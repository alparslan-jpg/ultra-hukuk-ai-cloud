import React, { useState } from 'react';
import {
  Scale,
  Shield,
  Zap,
  Swords,
  Brain,
  CheckCircle2,
  Lock,
  FileText,
  Cpu,
  ArrowRight,
  HardDrive,
  Users,
  Award,
  Sparkles,
  ChevronRight,
  UserCheck,
  Building,
  KeyRound,
  IdCard,
  Mail,
  UserPlus,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { SAAS_PLANS } from '../../routes/v1/billing';

interface LandingPageProps {
  onLoginSuccess: (userData?: any) => void;
  onOpenAdminLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginSuccess,
  onOpenAdminLogin
}) => {
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'register'>('none');
  const [selectedPlanTier, setSelectedPlanTier] = useState<'standart' | 'pro' | 'enterprise'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Login Form States
  const [loginSicilNo, setLoginSicilNo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register / Onboarding Form States
  const [regFullName, setRegFullName] = useState('');
  const [regTcKimlik, setRegTcKimlik] = useState('');
  const [regSicilNo, setRegSicilNo] = useState('');
  const [regBaro, setRegBaro] = useState('İstanbul Barosu');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sicilNo: loginSicilNo,
          tcKimlikNo: loginPassword,
          hardwareId: 'ultra-hukuk-web-client'
        })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setLoginError(data.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
      }
    } catch {
      setLoginError('Sunucu bağlantı hatası oluştu.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          tcKimlikNo: regTcKimlik,
          sicilNo: regSicilNo,
          baroAdi: regBaro,
          email: regEmail,
          password: regPassword,
          selectedPlan: selectedPlanTier
        })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setRegError(data.message || 'Kayıt işlemi tamamlanamadı.');
      }
    } catch {
      setRegError('Sunucuya bağlanırken hata oluştu.');
    } finally {
      setRegLoading(false);
    }
  };

  const openOnboardingForPlan = (tier: 'standart' | 'pro' | 'enterprise') => {
    setSelectedPlanTier(tier);
    setActiveModal('register');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 text-xs py-2 px-4 text-center font-bold tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
        <span>YENİ SÜRÜM: UYAP UDF v2.4 ve AKİS E-İmza Donanım Desteği Yayında! 30 Gün Ücretsiz Deneyin.</span>
      </div>

      {/* 2. NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 text-slate-950 font-black">
            <Scale className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-amber-400 bg-clip-text text-transparent">
                ULTRA HUKUK AI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                v3.0 Ticari
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Otonom Hukuki Yapay Zekâ & Dava Yönetim Sistemi</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-amber-400 transition">Özellikler</a>
          <a href="#agents" className="hover:text-amber-400 transition">Şeytanın Avukatı</a>
          <a href="#udf" className="hover:text-amber-400 transition">UYAP & E-İmza</a>
          <a href="#pricing" className="hover:text-amber-400 transition">Fiyatlandırma</a>
          <a href="#security" className="hover:text-amber-400 transition">Adli Güvenlik</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('login')}
            className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800/80 transition"
          >
            Avukat Girişi
          </button>
          <button
            onClick={() => {
              setSelectedPlanTier('pro');
              setActiveModal('register');
            }}
            className="text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center gap-1.5"
          >
            <span>Hemen Başla (30G Ücretsiz)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative pt-20 pb-24 px-6 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-amber-400 text-xs font-semibold shadow-inner">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Türk Hukuku İçin Özel Eğitilmiş İlk Hibrit Çoklu Ajan Mimarisi</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
          Davanızı Sadece Kendi Lehinize Değil; <br />
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
            Karşı Taraf Vekili ve Yargıç
          </span> Gözüyle Yönetin.
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Müvekkil evraklarınızı yükleyin; <strong>Veri Çıkarım Ajanı</strong> tarafları ayrıştırsın, <strong>Şeytanın Avukatı</strong> karşı vekilin ileri süreceği zamanaşımı ve delil tuzaklarını deşifre etsin, <strong>Hakem Motoru</strong> kazanma oranını hesaplasın ve UYAP UDF formatında dilekçenizi AKİS çipinizle imzalasın.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              setSelectedPlanTier('pro');
              setActiveModal('register');
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-950/60 transition flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>30 Günlük Ücretsiz Denemeyi Başlat</span>
          </button>
          <a
            href="#agents"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-700/80 transition flex items-center justify-center gap-2"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Harp Odası Simülasyonunu İncele</span>
          </a>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-800/80 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="text-2xl font-black text-amber-400 font-mono">2.4M+</div>
            <div className="text-xs text-slate-400 mt-1">Yargıtay & Danıştay İçtihadı (RAG)</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="text-2xl font-black text-emerald-400 font-mono">35.000+</div>
            <div className="text-xs text-slate-400 mt-1">Analiz Edilen Dava Dosyası</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="text-2xl font-black text-indigo-400 font-mono">%99.8</div>
            <div className="text-xs text-slate-400 mt-1">UYAP UDF 2.4 XML Şema Uyumu</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="text-2xl font-black text-sky-400 font-mono">5070 Sayılı</div>
            <div className="text-xs text-slate-400 mt-1">E-İmza Kanunu & AKİS Donanım Uyumlu</div>
          </div>
        </div>
      </section>

      {/* 4. MULTI-AGENT WAR ROOM SECTION */}
      <section id="agents" className="py-20 bg-slate-900/40 border-y border-slate-800/80 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-100 flex items-center justify-center gap-2.5">
              <Swords className="w-7 h-7 text-amber-400" />
              Şeytanın Avukatı & Hakem Terazisi
            </h2>
            <p className="text-sm text-slate-400">
              Tek taraflı dilekçe yazımı mazide kaldı. Ultra Hukuk AI, davanızı iki zıt kutup olarak simüle eder ve duruşmaya sıfır sürprizle girmenizi sağlar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-100">Veri Çıkarım & Otonom Müvekkil</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yüklediğiniz vekaletname veya tensip zaptından tarafların TCKN/VKN, adres, mahkeme ve esas numaralarını OCR ile çıkarır. Formları el değmeden doldurur.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 via-slate-950 to-slate-950 border border-rose-900/40 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Şeytanın Avukatı (Harp Odası)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Karşı taraf vekili şapkası giyerek sizin delillerinizdeki 8 günlük fatura itiraz süresi, yetki şartı noksanlığı ve zamanaşımı zafiyetlerinize acımasızca saldırır.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-900/40 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-100">Hakem & Yargıç Terazisi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                İddia ve karşı itirazları HMK m. 190 delil terazisinde tartar. Somut gerekçelerle kazanma ihtimalini (%78, %92 vb.) hesaplar ve en güçlü karşı hamleyi fısıldar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. UYAP & E-SIGNATURE SECTION */}
      <section id="udf" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-5 max-w-xl">
            <span className="text-xs font-bold text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
              DONANIM ENTEGRASYONU
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              AKİS Akıllı Kart ile Tarayıcıdan Doğrudan UYAP E-İmzalama
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Üretilen dilekçeleri dışarı aktarmadan, tarayıcınızın içinden yerel WebSocket köprüsüyle (`ws://localhost:8080`) USB E-İmza çipinize gönderin. Adalet Bakanlığı UDF v2.4 standartlarına uygun olarak damgalansın ve tek tıkla UYAP Avukat Portalı’na yüklenmeye hazır hale gelsin.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>TÜBİTAK BİLGEM Kamu SM, e-Tuğra, E-Güven ve TÜRKTRUST uyumlu</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SHA-256 Kriptografik Belge Bütünlük Damgası (Forensic Seal)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Eksik etiket ve XML karakterlerini otomatik onaran Self-Healing Şema</span>
              </li>
            </ul>
          </div>

          <div className="w-full md:w-96 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border border-indigo-800/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Yerel AKİS E-İmza Durumu
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                ÇİP AKTİF
              </span>
            </div>
            <div className="space-y-2 text-xs font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-slate-300">
              <div className="text-slate-400">Sertifika: TÜBİTAK Kamu SM NES</div>
              <div className="text-indigo-300">İmza Türü: XAdES-BES / XML-DSig</div>
              <div className="text-emerald-400 truncate">Hash: SHA256:8b4e72c019a...</div>
              <div className="text-slate-400">Format: .UDF (Adalet Bakanlığı)</div>
            </div>
            <button
              onClick={() => setActiveModal('register')}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center justify-center gap-1.5 transition"
            >
              <span>E-İmza Entegrasyonunu Dene</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section id="pricing" className="py-20 bg-slate-900/40 border-t border-slate-800/80 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-100">Şeffaf ve Esnek Abonelik Paketleri</h2>
            <p className="text-sm text-slate-400">
              Kredi kartı gerektirmeden 30 gün boyunca tam yetkiyle test edin. İhtiyacınıza en uygun paketi dilediğiniz zaman seçin.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-medium ${billingCycle === 'monthly' ? 'text-slate-200' : 'text-slate-500'}`}>
                Aylık Ödeme
              </span>
              <button
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center transition relative border border-slate-700"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-amber-500 shadow-md transition-transform duration-300 ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-medium flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-slate-200' : 'text-slate-500'}`}>
                Yıllık Ödeme
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  2 Ay Bedava
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(SAAS_PLANS).map((p) => {
              const price = billingCycle === 'yearly' ? Math.round(p.yearlyPriceTry / 12) : p.monthlyPriceTry;

              return (
                <div
                  key={p.tier}
                  className={`rounded-2xl p-6 border flex flex-col justify-between transition-all relative ${
                    p.recommended
                      ? 'bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-950 border-amber-500/60 shadow-2xl shadow-amber-950/20 ring-1 ring-amber-500/40'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  {p.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-extrabold shadow-md">
                      EN POPÜLER TERCİH
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.description}</p>
                    </div>

                    <div className="py-3 border-y border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-100">{price.toLocaleString('tr-TR')} ₺</span>
                        <span className="text-xs text-slate-400">/ ay</span>
                      </div>
                      <div className="text-[11px] text-amber-400 font-mono mt-1">
                        {p.monthlyTokens.toLocaleString('tr-TR')} AI Token / Ay
                      </div>
                    </div>

                    <ul className="space-y-3 text-xs text-slate-300">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={() => openOnboardingForPlan(p.tier)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                        p.recommended
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span>30 Gün Ücretsiz Başla</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-6 py-10 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-300">Ultra Hukuk AI v3.0</span>
            <span>— 1136 Sayılı Avukatlık Kanunu ve KVKK Uyumlu</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenAdminLogin}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              Yönetici (Admin) Girişi
            </button>
            <a href="#security" className="hover:text-slate-300 transition">Gizlilik & Adli Vault</a>
            <a href="#udf" className="hover:text-slate-300 transition">AKİS E-İmza Dokümanı</a>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL 1: AVUKAT GİRİŞ MODALI                             */}
      {/* ======================================================== */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-slate-100">Avukat Çalışma Portalı Girişi</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Baro Sicil Numarası</label>
                <div className="relative">
                  <IdCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={loginSicilNo}
                    onChange={(e) => setLoginSicilNo(e.target.value)}
                    placeholder="Örn: 8109"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">T.C. Kimlik No veya Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="T.C. Kimlik No veya Şifreniz"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>Giriş Yap ve Portala Geç</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Hesabınız yok mu? </span>
                <button
                  type="button"
                  onClick={() => setActiveModal('register')}
                  className="text-xs font-semibold text-amber-400 hover:underline"
                >
                  30 Gün Ücretsiz Kayıt Ol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: GÜVENLİ ONBOARDING & KAYIT MODALI               */}
      {/* ======================================================== */}
      {activeModal === 'register' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 my-8">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base text-slate-100">Avukat Hesabı Oluştur (Onboarding)</h3>
                  <p className="text-[11px] text-slate-400">
                    Seçilen Paket: <span className="font-bold text-amber-400">{SAAS_PLANS[selectedPlanTier]?.name}</span> (30 Gün Ücretsiz)
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {regError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Ad Soyad (Ünvan)</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Örn: Av. Osman Turgut"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">T.C. Kimlik Numarası</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={regTcKimlik}
                    onChange={(e) => setRegTcKimlik(e.target.value)}
                    placeholder="11 haneli TCKN"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Baro Sicil Numarası</label>
                  <input
                    type="text"
                    required
                    value={regSicilNo}
                    onChange={(e) => setRegSicilNo(e.target.value)}
                    placeholder="Örn: 8109"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Bağlı Olunan Baro</label>
                  <select
                    value={regBaro}
                    onChange={(e) => setRegBaro(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="İstanbul Barosu">İstanbul Barosu</option>
                    <option value="Ankara Barosu">Ankara Barosu</option>
                    <option value="İzmir Barosu">İzmir Barosu</option>
                    <option value="Bursa Barosu">Bursa Barosu</option>
                    <option value="Antalya Barosu">Antalya Barosu</option>
                    <option value="Diğer Baro">Diğer Baro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Resmi E-Posta Adresi</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="avukat@hukuk.av.tr"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Güvenli Şifre</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="En az 6 karakterli şifre"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition flex items-center justify-center gap-2"
              >
                {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
                <span>30 Gün Ücretsiz Başla ve Portala Gir</span>
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-400">Zaten kaydınız var mı? </span>
                <button
                  type="button"
                  onClick={() => setActiveModal('login')}
                  className="text-xs font-semibold text-amber-400 hover:underline"
                >
                  Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
