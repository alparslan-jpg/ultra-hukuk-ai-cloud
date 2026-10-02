# ====================================================================
# Ultra Hukuk AI — Otomasyon & Dağıtım Öncesi Doğrulama Betiği (PowerShell)
# ====================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  ULTRA HUKUK AI: DAĞITIM VE MİMARİ DOĞRULAMA KONSOLU  " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Modül Testlerini Çalıştır
Write-Host "`n[1/3] Modüler Mimari ve Servis Testleri Yürütülüyor..." -ForegroundColor Green
node scripts/test_modules.cjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[HATA] Modüler mimari testleri başarısız oldu!" -ForegroundColor Red
    exit 1
}

# 2. TypeScript ve Vite Derleme Testi
Write-Host "`n[2/3] TypeScript (tsc --noEmit) ve Vite Derleme Testi Yapılıyor..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[HATA] Proje derleme aşamasında hata verdi!" -ForegroundColor Red
    exit 1
}

# 3. Git Durumu Kontrolü
Write-Host "`n[3/3] Git Depo ve Branch Durumu Kontrol Ediliyor..." -ForegroundColor Green
git status -s

Write-Host "`n✓ BÜTÜN KONTROLLER VE TESTLER BAŞARIYLA GEÇİLDİ. DEPLOYMENT'A HAZIR!" -ForegroundColor Cyan
