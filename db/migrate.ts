// ============================================================
// ULTRA HUKUK AI — Neon PostgreSQL Migration Runner
// db/schema.sql dosyasını hedef veritabanına uygular
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını otomatik yükle
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    if (typeof (process as any).loadEnvFile === 'function') {
      (process as any).loadEnvFile(envPath);
    } else {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (err) {
    console.warn('⚠️ .env yüklenirken uyarı:', err);
  }
}

export async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL ortam değişkeni tanımlanmamış.');
    console.error('   Neon Dashboard\'dan bağlantı URL\'sini alıp .env dosyasına ekleyin.');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ db/schema.sql dosyası bulunamadı.');
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('🔄 Neon PostgreSQL migration başlatılıyor...');
  console.log(`   Hedef: ${DATABASE_URL.replace(/\/\/[^@]+@/, '//***@')}`);

  let pg: any;
  try {
    pg = await import('@neondatabase/serverless');
  } catch {
    try {
      pg = await import('pg');
    } catch {
      console.error('❌ PostgreSQL istemcisi bulunamadı (@neondatabase/serverless veya pg)');
      process.exit(1);
    }
  }

  try {
    // Client.query supports multiple statements in standard PostgreSQL simple query protocol
    if (pg.Client) {
      const client = new pg.Client({ connectionString: DATABASE_URL });
      await client.connect();
      await client.query(schemaSql);
      await client.end();
    } else if (pg.Pool) {
      const pool = new pg.Pool({ connectionString: DATABASE_URL });
      await pool.query(schemaSql);
      await pool.end();
    } else {
      // Split statements and execute individually with neon tagged template or function
      const { neon } = pg;
      const sql = neon(DATABASE_URL);
      const cleaned = schemaSql
        .split('\n')
        .filter(l => !l.trim().startsWith('--'))
        .join('\n');
      const statements = cleaned
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        await sql(statement);
      }
    }

    console.log('✅ Migration başarılı! Tüm tablolar oluşturuldu ve güncellendi.');
    console.log('   📋 admin_users, lawyers, whitelist, audit_logs, data_breach_incidents,');
    console.log('      gemini_usage, clients, cases, case_files, crm_clients, cases_extended,');
    console.log('      case_hearings, finance_records, uyap_sync_logs, async_jobs,');
    console.log('      chunked_uploads, upload_chunks');
  } catch (err: any) {
    console.error('❌ Migration hatası:', err.message || err);
    process.exit(1);
  }
}

// Directly invoked
if (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'))) {
  runMigration();
}
