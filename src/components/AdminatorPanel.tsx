import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  Cpu,
  Lock,
  RotateCcw,
  Plus,
  Trash2,
  AlertOctagon,
  ClipboardList,
  Sparkles,
  DollarSign,
  TrendingUp,
  Server,
  KeyRound,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface AdminatorPanelProps {
  onBackToWorkspace?: () => void;
}

export function AdminatorPanel({ onBackToWorkspace }: AdminatorPanelProps = {}) {
  const [adminToken, setAdminToken] = useState<string>(
    () => localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || ''
  );
  const [adminUsername, setAdminUsername] = useState<string>(
    () => localStorage.getItem('adminUsername') || sessionStorage.getItem('adminUsername') || 'Alparslan'
  );

  // Login form state (if not logged in)
  const [loginUser, setLoginUser] = useState<string>('Alparslan');
  const [loginPass, setLoginPass] = useState<string>('Alp.wolf58');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [geminiData, setGeminiData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [breaches, setBreaches] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Forms
  const [wlTc, setWlTc] = useState<string>('');
  const [wlSicil, setWlSicil] = useState<string>('');
  const [wlBaro, setWlBaro] = useState<string>('');
  const [wlName, setWlName] = useState<string>('');
  const [wlEmail, setWlEmail] = useState<string>('');

  const [breachDesc, setBreachDesc] = useState<string>('');
  const [breachSeverity, setBreachSeverity] = useState<string>('Orta');

  // Load all admin data
  const loadAll = async (tokenToUse?: string) => {
    const token = tokenToUse || adminToken;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Users
      const uRes = await fetch('/api/admin/users', { headers });
      if (uRes.ok) setUsers(await uRes.json());

      // 2. Telemetry
      const tRes = await fetch('/api/admin/system-telemetry', { headers });
      if (tRes.ok) setTelemetry(await tRes.json());

      // 3. Gemini usage
      const gRes = await fetch('/api/admin/gemini-usage', { headers });
      if (gRes.ok) setGeminiData(await gRes.json());

      // 4. Agents (Direct admin-health fallback for high reliability)
      let aRes = await fetch('/api/admin-health');
      if (!aRes.ok) {
        aRes = await fetch('/api/admin/agent-status', { headers });
      }
      if (aRes.ok) {
        const payload = await aRes.json();
        setAgents(payload.agents || payload.Agents || []);
      }

      // 5. Feature Flags
      const fRes = await fetch('/api/admin/feature-flags', { headers });
      if (fRes.ok) {
        const payload = await fRes.json();
        setFeatures(payload.features || []);
      }

      // 6. Whitelist
      const wRes = await fetch('/api/admin/whitelist', { headers });
      if (wRes.ok) setWhitelist(await wRes.json());

      // 7. Breaches
      const bRes = await fetch('/api/admin/data-breach-incidents', { headers });
      if (bRes.ok) {
        const data = await bRes.json();
        setBreaches(data.data || []);
      }

      // 8. Audit Log
      const lRes = await fetch('/api/admin/audit-log', { headers });
      if (lRes.ok) setAuditLogs(await lRes.json());
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadAll(adminToken);
    }
  }, [adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/adminauth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUser,
          password: loginPass,
          deviceId: 'web-browser-device-token-1',
          rememberMe: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || 'Giriş başarısız.');
        return;
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', data.username);
      setAdminToken(data.token);
      setAdminUsername(data.username);
      loadAll(data.token);
    } catch (err: any) {
      setLoginError('Sunucu bağlantı hatası: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    setAdminToken('');
  };

  const extendSubscription = async (userId: string) => {
    if (!confirm('Bu avukatın aboneliği 30 gün uzatılsın mı?')) return;
    try {
      const res = await fetch('/api/admin/extend-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userId, extraDays: 30 }),
      });
      const data = await res.json();
      alert(data.message || 'Lisans uzatıldı.');
      loadAll();
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  const resetHardware = async (userId: string) => {
    if (!confirm('Donanım kilidi sıfırlansın mı? Kullanıcı yeni cihazdan giriş yapabilecek.')) return;
    try {
      const res = await fetch('/api/admin/reset-hardware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      alert(data.message || 'Donanım kilidi sıfırlandı.');
      loadAll();
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  const addWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          tcKimlikNo: wlTc,
          sicilNo: wlSicil,
          baroAdi: wlBaro,
          fullName: wlName,
          email: wlEmail,
        }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setWlTc('');
        setWlSicil('');
        setWlBaro('');
        setWlName('');
        setWlEmail('');
        loadAll();
      }
    } catch (e) {
      alert('Ekleme hatası.');
    }
  };

  const deleteWhitelist = async (id: string) => {
    if (!confirm('Bu kayıt beyaz listeden silinsin mi?')) return;
    try {
      await fetch(`/api/admin/whitelist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      loadAll();
    } catch (e) {
      alert('Silinemedi.');
    }
  };

  const createBreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breachDesc) return;
    try {
      const res = await fetch('/api/admin/data-breach-incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ description: breachDesc, severity: breachSeverity }),
      });
      const data = await res.json();
      alert(data.message);
      setBreachDesc('');
      loadAll();
    } catch (e) {
      alert('Kayıt hatası.');
    }
  };

  const markBreachReported = async (id: string) => {
    const notes = prompt('KVKK bildirim referans no veya notu:');
    try {
      const res = await fetch(`/api/admin/data-breach-incidents/${id}/mark-reported`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      alert(data.message);
      loadAll();
    } catch (e) {
      alert('Güncellenemedi.');
    }
  };

  // If not logged in as Admin, show login form
  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          {onBackToWorkspace && (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Avukat Masasına Dön</span>
            </button>
          )}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Yönetici Paneli Girişi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Bağımsız Adminatör Güvenlik Portalı</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Şifre</label>
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {loginError && <p className="text-xs text-rose-500 text-center font-medium">{loginError}</p>}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
          >
            {isLoggingIn ? <Sparkles className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Giriş Yap</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          Varsayılan Giriş: <strong>Alparslan</strong> / <strong>Alp.wolf58</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Admin Status Bar */}
      <div className="flex flex-wrap items-center justify-between bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Adminatör Yönetim Paneli
              </h2>
              <span className="text-[10px] bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 font-semibold">
                Süper Yönetici
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Aktif Oturum: <strong className="text-amber-600 dark:text-amber-300">{adminUsername}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <ThemeToggle />

          {onBackToWorkspace && (
            <button
              onClick={onBackToWorkspace}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Avukat Masasına Dön</span>
            </button>
          )}

          <button
            onClick={() => loadAll()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Verileri Yenile</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/50 transition flex items-center gap-1.5 font-semibold"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Toplam Kayıtlı Avukat</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{telemetry?.totalUsers || users.length}</span>
            <Users className="w-5 h-5 text-amber-500" />
          </h3>
        </div>

        <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lisanslı & Korumalı PC</p>
          <h3 className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400 flex items-center justify-between">
            <span>{telemetry?.activeSessions || '3 / 3'}</span>
            <Lock className="w-5 h-5 text-sky-500" />
          </h3>
        </div>

        <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sunucu & Veritabanı</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Çevrimiçi / Aktif
            </span>
            <Server className="w-5 h-5 text-emerald-500" />
          </h3>
        </div>

        <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Güvenlik Standardı</p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold">AES-256 / WORM</span>
            <ShieldCheck className="w-5 h-5 text-amber-500" />
          </h3>
        </div>
      </div>

      {/* Gemini Usage & Billing Telemetry */}
      {geminiData && (
        <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Model ve Sistem Maliyet Raporu
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                Sağlayıcı: {geminiData.billingSource}
              </p>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              Aylık Kota: ${geminiData.monthlyBudgetUsd?.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-[#0b0f19] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Bu Ay Toplam Sorgu</span>
              <strong className="text-lg text-slate-900 dark:text-slate-100">
                {geminiData.users?.reduce((acc: number, u: any) => acc + (u.queryCount || 0), 0)}
              </strong>
            </div>
            <div className="bg-slate-50 dark:bg-[#0b0f19] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Tahmini Harcama</span>
              <strong className="text-lg text-amber-600 dark:text-amber-300">
                ${geminiData.estimatedTotalCostUsd?.toFixed(5)}
              </strong>
            </div>
            <div className="bg-slate-50 dark:bg-[#0b0f19] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Kalan Bütçe</span>
              <strong className="text-lg text-emerald-600 dark:text-emerald-300">
                ${geminiData.estimatedRemainingBudgetUsd?.toFixed(2)}
              </strong>
            </div>
            <div className="bg-slate-50 dark:bg-[#0b0f19] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Aktif Faturalanan Sicil</span>
              <strong className="text-lg text-sky-600 dark:text-sky-300">
                {geminiData.users?.length || 0} Avukat
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Kayıtlı Avukatlar ve Lisans Durumları */}
      <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> Kayıtlı Avukatlar ve Abonelik Durumları
          </h3>
          <span className="text-xs text-slate-400 font-mono">/api/admin/users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Ad Soyad</th>
                <th className="p-3">Baro & Sicil No</th>
                <th className="p-3">T.C. Kimlik</th>
                <th className="p-3">E-posta</th>
                <th className="p-3">Donanım Kilidi</th>
                <th className="p-3">Kalan Süre</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold text-slate-100">{u.fullName}</td>
                  <td className="p-3 text-slate-300">{u.baroAdi} - {u.sicilNo}</td>
                  <td className="p-3 font-mono text-slate-400">{u.tcKimlik}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">
                    {u.boundHardwareId ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                        Kilitli (Mühürlü)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
                        Boşta
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                      {u.daysRemaining} Gün
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      onClick={() => extendSubscription(u.id)}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg border border-amber-500/30 text-xs font-semibold transition"
                    >
                      +30 Gün
                    </button>
                    <button
                      onClick={() => resetHardware(u.id)}
                      className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg border border-rose-500/30 text-xs font-semibold transition"
                    >
                      HWID Sıfırla
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 18 Ajan Durumları & Özellik Matrisi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ajanlar */}
        <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" /> 18 Hukuk Ajanının Canlı Durumu ({agents.length} Ajan Aktif)
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            {agents.map((a, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-800 bg-[#0b0f19] flex items-center justify-between">
                <div>
                  <strong className="text-slate-200 block">{a.name}</strong>
                  <span className="text-[11px] text-slate-400">{a.detail}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 font-mono font-bold">
                  AKTİF
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Özellikler */}
        <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" /> Sistem Güvenlik & Özellik Matrisi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {features.map((f, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-800 bg-[#0b0f19] flex items-center justify-between">
                <span className="text-slate-300 font-medium">{f.feature}</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Aktif
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Beyaz Liste Yönetimi */}
      <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-teal-400" /> Beyaz Liste Yönetimi (İzinli Avukatlar)
        </h3>
        <p className="text-xs text-slate-400">
          Beyaz liste tanımlandığında yalnızca burada kayıtlı T.C. / Sicil numarasına sahip avukatlar sisteme dahil olabilir.
        </p>

        <form onSubmit={addWhitelist} className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          <input
            placeholder="T.C. Kimlik No"
            value={wlTc}
            onChange={(e) => setWlTc(e.target.value)}
            className="bg-[#0b0f19] border border-slate-700 p-2.5 rounded-xl text-slate-200"
          />
          <input
            placeholder="Sicil No"
            value={wlSicil}
            onChange={(e) => setWlSicil(e.target.value)}
            className="bg-[#0b0f19] border border-slate-700 p-2.5 rounded-xl text-slate-200"
          />
          <input
            placeholder="Baro Adı"
            value={wlBaro}
            onChange={(e) => setWlBaro(e.target.value)}
            className="bg-[#0b0f19] border border-slate-700 p-2.5 rounded-xl text-slate-200"
          />
          <input
            placeholder="Ad Soyad"
            value={wlName}
            onChange={(e) => setWlName(e.target.value)}
            className="bg-[#0b0f19] border border-slate-700 p-2.5 rounded-xl text-slate-200"
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Listeye Ekle</span>
          </button>
        </form>

        <div className="overflow-x-auto border-t border-slate-800 pt-3">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 pr-3">Ad Soyad</th>
                <th className="py-2 pr-3">Sicil No</th>
                <th className="py-2 pr-3">Baro</th>
                <th className="py-2 pr-3">Durum</th>
                <th className="py-2 text-right">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {whitelist.map((w) => (
                <tr key={w.id}>
                  <td className="py-2 pr-3 font-semibold text-slate-200">{w.fullName}</td>
                  <td className="py-2 pr-3 font-mono text-slate-300">{w.sicilNo}</td>
                  <td className="py-2 pr-3 text-slate-400">{w.baroAdi}</td>
                  <td className="py-2 pr-3">
                    {w.isUsed ? (
                      <span className="text-emerald-400">Kayıtlı</span>
                    ) : (
                      <span className="text-amber-400">Bekliyor</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => deleteWhitelist(w.id)}
                      className="text-rose-400 hover:text-rose-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KVKK 72 Saat İhlal Bildirim Takibi */}
      <div className="bg-[#131d31] border border-rose-900/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" /> KVKK Veri İhlali Takibi (72 Saat Kuralı — Kurul 2019/10)
          </h3>
          <span className="text-[11px] text-slate-400">Yasal Zorunlu Sayacı</span>
        </div>

        <form onSubmit={createBreach} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
          <input
            placeholder="Olay açıklaması (örn: Yetkisiz erişim teşebbüsü tespit edildi)..."
            value={breachDesc}
            onChange={(e) => setBreachDesc(e.target.value)}
            className="md:col-span-2 bg-[#0b0f19] border border-slate-700 p-2.5 rounded-xl text-slate-200"
          />
          <select
            value={breachSeverity}
            onChange={(e) => setBreachSeverity(e.target.value)}
            className="bg-[#0b0f19] border border-slate-700 p-2.5 rounded-xl text-slate-200"
          >
            <option value="Düşük">Düşük Önem</option>
            <option value="Orta">Orta Önem</option>
            <option value="Yüksek">Yüksek Önem</option>
            <option value="Kritik">Kritik Önem</option>
          </select>
          <button
            type="submit"
            className="bg-rose-700 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl transition"
          >
            ➕ Yeni İhlal Olayı Kaydet
          </button>
        </form>

        <div className="space-y-2">
          {breaches.map((b) => {
            const detectedAt = new Date(b.detectedAt);
            const deadline = new Date(detectedAt.getTime() + 72 * 3600000);
            const hoursLeft = Math.round((deadline.getTime() - Date.now()) / 3600000);
            const isResolved = !!b.kvkkReportedAt;

            return (
              <div
                key={b.id}
                className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{b.description}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/40 text-rose-300 border border-rose-900/50">
                      {b.severity}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Tespit: {detectedAt.toLocaleString('tr-TR')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs ${isResolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isResolved ? '✅ KVKK\'ya Bildirildi' : `⏳ ${hoursLeft} saat kaldı`}
                  </span>
                  {!isResolved && (
                    <button
                      onClick={() => markBreachReported(b.id)}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs"
                    >
                      Bildirildi Yap
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Denetim Kaydı (Audit Log) */}
      <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-400" /> Sistem Denetim İzi (Audit Log)
        </h3>
        <div className="max-h-56 overflow-y-auto pr-1">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-1.5 pr-2">Zaman</th>
                <th className="py-1.5 pr-2">Yönetici</th>
                <th className="py-1.5 pr-2">İşlem</th>
                <th className="py-1.5 pr-2">Detay</th>
                <th className="py-1.5 text-right">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-1.5 pr-2 text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString('tr-TR')}
                  </td>
                  <td className="py-1.5 pr-2 font-semibold text-slate-200">{log.adminUsername}</td>
                  <td className="py-1.5 pr-2 text-amber-300">{log.action}</td>
                  <td className="py-1.5 pr-2 text-slate-400">{log.details}</td>
                  <td className="py-1.5 text-right font-mono text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
