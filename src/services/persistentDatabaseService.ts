import fs from 'fs';
import path from 'path';

// ============================================================
// ULTRA HUKUK AI — Central Neon PostgreSQL Database Service
// Tüm kalıcı veri akışı merkezi SQL (Neon) veritabanına bağlıdır.
// ultrahukuk_store.json yerel depolaması tamamen kaldırılmıştır.
// ============================================================

// .env dosyasını ortam değişkenlerine yükle
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
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  actionType?: string;
  resourceId?: string;
  statusCode?: number;
  status?: string;
  errorDetails?: string | null;
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

const DATABASE_URL = process.env.DATABASE_URL || '';

class NeonDatabaseService {
  private neonSql: any = null;
  private isConnected = false;
  private initPromise: Promise<void>;

  // Fast in-memory synced cache for synchronous accessors
  private cachedAdmins: AdminUserRecord[] = [];
  private cachedLawyers: LawyerUserRecord[] = [];
  private cachedWhitelist: WhitelistRecord[] = [];
  private cachedAuditLogs: AuditLogRecord[] = [];
  private cachedBreaches: DataBreachIncidentRecord[] = [];
  private cachedGeminiUsage: GeminiUsageRecord[] = [];

  constructor() {
    this.initPromise = this.init();
  }

  private async init() {
    if (!DATABASE_URL) {
      console.warn('[DB] ⚠️ DATABASE_URL tanımlanmamış. Neon SQL bağlantısı kurulamadı.');
      return;
    }

    try {
      const { neon } = await import('@neondatabase/serverless');
      this.neonSql = neon(DATABASE_URL);

      // Test connection
      await this.neonSql`SELECT 1`;
      this.isConnected = true;
      console.log('[DB] 🟢 Neon PostgreSQL veritabanına başarıyla bağlanıldı (Merkezi Bulut SQL).');

      // Hydrate in-memory cache directly from Neon SQL
      await this.syncFromNeon();
    } catch (err: any) {
      console.error('[DB] 🔴 Neon PostgreSQL bağlantı hatası:', err?.message || err);
    }
  }

  public async ready(): Promise<void> {
    await this.initPromise;
  }

  public getSql(): any {
    return this.neonSql;
  }

  public async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    if (!this.neonSql) {
      throw new Error('Neon SQL veritabanı bağlantısı aktif değil.');
    }
    const rows = await this.neonSql(queryText, params);
    return rows as T[];
  }

  public async syncFromNeon(): Promise<void> {
    if (!this.neonSql) return;

    try {
      // 1. Admins
      const adminRows = await this.neonSql`SELECT * FROM admin_users ORDER BY created_at`;
      this.cachedAdmins = adminRows.map((r: any) => ({
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

      // 2. Lawyers
      const lawyerRows = await this.neonSql`SELECT * FROM lawyers ORDER BY created_at`;
      this.cachedLawyers = lawyerRows.map((r: any) => ({
        id: r.id,
        fullName: r.full_name,
        sicilNo: r.sicil_no,
        baroAdi: r.baro_adi,
        email: r.email || '',
        tcKimlik: r.tc_kimlik || '',
        subscriptionStartDate: r.subscription_start_date ? new Date(r.subscription_start_date).toISOString() : new Date().toISOString(),
        subscriptionEndDate: r.subscription_end_date ? new Date(r.subscription_end_date).toISOString() : new Date().toISOString(),
        daysRemaining: r.days_remaining ?? 365,
        isActive: r.is_active ?? true,
        isHardwareLocked: r.is_hardware_locked ?? false,
        boundHardwareId: r.bound_hardware_id || null,
        status: r.status || 'AKTİF',
      }));

      // 3. Whitelist
      const wlRows = await this.neonSql`SELECT * FROM whitelist ORDER BY added_at DESC`;
      this.cachedWhitelist = wlRows.map((r: any) => ({
        id: r.id,
        tcKimlikNo: r.tc_kimlik_no,
        sicilNo: r.sicil_no,
        baroAdi: r.baro_adi,
        fullName: r.full_name,
        email: r.email || '',
        isUsed: r.is_used,
        addedAt: r.added_at ? new Date(r.added_at).toISOString() : new Date().toISOString(),
        addedVia: r.added_via || 'Sistem Yöneticisi',
      }));

      // 4. Audit Logs
      const auditRows = await this.neonSql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`;
      this.cachedAuditLogs = auditRows.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
        adminUsername: r.admin_username || 'Sistem / Anonim',
        action: r.action,
        details: r.details || '',
        ipAddress: r.ip_address || '',
        userAgent: r.user_agent || '',
        userId: r.user_id || '',
        sessionId: r.session_id || '',
        actionType: r.action_type || 'Genel',
        resourceId: r.resource_id || '',
        statusCode: r.status_code ?? 200,
        status: r.status || 'Başarılı',
        errorDetails: r.error_details || null,
      }));

      // 5. Breaches
      const breachRows = await this.neonSql`SELECT * FROM data_breach_incidents ORDER BY detected_at DESC`;
      this.cachedBreaches = breachRows.map((r: any) => ({
        id: r.id,
        detectedAt: r.detected_at ? new Date(r.detected_at).toISOString() : new Date().toISOString(),
        description: r.description,
        severity: r.severity,
        kvkkReportedAt: r.kvkk_reported_at ? new Date(r.kvkk_reported_at).toISOString() : null,
        notes: r.notes || null,
      }));

      // 6. Gemini Usage
      const usageRows = await this.neonSql`SELECT * FROM gemini_usage ORDER BY last_used_at DESC`;
      this.cachedGeminiUsage = usageRows.map((r: any) => ({
        id: r.id,
        lawyerSicilNo: r.lawyer_sicil_no,
        queryCount: r.query_count || 0,
        inputTokens: r.input_tokens || 0,
        outputTokens: r.output_tokens || 0,
        estimatedCostUsd: parseFloat(r.estimated_cost_usd || '0'),
        lastUsedAt: r.last_used_at ? new Date(r.last_used_at).toISOString() : new Date().toISOString(),
      }));

      console.log(`[DB] 📦 Neon veritabanı önbelleği senkronize edildi: ${this.cachedLawyers.length} avukat, ${this.cachedAdmins.length} admin, ${this.cachedWhitelist.length} whitelist.`);
    } catch (err: any) {
      console.error('[DB] ⚠️ Neon senkronizasyon hatası:', err?.message || err);
    }
  }

  // --- Admin Users ---
  getAdmins(): AdminUserRecord[] {
    return [...this.cachedAdmins];
  }

  async saveAdmin(admin: AdminUserRecord): Promise<void> {
    const idx = this.cachedAdmins.findIndex(a => a.id === admin.id);
    if (idx >= 0) this.cachedAdmins[idx] = admin;
    else this.cachedAdmins.push(admin);

    if (this.neonSql) {
      await this.neonSql`
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
  }

  // --- Lawyer Users ---
  getLawyers(): LawyerUserRecord[] {
    return [...this.cachedLawyers];
  }

  async saveLawyer(lawyer: LawyerUserRecord): Promise<void> {
    const idx = this.cachedLawyers.findIndex(u => u.id === lawyer.id || u.sicilNo === lawyer.sicilNo);
    if (idx >= 0) this.cachedLawyers[idx] = lawyer;
    else this.cachedLawyers.push(lawyer);

    if (this.neonSql) {
      await this.neonSql`
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
  }

  // --- Whitelist ---
  getWhitelist(): WhitelistRecord[] {
    return [...this.cachedWhitelist];
  }

  async addWhitelist(item: WhitelistRecord): Promise<void> {
    this.cachedWhitelist.unshift(item);
    if (this.neonSql) {
      await this.neonSql`
        INSERT INTO whitelist (id, tc_kimlik_no, sicil_no, baro_adi, full_name, email, is_used, added_at, added_via)
        VALUES (${item.id}, ${item.tcKimlikNo}, ${item.sicilNo}, ${item.baroAdi}, ${item.fullName}, ${item.email}, ${item.isUsed}, ${item.addedAt}, ${item.addedVia})
        ON CONFLICT (id) DO UPDATE SET
          is_used = EXCLUDED.is_used,
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name
      `;
    }
  }

  async removeWhitelist(id: string): Promise<boolean> {
    const idx = this.cachedWhitelist.findIndex(w => w.id === id);
    if (idx >= 0) this.cachedWhitelist.splice(idx, 1);
    if (this.neonSql) {
      await this.neonSql`DELETE FROM whitelist WHERE id = ${id}`;
      return true;
    }
    return idx >= 0;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLogRecord[] {
    return [...this.cachedAuditLogs];
  }

  getFilteredAuditLogs(filter?: {
    search?: string;
    actionType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): { total: number; logs: AuditLogRecord[] } {
    let result = [...this.cachedAuditLogs];

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        l =>
          l.ipAddress?.toLowerCase().includes(q) ||
          l.adminUsername?.toLowerCase().includes(q) ||
          l.userId?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.resourceId?.toLowerCase().includes(q) ||
          l.userAgent?.toLowerCase().includes(q)
      );
    }

    if (filter?.actionType && filter.actionType !== 'TÜMÜ') {
      result = result.filter(l => l.actionType?.toLowerCase() === filter.actionType?.toLowerCase());
    }

    if (filter?.status && filter.status !== 'TÜMÜ') {
      result = result.filter(l => l.status?.toLowerCase() === filter.status?.toLowerCase());
    }

    const total = result.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 200;

    return {
      total,
      logs: result.slice(offset, offset + limit)
    };
  }

  async addAuditLog(log: AuditLogRecord): Promise<void> {
    this.cachedAuditLogs.unshift(log);
    if (this.cachedAuditLogs.length > 1000) this.cachedAuditLogs.pop();

    if (this.neonSql) {
      try {
        await this.neonSql`
          INSERT INTO audit_logs (
            id, timestamp, admin_username, action, details, ip_address,
            user_agent, user_id, session_id, action_type, resource_id,
            status_code, status, error_details
          )
          VALUES (
            ${log.id},
            ${log.timestamp},
            ${log.adminUsername || 'Sistem / Anonim'},
            ${log.action},
            ${log.details || ''},
            ${log.ipAddress || '127.0.0.1'},
            ${log.userAgent || null},
            ${log.userId || null},
            ${log.sessionId || null},
            ${log.actionType || 'Genel'},
            ${log.resourceId || null},
            ${log.statusCode ?? 200},
            ${log.status || 'Başarılı'},
            ${log.errorDetails || null}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (err: any) {
        console.warn('[DB] ⚠️ Audit log SQL yazma uyarısı:', err?.message || err);
      }
    }
  }

  // --- Breaches ---
  getBreaches(): DataBreachIncidentRecord[] {
    return [...this.cachedBreaches];
  }

  async addBreach(incident: DataBreachIncidentRecord): Promise<void> {
    this.cachedBreaches.unshift(incident);
    if (this.neonSql) {
      await this.neonSql`
        INSERT INTO data_breach_incidents (id, detected_at, description, severity, kvkk_reported_at, notes)
        VALUES (${incident.id}, ${incident.detectedAt}, ${incident.description}, ${incident.severity}, ${incident.kvkkReportedAt}, ${incident.notes})
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }

  async updateBreach(id: string, updates: Partial<DataBreachIncidentRecord>): Promise<boolean> {
    const item = this.cachedBreaches.find(b => b.id === id);
    if (item) Object.assign(item, updates);

    if (this.neonSql) {
      if (updates.kvkkReportedAt !== undefined) {
        await this.neonSql`UPDATE data_breach_incidents SET kvkk_reported_at = ${updates.kvkkReportedAt} WHERE id = ${id}`;
      }
      if (updates.notes !== undefined) {
        await this.neonSql`UPDATE data_breach_incidents SET notes = ${updates.notes} WHERE id = ${id}`;
      }
      return true;
    }
    return !!item;
  }

  // --- Gemini Usage ---
  getGeminiUsage(): GeminiUsageRecord[] {
    return [...this.cachedGeminiUsage];
  }

  async updateGeminiUsage(record: GeminiUsageRecord): Promise<void> {
    const idx = this.cachedGeminiUsage.findIndex(g => g.lawyerSicilNo === record.lawyerSicilNo);
    if (idx >= 0) this.cachedGeminiUsage[idx] = record;
    else this.cachedGeminiUsage.push(record);

    if (this.neonSql) {
      await this.neonSql`
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
  }

  public persist() {
    // Neon commits automatically for each statement.
    // ultrahukuk_store.json disk kaydı devre dışı bırakılmıştır.
  }
}

export const db = new NeonDatabaseService();
