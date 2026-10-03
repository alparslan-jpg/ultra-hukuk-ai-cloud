# Ultra Hukuk AI - GitHub Senkronizasyon Betiği (PowerShell)
# Hedef Depo: https://github.com/alparslan-jpg/ultra-hukuk-ai-cloud

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " ULTRA HUKUK AI -> GITHUB SENKRONİZASYONU" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Zararlı olabilecek ve 403 hatası verdiren binary klasörlerini temizle
Write-Host "[1/5] Gereksiz binary (bin, obj) klasörleri taranıyor..." -ForegroundColor Yellow
Get-ChildItem -Path . -Include bin,obj -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 2. Git başlat veya kontrol et
Write-Host "[2/5] Git deposu kontrol ediliyor..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

# 3. Remote URL ayarla
Write-Host "[3/5] GitHub Remote bağlanıyor..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/alparslan-jpg/ultra-hukuk-ai-cloud.git"
git remote remove origin 2>$null
git remote add origin $remoteUrl

# 4. Değişiklikleri ekle ve commit oluştur
Write-Host "[4/5] Çoklu Model (Multi-Model) ve Denetleme Sistemi commit ediliyor..." -ForegroundColor Yellow
git add .
git commit -m "feat: Multi-Model Routing (Gemini 3.8 Flash, 3.1 Pro, 3.5 Transcribe), Adli Evrak Mikro Denetim ve Yapay Zeka Dedektoru"

# 5. Push et
Write-Host "[5/5] GitHub'a push ediliyor..." -ForegroundColor Green
git push -u origin main --force

Write-Host "`n>>> Tebrikler! Ultra Hukuk AI başarıyla https://github.com/alparslan-jpg/ultra-hukuk-ai ile senkronize edildi." -ForegroundColor Cyan
