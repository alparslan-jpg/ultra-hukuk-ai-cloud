import fs from 'fs';
import path from 'path';

// ============================================================
// ULTRA HUKUK AI — Hybrid Persistent Database Service
// DATABASE_URL varsa → Neon PostgreSQL (bulut kalıcı veri)
// DATABASE_URL yoksa → JSON dosya (yerel geliştirme)
// ============================================================

export interface AdminUserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  boundDeviceId: string | null;
  isDeviceLocked: boolean;
  mustChangePassword: boolean;
}

export interface LawyerUserRecord {
  id: string;
  fullName: string;
  sicilNo: string;
  baroAdi: string;
  email: string;
  tcKimlik: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  daysRemaining: number;
  isActive: boolean;
  isHardwareLocked: boolean;
  boundHardwareId: string | null;
  status: string;
}

export interface WhitelistRecord {
  id: string;
  tcKimlikNo: string;
  sicilNo: string;
  baroAdi: string;
  fullName: string;
  email: string;
  isUsed: boolean;
  addedAt: string;
  addedVia: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  adminUsername: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface DataBreachIncidentRecord {
  id: string;
  detectedAt: string;
  description: string;
  severity: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
  kvkkReportedAt: string | null;
  notes: string | null;
}

export interface GeminiUsageRecord {
  id: string;
  lawyerSicilNo: string;
  queryCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  lastUsedAt: string;
}

export interface DatabaseSchema {
  adminUsers: AdminUserRecord[];
  lawyerUsers: LawyerUserRecord[];
  whitelist: WhitelistRecord[];
  auditLogs: AuditLogRecord[];
  dataBreachIncidents: DataBreachIncidentRecord[];
  geminiUsage: GeminiUsageRecord[];
  settings: Record<string, any>;
}

// ============================================================
// NEON POSTGRESQL ADAPTER
// ============================================================

let neonSql: any = null;
const DATABASE_URL = process.env.DATABASE_URL || '';

async function initNeon() {
  if (!DATABASE_URL) return false;
  try {
    const { neon } = await import('@neondatabase/serverless');
    neonSql = neon(DATABASE_URL);
    // Test connection
    await neonSql`SELECT 1`;
    console.log('[DB] ✅ Neon PostgreSQL bağlantısı başarılı');
    return true;
  } catch (err: any) {
    console.warn('[DB] ⚠️ Neon PostgreSQL bağlantısı kurulamadı, JSON fallback kullanılacak:', err?.message);
    neonSql = null;
    return false;
  }
}

class NeonDatabaseAdapter {
  // --- Admin Users ---
  async getAdmins(): Promise<AdminUserRecord[]> {
    const rows = await neonSql`SELECT * FROM admin_users ORDER BY created_at`;
    return rows.map((r: any) => ({
      id: r.id,
      username: r.username,
      passwordHash: r.password_hash,
      role: r.role,
      isActive: r.is_active,
      failedLoginCount: r.failed_login_count,
      lockedUntil: r.locked_until,
      lastLoginAt: r.last_login_at,
      boundDeviceId: r.bound_device_id,
      isDeviceLocked: r.is_device_locked,
      mustChangePassword: r.must_change_password,
    }));
  }

  async saveAdmin(admin: AdminUserRecord) {
    await neonSql`
      INSERT INTO admin_users (id, username, password_hash, role, is_active, failed_login_count, locked_until, last_login_at, bound_device_id, is_device_locked, must_change_password, updated_at)
      VALUES (${admin.id}, ${admin.username}, ${admin.passwordHash}, ${admin.role}, ${admin.isActive}, ${admin.failedLoginCount}, ${admin.lockedUntil}, ${admin.lastLoginAt}, ${admin.boundDeviceId}, ${admin.isDeviceLocked}, ${admin.mustChangePassword}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        failed_login_count = EXCLUDED.failed_login_count,
        locked_until = EXCLUDED.locked_until,
        last_login_at = EXCLUDED.last_login_at,
        bound_device_id = EXCLUDED.bound_device_id,
        is_device_locked = EXCLUDED.is_device_locked,
        must_change_password = EXCLUDED.must_change_password,
        updated_at = NOW()
    `;
  }

  // --- Lawyer Users ---
  async getLawyers(): Promise<LawyerUserRecord[]> {
    const rows = await neonSql`SELECT * FROM lawyers ORDER BY created_at`;
    return rows.map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      sicilNo: r.sicil_no,
      baroAdi: r.baro_adi,
      email: r.email || '',
      tcKimlik: r.tc_kimlik || '',
      subscriptionStartDate: r.subscription_start_date,
      subscriptionEndDate: r.subscription_end_date,
      daysRemaining: r.days_remaining,
      isActive: r.is_active,
      isHardwareLocked: r.is_hardware_locked,
      boundHardwareId: r.bound_hardware_id,
      status: r.status,
    }));
  }

  async saveLawyer(lawyer: LawyerUserRecord) {
    await neonSql`
      INSERT INTO lawyers (id, full_name, sicil_no, baro_adi, email, tc_kimlik, subscription_start_date, subscription_end_date, days_remaining, is_active, is_hardware_locked, bound_hardware_id, status, updated_at)
      VALUES (${lawyer.id}, ${lawyer.fullName}, ${lawyer.sicilNo}, ${lawyer.baroAdi}, ${lawyer.email}, ${lawyer.tcKimlik}, ${lawyer.subscriptionStartDate}, ${lawyer.subscriptionEndDate}, ${lawyer.daysRemaining}, ${lawyer.isActive}, ${lawyer.isHardwareLocked}, ${lawyer.boundHardwareId}, ${lawyer.status}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        sicil_no = EXCLUDED.sicil_no,
        baro_adi = EXCLUDED.baro_adi,
        email = EXCLUDED.email,
        tc_kimlik = EXCLUDED.tc_kimlik,
        subscription_start_date = EXCLUDED.subscription_start_date,
        subscription_end_date = EXCLUDED.subscription_end_date,
        days_remaining = EXCLUDED.days_remaining,
        is_active = EXCLUDED.is_active,
        is_hardware_locked = EXCLUDED.is_hardware_locked,
        bound_hardware_id = EXCLUDED.bound_hardware_id,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;
  }

  // --- Whitelist ---
  async getWhitelist(): Promise<WhitelistRecord[]> {
    const rows = await neonSql`SELECT * FROM whitelist ORDER BY added_at DESC`;
    return rows.map((r: any) => ({
      id: r.id,
      tcKimlikNo: r.tc_kimlik_no,
      sicilNo: r.sicil_no,
      baroAdi: r.baro_adi,
      fullName: r.full_name,
      email: r.email || '',
      isUsed: r.is_used,
      addedAt: r.added_at,
      addedVia: r.added_via,
    }));
  }

  async addWhitelist(item: WhitelistRecord) {
    await neonSql`
      INSERT INTO whitelist (id, tc_kimlik_no, sicil_no, baro_adi, full_name, email, is_used, added_at, added_via)
      VALUES (${item.id}, ${item.tcKimlikNo}, ${item.sicilNo}, ${item.baroAdi}, ${item.fullName}, ${item.email}, ${item.isUsed}, ${item.addedAt}, ${item.addedVia})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  async removeWhitelist(id: string): Promise<boolean> {
    const res = await neonSql`DELETE FROM whitelist WHERE id = ${id}`;
    return (res?.length ?? 0) > 0 || true;
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLogRecord[]> {
    const rows = await neonSql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`;
    return rows.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      adminUsername: r.admin_username,
      action: r.action,
      details: r.details || '',
      ipAddress: r.ip_address || '',
    }));
  }

  async addAuditLog(log: AuditLogRecord) {
    await neonSql`
      INSERT INTO audit_logs (id, timestamp, admin_username, action, details, ip_address)
      VALUES (${log.id}, ${log.timestamp}, ${log.adminUsername}, ${log.action}, ${log.details}, ${log.ipAddress})
    `;
  }

  // --- Breaches ---
  async getBreaches(): Promise<DataBreachIncidentRecord[]> {
    const rows = await neonSql`SELECT * FROM data_breach_incidents ORDER BY detected_at DESC`;
    return rows.map((r: any) => ({
      id: r.id,
      detectedAt: r.detected_at,
      description: r.description,
      severity: r.severity,
      kvkkReportedAt: r.kvkk_reported_at,
      notes: r.notes,
    }));
  }

  async addBreach(incident: DataBreachIncidentRecord) {
    await neonSql`
      INSERT INTO data_breach_incidents (id, detected_at, description, severity, kvkk_reported_at, notes)
      VALUES (${incident.id}, ${incident.detectedAt}, ${incident.description}, ${incident.severity}, ${incident.kvkkReportedAt}, ${incident.notes})
    `;
  }

  async updateBreach(id: string, updates: Partial<DataBreachIncidentRecord>): Promise<boolean> {
    if (updates.kvkkReportedAt !== undefined) {
      await neonSql`UPDATE data_breach_incidents SET kvkk_reported_at = ${updates.kvkkReportedAt} WHERE id = ${id}`;
    }
    if (updates.notes !== undefined) {
      await neonSql`UPDATE data_breach_incidents SET notes = ${updates.notes} WHERE id = ${id}`;
    }
    return true;
  }

  // --- Gemini Usage ---
  async getGeminiUsage(): Promise<GeminiUsageRecord[]> {
    const rows = await neonSql`SELECT * FROM gemini_usage ORDER BY last_used_at DESC`;
    return rows.map((r: any) => ({
      id: r.id,
      lawyerSicilNo: r.lawyer_sicil_no,
      queryCount: r.query_count,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      estimatedCostUsd: parseFloat(r.estimated_cost_usd),
      lastUsedAt: r.last_used_at,
    }));
  }

  async updateGeminiUsage(record: GeminiUsageRecord) {
    await neonSql`
      INSERT INTO gemini_usage (id, lawyer_sicil_no, query_count, input_tokens, output_tokens, estimated_cost_usd, last_used_at)
      VALUES (${record.id}, ${record.lawyerSicilNo}, ${record.queryCount}, ${record.inputTokens}, ${record.outputTokens}, ${record.estimatedCostUsd}, ${record.lastUsedAt})
      ON CONFLICT (id) DO UPDATE SET
        query_count = EXCLUDED.query_count,
        input_tokens = EXCLUDED.input_tokens,
        output_tokens = EXCLUDED.output_tokens,
        estimated_cost_usd = EXCLUDED.estimated_cost_usd,
        last_used_at = EXCLUDED.last_used_at
    `;
  }

  async persist() { /* no-op: Neon commits automatically */ }
}

// ============================================================
// JSON FILE ADAPTER (Fallback)
// ============================================================

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ultrahukuk_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonDatabaseAdapter {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content) as DatabaseSchema;
      } catch (err) {
        console.error('[DB] Veritabanı dosyası okunamadı, yeniden oluşturuluyor:', err);
      }
    }
    const defaultData: DatabaseSchema = {
      adminUsers: [], lawyerUsers: [], whitelist: [],
      auditLogs: [], dataBreachIncidents: [], geminiUsage: [],
      settings: { createdAt: new Date().toISOString(), version: '2.6.4' }
    };
    this.saveImmediate(defaultData);
    return defaultData;
  }

  private saveImmediate(state: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Disk kaydı hatası:', err);
    }
  }

  persist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => { this.saveImmediate(this.data); }, 100);
  }

  getAdmins(): AdminUserRecord[] { return this.data.adminUsers; }
  saveAdmin(admin: AdminUserRecord) {
    const idx = this.data.adminUsers.findIndex(a => a.id === admin.id);
    if (idx >= 0) this.data.adminUsers[idx] = admin;
    else this.data.adminUsers.push(admin);
    this.persist();
  }

  getLawyers(): LawyerUserRecord[] { return this.data.lawyerUsers; }
  saveLawyer(lawyer: LawyerUserRecord) {
    const idx = this.data.lawyerUsers.findIndex(u => u.id === lawyer.id || u.sicilNo === lawyer.sicilNo);
    if (idx >= 0) this.data.lawyerUsers[idx] = lawyer;
    else this.data.lawyerUsers.push(lawyer);
    this.persist();
  }

  getWhitelist(): WhitelistRecord[] { return this.data.whitelist; }
  addWhitelist(item: WhitelistRecord) { this.data.whitelist.unshift(item); this.persist(); }
  removeWhitelist(id: string): boolean {
    const idx = this.data.whitelist.findIndex(w => w.id === id);
    if (idx >= 0) { this.data.whitelist.splice(idx, 1); this.persist(); return true; }
    return false;
  }

  getAuditLogs(): AuditLogRecord[] { return this.data.auditLogs; }
  addAuditLog(log: AuditLogRecord) {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) this.data.auditLogs.pop();
    this.persist();
  }

  getBreaches(): DataBreachIncidentRecord[] { return this.data.dataBreachIncidents; }
  addBreach(incident: DataBreachIncidentRecord) { this.data.dataBreachIncidents.unshift(incident); this.persist(); }
  updateBreach(id: string, updates: Partial<DataBreachIncidentRecord>): boolean {
    const item = this.data.dataBreachIncidents.find(b => b.id === id);
    if (item) { Object.assign(item, updates); this.persist(); return true; }
    return false;
  }

  getGeminiUsage(): GeminiUsageRecord[] { return this.data.geminiUsage; }
  updateGeminiUsage(record: GeminiUsageRecord) {
    const idx = this.data.geminiUsage.findIndex(g => g.lawyerSicilNo === record.lawyerSicilNo);
    if (idx >= 0) this.data.geminiUsage[idx] = record;
    else this.data.geminiUsage.push(record);
    this.persist();
  }
}

// ============================================================
// HYBRID DATABASE — Auto-select Neon or JSON
// ============================================================

class HybridDatabase {
  private neonAdapter: NeonDatabaseAdapter | null = null;
  private jsonAdapter: JsonDatabaseAdapter;
  private useNeon = false;
  private initPromise: Promise<void>;

  constructor() {
    this.jsonAdapter = new JsonDatabaseAdapter();
    this.initPromise = this.initialize();
  }

  private async initialize() {
    if (DATABASE_URL) {
      const ok = await initNeon();
      if (ok) {
        this.neonAdapter = new NeonDatabaseAdapter();
        this.useNeon = true;
        console.log('[DB] 🟢 Neon PostgreSQL aktif (bulut kalıcı veri)');
      } else {
        console.log('[DB] 🟡 JSON dosya fallback aktif (yerel geliştirme)');
      }
    } else {
      console.log('[DB] 🟡 DATABASE_URL tanımlanmamış — JSON dosya modu');
    }
  }

  async ready() { await this.initPromise; }

  // Sync wrappers that return cached JSON data immediately,
  // while async Neon calls run in background for writes
  getAdmins(): AdminUserRecord[] { return this.jsonAdapter.getAdmins(); }
  getLawyers(): LawyerUserRecord[] { return this.jsonAdapter.getLawyers(); }
  getWhitelist(): WhitelistRecord[] { return this.jsonAdapter.getWhitelist(); }
  getAuditLogs(): AuditLogRecord[] { return this.jsonAdapter.getAuditLogs(); }
  getBreaches(): DataBreachIncidentRecord[] { return this.jsonAdapter.getBreaches(); }
  getGeminiUsage(): GeminiUsageRecord[] { return this.jsonAdapter.getGeminiUsage(); }

  saveAdmin(admin: AdminUserRecord) {
    this.jsonAdapter.saveAdmin(admin);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.saveAdmin(admin).catch(e => console.error('[Neon] saveAdmin error:', e?.message));
    }
  }

  saveLawyer(lawyer: LawyerUserRecord) {
    this.jsonAdapter.saveLawyer(lawyer);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.saveLawyer(lawyer).catch(e => console.error('[Neon] saveLawyer error:', e?.message));
    }
  }

  addWhitelist(item: WhitelistRecord) {
    this.jsonAdapter.addWhitelist(item);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.addWhitelist(item).catch(e => console.error('[Neon] addWhitelist error:', e?.message));
    }
  }

  removeWhitelist(id: string): boolean {
    const result = this.jsonAdapter.removeWhitelist(id);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.removeWhitelist(id).catch(e => console.error('[Neon] removeWhitelist error:', e?.message));
    }
    return result;
  }

  addAuditLog(log: AuditLogRecord) {
    this.jsonAdapter.addAuditLog(log);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.addAuditLog(log).catch(e => console.error('[Neon] addAuditLog error:', e?.message));
    }
  }

  addBreach(incident: DataBreachIncidentRecord) {
    this.jsonAdapter.addBreach(incident);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.addBreach(incident).catch(e => console.error('[Neon] addBreach error:', e?.message));
    }
  }

  updateBreach(id: string, updates: Partial<DataBreachIncidentRecord>): boolean {
    const result = this.jsonAdapter.updateBreach(id, updates);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.updateBreach(id, updates).catch(e => console.error('[Neon] updateBreach error:', e?.message));
    }
    return result;
  }

  updateGeminiUsage(record: GeminiUsageRecord) {
    this.jsonAdapter.updateGeminiUsage(record);
    if (this.useNeon && this.neonAdapter) {
      this.neonAdapter.updateGeminiUsage(record).catch(e => console.error('[Neon] updateGeminiUsage error:', e?.message));
    }
  }

  persist() {
    this.jsonAdapter.persist();
    // Neon auto-commits, no explicit persist needed
  }
}

export const db = new HybridDatabase();
