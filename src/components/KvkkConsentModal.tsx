import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Award,
  Check,
  UserCheck
} from 'lucide-react';

export interface KvkkConsentRecord {
  sicilNo: string;
  lawyerFullName: string;
  consentedAt: string;
  consentVersion: string;
  acceptedKvkk: boolean;
  acceptedAiResponsibility: boolean;
  acceptedDataProcessing: boolean;
}

const STORAGE_KEY_PREFIX = 'ultra_hukuk_kvkk_consent_';

export function getKvkkConsent(sicilNo: string): KvkkConsentRecord | null {
  if (typeof window === 'undefined' || !sicilNo) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sicilNo}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveKvkkConsent(record: KvkkConsentRecord): void {
  if (typeof window === 'undefined' || !record.sicilNo) return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${record.sicilNo}`, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('ultra_hukuk_kvkk_updated', { detail: record }));
  } catch (e) {
    console.warn('Failed to save KVKK consent:', e);
  }
}

interface KvkkConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sicilNo: string;
  lawyerFullName: string;
  onConsentSuccess?: (record: KvkkConsentRecord) => void;
  enforceRequired?: boolean; // if true, cannot be closed without accepting
}

export const KvkkConsentModal: React.FC<KvkkConsentModalProps> = ({
  isOpen,
  onClose,
  sicilNo,
  lawyerFullName,
  onConsentSuccess,
  enforceRequired = false
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedAiDisclaimer, setAcceptedAiDisclaimer] = useState<boolean>(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('kvkk_aydinlatma');

  // Check if already consented
  const existingConsent = getKvkkConsent(sicilNo);

  useEffect(() => {
    if (existingConsent) {
      setAcceptedTerms(true);
      setAcceptedAiDisclaimer(true);
      setHasScrolledToBottom(true);
    } else {
      setAcceptedTerms(false);
      setAcceptedAiDisclaimer(false);
    }
  }, [sicilNo, isOpen]);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  const handleConfirmConsent = () => {
    if (!acceptedTerms || !acceptedAiDisclaimer) return;

    const record: KvkkConsentRecord = {
      sicilNo,
      lawyerFullName,
      consentedAt: new Date().toISOString(),
      consentVersion: '2026.1-KVKK-AI-ETHICS',
      acceptedKvkk: true,
      acceptedAiResponsibility: true,
      acceptedDataProcessing: true
    };

    saveKvkkConsent(record);
    if (onConsentSuccess) {
      onConsentSuccess(record);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] border border-slate-300 dark:border-slate-700/80 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-emerald-500/15 border-b border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">
                  KVKK Aydınlatma Metni & Yapay Zekâ Sorumluluk Beyanı
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  6698 Sayılı Kanun & TBB İlke Kararları
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Avukat: <strong className="text-slate-800 dark:text-slate-200">{lawyerFullName}</strong> (Sicil: <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{sicilNo}</span>)
              </p>
            </div>
          </div>

          {!enforceRequired && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
              title="Kapat"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Legal Document Body */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b0f19]/40"
        >
          {/* Important Highlight Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>ZORUNLU MESLEKİ BİLGİLENDİRME & HUKUKİ ÇERÇEVE</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Bu sistem, 1136 Sayılı Avukatlık Kanunu m. 34'te düzenlenen <em>"avukatın mesleki özen ve doğruluk yükümlülüğü"</em> ile 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca avukatın müvekkil sırrı saklama yükümlülüğünü korumak üzere tasarlanmıştır.
            </p>
          </div>

          {/* Section 1: KVKK Metni */}
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <button
              type="button"
              onClick={() => setActiveAccordion(activeAccordion === 'kvkk_aydinlatma' ? null : 'kvkk_aydinlatma')}
              className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-slate-100"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                1. 6698 Sayılı KVKK Kapsamında Aydınlatma ve Veri İşleme Şartları
              </span>
              {activeAccordion === 'kvkk_aydinlatma' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {activeAccordion === 'kvkk_aydinlatma' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-slate-600 dark:text-slate-300">
                <p>
                  <strong>Veri Sorumlusu:</strong> Ultra Hukuk Avukat Çalışma Masası altyapısı, avukatın müvekkillerine ait hukuki uyuşmazlık, dava ve delil verilerini yalnızca oturum süresince ve ilgili avukata tahsis edilmiş güvenli yerel/izole alanda işler.
                </p>
                <p>
                  <strong>Verilerin İşlenme Amacı:</strong> Dava dilekçesi taslağı hazırlama, tensip zaptı/delil incelemesi, HMK 200 senetle ispat ve zamanaşımı risklerinin tespiti, tanık ifadelerindeki çelişkilerin taranması ve emsal Yargıtay içtihadı eşleştirmesi amaçlarıyla sınırlıdır.
                </p>
                <p>
                  <strong>Üçüncü Kişilere Aktarım Yasağı:</strong> Sisteme yüklenen müvekkil evrakları, kimlik bilgileri, ses ve metin kayıtları hiçbir şekilde reklam, pazarlama, genel açık model eğitimi veya yetkisiz üçüncü taraflarla paylaşılmaz.
                </p>
                <p>
                  <strong>Veri Güvenliği ve İzolasyon:</strong> Her avukatın verisi yalnızca kendi baro sicil numarası ve donanım kimliğiyle kriptografik olarak ayrıştırılmıştır. Bir avukatın verisine diğer avukatlar veya üçüncü şahıslar erişemez.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: AI & Avukat Onayı Beyanı */}
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <button
              type="button"
              onClick={() => setActiveAccordion(activeAccordion === 'ai_disclaimer' ? null : 'ai_disclaimer')}
              className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-slate-100"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                2. Yapay Zekâ Analizlerinin Niteliği ve Avukat Nihai Onay Kuralı
              </span>
              {activeAccordion === 'ai_disclaimer' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {activeAccordion === 'ai_disclaimer' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-slate-600 dark:text-slate-300">
                <p>
                  <strong>Otomatik Karar Olmama İlkesi:</strong> Bu sistem tarafından üretilen hukuki teşhisler, çelişki taramaları, kanun maddesi atıfları ve dilekçe taslakları <em>nihai bir yargı veya otomatik hukuki karar niteliğinde değildir</em>.
                </p>
                <p>
                  <strong>Avukat Onayı Zorunluluğu:</strong> Tüm çıktılar, sorumlu ruhsatlı avukat tarafından 1136 Sayılı Avukatlık Kanunu çerçevesinde incelenmek, pozitif mevzuat ve somut olayın özelliklerine göre doğrulanmak ve bizzat onaylanmak zorundadır.
                </p>
                <p>
                  <strong>Mesleki Sorumluluk:</strong> Mahkemelere, icra dairelerine veya resmi makamlara sunulacak her türlü dilekçe, itiraz ve beyanın nihai hukuki ve cezai mesleki sorumluluğu dilekçeyi imzalayan ve UYAP üzerinden sunan avukata aittir.
                </p>
              </div>
            )}
          </div>

          {/* Section 3: TCK 272 ve Delil Dürüstlüğü */}
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <button
              type="button"
              onClick={() => setActiveAccordion(activeAccordion === 'tck_delil' ? null : 'tck_delil')}
              className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-slate-100"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                3. Adli Hakikat, Delil Güvenilirliği ve TCK 272 Hatırlatması
              </span>
              {activeAccordion === 'tck_delil' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {activeAccordion === 'tck_delil' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-slate-600 dark:text-slate-300">
                <p>
                  Adli Delil ve Şahit Çelişkisi (Cımbız Ajanı) modülü, mahkeme huzurundaki gerçeğin ortaya çıkarılması, masumiyet karinesi ve adil yargılanma hakkının temini amacıyla analiz yapar.
                </p>
                <p>
                  Analizlerde TCK 272 (Yalan Tanıklık) ve TCK 271 (Suç Uydurma) kapsamındaki şüpheli durumlar mantıksal ve kronolojik olarak tespit edilip avukatın takdirine sunulur.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Consent Checkboxes & Actions */}
        <div className="p-5 sm:p-6 bg-white dark:bg-[#101726] border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-800 dark:text-slate-200 leading-snug">
                <strong>KVKK Aydınlatma Metni ve Açık Rıza Beyanı'nı okudum, anladım</strong> ve kişisel verilerimin/müvekkil verilerinin yukarıda belirtilen mesleki amaçlarla işlenmesine açık rızam ile onay veriyorum.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
              <input
                type="checkbox"
                checked={acceptedAiDisclaimer}
                onChange={(e) => setAcceptedAiDisclaimer(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-800 dark:text-slate-200 leading-snug">
                <strong>Yapay zekâ analizlerinin nihai otomatik karar olmadığını,</strong> sistemin yalnızca bir mesleki destek aracı olduğunu ve her çıktının bizzat avukat denetimi ve onayı gerektirdiğini kabul ve beyan ediyorum.
              </span>
            </label>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Onay kaydınız tarih/saat ve baro sicil no mühürlenerek güvenli kütüğe işlenir.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!enforceRequired && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition"
                >
                  Daha Sonra İncele
                </button>
              )}

              <button
                type="button"
                disabled={!acceptedTerms || !acceptedAiDisclaimer}
                onClick={handleConfirmConsent}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md ${
                  acceptedTerms && acceptedAiDisclaimer
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Onayla ve Sisteme Kaydet</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
