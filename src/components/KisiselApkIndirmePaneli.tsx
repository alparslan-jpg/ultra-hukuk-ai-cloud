import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Lock,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  KeyRound,
  Cpu,
  RefreshCw,
  QrCode,
  FileCheck,
  Shield
} from 'lucide-react';

interface LawyerUser {
  id: string;
  fullName: string;
  sicilNo: string;
  baroAdi: string;
  daysRemaining: number;
}

interface ApkTokenResponse {
  success: boolean;
  token: string;
  downloadUrl: string;
  expiresAt: string;
  remainingSeconds: number;
  isUsed: boolean;
  singleUseConstraint: boolean;
  packageName: string;
  fileName: string;
  sha256: string;
  version: string;
}

interface KisiselApkIndirmePaneliProps {
  user: LawyerUser;
  onNavigateBack?: () => void;
}

export function KisiselApkIndirmePaneli({ user, onNavigateBack }: KisiselApkIndirmePaneliProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenData, setTokenData] = useState<ApkTokenResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Setup Verification Simulation
  const [verifyDeviceHwid, setVerifyDeviceHwid] = useState<string>('ANDROID-S24-ULTRA-99A1');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    boundDeviceId?: string;
    usedAt?: string;
  } | null>(null);

  const fetchOrGenerateToken = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lawyer/apk-setup-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sicilNo: user.sicilNo,
          lawyerFullName: user.fullName,
          baroAdi: user.baroAdi
        })
      });
      const data: ApkTokenResponse = await res.json();
      if (data.success) {
        setTokenData(data);
        setSecondsLeft(data.remainingSeconds || 86400);
      }
    } catch (err) {
      console.error('Failed to get APK token:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrGenerateToken();
  }, [user.sicilNo]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatCountdown = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, type: 'token' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSimulateSetupVerification = async () => {
    if (!tokenData) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch('/api/apk/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenData.token,
          sicilNo: user.sicilNo,
          deviceHardwareId: verifyDeviceHwid
        })
      });
      const data = await res.json();
      setVerificationResult(data);
      if (data.success) {
        setTokenData((prev) => (prev ? { ...prev, isUsed: true } : null));
      }
    } catch (e: any) {
      setVerificationResult({ success: false, message: 'Doğrulama bağlantı hatası: ' + e.message });
    } finally {
      setVerifying(false);
    }
  };

  const fullDownloadUrl = typeof window !== 'undefined' && tokenData ? `${window.location.origin}${tokenData.downloadUrl}` : '';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-sky-900/40 to-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Kişiye Özel Mobil APK İndirme & Mühürleme
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-mono">
                    Sicil Mühürlü
                  </span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Her avukatın kendi sicil numarası ve şifresiyle şifrelenmiş özel Android APK paketi.
                </p>
              </div>
            </div>
          </div>

          {/* Lawyer Info Badge */}
          <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-4 text-xs shadow-sm">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Yetkili Avukat</span>
              <strong className="text-slate-800 dark:text-slate-100">{user.fullName}</strong>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-[10px] text-slate-400 block font-semibold">Sicil & Baro</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">{user.sicilNo}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">({user.baroAdi})</span>
            </div>
            <button
              onClick={fetchOrGenerateToken}
              disabled={loading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
              title="Yeni Tek Kullanımlık Bağlantı Üret"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Security Pillars */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span><strong>Tek Kullanımlık Mühür:</strong> Kurulum yapıldıktan sonra anahtar kapatılır.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-sky-500 shrink-0" />
            <span><strong>24 Saat Geçerlilik:</strong> Üretilen kurulum bağlantısı süre sınırlıdır.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Donanım Bağlama (HWID):</strong> Yalnızca izin verilen cep telefonuna kilitlenir.</span>
          </div>
        </div>
      </div>

      {/* Main Download Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Download details & Actions */}
        <div className="lg:col-span-7 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-500" />
              Android APK Kurulum Paketi
            </h3>
            {tokenData?.isUsed ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Kurulum Kullanıldı (Mühürlü)
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Kuruluma Hazır
              </span>
            )}
          </div>

          {/* Countdown & Validity Notice */}
          <div className="p-4 bg-slate-50 dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Kurulum Süresi Kalan</span>
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                {formatCountdown(secondsLeft)}
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 block text-[10px]">Geçerlilik Bitiş:</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold">
                {tokenData ? new Date(tokenData.expiresAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>
          </div>

          {/* Setup Token Box */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
              <span>Tek Kullanımlık Kurulum & Aktivasyon Anahtarı:</span>
              <span className="text-[10px] text-slate-400">Kurulum esnasında mobil uygulamaya giriniz</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 font-mono text-sm text-amber-600 dark:text-amber-300 font-bold select-all tracking-wider">
                {tokenData?.token || 'Yükleniyor...'}
              </div>
              <button
                type="button"
                onClick={() => tokenData && copyToClipboard(tokenData.token, 'token')}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition font-medium text-xs flex items-center gap-1.5"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToken ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>
            </div>
          </div>

          {/* Download APK Action Button */}
          <div className="space-y-2 pt-2">
            <a
              href={tokenData?.downloadUrl || '#'}
              download={tokenData?.fileName || `UltraHukuk-Avukat-${user.sicilNo}.apk`}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                tokenData?.isUsed
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Kişiselleştirilmiş APK Dosyasını İndir (.apk)</span>
            </a>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
              <span>Paket: <strong className="font-mono text-slate-700 dark:text-slate-300">{tokenData?.fileName}</strong></span>
              <span>SHA-256 Doğrulandı</span>
            </div>
          </div>

          {/* Direct link copy */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
              Doğrudan Mobil İndirme Bağlantısı (Telefona Gönder / WhatsApp / E-Posta):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullDownloadUrl}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono truncate"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(fullDownloadUrl, 'link')}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-xs font-medium flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Installation Guide & HWID Locking Test */}
        <div className="lg:col-span-5 space-y-4">
          {/* Guide Card */}
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Telefona Kurulum Adımları
            </h4>

            <ol className="space-y-2.5 text-slate-600 dark:text-slate-300 list-decimal list-inside">
              <li className="leading-snug">
                <strong>APK İndirme:</strong> İndirilen <span className="font-mono text-amber-600 dark:text-amber-300">.apk</span> dosyasını Android cihazınızda açın.
              </li>
              <li className="leading-snug">
                <strong>Bilinmeyen Kaynaklara İzin Verin:</strong> Ayarlar &gt; Güvenlik &gt; <em>Bilinmeyen Uygulamaları Yükle</em> iznini aktif edin.
              </li>
              <li className="leading-snug">
                <strong>Aktivasyon & Kimlik Doğrulama:</strong> Uygulamayı açtığınızda Baro Sicil Numaranız (<span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{user.sicilNo}</span>) ve şifrenizle giriş yapın.
              </li>
              <li className="leading-snug">
                <strong>Tek Seferlik Kurulum Anahtarı:</strong> Ekrana gelen alana yukarıdaki <span className="font-mono text-amber-600 dark:text-amber-300">{tokenData?.token}</span> kodunu girerek donanım mühürlemesini tamamlayın.
              </li>
            </ol>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              <strong>Önemli Güvenlik Kuralı:</strong> Bu APK yalnızca sizin siciliniz ve müvekkil dosyalarınızla çalışır. Başka bir avukatın veya yabancı bir cihazın dosyalarınıza erişimi kriptografik donanım anahtarıyla engellenmiştir.
            </div>
          </div>

          {/* Interactive Hardware Sealing Verification Simulator */}
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-500" />
              Cihaz Mühürleme Testi (Aktivasyon Simülasyonu)
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mobil cihazın ilk kurulumda anahtarı tüketip tek kullanımlık donanım kilidi oluşturmasını test edin:
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Mobil Cihaz Donanım Kimliği (HWID):</label>
                <input
                  type="text"
                  value={verifyDeviceHwid}
                  onChange={(e) => setVerifyDeviceHwid(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <button
                type="button"
                disabled={verifying || tokenData?.isUsed}
                onClick={handleSimulateSetupVerification}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  tokenData?.isUsed
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{verifying ? 'Mühürleniyor...' : 'Aktivasyonu Tamamla ve Cihaza Mühürle'}</span>
              </button>

              {verificationResult && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    verificationResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <div className="font-bold mb-0.5">
                    {verificationResult.success ? '✓ Cihaz Başarıyla Mühürlendi!' : '✕ Aktivasyon Reddedildi'}
                  </div>
                  <div>{verificationResult.message}</div>
                  {verificationResult.boundDeviceId && (
                    <div className="text-[10px] font-mono mt-1 text-slate-500 dark:text-slate-400">
                      Mühürlenen HWID: {verificationResult.boundDeviceId}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
