# 🚀 Ultra Hukuk AI — Bulut Dağıtım Rehberi (PC Gerektirmez)

Bu rehber, Ultra Hukuk AI uygulamasını **7/24 çalışan bir bulut sunucuya** nasıl dağıtacağınızı adım adım anlatır. Dağıtım sonrasında PC'niz kapalı olsa bile uygulama URL üzerinden erişilebilir olacaktır.

---

## 📋 Ön Gereksinimler

- GitHub hesabı (https://github.com)
- Render.com hesabı (https://render.com — ücretsiz, kredi kartı gerekmez)
- Gemini API Anahtarı (https://aistudio.google.com/apikey)

---

## Adım 1: GitHub Repository'ye Kod Push Etme

### 1a. GitHub Token Oluşturma
1. https://github.com/settings/tokens adresine gidin
2. **"Generate new token (classic)"** tıklayın
3. **Note:** `ultra-hukuk-ai-deploy` yazın
4. **Expiration:** 90 gün seçin
5. **Scopes:** `repo` kutusunu işaretleyin
6. **"Generate token"** tıklayın
7. Token'ı kopyalayın (bir kez gösterilir, kaydedin!)

### 1b. Terminal'den Push Etme
PowerShell açıp şu komutları çalıştırın:

```powershell
cd C:\Users\Monster\Downloads\ultra-hukuk-ai

# Token ile push (TOKEN yerine oluşturduğunuz token'ı yapıştırın)
git remote set-url origin https://TOKEN@github.com/alparslan-jpg/ultra-hukuk-ai.git
git push -u origin main --force
```

> **Not:** `TOKEN` yerine GitHub'dan aldığınız personal access token'ı yazın.

---

## Adım 2: Render.com'da Dağıtım

### 2a. Render.com Hesabı Oluşturma
1. https://render.com adresine gidin
2. **"Get Started for Free"** tıklayın
3. **"Sign in with GitHub"** seçin (en kolay yol)

### 2b. Yeni Web Service Oluşturma
1. Dashboard'da **"New +"** → **"Web Service"** tıklayın
2. **"Build and deploy from a Git repository"** seçin
3. **GitHub hesabınızı bağlayın** (ilk seferde izin isteyecek)
4. `alparslan-jpg/ultra-hukuk-ai` repository'sini seçin

### 2c. Servis Ayarları
| Alan | Değer |
|------|-------|
| **Name** | `ultra-hukuk-ai` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx vite build` |
| **Start Command** | `npx tsx server.ts` |
| **Instance Type** | `Free` |

### 2d. Ortam Değişkenleri (Environment Variables)
**"Advanced"** bölümüne tıklayıp şu değişkenleri ekleyin:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `GEMINI_API_KEY` | `(Gemini API anahtarınız)` |
| `JWT_SECRET` | `ultra-hukuk-prod-secret-2026` |
| `ADMIN_BOOTSTRAP_USERNAME` | `Alparslan` |
| `ADMIN_BOOTSTRAP_PASSWORD` | `Alp.wolf58` |

### 2e. Deploy Etme
**"Create Web Service"** tıklayın. Build süreci 3-5 dakika sürecektir.

---

## Adım 3: Uygulamaya Erişim

Deploy tamamlandığında size şu formatta bir URL verilecektir:

```
https://ultra-hukuk-ai.onrender.com
```

Bu URL üzerinden:
- ✅ Herhangi bir tarayıcıdan erişebilirsiniz
- ✅ PC'niz kapalı olsa bile çalışır
- ✅ HTTPS ile güvenlidir
- ✅ GitHub'a push yaptığınızda otomatik güncellenir

---

## 🔄 Google Drive Yedekleme

Render.com'un ücretsiz planında disk kalıcı değildir (container yeniden başlatıldığında sıfırlanır). Kalıcı veri için şu seçenekler mevcuttur:

### Seçenek A: Neon PostgreSQL (Önerilen)
1. https://neon.tech adresinden ücretsiz hesap oluşturun
2. Yeni bir database oluşturun
3. Bağlantı URL'sini Render.com ortam değişkenlerine ekleyin:
   - Key: `DATABASE_URL`
   - Value: `postgresql://...` (Neon'dan alın)

### Seçenek B: Google Drive API
`GOOGLE_DRIVE_KURULUM.md` dosyasındaki adımları takip edin.

---

## 🔧 Sorun Giderme

| Problem | Çözüm |
|---------|-------|
| Build başarısız | Render.com loglarını kontrol edin |
| Uygulama yavaş | Ücretsiz plan 15dk inaktivitede uyur, ilk istek 30sn sürebilir |
| API çalışmıyor | GEMINI_API_KEY ortam değişkenini kontrol edin |
| Giriş yapılamıyor | ADMIN_BOOTSTRAP_USERNAME ve PASSWORD değişkenlerini kontrol edin |

---

## 📌 Önemli Notlar

- **Ücretsiz plan sınırlaması:** Render.com ücretsiz plan, 15 dakika inaktiviteden sonra uyku moduna geçer. İlk istek uyandırır (~30 saniye bekleme). Sürekli aktif tutmak için ücretli plana geçebilirsiniz (\$7/ay).
- **Otomatik deploy:** GitHub `main` branch'ine her push yapıldığında otomatik olarak yeni versiyon dağıtılır.
- **Loglara erişim:** Render.com Dashboard → Servisiniz → **Logs** sekmesinden canlı logları görebilirsiniz.
