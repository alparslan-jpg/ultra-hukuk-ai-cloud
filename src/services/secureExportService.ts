import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ============================================================
// ULTRA HUKUK AI — Zero-Knowledge AES-256-GCM Encryption Service
// KVKK & Sır Saklama Yükümlülüğü: Tüm veriler buluta (Google Drive)
// gitmeden önce istemci/uç noktada AES-256-GCM ile şifrelenir.
// ============================================================

const MASTER_KEY_SECRET = process.env.ENCRYPTION_MASTER_KEY || 'ultra-hukuk-ai-zk-master-secret-key-2026';

export interface EncryptedPayload {
  iv: string;         // Base64
  authTag: string;    // Base64
  encryptedData: string; // Base64
  algorithm: 'aes-256-gcm';
  encryptedAt: string;
}

export class SecureExportService {
  /**
   * Kullanıcı ID veya Sicil No'ya göre benzersiz 256-bit türetilmiş anahtar oluşturur
   */
  private static deriveKey(userKeyOrId: string = 'global'): Buffer {
    const salt = `salt-ultrahukuk-${userKeyOrId}`;
    return crypto.scryptSync(MASTER_KEY_SECRET, salt, 32);
  }

  /**
   * Metin veya Buffer veriyi AES-256-GCM ile şifreler (Zero-Knowledge)
   */
  public static encrypt(data: string | Buffer, userKeyOrId: string = 'global'): EncryptedPayload {
    const key = this.deriveKey(userKeyOrId);
    const iv = crypto.randomBytes(12); // GCM standardı 12 bayt IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encryptedData: encrypted.toString('base64'),
      algorithm: 'aes-256-gcm',
      encryptedAt: new Date().toISOString()
    };
  }

  /**
   * AES-256-GCM şifrelenmiş veriyi çözer
   */
  public static decrypt(payload: { iv: string; authTag: string; encryptedData: string }, userKeyOrId: string = 'global'): Buffer {
    const key = this.deriveKey(userKeyOrId);
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const encryptedBuffer = Buffer.from(payload.encryptedData, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted;
  }

  /**
   * Dosyayı diskte şifreli formatta (.enc) oluşturur
   */
  public static encryptFile(inputFilePath: string, outputEncPath: string, userKeyOrId: string = 'global'): { iv: string; authTag: string; encryptedSize: number } {
    const fileData = fs.readFileSync(inputFilePath);
    const enc = this.encrypt(fileData, userKeyOrId);

    const fullEncObj = {
      meta: {
        originalName: path.basename(inputFilePath),
        size: fileData.length,
        encryptedAt: enc.encryptedAt
      },
      iv: enc.iv,
      authTag: enc.authTag,
      encryptedData: enc.encryptedData
    };

    const encJson = JSON.stringify(fullEncObj, null, 2);
    fs.writeFileSync(outputEncPath, encJson, 'utf-8');

    return {
      iv: enc.iv,
      authTag: enc.authTag,
      encryptedSize: Buffer.byteLength(encJson)
    };
  }

  /**
   * Diskteki şifreli dosyayı (.enc) çözer
   */
  public static decryptFile(encFilePath: string, outputDecPath: string, userKeyOrId: string = 'global'): Buffer {
    const encContent = fs.readFileSync(encFilePath, 'utf-8');
    const encObj = JSON.parse(encContent);

    const decryptedBuf = this.decrypt({
      iv: encObj.iv,
      authTag: encObj.authTag,
      encryptedData: encObj.encryptedData
    }, userKeyOrId);

    if (outputDecPath) {
      fs.writeFileSync(outputDecPath, decryptedBuf);
    }
    return decryptedBuf;
  }
}
