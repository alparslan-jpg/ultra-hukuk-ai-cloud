# Neon.tech Ücretsiz PostgreSQL Kurulumu (WebApi + Adminatör için Paylaşımlı Veritabanı)

Render'daki `ultrahukuk-webapi` ve `ultrahukuk-adminator` servisleri iki ayrı
konteynerdir ve varsayılan olarak birbirinden bağımsız, geçici SQLite dosyaları
kullanır. KVKK'nın gerektirdiği gerçek denetim (Adminatör'ün gerçek avukat
kayıtlarını, lisans sürelerini, veri ihlali kayıtlarını görebilmesi) için ikisinin
de **aynı kalıcı veritabanına** bağlanması gerekir. Bunun için Neon.tech'in kalıcı
olarak ücretsiz PostgreSQL katmanını kullanıyoruz.

## 1) Neon hesabı ve veritabanı oluşturma
1. https://neon.tech adresine gidin, ücretsiz hesap açın (GitHub ile giriş yapabilirsiniz).
2. "New Project" ile bir proje oluşturun, örn. isim: `ultra-hukuk-ai`.
3. Bölge (region) olarak Render servislerinize coğrafi olarak en yakın bölgeyi seçin
   (örn. Frankfurt/AWS eu-central-1), gecikmeyi azaltmak için.
4. Proje oluşturulunca "Connection string" (Bağlantı Dizesi) gösterilir, şuna benzer:
   ```
   postgres://kullanici:sifre@ep-xxxxxxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Bu dizeyi kopyalayın.

## 2) Render'da her iki servise env var ekleme
Render Dashboard'da **her iki** serviste (`ultrahukuk-webapi` VE `ultrahukuk-adminator`)
ayrı ayrı şu adımları izleyin:
1. Servise girin → **Environment** sekmesi → **Add Environment Variable**.
2. Şu iki değişkeni ekleyin:
   - `ConnectionStrings__DefaultConnection` = (Neon'dan kopyaladığınız tam bağlantı dizesi)
   - `Database__UseSqlite` = `false`
3. **Save Changes** — Render otomatik olarak servisi yeniden başlatır.

> Not: Anahtar adında `__` (çift alt çizgi) kullanılması zorunludur; ASP.NET Core
> ortam değişkenlerinde iç içe geçmiş ayarları (`ConnectionStrings:DefaultConnection`)
> bu şekilde temsil eder.

## 3) Doğrulama
Her iki servis yeniden başladıktan sonra:
- WebApi'de yeni bir avukat kaydı oluşturun (`/register.html`).
- Adminatör panelinde "Kayıtlı Avukatlar" tablosunda **aynı** kaydı görmelisiniz.
  Bu, iki servisin artık aynı (Neon) veritabanını paylaştığının kanıtıdır.

## 4) Geri dönüş / güvenlik ağı
`ConnectionStrings__DefaultConnection` boş bırakılırsa veya `Database__UseSqlite`
env var'ı silinirse, uygulama otomatik olarak eskisi gibi yerel/geçici SQLite'a
geri döner — hiçbir kod değişikliği gerekmez.
