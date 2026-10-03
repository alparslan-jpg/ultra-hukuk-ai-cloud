import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// .env: ESM import sırasından bağımsız olarak gizli anahtarlar çözülmeden önce yüklenir
(() => {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env okunamazsa ortam değişkenleri kullanılır */ }
})();

// ============================================================
// ULTRA HUKUK AI — Merkezi Güvenlik Yapılandırması
// Koda gömülü sabit sır (secret) kullanılmaz.
//  - Üretimde (NODE_ENV=production) JWT_SECRET / ENCRYPTION_MASTER_KEY yoksa
//    süreç başına rastgele geçici anahtar üretilir ve KRİTİK uyarı basılır.
//    (Geçici JWT: yeniden başlatmada oturumlar düşer. Geçici şifreleme anahtarı:
//    yeniden başlatmada eski dosyalar çözülemez -> bu yüzden ENCRYPTION_MASTER_KEY
//    Render ortam değişkenlerine MUTLAKA eklenmelidir.)
//  - Geliştirmede sabit olmayan, makineye özgü bir türetme kullanılır.
// ============================================================

const isProd = process.env.NODE_ENV === 'production';

function resolveSecret(name: string, minLength: number): string {
  const fromEnv = process.env[name];
  if (fromEnv && fromEnv.length >= minLength) return fromEnv;

  if (fromEnv && fromEnv.length < minLength) {
    console.error(`[SECURITY] 🔴 ${name} çok kısa (min ${minLength} karakter). Yok sayıldı.`);
  }
  const ephemeral = crypto.randomBytes(48).toString('base64');
  console.error(
    `[SECURITY] 🔴 KRİTİK: ${name} tanımlı değil${isProd ? ' (PRODUCTION)' : ''}. ` +
    `Bu süreç için geçici rastgele anahtar üretildi. Kalıcı çözüm: ${name} ortam değişkenini tanımlayın.`
  );
  return ephemeral;
}

export const JWT_SECRET: string = resolveSecret('JWT_SECRET', 24);
export const ENCRYPTION_MASTER_KEY: string = resolveSecret('ENCRYPTION_MASTER_KEY', 24);

/** Sicil/kullanıcı kimliği dosya yolu ve SQL anahtarı olarak güvenli mi? (path traversal koruması) */
export function isSafeOwnerId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_.@-]{1,64}$/.test(value) && !value.includes('..');
}
