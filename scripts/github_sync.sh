#!/usr/bin/env bash
# Ultra Hukuk AI - GitHub Synchronization Script (Bash)
# Repository: https://github.com/alparslan-jpg/ultra-hukuk-ai

set -e

echo "================================================="
echo " ULTRA HUKUK AI -> GITHUB SENKRONİZASYONU"
echo "================================================="

# Clean dangerous binaries (exclude node_modules)
echo "[1/4] Binary temizliği yapılıyor..."
find . -path "./node_modules" -prune -o -name "obj" -type d -exec rm -rf {} + 2>/dev/null || true

# Init git if needed
if [ ! -d ".git" ]; then
    echo "[2/4] Git başlatılıyor..."
    git init
    git branch -M main
fi

# Set remote
echo "[3/4] Remote repository ayarlanıyor..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/alparslan-jpg/ultra-hukuk-ai.git

# Stage, commit and push
echo "[4/4] Commit ve GitHub'a push işlemi..."
git add .
git commit -m "feat: Multi-Model Routing, Adli Evrak Mikro-Ayrinti ve Yapay Zeka Tespiti" || true
git push -u origin main || echo "Lütfen GitHub kimlik bilgilerinizi veya SSH anahtarınızı kullanarak push edin."

echo "Senkronizasyon adımları tamamlandı!"
