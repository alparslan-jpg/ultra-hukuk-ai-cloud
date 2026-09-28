import React, { useState } from 'react';
import { Scale, User, UserPlus, Shield, Lock, Mail, IdCard, Building } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (userData?: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#admin' || window.location.pathname === '/admin')) {
      return 'admin';
    }
    return 'login';
  });
  
  // Login State
  const [loginSicilNo, setLoginSicilNo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regTcKimlik, setRegTcKimlik] = useState('');
  const [regSicilNo, setRegSicilNo] = useState('');
  const [regBaro, setRegBaro] = useState('İstanbul Barosu');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Admin State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sicilNo: loginSicilNo,
          tcKimlikNo: loginPassword, 
          hardwareId: 'browser-uuid'
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Giriş başarılı, yönlendiriliyorsunuz...');
        setTimeout(() => {
          window.location.hash = '#workspace';
          onLogin(data.user);
        }, 1000);
      } else {
        setErrorMsg(data.message || 'Giriş başarısız.');
      }
    } catch (err) {
      setErrorMsg('Sunucuya bağlanılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Kayıt başarılı, giriş yapılıyor...');
        setTimeout(() => {
          window.location.hash = '#workspace';
          onLogin(data.user);
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Kayıt başarısız.');
      }
    } catch (err) {
      setErrorMsg('Sunucuya bağlanılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/adminauth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword, deviceId: 'browser-uuid' }),
      });
      const data = await res.json();
      if (data.token) {
        setSuccessMsg('Yönetici girişi başarılı...');
        window.location.hash = '#admin';
        setTimeout(() => onLogin({ isAdmin: true }), 1000);
      } else {
        setErrorMsg(data.error || 'Giriş başarısız.');
      }
    } catch (err) {
      setErrorMsg('Sunucuya bağlanılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Scale className="w-10 h-10 text-slate-950" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Ultra Hukuk</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Avukat Çalışma Portalı</p>
          </div>
        </div>

        {/* Tabs */}
        {activeTab !== 'admin' && (
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-[#1a2333] text-amber-600 dark:text-amber-500 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              Giriş Yap
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-[#1a2333] text-amber-600 dark:text-amber-500 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Kayıt Ol
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-900/50">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-200 dark:border-emerald-900/50">
            {successMsg}
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">TC Kimlik No veya Sicil No</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdCard className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={loginSicilNo}
                  onChange={(e) => setLoginSicilNo(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                  placeholder="Sicil No giriniz"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all mt-6 disabled:opacity-70"
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Ad Soyad</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  placeholder="Av. İsim Soyisim"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">TC Kimlik No</label>
                <input
                  type="text"
                  required
                  value={regTcKimlik}
                  onChange={(e) => setRegTcKimlik(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  placeholder="11 haneli TC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Sicil No</label>
                <input
                  type="text"
                  required
                  value={regSicilNo}
                  onChange={(e) => setRegSicilNo(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  placeholder="Örn: 12345"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Kayıtlı Baro</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={regBaro}
                  onChange={(e) => setRegBaro(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                >
                  <option>İstanbul Barosu</option>
                  <option>Ankara Barosu</option>
                  <option>İzmir Barosu</option>
                  <option>Bursa Barosu</option>
                  <option>Antalya Barosu</option>
                  <option>Diğer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">E-posta</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  placeholder="avukat@ornek.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  placeholder="En az 6 karakter"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all mt-4 disabled:opacity-70"
            >
              {isLoading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>
        )}

        {/* Admin Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Yönetici Girişi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sadece sistem yöneticileri içindir.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Kullanıcı Adı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow"
                  placeholder="Yönetici kullanıcı adı"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all mt-6 disabled:opacity-70"
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Yönetici Girişi'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          {activeTab === 'admin' ? (
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-amber-500 transition-colors"
            >
              <User className="w-3 h-3" />
              Kullanıcı Girişine Dön
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Shield className="w-3 h-3" />
              Yönetici Girişi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
