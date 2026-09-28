-- ============================================================
-- ULTRA HUKUK AI — Neon PostgreSQL Veritabanı Şeması
-- Tüm kalıcı veri tabloları (Admin, Avukat, Whitelist, Audit, vb.)
-- ============================================================

-- Admin Kullanıcıları
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  bound_device_id TEXT,
  is_device_locked BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kayıtlı Avukatlar
CREATE TABLE IF NOT EXISTS lawyers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  sicil_no TEXT UNIQUE NOT NULL,
  baro_adi TEXT NOT NULL,
  email TEXT,
  tc_kimlik TEXT,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  days_remaining INTEGER NOT NULL DEFAULT 365,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_hardware_locked BOOLEAN NOT NULL DEFAULT false,
  bound_hardware_id TEXT,
  status TEXT NOT NULL DEFAULT 'AKTİF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beyaz Liste (Whitelist)
CREATE TABLE IF NOT EXISTS whitelist (
  id TEXT PRIMARY KEY,
  tc_kimlik_no TEXT NOT NULL,
  sicil_no TEXT NOT NULL,
  baro_adi TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  is_used BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_via TEXT NOT NULL DEFAULT 'Sistem Yöneticisi'
);

-- Denetim Günlüğü (Audit Log)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT
);

-- Veri İhlali Kayıtları (KVKK)
CREATE TABLE IF NOT EXISTS data_breach_incidents (
  id TEXT PRIMARY KEY,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Düşük',
  kvkk_reported_at TIMESTAMPTZ,
  notes TEXT
);

-- Gemini API Kullanım Kayıtları
CREATE TABLE IF NOT EXISTS gemini_usage (
  id TEXT PRIMARY KEY,
  lawyer_sicil_no TEXT NOT NULL,
  query_count INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Müvekkil Kayıtları
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  lawyer_sicil_no TEXT NOT NULL,
  full_name TEXT NOT NULL,
  tc_kimlik TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dava Kayıtları
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lawyer_sicil_no TEXT NOT NULL,
  case_title TEXT NOT NULL,
  case_type TEXT,
  court_name TEXT,
  esas_no TEXT,
  karar_no TEXT,
  status TEXT NOT NULL DEFAULT 'Açık',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dava Dosyaları
CREATE TABLE IF NOT EXISTS case_files (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_data TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_lawyers_sicil ON lawyers(sicil_no);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gemini_usage_sicil ON gemini_usage(lawyer_sicil_no);
CREATE INDEX IF NOT EXISTS idx_clients_lawyer ON clients(lawyer_sicil_no);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer ON cases(lawyer_sicil_no);

-- Varsayılan Admin Kullanıcısı (Seed)
INSERT INTO admin_users (id, username, password_hash, role, is_active, last_login_at)
VALUES (
  'admin-1',
  'Alparslan',
  '$2a$10$placeholder_will_be_set_at_runtime',
  'SuperAdmin',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Varsayılan Avukat (Seed)
INSERT INTO lawyers (id, full_name, sicil_no, baro_adi, email, tc_kimlik, subscription_start_date, subscription_end_date, days_remaining, is_active, status)
VALUES (
  'usr-8109',
  'Av. Osman Turgut',
  '8109',
  'İstanbul Barosu',
  'av.osmanturgut@hukukburosu.av.tr',
  '10000008109',
  NOW(),
  NOW() + INTERVAL '365 days',
  365,
  true,
  'AKTİF'
) ON CONFLICT (id) DO NOTHING;

-- Varsayılan Whitelist Kaydı
INSERT INTO whitelist (id, tc_kimlik_no, sicil_no, baro_adi, full_name, email, is_used, added_via)
VALUES (
  'wl-8109',
  '10000008109',
  '8109',
  'İstanbul Barosu',
  'Av. Osman Turgut',
  'av.osmanturgut@hukukburosu.av.tr',
  true,
  'Sistem Yöneticisi'
) ON CONFLICT (id) DO NOTHING;
