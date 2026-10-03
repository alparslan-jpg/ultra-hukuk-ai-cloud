import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { google, drive_v3 } from 'googleapis';
import { SecureExportService } from './secureExportService.ts';
import { db } from './persistentDatabaseService.ts';
import { isSafeOwnerId } from '../config/security.ts';

// ============================================================
// ULTRA HUKUK AI — Kullanıcıya Özel, İzole ve Şifreli Kasa (Vault)
//
// Katmanlar:
//  1) BİRİNCİL  : Neon PostgreSQL "secure_files" + "secure_file_chunks"
//                 (kalıcı; Render'ın geçici diskine bağımlı değil)
//  2) YEDEK     : DATABASE_URL yoksa yerel şifreli disk (storage/vault/usr_<sicil>)
//  3) AYNA      : GOOGLE_SERVICE_ACCOUNT_JSON varsa Google Drive'a şifreli kopya
//
// Güvenlik:
//  - Veri sunucuya gelir gelmez AES-256-GCM ile şifrelenir (kullanıcıya özel anahtar)
//  - AAD = `${sahip}:${dosyaId}` -> şifreli veri başka sahibe/dosyaya taşınamaz
//  - Tüm sorgular owner_sicil ile kısıtlıdır; dosya kimlikleri tahmin edilemez (UUID)
//  - Sahip kimliği YALNIZCA doğrulanmış JWT'den gelir (çağıran katman sorumlu)
// ============================================================

export type VaultProvider = 'Neon Şifreli Kasa' | 'Yerel Şifreli Disk' | 'Google Drive Service Account';

export interface DriveStoredFile {
  fileId: string;
  originalFileName: string;
  encryptedFileName: string;
  folderId: string;
  userSicilNo: string;
  size: number;
  encryptedSize: number;
  iv: string;
  authTag: string;
  sha256: string;
  uploadedAt: string;
  cloudProvider: VaultProvider;
}

const CHUNK_BYTES = 6 * 1024 * 1024; // 6MB şifreli veri / satır (Neon HTTP istek sınırı altında)

function assertOwner(owner: string): void {
  if (!isSafeOwnerId(owner)) {
    throw new Error('Geçersiz kullanıcı kimliği: depolama alanına erişim reddedildi.');
  }
}

function assertFileId(fileId: string): void {
  if (!/^[0-9a-fA-F-]{36}$/.test(fileId)) {
    throw new Error('Geçersiz dosya kimliği.');
  }
}

class CentralDriveService {
  private driveClient: drive_v3.Drive | null = null;
  private rootFolderId: string | null = null;
  private isLiveGoogleActive = false;
  private localVaultRoot: string;
  private schemaReady: Promise<boolean> | null = null;

  constructor() {
    this.localVaultRoot = path.resolve(process.cwd(), 'storage/vault');
    this.initGoogleDrive();
  }

  // ---------- Neon şeması ----------
  private ensureSchema(): Promise<boolean> {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
        await db.ready();
        const sql = db.getSql();
        if (!sql) return false;
        await sql`
          CREATE TABLE IF NOT EXISTS secure_files (
            id TEXT PRIMARY KEY,
            owner_sicil TEXT NOT NULL,
            original_name TEXT NOT NULL,
            size BIGINT NOT NULL,
            enc_size BIGINT NOT NULL,
            iv TEXT NOT NULL,
            auth_tag TEXT NOT NULL,
            sha256 TEXT NOT NULL,
            chunk_count INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at TIMESTAMPTZ
          )`;
        await sql`CREATE INDEX IF NOT EXISTS idx_secure_files_owner ON secure_files(owner_sicil, created_at DESC)`;
        await sql`
          CREATE TABLE IF NOT EXISTS secure_file_chunks (
            file_id TEXT NOT NULL REFERENCES secure_files(id) ON DELETE CASCADE,
            idx INTEGER NOT NULL,
            data TEXT NOT NULL,
            PRIMARY KEY (file_id, idx)
          )`;
        return true;
      })().catch((err) => {
        console.error('[Vault] Neon kasa şeması hazırlanamadı:', err?.message || err);
        this.schemaReady = null;
        return false;
      });
    }
    return this.schemaReady;
  }

  // ---------- Google Drive (opsiyonel ayna) ----------
  private async initGoogleDrive() {
    try {
      const saKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      const saKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      let auth: any = null;

      if (saKeyJson) {
        auth = new google.auth.GoogleAuth({ credentials: JSON.parse(saKeyJson), scopes: ['https://www.googleapis.com/auth/drive'] });
      } else if (saKeyPath && fs.existsSync(saKeyPath)) {
        auth = new google.auth.GoogleAuth({ keyFile: saKeyPath, scopes: ['https://www.googleapis.com/auth/drive'] });
      }

      if (auth) {
        this.driveClient = google.drive({ version: 'v3', auth });
        this.isLiveGoogleActive = true;
        console.log('[Vault] 🟢 Google Drive aynası aktif.');
        await this.ensureRootFolder();
      } else {
        console.log('[Vault] ℹ️ Google Drive kimlik bilgisi yok; birincil depo Neon/yerel şifreli kasa.');
      }
    } catch (err: any) {
      console.warn('[Vault] ⚠️ Google Drive başlatılamadı:', err?.message);
      this.isLiveGoogleActive = false;
    }
  }

  private async ensureRootFolder(): Promise<string> {
    if (!this.driveClient || !this.isLiveGoogleActive) return 'no-drive';
    if (this.rootFolderId) return this.rootFolderId;
    const q = "name = 'UltraHukuk_Secure_Storage' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const res = await this.driveClient.files.list({ q, fields: 'files(id, name)' });
    if (res.data.files && res.data.files.length > 0) {
      this.rootFolderId = res.data.files[0].id || 'root';
    } else {
      const created = await this.driveClient.files.create({
        requestBody: { name: 'UltraHukuk_Secure_Storage', mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id'
      });
      this.rootFolderId = created.data.id || 'root';
    }
    return this.rootFolderId;
  }

  private async ensureDriveUserFolder(owner: string): Promise<string> {
    const parentId = await this.ensureRootFolder();
    const folderName = `usr_${owner}`;
    const q = `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await this.driveClient!.files.list({ q, fields: 'files(id, name)' });
    if (res.data.files && res.data.files.length > 0) return res.data.files[0].id || folderName;
    const created = await this.driveClient!.files.create({
      requestBody: { name: folderName, parents: [parentId], mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id'
    });
    return created.data.id || folderName;
  }

  // ---------- Yerel şifreli disk ----------
  private localUserDir(owner: string): string {
    assertOwner(owner);
    const dir = path.join(this.localVaultRoot, `usr_${owner}`);
    // path traversal son kontrol
    if (!path.resolve(dir).startsWith(this.localVaultRoot)) throw new Error('Geçersiz depolama yolu.');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  // ---------- Genel API ----------

  /** Dosyayı AES-256-GCM ile şifreleyip sahibin izole alanına kaydeder. */
  public async uploadEncryptedFile(fileName: string, fileBuffer: Buffer, userSicilNo: string): Promise<DriveStoredFile> {
    assertOwner(userSicilNo);
    const safeName = path.basename(String(fileName)).replace(/[\u0000-\u001f<>:"|?*]/g, '_').slice(0, 200) || 'dosya';
    const fileId = crypto.randomUUID();
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const enc = SecureExportService.encrypt(fileBuffer, userSicilNo, `${userSicilNo}:${fileId}`);
    const encBuf = Buffer.from(enc.encryptedData, 'base64');
    const uploadedAt = new Date().toISOString();

    let provider: VaultProvider;
    let folderId = `usr_${userSicilNo}`;

    const hasNeon = await this.ensureSchema();
    if (hasNeon) {
      const sql = db.getSql();
      const chunkCount = Math.max(1, Math.ceil(encBuf.length / CHUNK_BYTES));
      await sql`
        INSERT INTO secure_files (id, owner_sicil, original_name, size, enc_size, iv, auth_tag, sha256, chunk_count)
        VALUES (${fileId}, ${userSicilNo}, ${safeName}, ${fileBuffer.length}, ${encBuf.length}, ${enc.iv}, ${enc.authTag}, ${sha256}, ${chunkCount})`;
      try {
        for (let i = 0; i < chunkCount; i++) {
          const slice = encBuf.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES);
          await sql`INSERT INTO secure_file_chunks (file_id, idx, data) VALUES (${fileId}, ${i}, ${slice.toString('base64')})`;
        }
      } catch (err) {
        await sql`DELETE FROM secure_files WHERE id = ${fileId}`.catch(() => {});
        throw err;
      }
      provider = 'Neon Şifreli Kasa';
    } else {
      const dir = this.localUserDir(userSicilNo);
      const pkg = {
        v: 2, fileId, originalFileName: safeName, userSicilNo, size: fileBuffer.length, sha256,
        uploadedAt, iv: enc.iv, authTag: enc.authTag, encryptedData: enc.encryptedData
      };
      fs.writeFileSync(path.join(dir, `${fileId}.vault.json`), JSON.stringify(pkg), 'utf-8');
      provider = 'Yerel Şifreli Disk';
    }

    // Opsiyonel Google Drive aynası (yalnızca şifreli veri)
    if (this.driveClient && this.isLiveGoogleActive) {
      try {
        const { Readable } = await import('stream');
        const body = Readable.from([JSON.stringify({ v: 2, fileId, owner: userSicilNo, iv: enc.iv, authTag: enc.authTag, encryptedData: enc.encryptedData })]);
        folderId = await this.ensureDriveUserFolder(userSicilNo);
        await this.driveClient.files.create({
          requestBody: { name: `${fileId}.vault.json`, parents: [folderId], description: `UltraHukuk ZK-Encrypted (${userSicilNo})` },
          media: { mimeType: 'application/json', body },
          fields: 'id'
        });
      } catch (driveErr: any) {
        console.warn('[Vault] Google Drive aynası yazılamadı (birincil kasa etkilenmedi):', driveErr?.message);
      }
    }

    return {
      fileId, originalFileName: safeName, encryptedFileName: `${fileId}.aes256.enc`, folderId,
      userSicilNo, size: fileBuffer.length, encryptedSize: encBuf.length,
      iv: enc.iv, authTag: enc.authTag, sha256, uploadedAt, cloudProvider: provider
    };
  }

  /** Yalnızca dosyanın SAHİBİ çözebilir; başkasına ait dosya 'bulunamadı' gibi davranır (varlık sızdırmaz). */
  public async downloadAndDecryptFile(fileId: string, userSicilNo: string): Promise<{ fileName: string; content: Buffer; size: number; sha256?: string }> {
    assertOwner(userSicilNo);
    assertFileId(fileId);

    const hasNeon = await this.ensureSchema();
    if (hasNeon) {
      const sql = db.getSql();
      const rows = await sql`
        SELECT * FROM secure_files WHERE id = ${fileId} AND owner_sicil = ${userSicilNo} AND deleted_at IS NULL`;
      if (rows.length > 0) {
        const f = rows[0];
        const chunks = await sql`SELECT data FROM secure_file_chunks WHERE file_id = ${fileId} ORDER BY idx ASC`;
        if (chunks.length !== f.chunk_count) throw new Error('Şifreli dosya bütünlüğü bozuk (eksik parça).');
        const encryptedData = Buffer.concat(chunks.map((c: any) => Buffer.from(c.data, 'base64'))).toString('base64');
        const content = SecureExportService.decrypt({ iv: f.iv, authTag: f.auth_tag, encryptedData }, userSicilNo, `${userSicilNo}:${fileId}`);
        if (crypto.createHash('sha256').update(content).digest('hex') !== f.sha256) {
          throw new Error('Dosya bütünlük doğrulaması (SHA-256) başarısız.');
        }
        return { fileName: f.original_name, content, size: content.length, sha256: f.sha256 };
      }
    }

    // Yerel şifreli disk (DB yokken veya eski kayıtlar)
    const dir = this.localUserDir(userSicilNo);
    const candidate = fs.readdirSync(dir).find((n) => n.startsWith(fileId));
    if (!candidate) throw new Error('Dosya bulunamadı.');
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, candidate), 'utf-8'));
    if (pkg.userSicilNo !== userSicilNo) throw new Error('Dosya bulunamadı.');
    const content = SecureExportService.decrypt(pkg, userSicilNo, pkg.v === 2 ? `${userSicilNo}:${fileId}` : undefined);
    return { fileName: pkg.originalFileName, content, size: content.length, sha256: pkg.sha256 };
  }

  /** Sahibin kendi dosyalarını listeler (yalnızca üst veri; içerik çözülmez). */
  public async listUserFiles(userSicilNo: string): Promise<DriveStoredFile[]> {
    assertOwner(userSicilNo);
    const results: DriveStoredFile[] = [];

    const hasNeon = await this.ensureSchema();
    if (hasNeon) {
      const sql = db.getSql();
      const rows = await sql`
        SELECT id, original_name, size, enc_size, iv, auth_tag, sha256, created_at
        FROM secure_files WHERE owner_sicil = ${userSicilNo} AND deleted_at IS NULL
        ORDER BY created_at DESC LIMIT 500`;
      for (const r of rows) {
        results.push({
          fileId: r.id, originalFileName: r.original_name, encryptedFileName: `${r.id}.aes256.enc`,
          folderId: `usr_${userSicilNo}`, userSicilNo, size: Number(r.size), encryptedSize: Number(r.enc_size),
          iv: r.iv, authTag: r.auth_tag, sha256: r.sha256,
          uploadedAt: new Date(r.created_at).toISOString(), cloudProvider: 'Neon Şifreli Kasa'
        });
      }
      return results;
    }

    const dir = this.localUserDir(userSicilNo);
    for (const f of fs.readdirSync(dir)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        if (pkg.userSicilNo !== userSicilNo) continue;
        results.push({
          fileId: pkg.fileId, originalFileName: pkg.originalFileName, encryptedFileName: `${pkg.fileId}.aes256.enc`,
          folderId: `usr_${userSicilNo}`, userSicilNo, size: pkg.size, encryptedSize: Buffer.byteLength(pkg.encryptedData, 'base64'),
          iv: pkg.iv, authTag: pkg.authTag, sha256: pkg.sha256 || '',
          uploadedAt: pkg.uploadedAt, cloudProvider: 'Yerel Şifreli Disk'
        });
      } catch { /* bozuk kayıt atlanır */ }
    }
    return results;
  }

  /** Yumuşak silme: yalnızca sahibi silebilir. */
  public async deleteFile(fileId: string, userSicilNo: string): Promise<boolean> {
    assertOwner(userSicilNo);
    assertFileId(fileId);
    const hasNeon = await this.ensureSchema();
    if (hasNeon) {
      const sql = db.getSql();
      const r = await sql`UPDATE secure_files SET deleted_at = NOW() WHERE id = ${fileId} AND owner_sicil = ${userSicilNo} AND deleted_at IS NULL RETURNING id`;
      return r.length > 0;
    }
    const dir = this.localUserDir(userSicilNo);
    const candidate = fs.readdirSync(dir).find((n) => n.startsWith(fileId));
    if (!candidate) return false;
    fs.unlinkSync(path.join(dir, candidate));
    return true;
  }

  public async getStatus() {
    const hasNeon = await this.ensureSchema();
    return {
      primaryStorage: hasNeon ? 'Neon PostgreSQL (kalıcı, şifreli kasa)' : 'Yerel şifreli disk (DATABASE_URL tanımlı değil)',
      googleDriveMirrorActive: this.isLiveGoogleActive,
      encryption: 'AES-256-GCM (kullanıcıya özel anahtar + sahip/dosya AAD)',
      isolation: 'owner_sicil ile satır düzeyinde izolasyon (JWT kimliği)',
      masterKeyConfigured: !!process.env.ENCRYPTION_MASTER_KEY
    };
  }
}

export const centralDrive = new CentralDriveService();
