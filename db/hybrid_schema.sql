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
