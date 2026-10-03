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

-- Denetim Günlüğü & Adli Bilişim Log Şeması (Audit Trail & Forensic Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_username TEXT DEFAULT 'Sistem / Anonim',
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT,
  session_id TEXT,
  action_type TEXT DEFAULT 'Genel',
  resource_id TEXT,
  status_code INTEGER DEFAULT 200,
  status TEXT DEFAULT 'Başarılı',
  error_details TEXT
);

-- Var olan veritabanları için geriye dönük uyumlu kolon eklemeleri
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'Genel';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status_code INTEGER DEFAULT 200;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Başarılı';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS error_details TEXT;

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
-- ====================================================================
-- ULTRA HUKUK AI — HİBRİT KURUMSAL MİMARİ VERİTABANI ŞEMASI (FAZ 1)
-- Apilex ERP, CRM, Finans/Kasa, UYAP Entegrasyonu & Asenkron Kuyruk Tabloları
-- ====================================================================

-- 1. Kurumsal Müvekkil CRM Tablosu
CREATE TABLE IF NOT EXISTS crm_clients (
  id TEXT PRIMARY KEY,
  lawyer_sicil_no TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'Tüzel Kişi (Şirket)', -- 'Tüzel Kişi (Şirket)' veya 'Gerçek Kişi (Şahıs)'
  company_title TEXT,
  full_name TEXT NOT NULL,
  tax_or_tc_no TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  contract_type TEXT NOT NULL DEFAULT 'Aylık Kurumsal Danışmanlık', -- 'Aylık Kurumsal Danışmanlık', 'Dava Başı Ücret', 'Başarı Primi (%15)'
  billing_currency TEXT NOT NULL DEFAULT 'TRY',
  total_billed NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'Standart', -- 'Düşük', 'Standart', 'Yüksek Risk'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Dava ve Dosya Takip Tablosu (Genişletilmiş ERP Dava Modülü)
CREATE TABLE IF NOT EXISTS cases_extended (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES crm_clients(id) ON DELETE SET NULL,
  lawyer_sicil_no TEXT NOT NULL,
  case_title TEXT NOT NULL,
  case_type TEXT NOT NULL, -- 'Ticari İtirazın İptali', 'İşçilik Alacağı', 'Tapu İptali ve Tescil', 'Ceza', vb.
  court_name TEXT NOT NULL,
  esas_no TEXT NOT NULL,
  karar_no TEXT,
  plaintiff TEXT, -- Davacı / Müşteki
  defendant TEXT, -- Davalı / Sanık
  assigned_lawyer TEXT NOT NULL DEFAULT 'Av. Osman Turgut',
  role_in_case TEXT NOT NULL DEFAULT 'Davacı Vekili',
  stage TEXT NOT NULL DEFAULT 'Ön İnceleme', -- 'Dava Açılışı', 'Tansip', 'Ön İnceleme', 'Tahkikat', 'Bilirkişi İncelemesi', 'Sözlü Yargılama', 'İstinaf/Temyiz', 'Kesinleşti'
  claim_amount NUMERIC(14, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  next_hearing_date DATE,
  next_hearing_time TEXT,
  critical_deadline_date DATE,
  critical_deadline_description TEXT,
  status TEXT NOT NULL DEFAULT 'Açık', -- 'Açık', 'Derdest', 'Karara Çıktı', 'İstinafta', 'Arşivlendi'
  risk_score INTEGER NOT NULL DEFAULT 20, -- 0 - 100 risk puanı
  winning_probability INTEGER NOT NULL DEFAULT 80, -- % kazanma ihtimali
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Celse, Duruşma & Hak Düşürücü Süre Tablosu
CREATE TABLE IF NOT EXISTS case_hearings (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases_extended(id) ON DELETE CASCADE,
  hearing_date DATE NOT NULL,
  hearing_time TEXT NOT NULL DEFAULT '10:00',
  court_name TEXT NOT NULL,
  hearing_stage TEXT NOT NULL, -- 'Ön İnceleme Duruşması', 'Tahkikat & Tanıklı Celse', 'Bilirkişi Raporuna İtiraz', 'Karar Celsesi'
  hearing_notes TEXT,
  objection_deadline DATE, -- Bilirkişi veya tensip 2 haftalık kesin itiraz süresi
  appeal_deadline DATE, -- Kararın tebliğinden itibaren 2 haftalık istinaf süresi
  assigned_lawyer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Yaklaşıyor', -- 'Yaklaşıyor', 'Tamamlandı', 'Ertelendi'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Finans, Kasa, Masraf ve SMM Tablosu
CREATE TABLE IF NOT EXISTS finance_records (
  id TEXT PRIMARY KEY,
  lawyer_sicil_no TEXT NOT NULL,
  client_id TEXT REFERENCES crm_clients(id) ON DELETE SET NULL,
  case_id TEXT REFERENCES cases_extended(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'tahsilat', 'masraf', 'avans', 'smm'
  category TEXT NOT NULL, -- 'Vekalet Ücreti', 'Bilirkişi Masrafı', 'UYAP Harç', 'Gider Avansı', 'Büro Gideri'
  description TEXT NOT NULL,
  gross_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  vat_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  withholding_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00, -- GV Stopajı %20
  withholding_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_deduction_applied BOOLEAN NOT NULL DEFAULT false, -- KDV Tevkifatı (5/10, 9/10)
  tax_deduction_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  receipt_no TEXT, -- e-SMM Makbuz Seri/Sıra No
  status TEXT NOT NULL DEFAULT 'tamamlandi', -- 'tamamlandi', 'beklemede', 'iptal'
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. UYAP & e-Devlet Entegrasyon Kütüğü
CREATE TABLE IF NOT EXISTS uyap_sync_logs (
  id TEXT PRIMARY KEY,
  lawyer_sicil_no TEXT NOT NULL,
  case_id TEXT REFERENCES cases_extended(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL, -- 'udf_export', 'xml_import', 'hearing_sync', 'safahat_poll'
  external_doc_id TEXT,
  payload_hash TEXT,
  status TEXT NOT NULL DEFAULT 'BAŞARILI', -- 'BAŞARILI', 'SIRADA', 'HATA'
  result_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Asenkron Arka Plan Görev Kuyruğu (Job Queue)
CREATE TABLE IF NOT EXISTS async_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL, -- 'ai_deep_analysis', 'multi_agent_simulation', 'uyap_batch_import', 'smm_batch_generate'
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  priority INTEGER NOT NULL DEFAULT 1, -- 1: Normal, 2: Yüksek, 3: Acil
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- İndeksler (Sorgu Optimizasyonu & Performans)
CREATE INDEX IF NOT EXISTS idx_crm_clients_lawyer ON crm_clients(lawyer_sicil_no);
CREATE INDEX IF NOT EXISTS idx_cases_ext_lawyer ON cases_extended(lawyer_sicil_no);
CREATE INDEX IF NOT EXISTS idx_cases_ext_client ON cases_extended(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_ext_hearing ON cases_extended(next_hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON case_hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_finance_lawyer ON finance_records(lawyer_sicil_no);
CREATE INDEX IF NOT EXISTS idx_finance_case ON finance_records(case_id);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_records(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_async_jobs_status ON async_jobs(status, priority DESC);


-- 7. Parçalı Dosya Yükleme Tabloları (Chunked Uploads - 50MB+ Payload & Zaman Aşımı Çözümü)
CREATE TABLE IF NOT EXISTS chunked_uploads (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_type TEXT,
  total_size BIGINT NOT NULL,
  total_chunks INTEGER NOT NULL,
  uploaded_chunks INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploading',
  case_id TEXT,
  lawyer_sicil_no TEXT NOT NULL DEFAULT '8109',
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upload_chunks (
  id TEXT PRIMARY KEY,
  upload_id TEXT NOT NULL REFERENCES chunked_uploads(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  chunk_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(upload_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_upload_chunks_id ON upload_chunks(upload_id, chunk_index);
