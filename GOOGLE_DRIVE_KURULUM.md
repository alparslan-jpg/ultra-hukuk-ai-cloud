# Google Drive Otomatik Evrak Yedekleme — Render Kurulumu

Render'ın ücretsiz planında kalıcı disk yoktur: her yeniden dağıtımda (redeploy)
`Vault_Storage` klasöründeki tüm yüklenen evraklar silinir. Bu yüzden her evrak
yüklemesi artık otomatik olarak (kendi ayrı AES-256 şifrelemesiyle) Google
Drive'a da yedeklenir; yerel dosya kayıpsa uygulama otomatik olarak Drive'dan
geri kurtarır.

Bu özelliğin **canlıda (Render'da)** çalışması için 3 parça bilgiyi Render'a
tanımlamanız gerekir. Bu bilgiler yerel bilgisayarınızda zaten üretildi
(bir kerelik Google hesabı onayı ile). Değerleri ayrı olarak (sohbet içinde)
sizinle paylaşıldı — bu dosyaya gerçek gizli değerler **kasıtlı olarak
yazılmamıştır**.

## 1) Render'da "Secret Files" (Gizli Dosyalar) ekleyin

Her iki serviste de (ultrahukuk-webapi yeterli, evrak yükleme sadece WebApi'de
çalışıyor) → **Environment** sekmesi → **Secret Files** bölümü → **Add Secret File**:

1. **Dosya adı:** `google-oauth-client-secret.json`
   **İçerik:** (sohbette paylaşılan `client_secret_...json` dosyasının tam içeriği)

2. **Dosya adı:** `token-store/Google.Apis.Auth.OAuth2.Responses.TokenResponse-ultrahukuk-adminator`
   **İçerik:** (sohbette paylaşılan, yerel testte üretilen token JSON içeriği)

Render, Secret File'ları container içinde `/etc/secrets/<dosya adı>` yoluna koyar.

## 2) Ortam değişkenlerini ekleyin (neon-database grubuna veya doğrudan servise)

| Değişken | Değer |
| --- | --- |
| `GOOGLE_OAUTH_CLIENT_SECRETS_PATH` | `/etc/secrets/google-oauth-client-secret.json` |
| `GOOGLE_OAUTH_TOKEN_STORE` | `/etc/secrets/token-store` |
| `GOOGLE_DRIVE_FOLDER_ID` | (sohbette paylaşılan klasör ID) |

## 3) Redeploy edin

Bu değişkenler eklendikten sonra servisi yeniden dağıtın (Manual Deploy →
Deploy latest commit). Bir sonraki evrak yüklemesinde yanıt içindeki
`cloudSyncStatus` alanı **"GERÇEKTEN Yüklendi"** ifadesini içeriyorsa kurulum
başarılıdır.

## Önemli notlar

- Token'ın süresi dolarsa (refresh token normalde süresiz çalışır, sadece
  Google hesabı erişimi manuel iptal edilirse veya 6 ay hiç kullanılmazsa
  geçersiz olabilir), sistem yalnızca yerel şifreli kasaya yazmaya devam eder
  ve `cloudSyncStatus` alanında hata mesajı görünür — hiçbir yükleme bu
  yüzden başarısız OLMAZ, sadece bulut yedeği o an için alınamaz.
- Bu OAuth kişisel Google hesabı yetkilendirmesidir (Servis Hesabı DEĞİL);
  Drive'daki dosyalar yetkilendirmeyi yapan Google hesabının kendi Drive
  alanına yüklenir.
