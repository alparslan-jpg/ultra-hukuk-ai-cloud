import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ENCRYPTION_MASTER_KEY } from '../config/security.ts';

// ============================================================
// ULTRA HUKUK AI — Zero-Knowledge AES-256-GCM Encryption Service
// KVKK & Sır Saklama Yükümlülüğü: Tüm veriler buluta/depoya
// gitmeden önce AES-256-GCM ile şifrelenir.
//  - Her kullanıcı için ayrı 256-bit anahtar (scrypt ile türetilir)
//  - İsteğe bağlı AAD: şifreli veri belirli bir sahip+dosyaya bağlanır;
//    başka kullanıcıya/dosyaya taşınırsa doğrulama (authTag) başarısız olur.
// ============================================================

export interface EncryptedPayload {
  iv: string;         // Base64
  authTag: string;    // Base64
  encryptedData: string; // Base64
  algorithm: 'aes-256-gcm';
  encryptedAt: string;
}

const keyCache = new Map<string, Buffer>();

export class SecureExportService {
  /**
   * Kullanıcı ID veya Sicil No'ya göre benzersiz 256-bit türetilmiş anahtar oluşturur
   */
  private static deriveKey(userKeyOrId: string = 'global'): Buffer {
    const cached = keyCache.get(userKeyOrId);
    if (cached) return cached;
    const salt = `salt-ultrahukuk-${userKeyOrId}`;
    const key = crypto.scryptSync(ENCRYPTION_MASTER_KEY, salt, 32);
    keyCache.set(userKeyOrId, key);
    return key;
  }

  /**
   * Metin veya Buffer veriyi AES-256-GCM ile şifreler (Zero-Knowledge)
   * @param aad Opsiyonel ek doğrulanmış veri (örn. `${sicilNo}:${fileId}`)
   */
  public static encrypt(data: string | Buffer, userKeyOrId: string = 'global', aad?: string): EncryptedPayload {
    const key = this.deriveKey(userKeyOrId);
    const iv = crypto.randomBytes(12); // GCM standardı 12 bayt IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    if (aad) cipher.setAAD(Buffer.from(aad, 'utf-8'));

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
  public static decrypt(payload: { iv: string; authTag: string; encryptedData: string }, userKeyOrId: string = 'global', aad?: string): Buffer {
    const key = this.deriveKey(userKeyOrId);
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const encryptedBuffer = Buffer.from(payload.encryptedData, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    if (aad) decipher.setAAD(Buffer.from(aad, 'utf-8'));
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
