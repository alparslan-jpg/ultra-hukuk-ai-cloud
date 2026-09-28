# Ultra Hukuk AI — Profesyonel Avukat Çalışma Alanı & Çoklu Model (Multi-Model) Stratejisi

**Ultra Hukuk AI**, Türk Hukuku normlarına (TBK, HMK, TTK, İİK, İş K., İYUK) ve 1136 Sayılı Avukatlık Kanunu m. 34 mesleki özen yükümlülüğüne tam uyumlu, yeni nesil **Çoklu Model Akıllı Dağıtım (Multi-Model Routing)** mimarisine sahip yapay zeka destekli hukuk asistanıdır.

---

## 🏛️ Çoklu Model (Multi-Model) Stratejisi & Routing Mimarisi

Hukuk büroları için tek bir model yerine akıllı görev dağıtımı (Routing) esası uygulanmaktadır:

| Hukuki Görev / Modül | Model | Rol ve Avantajı |
|---|---|---|
| **Ön İnceleme, Case Briefing & Taslak Dilekçe** | `gemini-3.8-flash` | Hızlı ve ekonomik analiz (~1.2 sn), risk ve argüman ayrıştırması |
| **Harp Odası, Çelişki Tespiti & HMK 281 İtirazı** | `gemini-3.1-pro-preview` | Derin akıl yürütme, çapraz sorgu, karşı taraf hamle simülasyonu |
| **Zorunlu Hukuki Dayanak Denetleme Paneli** | `gemini-3.1-pro-preview` | Her iddiayı pozitif hukuk normuna (TBK/HMK/TTK/Tüzük/Doktrin) bağlama zorunluluğu |
| **Adli Sesli Dikte & Duruşma Zaptı** | `gemini-3.5-transcribe` | Duruşma zaptı, mülakat ve dikte seslerini konuşmacı ayrımıyla (Hakim/Vekil) metne dökme |
| **Görsel Evrak OCR & Mikro Ayrıntı Analizi** | `gemini-3.8-flash` | İmza, yetki, tebliğ tarihi ve evrakta yapay zeka (LLM) kullanım izi tespiti |

---

## ⚖️ Zorunlu Hukuki Dayanak Denetleme Paneli (Denetleme Paneli)

6100 Sayılı HMK m. 119/1-e ve m. 194 (somutlaştırma yükü) uyarınca, her iddia pozitif bir hukuk normuna dayanmalıdır.

1. **İfade Bazlı Ayrıştırma:** Girilen dava metni veya iddialar tek tek cümlelere ayrıştırılır.
2. **Pozitif Hukuk Taraması:** Her ifadenin kanun maddesi (TBK, HMK, TTK, İİK vb.), tüzük, yönetmelik veya doktrin şerhi içerip içermediği denetlenir.
3. **Kırmızı Bayraklama (Flagging):** Mevzuat atfı olmayan soyut iddialar bayrakla işaretlenir ve avukata bildirim yapılır.
4. **Hızlı Dayanak Önerileri:** Önerilen normlar (örn. `TBK m. 117`, `HMK m. 200`, `TTK m. 21/2`) tek tıkla iddiaya bağlanabilir.
5. **Katı Mod (Strict Grounding):** Bayraklı beyanlar doğrulanmadan veya onaylanmadan UYAP dilekçesine aktarılamaz.
6. **"Yapay Zeka Destekli" Damgası:** İncelenen tüm belgeler resmi denetim mührü ve avukat sicil numarası ile damgalanır.

---

## 🔍 Mevzuat & Emsal İçtihat Çapraz Doğrulama Servisi (Verified / Flagged)

Yapay zeka modellerinin ürettiği hukuki argümanlardaki kanun maddesi ve içtihat atıflarını Türk Hukuk Külliyatı ile çapraz denetleyen uzmanlaşmış doğrulama motoru:

- **'Verified' Statüsü (✅):** Yürürlükteki Türk kanunları (6098 s. TBK, 6100 s. HMK, 6102 s. TTK, 2004 s. İİK, 4857 s. İş K., 3095 s. Faiz K.) ile birebir eşleşen ve emsal Yargıtay/Danıştay kararlarıyla desteklenen maddelere verilir.
- **'Flagged' Statüsü (❌):**
  - **Halüsinasyon / Sınır Dışı Maddeler:** Kanunda bulunmayan uydurma maddeler (Örn. `TBK m. 999` — azami 649 maddedir; `HMK m. 750` — azami 451 maddedir) anında tespit edilip kırmızı bayraklanır.
  - **Mülga / Yürürlükten Kalkan Maddeler:** Eski kanun hükümleri (Örn. Mülga 818 s. BK m. 106, 6762 s. TTK m. 688, 1086 s. HUMK m. 288) bayraklanır ve güncel madde önerisi sunulur.
- **Tek Tıkla Otomatik Düzeltme (Auto-Fix):** Bayraklanan uydurma veya mülga maddeler tek bir tıkla yürürlükteki gerçek kanun normuyla değiştirilebilir.
- **Örnek Test Senaryoları:** Avukatların yapay zeka halüsinasyon tuzaklarını test edebilmeleri için hazır senaryolar (Halüsinasyon Tuzağı, Eser Sözleşmesi, Ticari Alacak, İşçi Davası) entegre edilmiştir.

---

## 🤖 Hukuk Ajanı Yönetim Paneli & Multi-Model Stratejisi

Avukat çalışma alanında (`LawyerWorkspace`) 18 uzman hukuk ajanının canlı çalışma durumu, yürüttükleri anlık hukuki görevler ve görev karmaşıklığına göre atanan Gemini modelleri yönetilmektedir:

- **18 Aktif Hukuk Ajanı:**
  1. *Belge Okuma ve Görsel Yorumlama (OCR)* — Görev: Analiz (Gemini-3.8-Flash)
  2. *Belge Çıkarım ve Sınıflandırma* — Görev: Analiz (Gemini-3.8-Flash)
  3. *Şeytanın Avukatı (Harp Odası)* — Görev: Çelişki Tespiti (Gemini-3.1-pro-preview)
  4. *Baş Müzakereci Ön Değerlendirme* — Görev: Ön İnceleme (Gemini-3.8-Flash)
  5. *Risk ve Süre Tarama Ajanı* — Görev: Zamanaşımı (Gemini-3.8-Flash)
  6. *Dilekçe Yazarlığı & Yetki Doğrulama* — Görev: Vekalet & Sicil Kontrolü (Gemini-3.8-Flash)
  7. *Mevzuat Takip ve Değişiklik Ajanı* — Görev: Mevzuat Doğrulama (Gemini-3.8-Flash)
  8. *Baro Sicil & TBB Doğrulama Ajanı* — Görev: Vekalet & Sicil Kontrolü (Gemini-3.8-Flash)
  9. *UYAP Dilekçe Taslak Üretim Ajanı* — Görev: Dilekçe Kurgusu (Gemini-3.8-Flash)
  10. *Bağımsız Hakim Perspektifi Ajanı* — Görev: Yargıç Tahmini (Gemini-3.1-pro-preview)
  11. *Çapraz Müzakere ve Çelişki Denetimi* — Görev: Çelişki Tespiti (Gemini-3.1-pro-preview)
  12. *Emsal Karar Tarama Ajanı* — Görev: Emsal Tarama (Gemini-3.8-Flash)
  13. *Gerçekçilik Denetim ve Güvenilirlik Ajanı* — Görev: Mevzuat Doğrulama (Gemini-3.1-pro-preview)
  14. *Zamanaşımı & Faiz Hesaplama Motoru* — Görev: Zamanaşımı (Gemini-3.8-Flash)
  15. *35 Noktalı Usul Denetimi ve Dava Şartı Filtresi* — Görev: Analiz (Gemini-3.1-pro-preview)
  16. *Bilirkişi Raporu İnceleme & İtiraz Ajanı* — Görev: HMK 281 İtiraz (Gemini-3.1-pro-preview)
  17. *Duruşma Hazırlığı & Çapraz Sorgu Simülatörü* — Görev: Çapraz Sorgu (Gemini-3.1-pro-preview)
  18. *Adli Sesli Dikte ve Duruşma Zaptı Ajanı* — Görev: Dikte (Gemini-3.5-transcribe)

- **Multi-Model Mimarisi:**
  - **Gemini-3.8-Flash (Hızlı & Çevik Görevler):** Ön inceleme, metin çıkarımı, sınıflandırma, emsal arama, faiz hesabı ve UYAP şablon kurgusu (~0.8 - 1.2 sn yanıt süresi).
  - **Gemini-3.1-Pro-Preview (Derin Akıl Yürütme):** Şeytanın Avukatı, bilirkişi rapor çelişkileri, çapraz sorgu taktikleri, 35 noktalı usul denetimi ve yapay zeka halüsinasyon kalkanı.
  - **Gemini-3.5-Transcribe (Adli Ses):** Duruşma salonundaki ses karmaşasında Hakim, Katip ve Avukat diyaloglarını konuşmacı etiketli resmi tutanağa dönüştürme.

---

## 🚀 Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirici sunucusunu başlatın (Frontend + Express API)
npm run dev

# Tip kontrolü ve derleme testi
npm run lint
npm run build
```

---

## 🔄 GitHub Senkronizasyonu

Depo: `https://github.com/alparslan-jpg/ultra-hukuk-ai`

```bash
# Linux / macOS:
bash scripts/github_sync.sh "feat: Zorunlu Mevzuat Denetleme Paneli ve Yapay Zeka Destekli rozetleri eklendi"

# Windows PowerShell:
.\scripts\github_sync.ps1 -CommitMsg "feat: Zorunlu Mevzuat Denetleme Paneli ve Yapay Zeka Destekli rozetleri eklendi"
```
