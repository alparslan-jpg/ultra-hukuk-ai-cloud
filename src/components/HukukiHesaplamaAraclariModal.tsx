import React, { useState } from 'react';
import {
  Calculator,
  X,
  TrendingUp,
  Scale,
  Receipt,
  ShieldAlert,
  Percent,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Coins
} from 'lucide-react';
import {
  calculateAautNispi,
  calculateFaiz,
  calculateSmm,
  checkHmk200,
  HMK_PARASAL_SINIRLAR
} from '../services/legalFinanceCalculatorService';

interface HukukiHesaplamaAraclariModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HukukiHesaplamaAraclariModal: React.FC<HukukiHesaplamaAraclariModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'aaut' | 'faiz' | 'smm' | 'hmk200'>('aaut');
  const [copied, setCopied] = useState<boolean>(false);

  // 1. AAÜT State
  const [davaDegeri, setDavaDegeri] = useState<number>(350000);
  const [mahkemeTuru, setMahkemeTuru] = useState<any>('asliyeHukuk');

  // 2. Faiz State
  const [faizAnaPara, setFaizAnaPara] = useState<number>(200000);
  const [faizBaslangic, setFaizBaslangic] = useState<string>('2024-01-01');
  const [faizBitis, setFaizBitis] = useState<string>('2026-09-28');
  const [faizTuru, setFaizTuru] = useState<'yasal' | 'ticari_avans' | 'mevduat'>('ticari_avans');

  // 3. SMM State
  const [smmTutar, setSmmTutar] = useState<number>(50000);
  const [smmKdv, setSmmKdv] = useState<number>(20);
  const [smmStopaj, setSmmStopaj] = useState<number>(20);
  const [smmHesapTuru, setSmmHesapTuru] = useState<'brutten' | 'netten'>('brutten');

  // 4. HMK 200 State
  const [hmkMiktar, setHmkMiktar] = useState<number>(65000);
  const [hmkYil, setHmkYil] = useState<number>(2026);

  if (!isOpen) return null;

  // Hesaplamalar
  const aautSonuc = calculateAautNispi(davaDegeri, mahkemeTuru);
  const faizSonuc = calculateFaiz({
    anaPara: faizAnaPara,
    baslangicTarihi: faizBaslangic,
    bitisTarihi: faizBitis,
    faizTuru
  });
  const smmSonuc = calculateSmm(smmTutar, smmKdv, smmStopaj, smmHesapTuru);
  const hmkSonuc = checkHmk200(hmkMiktar, hmkYil);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111928] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0e1626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Hukuki Hesaplama ve Barem Motoru
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  AAÜT & 3095 s. K. Güncel
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Avukatlık asgari vekalet ücreti, yasal/avans faiz, SMM ve senetle ispat sınırı hesaplayıcısı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-[#0a0f1d] px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('aaut')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'aaut'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>AAÜT Vekalet Ücreti</span>
          </button>
          <button
            onClick={() => setActiveTab('faiz')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'faiz'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>3095 s. Faiz Hesabı</span>
          </button>
          <button
            onClick={() => setActiveTab('smm')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'smm'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Serbest Meslek Makbuzu (SMM)</span>
          </button>
          <button
            onClick={() => setActiveTab('hmk200')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'hmk200'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>HMK m. 200 & İstinaf Sınırları</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {/* TAB 1: AAÜT */}
          {activeTab === 'aaut' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Dava / Takip / Uyuşmazlık Değeri (TL)
                  </label>
                  <input
                    type="number"
                    value={davaDegeri}
                    onChange={(e) => setDavaDegeri(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Görevli Mahkeme / Merci
                  </label>
                  <select
                    value={mahkemeTuru}
                    onChange={(e) => setMahkemeTuru(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                  >
                    <option value="asliyeHukuk">Asliye Hukuk Mahkemesi (Maktu: 30.000 TL)</option>
                    <option value="asliyeTicaret">Asliye Ticaret Mahkemesi (Maktu: 30.000 TL)</option>
                    <option value="isMahkemesi">İş Mahkemesi (Maktu: 24.000 TL)</option>
                    <option value="sulhHukuk">Sulh Hukuk Mahkemesi (Maktu: 18.000 TL)</option>
                    <option value="icraTakip">İcra Takip (Maktu: 9.000 TL)</option>
                    <option value="istinafDurusmali">BAM İstinaf Duruşmalı (Maktu: 24.000 TL)</option>
                  </select>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                  AAÜT Genel Hükümler m. 13 uyarınca nispi vekalet ücreti maktu ücretten az olamaz. Dava değerini aşan kısım sınırlanır.
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Hesaplama Sonucu
                  </span>
                  <div>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {aautSonuc.nihaiUcret.toLocaleString('tr-TR')} TL
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Nihai Karşı Taraf Vekalet Ücreti (KDV Hariç)
                    </span>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Nispi Barem Toplamı:</span>
                      <strong className="text-slate-900 dark:text-white">{aautSonuc.hesaplananUcret.toLocaleString('tr-TR')} TL</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Mahkeme Maktu Tabanı:</span>
                      <strong className="text-slate-900 dark:text-white">{aautSonuc.maktuAsgariUcret.toLocaleString('tr-TR')} TL</strong>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-bold text-slate-400">Barem Dilim Detayı:</span>
                    {aautSonuc.dilimAciklamalari.map((a, i) => (
                      <div key={i} className="text-[10px] text-slate-500 font-mono">
                        • {a}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`Dava Değeri: ${davaDegeri.toLocaleString('tr-TR')} TL\nAAÜT Vekalet Ücreti: ${aautSonuc.nihaiUcret.toLocaleString('tr-TR')} TL`)}
                  className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı' : 'Sonucu Kopyala'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FAİZ */}
          {activeTab === 'faiz' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ana Para Tutarı (TL)</label>
                  <input
                    type="number"
                    value={faizAnaPara}
                    onChange={(e) => setFaizAnaPara(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={faizBaslangic}
                      onChange={(e) => setFaizBaslangic(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={faizBitis}
                      onChange={(e) => setFaizBitis(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Faiz Türü</label>
                  <select
                    value={faizTuru}
                    onChange={(e: any) => setFaizTuru(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                  >
                    <option value="ticari_avans">Ticari İşlerde Avans Faizi (TCMB - Yıllık %48)</option>
                    <option value="yasal">3095 s. Kanuni Yasal Faiz (Yıllık %24)</option>
                    <option value="mevduat">En Yüksek Banka Mevduat Faizi (Yıllık %50)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Faiz ve Alacak Tablosu
                  </span>
                  <div>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {faizSonuc.toplamAlacak.toLocaleString('tr-TR')} TL
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Toplam Tahsil Edilecek Tutar (Ana Para + Faiz)
                    </span>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>İşleyen Gün Sayısı:</span>
                      <strong className="text-slate-900 dark:text-white">{faizSonuc.gunSayisi} Gün</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Uygulanan Yıllık Oran:</span>
                      <strong className="text-slate-900 dark:text-white">%{faizSonuc.uygulananYillikOran}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Toplam İşleyen Faiz:</span>
                      <strong className="text-amber-600 dark:text-amber-400">{faizSonuc.toplamFaiz.toLocaleString('tr-TR')} TL</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Günlük Faiz Yükü:</span>
                      <strong className="text-slate-900 dark:text-white">{faizSonuc.gunlukFaiz.toLocaleString('tr-TR')} TL/gün</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`Ana Para: ${faizAnaPara.toLocaleString('tr-TR')} TL\nİşleyen Faiz: ${faizSonuc.toplamFaiz.toLocaleString('tr-TR')} TL\nToplam: ${faizSonuc.toplamAlacak.toLocaleString('tr-TR')} TL`)}
                  className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı' : 'Hesabı Kopyala'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SMM */}
          {activeTab === 'smm' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Hesaplama Türü</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSmmHesapTuru('brutten')}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        smmHesapTuru === 'brutten'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      Brüt Ücretten Hesapla
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmmHesapTuru('netten')}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        smmHesapTuru === 'netten'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      Net Ele Geçenden Hesapla
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {smmHesapTuru === 'brutten' ? 'Brüt Ücret (TL)' : 'Net Ele Geçecek Tutar (TL)'}
                  </label>
                  <input
                    type="number"
                    value={smmTutar}
                    onChange={(e) => setSmmTutar(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Stopaj Oranı (%)</label>
                    <select
                      value={smmStopaj}
                      onChange={(e) => setSmmStopaj(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    >
                      <option value="20">%20 (Genel Tacir / Kurum)</option>
                      <option value="0">%0 (Gerçek Kişi Nihai Tüketici)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">KDV Oranı (%)</label>
                    <select
                      value={smmKdv}
                      onChange={(e) => setSmmKdv(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    >
                      <option value="20">%20 (Genel Vekalet)</option>
                      <option value="10">%10 (Aile Mahkemesi / Adli Yardım)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Makbuz Dökümü (e-SMM)
                  </span>
                  <div>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {smmSonuc.tahsilEdilenToplam.toLocaleString('tr-TR')} TL
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Müvekkilden Tahsil Edilen Toplam Tutar
                    </span>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Brüt Ücret:</span>
                      <strong className="text-slate-900 dark:text-white">{smmSonuc.brutUcret.toLocaleString('tr-TR')} TL</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Stopaj Kesintisi:</span>
                      <strong className="text-rose-500">-{smmSonuc.stopajTutari.toLocaleString('tr-TR')} TL</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Net Ücret:</span>
                      <strong className="text-emerald-500">{smmSonuc.netUcret.toLocaleString('tr-TR')} TL</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Hesaplanan KDV:</span>
                      <strong className="text-sky-500">+{smmSonuc.kdvTutari.toLocaleString('tr-TR')} TL</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`Brüt: ${smmSonuc.brutUcret} TL\nStopaj: ${smmSonuc.stopajTutari} TL\nNet: ${smmSonuc.netUcret} TL\nKDV: ${smmSonuc.kdvTutari} TL\nTahsilat: ${smmSonuc.tahsilEdilenToplam} TL`)}
                  className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı' : 'e-SMM Dökümünü Kopyala'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: HMK 200 */}
          {activeTab === 'hmk200' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Uyuşmazlık / Alacak Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    value={hmkMiktar}
                    onChange={(e) => setHmkMiktar(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    İşlem / Dava Yılı
                  </label>
                  <select
                    value={hmkYil}
                    onChange={(e) => setHmkYil(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="2026">2026 Yılı (Sınır: 45.000 TL)</option>
                    <option value="2025">2025 Yılı (Sınır: 33.720 TL)</option>
                    <option value="2024">2024 Yılı (Sınır: 23.430 TL)</option>
                    <option value="2023">2023 Yılı (Sınır: 14.800 TL)</option>
                  </select>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                hmkSonuc.isSenetZorunlu
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500/30 text-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                  {hmkSonuc.isSenetZorunlu ? <ShieldAlert className="w-5 h-5 text-rose-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  <span>{hmkSonuc.isSenetZorunlu ? 'SENETLE İSPAT ZORUNLUDUR (Tanık Dinletilemez)' : 'SENET ŞARTI YOKTUR (Takdiri Delil & Tanık Serbest)'}</span>
                </div>
                <p>{hmkSonuc.aciklama}</p>
              </div>

              {/* Yıllar Tablosu */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500">
                    <tr>
                      <th className="p-3">Yıl</th>
                      <th className="p-3">HMK m. 200 Senet Sınırı</th>
                      <th className="p-3">İstinaf Kesinlik Sınırı</th>
                      <th className="p-3">Temyiz Kesinlik Sınırı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {HMK_PARASAL_SINIRLAR.map((r) => (
                      <tr key={r.yil} className={r.yil === hmkYil ? 'bg-amber-500/10 font-bold' : ''}>
                        <td className="p-3">{r.yil}</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">{r.senetleIspatSiniri.toLocaleString('tr-TR')} TL</td>
                        <td className="p-3">{r.istinafKesinlikSiniri.toLocaleString('tr-TR')} TL</td>
                        <td className="p-3">{r.temyizKesinlikSiniri.toLocaleString('tr-TR')} TL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
