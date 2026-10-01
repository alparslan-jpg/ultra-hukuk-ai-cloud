import React, { useState, useRef } from 'react';
import {
  Users, UserPlus, FolderPlus, Folder, FileText, ChevronRight,
  ChevronDown, X, Save, Trash2, Upload, Eye, Search,
  Phone, Mail, MapPin, Hash, Calendar, Paperclip, ArrowLeft,
  Edit2, CheckCircle2, AlertCircle, Tag, Gavel
} from 'lucide-react';

// ── Tipler ──────────────────────────────────────────────────────────────────
export interface MuvekkilEvrak {
  id: string;
  ad: string;
  tur: string;
  eklenmeTarihi: string;
  icerik?: string;
  boyut?: string;
}

export interface MuvekkilDava {
  id: string;
  davaNo: string;
  konu: string;
  mahkeme?: string;
  karsiTaraf?: string;
  davaAcilisTarihi: string;
  durum: 'Aktif' | 'Kapalı' | 'Arşiv' | 'Beklemede';
  aciklama?: string;
  evraklar: MuvekkilEvrak[];
}

export interface Muvekkil {
  id: string;
  ad: string;
  soyad: string;
  tcKimlik?: string;
  telefon?: string;
  email?: string;
  adres?: string;
  eklenmeTarihi: string;
  davalar: MuvekkilDava[];
}

// ── Yardımcı ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'ultra_muvekkiller';
const loadMuvekkiller = (): Muvekkil[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveMuvekkiller = (list: Muvekkil[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};
const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const dateNow = () => new Date().toLocaleDateString('tr-TR');

const DURUM_COLORS: Record<string, string> = {
  'Aktif':     'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Beklemede': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'Kapalı':   'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  'Arşiv':    'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

// ── Props ────────────────────────────────────────────────────────────────────
interface MuvekkilYonetimiProps {
  onCaseSelected?: (ctx: { clientName: string; caseNumber: string; subject: string; files: any[] }) => void;
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                       MuvekkilYonetimi Panel                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝
export function MuvekkilYonetimi({ onCaseSelected }: MuvekkilYonetimiProps) {
  const [muvekkiller, setMuvekkiller] = useState<Muvekkil[]>(loadMuvekkiller);
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenMuvekkil, setSecilenMuvekkil] = useState<Muvekkil | null>(null);
  const [secilenDava, setSecilenDava] = useState<MuvekkilDava | null>(null);
  const [gorunum, setGorunum] = useState<'liste' | 'muvekkil-ekle' | 'dava-ekle' | 'evrak-goruntule'>('liste');

  // Müvekkil ekleme formu
  const [muvForm, setMuvForm] = useState({ ad: '', soyad: '', tcKimlik: '', telefon: '', email: '', adres: '' });
  // Dava ekleme formu
  const [davaForm, setDavaForm] = useState({ davaNo: '', konu: '', mahkeme: '', karsiTaraf: '', davaAcilisTarihi: dateNow(), durum: 'Aktif' as MuvekkilDava['durum'], aciklama: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const persist = (list: Muvekkil[]) => { setMuvekkiller(list); saveMuvekkiller(list); };

  // ── Müvekkil CRUD ──────────────────────────────────────────────────────
  const muvekkilEkle = () => {
    if (!muvForm.ad.trim() || !muvForm.soyad.trim()) { alert('Ad ve Soyad zorunludur.'); return; }
    const yeni: Muvekkil = { id: uid(), ...muvForm, eklenmeTarihi: dateNow(), davalar: [] };
    const liste = [yeni, ...muvekkiller];
    persist(liste);
    setMuvForm({ ad: '', soyad: '', tcKimlik: '', telefon: '', email: '', adres: '' });
    setGorunum('liste');
    setSecilenMuvekkil(yeni);
  };

  const muvekkilSil = (id: string) => {
    if (!confirm('Müvekkil ve tüm davaları silinecek. Emin misiniz?')) return;
    const liste = muvekkiller.filter(m => m.id !== id);
    persist(liste);
    if (secilenMuvekkil?.id === id) { setSecilenMuvekkil(null); setGorunum('liste'); }
  };

  // ── Dava CRUD ──────────────────────────────────────────────────────────
  const davaEkle = () => {
    if (!secilenMuvekkil) return;
    if (!davaForm.konu.trim()) { alert('Dava konusu zorunludur.'); return; }
    const yeniDava: MuvekkilDava = {
      id: uid(), ...davaForm,
      davaNo: davaForm.davaNo.trim() || `D-${Date.now().toString().slice(-6)}`,
      evraklar: []
    };
    const liste = muvekkiller.map(m => m.id === secilenMuvekkil.id
      ? { ...m, davalar: [yeniDava, ...m.davalar] }
      : m
    );
    persist(liste);
    const guncellenenMuv = liste.find(m => m.id === secilenMuvekkil.id)!;
    setSecilenMuvekkil(guncellenenMuv);
    setDavaForm({ davaNo: '', konu: '', mahkeme: '', karsiTaraf: '', davaAcilisTarihi: dateNow(), durum: 'Aktif', aciklama: '' });
    setGorunum('liste');
  };

  const davaSil = (muvId: string, davaId: string) => {
    if (!confirm('Bu dava ve evrakları silinecek. Emin misiniz?')) return;
    const liste = muvekkiller.map(m => m.id === muvId
      ? { ...m, davalar: m.davalar.filter(d => d.id !== davaId) }
      : m
    );
    persist(liste);
    const guncellenen = liste.find(m => m.id === muvId)!;
    setSecilenMuvekkil(guncellenen);
    if (secilenDava?.id === davaId) setSecilenDava(null);
  };

  // ── Evrak Yükleme ──────────────────────────────────────────────────────
  const evrakYukle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!secilenMuvekkil || !secilenDava) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const icerik = ev.target?.result as string;
        const yeniEvrak: MuvekkilEvrak = {
          id: uid(), ad: file.name,
          tur: file.type || 'Bilinmeyen',
          eklenmeTarihi: dateNow(),
          icerik: icerik || '',
          boyut: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`
        };
        setMuvekkiller(prev => {
          const liste = prev.map(m => m.id === secilenMuvekkil.id
            ? {
                ...m,
                davalar: m.davalar.map(d => d.id === secilenDava.id
                  ? { ...d, evraklar: [yeniEvrak, ...d.evraklar] }
                  : d
                )
              }
            : m
          );
          saveMuvekkiller(liste);
          const guncellenen = liste.find(m => m.id === secilenMuvekkil.id)!;
          setSecilenMuvekkil(guncellenen);
          setSecilenDava(guncellenen.davalar.find(d => d.id === secilenDava.id)!);
          return liste;
        });
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const evrakSil = (evrakId: string) => {
    if (!secilenMuvekkil || !secilenDava) return;
    const liste = muvekkiller.map(m => m.id === secilenMuvekkil.id
      ? {
          ...m,
          davalar: m.davalar.map(d => d.id === secilenDava.id
            ? { ...d, evraklar: d.evraklar.filter(e => e.id !== evrakId) }
            : d
          )
        }
      : m
    );
    persist(liste);
    const guncellenen = liste.find(m => m.id === secilenMuvekkil.id)!;
    setSecilenMuvekkil(guncellenen);
    setSecilenDava(guncellenen.davalar.find(d => d.id === secilenDava.id)!);
  };

  // Dava seç ve danışma bağlamına aktar
  const davaSeçVeAktar = (dava: MuvekkilDava) => {
    setSecilenDava(dava);
    if (onCaseSelected && secilenMuvekkil) {
      onCaseSelected({
        clientName: `${secilenMuvekkil.ad} ${secilenMuvekkil.soyad}`,
        caseNumber: dava.davaNo,
        subject: dava.konu,
        files: dava.evraklar.map(e => ({ name: e.ad, content: e.icerik || '', type: e.tur }))
      });
    }
  };

  const filtrelenmis = muvekkiller.filter(m =>
    `${m.ad} ${m.soyad} ${m.tcKimlik} ${m.telefon}`.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-[#0e1524]">
      
      {/* ── Üst Bar ── */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a1020] flex items-center gap-2">
        {(gorunum === 'muvekkil-ekle' || gorunum === 'dava-ekle') && (
          <button type="button" onClick={() => setGorunum('liste')} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <Users className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {gorunum === 'muvekkil-ekle' ? 'Yeni Müvekkil Ekle' :
           gorunum === 'dava-ekle'    ? `Dava Ekle — ${secilenMuvekkil?.ad} ${secilenMuvekkil?.soyad}` :
           'Müvekkil & Dava Yönetimi'}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">{muvekkiller.length} Müvekkil</span>
          {gorunum === 'liste' && (
            <button type="button" onClick={() => setGorunum('muvekkil-ekle')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition shadow-sm">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Müvekkil Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* ── İçerik ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* ══ FORM: Müvekkil Ekle ══ */}
        {gorunum === 'muvekkil-ekle' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Ad *</label>
                <input type="text" value={muvForm.ad} onChange={e => setMuvForm(p => ({...p, ad: e.target.value}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Avukat adı" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Soyad *</label>
                <input type="text" value={muvForm.soyad} onChange={e => setMuvForm(p => ({...p, soyad: e.target.value}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Avukat soyadı" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">TC Kimlik No</label>
              <input type="text" maxLength={11} value={muvForm.tcKimlik} onChange={e => setMuvForm(p => ({...p, tcKimlik: e.target.value}))}
                className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="11 haneli TC Kimlik" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Telefon</label>
                <input type="text" value={muvForm.telefon} onChange={e => setMuvForm(p => ({...p, telefon: e.target.value}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="0555 000 00 00" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">E-posta</label>
                <input type="email" value={muvForm.email} onChange={e => setMuvForm(p => ({...p, email: e.target.value}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="ornek@mail.com" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Adres</label>
              <textarea rows={2} value={muvForm.adres} onChange={e => setMuvForm(p => ({...p, adres: e.target.value}))}
                className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="İkamet adresi" />
            </div>
            <button type="button" onClick={muvekkilEkle}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <Save className="w-4 h-4" />
              Müvekkil Kaydet
            </button>
          </div>
        )}

        {/* ══ FORM: Dava Ekle ══ */}
        {gorunum === 'dava-ekle' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Dava No (otomatik)</label>
                <input type="text" value={davaForm.davaNo} onChange={e => setDavaForm(p => ({...p, davaNo: e.target.value}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="2024/1234 (boş bırakılabilir)" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Durum</label>
                <select value={davaForm.durum} onChange={e => setDavaForm(p => ({...p, durum: e.target.value as any}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500">
                  <option>Aktif</option><option>Beklemede</option><option>Kapalı</option><option>Arşiv</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Dava Konusu *</label>
              <input type="text" value={davaForm.konu} onChange={e => setDavaForm(p => ({...p, konu: e.target.value}))}
                className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="Alacak davası, İş hukuku, Ceza v.s." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Mahkeme</label>
                <input type="text" value={davaForm.mahkeme} onChange={e => setDavaForm(p => ({...p, mahkeme: e.target.value}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="İstanbul 3. Asliye Hukuk" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Karşı Taraf</label>
                <input type="text" value={davaForm.karsiTaraf} onChange={e => setDavaForm(p => ({...p, karsiTaraf: e.target.value}))}
                  className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Ad Soyad / Şirket Adı" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Açıklama / Notlar</label>
              <textarea rows={3} value={davaForm.aciklama} onChange={e => setDavaForm(p => ({...p, aciklama: e.target.value}))}
                className="w-full bg-white dark:bg-[#141d30] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Dava hakkında ek bilgiler..." />
            </div>
            <button type="button" onClick={davaEkle}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm">
              <Save className="w-4 h-4" />
              Dava Dosyası Kaydet
            </button>
          </div>
        )}

        {/* ══ LİSTE GÖRÜNÜMÜ ══ */}
        {gorunum === 'liste' && (
          <div className="flex-1 overflow-hidden flex">

            {/* Sol: Müvekkil listesi */}
            <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none border border-transparent focus:border-indigo-400"
                    placeholder="Müvekkil ara..." />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtrelenmis.length === 0 && (
                  <div className="p-4 text-center text-[11px] text-slate-400">
                    <Users className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    Müvekkil yok
                  </div>
                )}
                {filtrelenmis.map(m => (
                  <button key={m.id} type="button"
                    onClick={() => { setSecilenMuvekkil(m); setSecilenDava(null); }}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 transition ${
                      secilenMuvekkil?.id === m.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-2 border-l-indigo-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {m.ad[0]}{m.soyad[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{m.ad} {m.soyad}</div>
                        <div className="text-[9px] text-slate-400 truncate">{m.davalar.length} dava · {m.eklenmeTarihi}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sağ: Dava & Evrak Detayı */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!secilenMuvekkil ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-semibold">Müvekkil Seçin</p>
                  <p className="text-xs mt-1">Sol listeden bir müvekkil seçin veya yeni müvekkil ekleyin.</p>
                </div>
              ) : (
                <>
                  {/* Müvekkil başlık */}
                  <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a1020] flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {secilenMuvekkil.ad[0]}{secilenMuvekkil.soyad[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{secilenMuvekkil.ad} {secilenMuvekkil.soyad}</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                          {secilenMuvekkil.tcKimlik && <span><Hash className="w-2.5 h-2.5 inline" /> {secilenMuvekkil.tcKimlik}</span>}
                          {secilenMuvekkil.telefon && <span><Phone className="w-2.5 h-2.5 inline" /> {secilenMuvekkil.telefon}</span>}
                          {secilenMuvekkil.email && <span><Mail className="w-2.5 h-2.5 inline" /> {secilenMuvekkil.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => { setSecilenMuvekkil(secilenMuvekkil); setGorunum('dava-ekle'); }}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition">
                        <FolderPlus className="w-3 h-3" />Dava Ekle
                      </button>
                      <button type="button" onClick={() => muvekkilSil(secilenMuvekkil.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition" title="Müvekkil sil">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dava & Evrak alanı */}
                  <div className="flex-1 overflow-hidden flex">

                    {/* Dava listesi */}
                    <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Davalar ({secilenMuvekkil.davalar.length})
                      </div>
                      {secilenMuvekkil.davalar.length === 0 && (
                        <div className="p-3 text-center text-[11px] text-slate-400">
                          <Folder className="w-5 h-5 mx-auto mb-1 opacity-30" />
                          Dava yok
                        </div>
                      )}
                      {secilenMuvekkil.davalar.map(d => (
                        <div key={d.id}
                          className={`border-b border-slate-100 dark:border-slate-800/80 ${secilenDava?.id === d.id ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}`}>
                          <button type="button" onClick={() => davaSeçVeAktar(d)}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group">
                            <div className="flex items-start gap-1.5">
                              <Folder className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${secilenDava?.id === d.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{d.konu}</div>
                                <div className="text-[9px] font-mono text-slate-400">{d.davaNo}</div>
                                <span className={`inline-block mt-0.5 text-[8px] font-semibold px-1 py-0 rounded border ${DURUM_COLORS[d.durum]}`}>{d.durum}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                              <span><Paperclip className="w-2.5 h-2.5 inline" /> {d.evraklar.length} evrak</span>
                              <span><Calendar className="w-2.5 h-2.5 inline" /> {d.davaAcilisTarihi}</span>
                            </div>
                          </button>
                          <div className="px-2 pb-1 flex gap-1">
                            <button type="button" onClick={() => davaSeçVeAktar(d)} title="Danışmaya aktar"
                              className="flex-1 text-[8px] font-semibold py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition">
                              Danışmaya Aktar
                            </button>
                            <button type="button" onClick={() => davaSil(secilenMuvekkil.id, d.id)} title="Davayı sil"
                              className="p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-300 hover:text-rose-400 transition">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Evrak Listesi / Görüntüleyici */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {!secilenDava ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <Folder className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-semibold">Dava Seçin</p>
                          <p className="text-[11px] mt-1">Sol listeden bir davaya tıklayın.</p>
                          <button type="button" onClick={() => setGorunum('dava-ekle')}
                            className="mt-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition">
                            <FolderPlus className="w-3 h-3" />Yeni Dava Ekle
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Dava Başlık */}
                          <div className="shrink-0 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1525]">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{secilenDava.konu}</span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${DURUM_COLORS[secilenDava.durum]}`}>{secilenDava.durum}</span>
                              </div>
                              <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-semibold cursor-pointer transition shadow-sm">
                                <Upload className="w-3 h-3" />Evrak Yükle
                                <input type="file" multiple ref={fileInputRef} onChange={evrakYukle} className="hidden"
                                  accept=".txt,.pdf,.docx,.doc,.rtf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.html,.xml" />
                              </label>
                            </div>
                            <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
                              {secilenDava.davaNo && <span className="font-mono"><Hash className="w-2.5 h-2.5 inline" /> {secilenDava.davaNo}</span>}
                              {secilenDava.mahkeme && <span><Gavel className="w-2.5 h-2.5 inline" /> {secilenDava.mahkeme}</span>}
                              {secilenDava.karsiTaraf && <span>vs. {secilenDava.karsiTaraf}</span>}
                            </div>
                            {secilenDava.aciklama && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{secilenDava.aciklama}</p>}
                          </div>

                          {/* Evrak Listesi */}
                          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1 mb-2">
                              Dava Evrakları ({secilenDava.evraklar.length})
                            </div>
                            {secilenDava.evraklar.length === 0 && (
                              <div className="py-8 text-center text-[11px] text-slate-400">
                                <Paperclip className="w-7 h-7 mx-auto mb-2 opacity-20" />
                                Henüz evrak yüklenmemiş.<br/>
                                <span className="text-indigo-500">"Evrak Yükle"</span> butonuna tıklayın.
                              </div>
                            )}
                            {secilenDava.evraklar.map(evrak => (
                              <EvrakKart key={evrak.id} evrak={evrak} onSil={() => evrakSil(evrak.id)} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Evrak Kartı ──────────────────────────────────────────────────────────────
function EvrakKart({ evrak, onSil }: { evrak: MuvekkilEvrak; onSil: () => void }) {
  const [acik, setAcik] = useState(false);

  const icon = evrak.ad.match(/\.(pdf)$/i) ? '📄' :
               evrak.ad.match(/\.(docx?|rtf)$/i) ? '📝' :
               evrak.ad.match(/\.(jpe?g|png|gif)$/i) ? '🖼️' :
               evrak.ad.match(/\.(xlsx?|csv)$/i) ? '📊' : '📎';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141d30] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-base shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{evrak.ad}</div>
          <div className="text-[9px] text-slate-400">{evrak.tur} · {evrak.boyut || '–'} · {evrak.eklenmeTarihi}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setAcik(p => !p)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition" title="İçeriği görüntüle">
            {acik ? <ChevronDown className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onSil}
            className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-300 hover:text-rose-400 transition" title="Evrakı sil">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {acik && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2 bg-slate-50 dark:bg-[#0e1524]">
          {evrak.icerik ? (
            <pre className="text-[10px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto leading-relaxed">
              {evrak.icerik.substring(0, 3000)}{evrak.icerik.length > 3000 ? '\n\n... (içerik kısaltıldı)' : ''}
            </pre>
          ) : (
            <p className="text-[11px] text-slate-400 italic">İçerik önizlemesi için metin tabanlı dosya yükleyin.</p>
          )}
        </div>
      )}
    </div>
  );
}

