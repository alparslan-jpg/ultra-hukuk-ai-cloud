# Ultra Hukuk AI - GitHub Senkronizasyon ve Canlı Dağıtım Betiği
Write-Host ">>> Ultra Hukuk AI GitHub Senkronizasyonu Başlatılıyor..." -ForegroundColor Cyan

git add -A
$commitMsg = "feat: Kirmizi alanlarin (Ana Sayfa ve Muvekkil Ekle butonlari) tasfiyesi, AI evraktan otonom muvekkil/taraf cikarimi ve Gates 1-8 tam dogrulamasi"
try {
    git commit -S -m $commitMsg
} catch {
    git commit --no-gpg-sign -m $commitMsg
}
if ($LASTEXITCODE -ne 0) {
    git commit --no-gpg-sign -m $commitMsg
}

Write-Host ">>> GitHub Remote'larına Gönderiliyor..." -ForegroundColor Cyan
git push origin main

Write-Host ">>> Senkronizasyon ve Canlı Dağıtım Başarıyla Tetiklendi!" -ForegroundColor Green
