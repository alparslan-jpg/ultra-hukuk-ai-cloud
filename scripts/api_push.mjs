#!/usr/bin/env node
// GitHub API ile tüm dosyaları tek seferde push eden script
// git push çalışmadığında alternatif olarak kullanılır

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO = 'alparslan-jpg/ultra-hukuk-ai';
const BRANCH = 'master';

function gh(cmd) {
  return execSync(`gh api ${cmd}`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
}

function ghPost(endpoint, data) {
  const json = JSON.stringify(data).replace(/"/g, '\\"');
  return JSON.parse(execSync(
    `gh api ${endpoint} -X POST --input -`,
    { input: JSON.stringify(data), encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
  ));
}

// Collect all tracked files
const gitFiles = execSync('git ls-files', { encoding: 'utf-8', cwd: process.cwd() })
  .split('\n').filter(f => f.trim());

console.log(`📦 ${gitFiles.length} dosya yüklenecek...`);

// Create blobs for each file
const treeItems = [];
let i = 0;
for (const file of gitFiles) {
  i++;
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath);
  const isText = !content.includes(0x00); // simple binary check
  
  try {
    let blob;
    if (isText) {
      blob = ghPost(`repos/${REPO}/git/blobs`, {
        content: content.toString('utf-8'),
        encoding: 'utf-8'
      });
    } else {
      blob = ghPost(`repos/${REPO}/git/blobs`, {
        content: content.toString('base64'),
        encoding: 'base64'
      });
    }
    
    treeItems.push({
      path: file,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });
    
    if (i % 10 === 0) console.log(`  ✓ ${i}/${gitFiles.length} dosya yüklendi`);
  } catch (err) {
    console.error(`  ✗ ${file} yüklenemedi:`, err.message?.substring(0, 100));
  }
}

console.log(`\n🌳 Git tree oluşturuluyor (${treeItems.length} dosya)...`);

// Create tree
const tree = ghPost(`repos/${REPO}/git/trees`, {
  tree: treeItems
});

console.log(`✓ Tree SHA: ${tree.sha}`);

// Get current commit SHA for parent
let parentSha = null;
try {
  const ref = JSON.parse(gh(`repos/${REPO}/git/ref/heads/${BRANCH}`));
  parentSha = ref.object.sha;
} catch (e) {
  console.log('  Yeni branch oluşturuluyor...');
}

// Create commit
const commitData = {
  message: 'feat: Ultra Hukuk AI - Neon PostgreSQL + Cloud Deploy Ready',
  tree: tree.sha,
};
if (parentSha) commitData.parents = [parentSha];

const commit = ghPost(`repos/${REPO}/git/commits`, commitData);
console.log(`✓ Commit SHA: ${commit.sha}`);

// Update branch reference
try {
  execSync(
    `gh api repos/${REPO}/git/refs/heads/${BRANCH} -X PATCH --input -`,
    { input: JSON.stringify({ sha: commit.sha, force: true }), encoding: 'utf-8' }
  );
  console.log(`\n🚀 Push başarılı! https://github.com/${REPO}`);
} catch (e) {
  // Branch might not exist, create it
  ghPost(`repos/${REPO}/git/refs`, {
    ref: `refs/heads/${BRANCH}`,
    sha: commit.sha
  });
  console.log(`\n🚀 Branch oluşturuldu ve push başarılı! https://github.com/${REPO}`);
}
