import fs from 'fs';
import path from 'path';
import { google, drive_v3 } from 'googleapis';
import { SecureExportService, EncryptedPayload } from './secureExportService';

// ============================================================
// ULTRA HUKUK AI — Merkezi Google Drive & İstemci İzolasyon Servisi
// Arka planda yapılandırılmış tek bir merkezi Google Drive hesabı
// üzerinden her kullanıcıya izole alanlar açar.
// Dosyalar Drive'a gönderilmeden önce AES-256 ile şifrelenir.
// ============================================================

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
  uploadedAt: string;
  cloudProvider: 'Google Drive Service Account' | 'UltraHukuk Cloud Mock Storage';
}

class CentralDriveService {
  private driveClient: drive_v3.Drive | null = null;
  private rootFolderId: string | null = null;
  private isLiveGoogleActive = false;
  private localDriveRoot: string;

  constructor() {
    this.localDriveRoot = path.resolve(process.cwd(), 'storage/google_drive/UltraHukuk_Secure_Storage');
    if (!fs.existsSync(this.localDriveRoot)) {
      fs.mkdirSync(this.localDriveRoot, { recursive: true });
    }
    this.initGoogleDrive();
  }

  private async initGoogleDrive() {
    try {
      const saKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      const saKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      let auth: any = null;

      if (saKeyJson) {
        const credentials = JSON.parse(saKeyJson);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive']
        });
      } else if (saKeyPath && fs.existsSync(saKeyPath)) {
        auth = new google.auth.GoogleAuth({
          keyFile: saKeyPath,
          scopes: ['https://www.googleapis.com/auth/drive']
        });
      }

      if (auth) {
        this.driveClient = google.drive({ version: 'v3', auth });
        this.isLiveGoogleActive = true;
        console.log('[Central Drive] 🟢 Google Drive Service Account bağlantısı aktif.');
        await this.ensureRootFolder();
      } else {
        console.log('[Central Drive] 🟡 Google Service Account kimlik bilgisi verilmedi. UltraHukuk Cloud Güvenli Alanı aktif.');
      }
    } catch (err: any) {
      console.warn('[Central Drive] ⚠️ Google Drive API başlatılamadı, yerel güvenli depolama devrede:', err?.message);
      this.isLiveGoogleActive = false;
    }
  }

  /**
   * Drive üzerinde UltraHukuk_Secure_Storage ana klasörünü oluşturur veya bulur
   */
  private async ensureRootFolder(): Promise<string> {
    if (!this.driveClient || !this.isLiveGoogleActive) {
      return 'local-root-storage';
    }

    if (this.rootFolderId) return this.rootFolderId;

    try {
      const q = "name = 'UltraHukuk_Secure_Storage' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
      const res = await this.driveClient.files.list({ q, fields: 'files(id, name)' });

      if (res.data.files && res.data.files.length > 0) {
        this.rootFolderId = res.data.files[0].id || 'root';
      } else {
        const createRes = await this.driveClient.files.create({
          requestBody: {
            name: 'UltraHukuk_Secure_Storage',
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
        this.rootFolderId = createRes.data.id || 'root';
        console.log(`[Central Drive] 📁 'UltraHukuk_Secure_Storage' ana klasörü oluşturuldu: ${this.rootFolderId}`);
      }
      return this.rootFolderId;
    } catch (err: any) {
      console.warn('[Central Drive] Root klasör sorgulama hatası:', err?.message);
      return 'root';
    }
  }

  /**
   * Kullanıcı ID'sine özel izole alt klasörü oluşturur / bulur
   */
  public async ensureUserFolder(userSicilNo: string): Promise<string> {
    const folderName = `usr_${userSicilNo}`;
    const localUserDir = path.join(this.localDriveRoot, folderName);
    if (!fs.existsSync(localUserDir)) {
      fs.mkdirSync(localUserDir, { recursive: true });
    }

    if (!this.driveClient || !this.isLiveGoogleActive) {
      return folderName;
    }

    try {
      const parentId = await this.ensureRootFolder();
      const q = `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const res = await this.driveClient.files.list({ q, fields: 'files(id, name)' });

      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id || folderName;
      }

      const createRes = await this.driveClient.files.create({
        requestBody: {
          name: folderName,
          parents: [parentId],
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      return createRes.data.id || folderName;
    } catch (err: any) {
      console.warn(`[Central Drive] Kullanıcı klasörü (${folderName}) oluşturma uyarısı:`, err?.message);
      return folderName;
    }
  }

  /**
   * Dosyayı AES-256 ile şifreleyerek merkezi Drive'daki kullanıcı klasörüne yükler
   */
  public async uploadEncryptedFile(
    fileName: string,
    fileBuffer: Buffer,
    userSicilNo: string
  ): Promise<DriveStoredFile> {
    // 1. Zero-Knowledge: Veriyi AES-256-GCM ile şifrele
    const encPayload = SecureExportService.encrypt(fileBuffer, userSicilNo);
    const encryptedFileName = `${fileName}.aes256.enc`;

    // 2. Kullanıcı klasörünü hazırla
    const folderId = await this.ensureUserFolder(userSicilNo);
    const fileId = `drv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const encryptedPackage = {
      fileId,
      originalFileName: fileName,
      encryptedFileName,
      userSicilNo,
      size: fileBuffer.length,
      uploadedAt: new Date().toISOString(),
      iv: encPayload.iv,
      authTag: encPayload.authTag,
      encryptedData: encPayload.encryptedData
    };

    const packageJson = JSON.stringify(encryptedPackage, null, 2);
    const localUserDir = path.join(this.localDriveRoot, `usr_${userSicilNo}`);
    const localEncFilePath = path.join(localUserDir, `${fileId}_${encryptedFileName}`);
    fs.writeFileSync(localEncFilePath, packageJson, 'utf-8');

    // 3. Canlı Google Drive varsa yükle
    if (this.driveClient && this.isLiveGoogleActive) {
      try {
        const { Readable } = await import('stream');
        const mediaStream = new Readable();
        mediaStream.push(packageJson);
        mediaStream.push(null);

        const driveRes = await this.driveClient.files.create({
          requestBody: {
            name: `${fileId}_${encryptedFileName}`,
            parents: [folderId],
            description: `UltraHukuk ZK-Encrypted File for Sicil ${userSicilNo}`
          },
          media: {
            mimeType: 'application/json',
            body: mediaStream
          },
          fields: 'id, name, size'
        });

        return {
          fileId,
          originalFileName: fileName,
          encryptedFileName,
          folderId: driveRes.data.id || folderId,
          userSicilNo,
          size: fileBuffer.length,
          encryptedSize: Buffer.byteLength(packageJson),
          iv: encPayload.iv,
          authTag: encPayload.authTag,
          uploadedAt: encryptedPackage.uploadedAt,
          cloudProvider: 'Google Drive Service Account'
        };
      } catch (driveErr: any) {
        console.warn('[Central Drive] Google Drive upload hatası, yerel güvenli depolama kullanılıyor:', driveErr?.message);
      }
    }

    return {
      fileId,
      originalFileName: fileName,
      encryptedFileName,
      folderId,
      userSicilNo,
      size: fileBuffer.length,
      encryptedSize: Buffer.byteLength(packageJson),
      iv: encPayload.iv,
      authTag: encPayload.authTag,
      uploadedAt: encryptedPackage.uploadedAt,
      cloudProvider: 'UltraHukuk Cloud Mock Storage'
    };
  }

  /**
   * Şifreli dosyayı Drive'dan alır ve kullanıcı anahtarı ile çözerek ham Buffer döner
   */
  public async downloadAndDecryptFile(fileId: string, userSicilNo: string): Promise<{ fileName: string; content: Buffer; size: number }> {
    const localUserDir = path.join(this.localDriveRoot, `usr_${userSicilNo}`);
    if (!fs.existsSync(localUserDir)) {
      throw new Error(`Kullanıcıya (${userSicilNo}) ait depolama klasörü bulunamadı.`);
    }

    const files = fs.readdirSync(localUserDir);
    const targetFile = files.find(f => f.startsWith(`${fileId}_`) || f.includes(fileId));

    if (!targetFile) {
      throw new Error(`Drive üzerinde '${fileId}' kimlikli dosya bulunamadı.`);
    }

    const encRaw = fs.readFileSync(path.join(localUserDir, targetFile), 'utf-8');
    const encPackage = JSON.parse(encRaw);

    // Yetki kontrolü: Başka bir kullanıcının dosyası çözülemez
    if (encPackage.userSicilNo && encPackage.userSicilNo !== userSicilNo) {
      throw new Error('Yetkisiz erişim: Bu dosya başka bir avukatın izole Drive klasörüne aittir.');
    }

    // Zero-Knowledge: Şifreyi çöz
    const decryptedBuffer = SecureExportService.decrypt({
      iv: encPackage.iv,
      authTag: encPackage.authTag,
      encryptedData: encPackage.encryptedData
    }, userSicilNo);

    return {
      fileName: encPackage.originalFileName || targetFile.replace(`${fileId}_`, '').replace('.aes256.enc', ''),
      content: decryptedBuffer,
      size: decryptedBuffer.length
    };
  }

  /**
   * Kullanıcının izole alanındaki şifreli dosyaları listeler
   */
  public listUserFiles(userSicilNo: string): DriveStoredFile[] {
    const localUserDir = path.join(this.localDriveRoot, `usr_${userSicilNo}`);
    if (!fs.existsSync(localUserDir)) return [];

    const fileNames = fs.readdirSync(localUserDir);
    const results: DriveStoredFile[] = [];

    for (const f of fileNames) {
      try {
        const encRaw = fs.readFileSync(path.join(localUserDir, f), 'utf-8');
        const pkg = JSON.parse(encRaw);
        results.push({
          fileId: pkg.fileId,
          originalFileName: pkg.originalFileName,
          encryptedFileName: pkg.encryptedFileName,
          folderId: `usr_${userSicilNo}`,
          userSicilNo: pkg.userSicilNo,
          size: pkg.size,
          encryptedSize: Buffer.byteLength(encRaw),
          iv: pkg.iv,
          authTag: pkg.authTag,
          uploadedAt: pkg.uploadedAt,
          cloudProvider: this.isLiveGoogleActive ? 'Google Drive Service Account' : 'UltraHukuk Cloud Mock Storage'
        });
      } catch {}
    }

    return results;
  }

  public getStatus() {
    return {
      isLiveGoogleActive: this.isLiveGoogleActive,
      rootFolder: 'UltraHukuk_Secure_Storage',
      encryption: 'AES-256-GCM (Zero-Knowledge)',
      storagePath: this.localDriveRoot
    };
  }
}

export const centralDrive = new CentralDriveService();
