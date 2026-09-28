// ============================================================
// ULTRA HUKUK AI — Neon PostgreSQL Migration Runner
// db/schema.sql dosyasını hedef veritabanına uygular
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL ortam değişkeni tanımlanmamış.');
    console.error('   Neon Dashboard\'dan bağlantı URL\'sini alıp .env dosyasına ekleyin.');
    process.exit(1);
  }

  // Dynamic import for pg (postgres client)
  let pg;
  try {
    pg = await import('@neondatabase/serverless');
  } catch {
    try {
      pg = await import('pg');
    } catch {
      console.error('❌ PostgreSQL istemcisi bulunamadı. Şu komutu çalıştırın:');
      console.error('   npm install @neondatabase/serverless');
      process.exit(1);
    }
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ db/schema.sql dosyası bulunamadı.');
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('🔄 Neon PostgreSQL migration başlatılıyor...');
  console.log(`   Hedef: ${DATABASE_URL.replace(/\/\/[^@]+@/, '//***@')}`);

  try {
    const { neon } = pg;
    if (neon) {
      // Neon serverless driver
      const sql = neon(DATABASE_URL);
      await sql(schemaSql);
    } else {
      // Standard pg driver
      const { Pool } = pg;
      const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await pool.query(schemaSql);
      await pool.end();
    }

    console.log('✅ Migration başarılı! Tüm tablolar oluşturuldu.');
    console.log('   📋 admin_users, lawyers, whitelist, audit_logs,');
    console.log('      data_breach_incidents, gemini_usage, clients, cases, case_files');
  } catch (err) {
    console.error('❌ Migration hatası:', err.message || err);
    process.exit(1);
  }
}

migrate();
