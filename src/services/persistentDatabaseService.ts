import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ultrahukuk_store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class UltraHukukDatabase {
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
        console.error('[DB] Veritabanı dosyası okunamadı, yedeklenip yeniden oluşturuluyor:', err);
      }
    }

    // Default Seed Data
    const defaultData: DatabaseSchema = {
      adminUsers: [],
      lawyerUsers: [],
      whitelist: [],
      auditLogs: [],
      dataBreachIncidents: [],
      geminiUsage: [],
      settings: {
        createdAt: new Date().toISOString(),
        version: '2.6.4'
      }
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
      console.error('[DB] Veritabanı disk kaydı hatası:', err);
    }
  }

  public persist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.data);
    }, 100);
  }

  // --- Admin Users ---
  public getAdmins(): AdminUserRecord[] {
    return this.data.adminUsers;
  }

  public saveAdmin(admin: AdminUserRecord) {
    const idx = this.data.adminUsers.findIndex(a => a.id === admin.id);
    if (idx >= 0) {
      this.data.adminUsers[idx] = admin;
    } else {
      this.data.adminUsers.push(admin);
    }
    this.persist();
  }

  // --- Lawyer Users ---
  public getLawyers(): LawyerUserRecord[] {
    return this.data.lawyerUsers;
  }

  public saveLawyer(lawyer: LawyerUserRecord) {
    const idx = this.data.lawyerUsers.findIndex(u => u.id === lawyer.id || u.sicilNo === lawyer.sicilNo);
    if (idx >= 0) {
      this.data.lawyerUsers[idx] = lawyer;
    } else {
      this.data.lawyerUsers.push(lawyer);
    }
    this.persist();
  }

  // --- Whitelist ---
  public getWhitelist(): WhitelistRecord[] {
    return this.data.whitelist;
  }

  public addWhitelist(item: WhitelistRecord) {
    this.data.whitelist.unshift(item);
    this.persist();
  }

  public removeWhitelist(id: string): boolean {
    const idx = this.data.whitelist.findIndex(w => w.id === id);
    if (idx >= 0) {
      this.data.whitelist.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogRecord[] {
    return this.data.auditLogs;
  }

  public addAuditLog(log: AuditLogRecord) {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.persist();
  }

  // --- Breaches ---
  public getBreaches(): DataBreachIncidentRecord[] {
    return this.data.dataBreachIncidents;
  }

  public addBreach(incident: DataBreachIncidentRecord) {
    this.data.dataBreachIncidents.unshift(incident);
    this.persist();
  }

  public updateBreach(id: string, updates: Partial<DataBreachIncidentRecord>): boolean {
    const item = this.data.dataBreachIncidents.find(b => b.id === id);
    if (item) {
      Object.assign(item, updates);
      this.persist();
      return true;
    }
    return false;
  }

  // --- Gemini Usage ---
  public getGeminiUsage(): GeminiUsageRecord[] {
    return this.data.geminiUsage;
  }

  public updateGeminiUsage(record: GeminiUsageRecord) {
    const idx = this.data.geminiUsage.findIndex(g => g.lawyerSicilNo === record.lawyerSicilNo);
    if (idx >= 0) {
      this.data.geminiUsage[idx] = record;
    } else {
      this.data.geminiUsage.push(record);
    }
    this.persist();
  }
}

export const db = new UltraHukukDatabase();
