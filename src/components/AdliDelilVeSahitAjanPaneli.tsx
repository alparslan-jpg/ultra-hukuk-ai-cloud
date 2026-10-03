import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  FileCheck2,
  Gavel,
  ArrowRight,
  Copy,
  Check,
  Scale,
  Zap,
  BookmarkCheck,
  Eye,
  Crosshair,
  UserX,
  FileWarning,
  Flame,
  Brain,
  MessageSquare,
  RefreshCw,
  FolderOpen,
  Pencil,
  Trash2,
  Plus
} from 'lucide-react';
import { getClientList, getActiveLawyerSicil } from '../services/clientCaseStore';
import { PartyContextService, SelectedPartyContext } from '../services/partyContextService';

export interface WitnessItem {
  id: string;
  name: string;
  side: 'Davacı Tanığı' | 'Davalı Tanığı' | 'Mahkemece Resen Çağrılan Tanık';
  affiliation: string;
  statementText: string;
  testimonyDate?: string;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  date?: string;
  contentPreview: string;
  evidentiaryValue: string;
}

interface AdliDelilVeSahitAjanPaneliProps {
  initialCaseNo?: string;
  initialCourt?: string;
  initialSubject?: string;
  initialPlaintiff?: string;
  initialDefendant?: string;
  onApplyToPetition?: (text: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function AdliDelilVeSahitAjanPaneli({
  initialCaseNo = '',
  initialCourt = '',
  initialSubject = '',
  initialPlaintiff = '',
  initialDefendant = '',
  onApplyToPetition,
  onNavigateToTab
}: AdliDelilVeSahitAjanPaneliProps) {
  // Active Case Parameters
  const [caseNo, setCaseNo] = useState(initialCaseNo);
  const [court, setCourt] = useState(initialCourt);
  const [subject, setSubject] = useState(initialSubject);
  const [plaintiff, setPlaintiff] = useState(initialPlaintiff);
  const [defendant, setDefendant] = useState(initialDefendant);

  // Party claims
  const [plaintiffClaims, setPlaintiffClaims] = useState('');
  const [defendantClaims, setDefendantClaims] = useState('');

  // Witnesses Dataset
  const [witnesses, setWitnesses] = useState<WitnessItem[]>([]);

  // Evidence Documents Dataset
  const [evidenceDocuments, setEvidenceDocuments] = useState<DocumentItem[]>([]);

  // Party Context & Auto-population from active case
  const [partyContext, setPartyContext] = useState<SelectedPartyContext>(() => PartyContextService.get());

  useEffect(() => {
    const unsub = PartyContextService.subscribe((ctx) => {
      setPartyContext(ctx);
      if (ctx.courtName && !court) setCourt(ctx.courtName);
      if (ctx.esasNo && !caseNo) setCaseNo(ctx.esasNo);
      if (ctx.subject && !subject) setSubject(ctx.subject);
      if (ctx.plaintiffName && !plaintiff) setPlaintiff(ctx.plaintiffName);
      if (ctx.defendantName && !defendant) setDefendant(ctx.defendantName);
      if (ctx.plaintiffClaims && !plaintiffClaims) setPlaintiffClaims(ctx.plaintiffClaims);
      if (ctx.defendantClaims && !defendantClaims) setDefendantClaims(ctx.defendantClaims);
      if (ctx.witnesses && ctx.witnesses.length > 0 && witnesses.length === 0) {
        setWitnesses(ctx.witnesses);
      }
      if (ctx.evidenceDocuments && ctx.evidenceDocuments.length > 0 && evidenceDocuments.length === 0) {
        setEvidenceDocuments(ctx.evidenceDocuments);
      }
    });

    const current = PartyContextService.get();
    if (current.courtName && !court) setCourt(current.courtName);
    if (current.esasNo && !caseNo) setCaseNo(current.esasNo);
    if (current.subject && !subject) setSubject(current.subject);
    if (current.plaintiffName && !plaintiff) setPlaintiff(current.plaintiffName);
    if (current.defendantName && !defendant) setDefendant(current.defendantName);
    if (current.plaintiffClaims && !plaintiffClaims) setPlaintiffClaims(current.plaintiffClaims);
    if (current.defendantClaims && !defendantClaims) setDefendantClaims(current.defendantClaims);
    if (current.witnesses && current.witnesses.length > 0 && witnesses.length === 0) {
      setWitnesses(current.witnesses);
    }
    if (current.evidenceDocuments && current.evidenceDocuments.length > 0 && evidenceDocuments.length === 0) {
      setEvidenceDocuments(current.evidenceDocuments);
    }

    return unsub;
  }, []);

  // Analysis State
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    'cimbiz' | 'celiskiler' | 'tanik_profili' | 'yalan_taniklik' | 'capraz_sorgu_layiha'
  >('cimbiz');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Witness input & edit state
  const [showAddWitnessModal, setShowAddWitnessModal] = useState(false);
  const [editingWitnessId, setEditingWitnessId] = useState<string | null>(null);
  const [newWitnessName, setNewWitnessName] = useState('');
  const [newWitnessSide, setNewWitnessSide] = useState<'Davacı Tanığı' | 'Davalı Tanığı' | 'Mahkemece Resen Çağrılan Tanık'>('Davalı Tanığı');
  const [newWitnessAffiliation, setNewWitnessAffiliation] = useState('');
  const [newWitnessStatement, setNewWitnessStatement] = useState('');

  const handleStartAddWitness = () => {
    setEditingWitnessId(null);
    setNewWitnessName('');
    setNewWitnessSide(partyContext.side === 'Davacı' ? 'Davalı Tanığı' : 'Davacı Tanığı');
    setNewWitnessAffiliation('');
    setNewWitnessStatement('');
    setShowAddWitnessModal(true);
  };

  const handleStartEditWitness = (wit: WitnessItem) => {
    setEditingWitnessId(wit.id);
    setNewWitnessName(wit.name);
    setNewWitnessSide(wit.side);
    setNewWitnessAffiliation(wit.affiliation);
    setNewWitnessStatement(wit.statementText);
    setShowAddWitnessModal(true);
  };

  const handleDeleteWitness = (id: string) => {
    setWitnesses((prev) => prev.filter((w) => w.id !== id));
  };

  const handleAddWitnessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWitnessName.trim() || !newWitnessStatement.trim()) return;

    if (editingWitnessId) {
      setWitnesses((prev) =>
        prev.map((w) =>
          w.id === editingWitnessId
            ? {
                ...w,
                name: newWitnessName,
                side: newWitnessSide,
                affiliation: newWitnessAffiliation || 'Belirtilmedi',
                statementText: newWitnessStatement
              }
            : w
        )
      );
      setEditingWitnessId(null);
    } else {
      const newItem: WitnessItem = {
        id: `wit-${Date.now()}`,
        name: newWitnessName,
        side: newWitnessSide,
        affiliation: newWitnessAffiliation || 'Belirtilmedi',
        statementText: newWitnessStatement,
        testimonyDate: new Date().toISOString().split('T')[0]
      };
      setWitnesses((prev) => [...prev, newItem]);
    }

    setNewWitnessName('');
    setNewWitnessAffiliation('');
    setNewWitnessStatement('');
    setShowAddWitnessModal(false);
  };

  // Evidence Document input & edit state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('Ticari Evrak / Senet');
  const [newDocValue, setNewDocValue] = useState('Kesin Delil (HMK m. 199 - TTK m. 21)');
  const [newDocPreview, setNewDocPreview] = useState('');

  const handleStartAddDoc = () => {
    setEditingDocId(null);
    setNewDocName('');
    setNewDocType('Ticari Evrak / Senet');
    setNewDocValue('Kesin Delil (HMK m. 199 - TTK m. 21)');
    setNewDocPreview('');
    setShowAddDocModal(true);
  };

  const handleStartEditDoc = (doc: DocumentItem) => {
    setEditingDocId(doc.id);
    setNewDocName(doc.name);
    setNewDocType(doc.type);
    setNewDocValue(doc.evidentiaryValue);
    setNewDocPreview(doc.contentPreview);
    setShowAddDocModal(true);
  };

  const handleDeleteDoc = (id: string) => {
    setEvidenceDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    if (editingDocId) {
      setEvidenceDocuments((prev) =>
        prev.map((d) =>
          d.id === editingDocId
            ? {
                ...d,
                name: newDocName,
                type: newDocType,
                evidentiaryValue: newDocValue,
                contentPreview: newDocPreview || `Dosya içeriğindeki ${newDocName} evrakı.`
              }
            : d
        )
      );
      setEditingDocId(null);
    } else {
      const newDoc: DocumentItem = {
        id: `ev-${Date.now()}`,
        name: newDocName,
        type: newDocType,
        date: new Date().toISOString().split('T')[0],
        contentPreview: newDocPreview || `Dosya içeriğindeki ${newDocName} evrakı.`,
        evidentiaryValue: newDocValue
      };
      setEvidenceDocuments((prev) => [...prev, newDoc]);
    }

    setNewDocName('');
    setNewDocPreview('');
    setShowAddDocModal(false);
  };

  // Run Forensic Audit
  const handleRunForensicAudit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        caseContext: {
          caseNumber: caseNo,
          court,
          subject,
          plaintiff,
          defendant
        },
        witnesses,
        evidenceDocuments,
        partyClaims: {
          plaintiffClaims,
          defendantClaims
        },
        targetFocus: 'all',
        lawyerSicilNo: '8109',
        biasPromptDirective: partyContext.biasPromptDirective,
        clientSide: partyContext.side,
        selectedPartyName: partyContext.selectedPartyName
      };

      const res = await fetch('/api/ai/forensic-evidence-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data);
      } else {
        alert('Adli inceleme motoru hatası: ' + (data.message || 'Bilinmeyen hata'));
      }
    } catch (e: any) {
      console.error('Forensic audit call failed:', e);
      alert('Sunucu bağlantı hatası: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Strict Grounding Badge */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-300 shadow-inner">
                <Crosshair className="w-6 h-6 text-indigo-400 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    Adli Hakikat, Şahit Çelişkileri & Cımbız Ajanı
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    TCK m. 272 & HMK m. 208/255
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Şahitlerin menfaat bağını, ifadelerdeki kronolojik çelişkileri, yalan tanıklığı ve dosyanın içinden davanın seyrini değiştirecek kritik detayları çıkaran çoklu ajan sistemi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Kati Kural: %100 Pozitif Hukuk Dayanağı</span>
            </div>

            <button
              onClick={handleRunForensicAudit}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Başdenetçi ve 5 Ajan İnceliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Adli Hakikat İncelemesini Başlat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mor Alan: Taraf Seçimi & %100 Müvekkil Yanlısı Savunma Protokolü Bildirimi */}
      {partyContext.side !== 'none' && (
        <div className="p-3.5 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300">
              <Scale className="w-4 h-4" />
            </span>
            <div>
              <span className="text-slate-400 text-[11px] block">Aktif Müvekkil Savunma Protokolü:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">
                  {partyContext.selectedPartyName || (partyContext.side === 'Davacı' ? plaintiff : defendant) || 'Müvekkil'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-extrabold border border-purple-500/40 text-[10px]">
                  {partyContext.side} (MÜVEKKİL)
                </span>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            %100 Müvekkil Lehine Adli İnceleme & Karşı İddiaları Çürütme Açık
          </span>
        </div>
      )}

      {/* 2. Dava ve Şahit Veri Giriş / Özet Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Dava Bilgileri & Taraf Savları */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                Dava ve Taraf Bilgileri
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{caseNo}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-medium block">Mahkeme</label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-medium block">Uyuşmazlık Konusu</label>
                <textarea
                  rows={2}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-emerald-400 font-medium block">Davacı İddiası</label>
                <textarea
                  rows={2}
                  value={plaintiffClaims}
                  onChange={(e) => setPlaintiffClaims(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-rose-400 font-medium block">Davalı Savunması</label>
                <textarea
                  rows={2}
                  value={defendantClaims}
                  onChange={(e) => setDefendantClaims(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Dosyadaki Resmi Yazılı Deliller */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                Dosyadaki Yazılı Deliller ({evidenceDocuments.length})
              </h3>
              <button
                type="button"
                onClick={handleStartAddDoc}
                className="px-2 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-semibold text-[10px] flex items-center gap-1 transition"
                title="Yeni Delil / Evrak Ekle"
              >
                <Plus className="w-3 h-3" />
                <span>+ Delil Ekle</span>
              </button>
            </div>

            <div className="space-y-2">
              {evidenceDocuments.length === 0 ? (
                <div className="p-3 bg-slate-800/40 border border-dashed border-slate-700 rounded-xl text-center text-slate-400 text-xs">
                  Henüz yazılı delil girilmedi. + Delil Ekle ile ekleyebilirsiniz.
                </div>
              ) : (
                evidenceDocuments.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1 text-xs group">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate pr-2">{doc.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {doc.evidentiaryValue.split(' ')[0]}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEditDoc(doc)}
                          className="p-1 hover:bg-slate-700 text-slate-400 hover:text-sky-300 rounded transition"
                          title="Delili Düzenle"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition"
                          title="Delili Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{doc.contentPreview}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sağ Kolon (2 Sütun): Şahitler Listesi ve Beyanları */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Dinlenen / Gösterilen Şahitler ({witnesses.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  HMK m. 254 gereği tanığın taraflarla akrabalık, husumet ve menfaat bağı denetlenir.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartAddWitness}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Yeni Şahit Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {witnesses.length === 0 ? (
                <div className="col-span-1 md:col-span-2 p-4 bg-slate-800/40 border border-dashed border-slate-700 rounded-xl text-center text-slate-400 text-xs">
                  Henüz tanık/şahit kaydı bulunmuyor. + Yeni Şahit Ekle butonuyla ekleyebilirsiniz.
                </div>
              ) : (
                witnesses.map((wit, idx) => (
                  <div
                    key={wit.id}
                    className={`p-3.5 rounded-xl border transition ${
                      wit.side === 'Davalı Tanığı'
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-emerald-950/20 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span>{wit.name}</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            wit.side === 'Davalı Tanığı'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {wit.side}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-mono">{wit.testimonyDate || '2025'}</span>
                        <button
                          type="button"
                          onClick={() => handleStartEditWitness(wit)}
                          className="p-1 hover:bg-slate-700 text-slate-400 hover:text-sky-300 rounded transition"
                          title="Şahidi Düzenle"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWitness(wit.id)}
                          className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition"
                          title="Şahidi Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-[11px] text-amber-300/90 font-medium">
                      Olayla / Tarafla Bağı: <span className="text-slate-300 font-normal">{wit.affiliation}</span>
                    </div>
                    <div className="p-2 bg-slate-950/60 rounded-lg text-slate-300 text-[11px] italic border border-slate-800/80">
                      "{wit.statementText}"
                    </div>
                    {wit.notes && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{wit.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </div>

          {/* Quick Analysis Launch CTA banner */}
          {!analysisResult && !isLoading && (
            <div className="bg-gradient-to-r from-indigo-900/40 via-sky-900/40 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Adli Hakikat ve Delil Başdenetçisi Analize Hazır
                </h4>
                <p className="text-xs text-slate-400 max-w-xl mx-auto mt-1">
                  Yukarıdaki ifadeler ve deliller 5 uzman ajan tarafından taranacak; gizli çelişkiler, HMK m. 255 tanık zaafları, TCK m. 272 yalan şahitlik riskleri ve davayı kazandıracak kritik ayrıntılar derlenecektir.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunForensicAudit}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition transform active:scale-95 inline-flex items-center gap-2"
              >
                <span>Mikroskobik Adli İncelemeyi Başlat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* 3. İNCELEME SONUÇLARI VE ÇOKLU AJAN PANELİ (Forensic Audit Results) */}
      {analysisResult && (
        <div className="space-y-6 pt-2">
          {/* Stratejik Dilekçe Yaz Butonu */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                const btn = document.getElementById('strategic-petition-btn');
                if (btn) btn.innerHTML = '<span class="animate-pulse">Dilekçe Yazılıyor...</span>';
                try {
                  const res = await fetch('/api/ai/strategic-petition', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      analysisData: analysisResult,
                      lawyerSicilNo: getActiveLawyerSicil(),
                      lawyerName: `Av. ${getActiveLawyerSicil()}`
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    onApplyToPetition && onApplyToPetition(data.petitionText);
                    alert('Stratejik Dilekçe başarıyla oluşturuldu ve Uygulamanın Dilekçe modülüne (veya kopyalama panosuna) aktarıldı. Dilekçenizi kontrol ediniz!');
                  } else {
                    alert('Dilekçe oluşturulamadı.');
                  }
                } catch (e) {
                  alert('Bir hata oluştu.');
                }
                if (btn) btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> <span>Bu Ajan İçgörüleriyle Stratejik Dilekçe Yaz</span>';
              }}
              id="strategic-petition-btn"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition transform active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Bu Ajan İçgörüleriyle Stratejik Dilekçe Yaz</span>
            </button>
          </div>

          {/* Supreme Director Verdict Hero Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Brain className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-extrabold text-white">
                    {analysisResult.directorVerdict?.baslik || 'Adli Hakikat ve Delil Başdenetçisi Kararı'}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Yapay Zekâ Destekli
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Risk: {analysisResult.directorVerdict?.yalanVeSahtelikRiskSeviyesi || 'YÜKSEK'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {analysisResult.directorVerdict?.yoneticiOzeti}
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{analysisResult.directorVerdict?.genelHukumIhtimali}</span>
                </div>
              </div>

              {/* Truth Integrity Gauge */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center shrink-0 w-44">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Hakikat & İspat Endeksi
                </span>
                <div className="text-3xl font-black text-amber-400 my-1 font-mono">
                  %{analysisResult.directorVerdict?.hakikatGuvenilirlikPuani || 78}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  {analysisResult.directorVerdict?.hakikatGuvenilirlikPuani > 75 ? 'Güçlü İspat Çerçevesi' : 'Ciddi Çelişki / Şüphe'}
                </span>
              </div>
            </div>

            {/* KVKK ve Avukat Nihai İnceleme Şerhi */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-300 block">
                  KVKK & 1136 Sayılı Avukatlık Kanunu m. 34 Açık Rıza ve Onay Hatırlatması:
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cımbız ajanı ve çelişki tespitleri otomatik nihai karar oluşturmaz; duruşma taktiği ve çapraz sorgu hazırlığı için mesleki tavsiye niteliğindedir. Mahkemeye sunulacak beyanların ve itirazların sorumluluğu bizzat avukata aittir.
                </p>
              </div>
            </div>
          </div>

          {/* 5 Ajan Navigasyon Sekmeleri */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveAnalysisTab('cimbiz')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeAnalysisTab === 'cimbiz'
                  ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Cımbız Ajanı: Davayı Kazandıran Gizli Detaylar</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {analysisResult.cimbizGameChangers?.length || 0} Altın Detay
              </span>
            </button>

            <button
              onClick={() => setActiveAnalysisTab('celiskiler')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeAnalysisTab === 'celiskiler'
                  ? 'bg-gradient-to-r from-rose-500/30 to-red-500/30 text-rose-300 border border-rose-500/50 shadow-lg shadow-rose-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>İfadeler Arası Çelişki & Tutarsızlıklar</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                {analysisResult.contradictionsAudit?.length || 0} Çelişki
              </span>
            </button>

            <button
              onClick={() => setActiveAnalysisTab('tanik_profili')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeAnalysisTab === 'tanik_profili'
                  ? 'bg-gradient-to-r from-sky-500/30 to-blue-500/30 text-sky-300 border border-sky-500/50 shadow-lg shadow-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Şahit Bağı & Husumet Profili (HMK 254-255)</span>
            </button>

            <button
              onClick={() => setActiveAnalysisTab('yalan_taniklik')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeAnalysisTab === 'yalan_taniklik'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileWarning className="w-4 h-4 text-purple-400" />
              <span>Yalan Tanıklık (TCK 272) & Sahte Delil</span>
            </button>

            <button
              onClick={() => setActiveAnalysisTab('capraz_sorgu_layiha')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeAnalysisTab === 'capraz_sorgu_layiha'
                  ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Gavel className="w-4 h-4 text-emerald-400" />
              <span>Duruşma Çapraz Sorgu & İtiraz Layihası</span>
            </button>
          </div>

          {/* TAB 1: CIMBIZ AJANI (DAVAYI KAZANDIRAN GİZLİ DETAYLAR) */}
          {activeAnalysisTab === 'cimbiz' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <Crosshair className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Cımbız Ajanı Misyonu:</strong> Dosyada binlerce kelime ve evrak arasında gizlenen, karşı tarafın vekilinin fark etmediği veya hakimin gözünden kaçabilecek, davanın kaderini lehinize çevirecek kesin delil ayrıntılarını çıkarır.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(analysisResult.cimbizGameChangers || []).map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="bg-slate-900/90 border-2 border-amber-500/40 hover:border-amber-400/70 rounded-2xl p-5 shadow-xl transition space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                          #{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{item.detayBasligi}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          {item.davayiKazandirmaPotansiyeli}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">
                            Dosyanın İçinden Cımbızla Çekilen Cümle / Belge:
                          </span>
                          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs mt-1">
                            "{item.dosyadanCekilenKritikCumle}"
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          <strong className="text-slate-300">Nerede Gizliydi:</strong> {item.neredeGizliydi}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">
                            Niçin Davanın Seyrini Değiştirir?
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-1">
                            {item.nicinDavaninSeyriniDegistirir}
                          </p>
                        </div>

                        <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1">
                          <span className="text-[10px] text-indigo-300 uppercase tracking-wider block font-bold">
                            Avukatın Uygulayacağı Stratejik Hamle:
                          </span>
                          <p className="text-xs text-indigo-100">{item.avukatinUygulayacagiStratejikHamle}</p>
                        </div>
                      </div>
                    </div>

                    {item.ajanIcgorusleri && (
                      <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 mt-3">
                        <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-bold flex items-center gap-1.5 mb-1">
                          <Search className="w-3.5 h-3.5" /> Ajan İçgörüleri & Eksik Tamamlama
                        </span>
                        <p className="text-xs text-rose-200/80 leading-relaxed italic">
                          "{item.ajanIcgorusleri}"
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kati Kanun Dayanağı: <strong className="text-amber-300">{item.katiKanunDayanagi}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(`${item.detayBasligi}\nDayanak: ${item.katiKanunDayanagi}\nDetay: ${item.dosyadanCekilenKritikCumle}\nStrateji: ${item.avukatinUygulayacagiStratejikHamle}`, `cimbiz-${idx}`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === `cimbiz-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Kopyala</span>
                        </button>

                        {onApplyToPetition && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplyToPetition(
                                `\n\n--- CIMBIZ AJANI DAVAYI KAZANDIRAN KRİTİK AYRINTI TESPİTİ ---\nBAŞLIK: ${item.detayBasligi}\nKANUN DAYANAĞI: ${item.katiKanunDayanagi}\nDOSYA EVRAK TESPİTİ: ${item.dosyadanCekilenKritikCumle}\nHUKUKİ STRATEJİ VE MAHKEMEYE BEYAN: ${item.nicinDavaninSeyriniDegistirir}\nTALEP VE ŞERH: ${item.avukatinUygulayacagiStratejikHamle}`
                              );
                              alert('Cımbız ayrıntısı ve kanun dayanağı dilekçe taslağına eklendi!');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1 text-[11px]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Dilekçeye Aktar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ÇELİŞKİ & TUTARSIZLIKLAR */}
          {activeAnalysisTab === 'celiskiler' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {(analysisResult.contradictionsAudit || []).map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-5 shadow-lg space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                          {c.celiskiTuru}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-rose-400">
                        {c.ilgiliKanunMaddesi}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block">1. Taraf / İddia: {c.tarafVeyaTanik1}</span>
                        <p className="text-slate-200 italic">{c.ifadeVeyaIddia1}</p>
                      </div>

                      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block">2. Taraf / Delil: {c.tarafVeyaTanik2}</span>
                        <p className="text-slate-200 italic">{c.ifadeVeyaIddia2}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-1.5 text-xs">
                      <div className="font-bold text-rose-300">
                        Tespit Edilen Çelişki & Tutarsızlık:
                      </div>
                      <p className="text-slate-200 leading-relaxed">{c.tespitEdilenTutarsizlik}</p>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-rose-500/20">
                        <strong className="text-rose-400">Hukuki Sonucu:</strong> {c.hukukiSonucu}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ŞAHİT BAĞI & GÜVENİLİRLİK (HMK 254-255) */}
          {activeAnalysisTab === 'tanik_profili' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(analysisResult.witnessCredibilityAudit || []).map((w: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-5 shadow-lg space-y-3 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{w.tanikAdi}</h4>
                        <span className="text-xs text-slate-400">{w.olaylaVeTaraflarlaBagi}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold font-mono text-sky-400">%{w.guvenilirlikPuani}</div>
                        <span className="text-[10px] text-slate-400">Güvenilirlik</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg">
                        <span className="text-slate-400">Husumet / Menfaat Riski:</span>
                        <span className="font-semibold text-amber-300">{w.husumetVeyaMenfaatRiski}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg">
                        <span className="text-slate-400">Tanık Reddi / İtiraz Sebebi:</span>
                        <span className={`font-semibold ${w.tanikRedSebebiVarMi ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {w.tanikRedSebebiVarMi ? 'İTİRAZ GEREKİR (HMK m. 255)' : 'Genel Usule Uygun'}
                        </span>
                      </div>

                      <div className="p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl space-y-1">
                        <span className="text-[10px] text-sky-300 font-bold block">İtibar Edilmeme Gerekçesi:</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{w.itibarEdilmemeGerekcesi}</p>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-sky-400" />
                        <span>Mevzuat: {w.hmkMaddeDayanagi}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: YALAN TANIKLIK (TCK 272) & SAHTE DELİL */}
          {activeAnalysisTab === 'yalan_taniklik' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol: TCK 272 Yalancı Tanıklık */}
                <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-purple-400" />
                      5237 Sayılı TCK m. 272 Yalan Tanıklık
                    </h4>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {analysisResult.perjuryCoachingDetection?.tck272YalanciTaniklikRiski}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Yönlendirilmiş / Ezberletilmiş Kalıp Cümleler:
                      </span>
                      <ul className="space-y-1">
                        {(analysisResult.perjuryCoachingDetection?.yonlendirilmisKalipCumleler || []).map((s: string, i: number) => (
                          <li key={i} className="p-2 bg-slate-950/70 rounded-lg text-slate-200 text-[11px] border border-slate-800">
                            • {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Fiilen ve Fiziken İmkansız Görgü Anlatımları:
                      </span>
                      <ul className="space-y-1">
                        {(analysisResult.perjuryCoachingDetection?.fiilenImkansizGoruntuler || []).map((s: string, i: number) => (
                          <li key={i} className="p-2 bg-rose-950/30 rounded-lg text-rose-200 text-[11px] border border-rose-500/30">
                            ⚠ {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-1">
                      <span className="text-[10px] text-purple-300 font-bold block">Savcılık Suç Duyurusu & Ceza İhtarı:</span>
                      <p className="text-slate-300 text-[11px]">{analysisResult.perjuryCoachingDetection?.savcilikSucDuyurusuIhtiyaci}</p>
                    </div>
                  </div>
                </div>

                {/* Sağ: HMK 208 Sahte Delil & Belge Tahrifatı */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <FileWarning className="w-4 h-4 text-amber-400" />
                      HMK m. 208 Sahtelik & Tahrifat İncelemesi
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    {(analysisResult.documentForgeryAudit?.supheliBelgeler || []).map((b: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-xs">{b.belgeAdi}</span>
                          <span className="text-[10px] font-mono text-amber-400 font-semibold">{b.kanunMaddesi}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{b.supheGerekcesi}</p>
                        <div className="text-[10px] text-slate-400">
                          <strong>Tahrifat / Hile:</strong> {b.tahrifatVeyaHileTuru}
                        </div>
                      </div>
                    ))}

                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">İmza İnkârı & Adli Tıp Grafoloji Talebi:</span>
                      <p className="text-slate-300 text-[11px]">{analysisResult.documentForgeryAudit?.imzaInkariVeGrafolojiTalebi}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ÇAPRAZ SORGU & RESMİ İTİRAZ LAYİHASI */}
          {activeAnalysisTab === 'capraz_sorgu_layiha' && (
            <div className="space-y-6">
              {/* Duruşmada Sorulacak Çapraz Sorgu Soruları */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Duruşmada Şahide Yöneltilecek Çapraz Sorgu Soruları (HMK m. 255-257)
                  </h4>
                </div>

                <div className="space-y-2">
                  {(analysisResult.courtCrossExamQuestions || []).map((q: string, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-slate-200 leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resmi İtiraz Layihası Taslağı */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-400" />
                    Mahkemeye Sunulacak HMK m. 255 ve m. 208 İtiraz Layihası
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(analysisResult.officialObjectionPetitionDraft, 'layiha')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                    >
                      {copiedKey === 'layiha' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Metni Kopyala</span>
                    </button>

                    {onApplyToPetition && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyToPetition(analysisResult.officialObjectionPetitionDraft);
                          alert('Resmi itiraz layihası çalışma masası dilekçe taslağına aktarıldı!');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1 transition shadow"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Dilekçe Masasına Yükle</span>
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  readOnly
                  rows={14}
                  value={analysisResult.officialObjectionPetitionDraft}
                  className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-4 rounded-xl border border-slate-800 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Yeni Şahit Ekleme */}
      {showAddWitnessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{editingWitnessId ? 'Dava Şahidini Düzenle' : 'Yeni Dava Şahidi Tanımla'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddWitnessModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕ Kapat
              </button>
            </div>

            <form onSubmit={handleAddWitnessSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Şahit Adı Soyadı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz (Eski Muhasebe Sorumlusu)"
                  value={newWitnessName}
                  onChange={(e) => setNewWitnessName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Şahidin Tarafı</label>
                  <select
                    value={newWitnessSide}
                    onChange={(e: any) => setNewWitnessSide(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Davalı Tanığı">Davalı Tanığı</option>
                    <option value="Davacı Tanığı">Davacı Tanığı</option>
                    <option value="Mahkemece Resen Çağrılan Tanık">Mahkemece Resen Çağrılan</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Olayla / Tarafla Bağı (HMK 254)</label>
                  <input
                    type="text"
                    placeholder="Örn: Davalının kardeşi / Şirket çalışanı"
                    value={newWitnessAffiliation}
                    onChange={(e) => setNewWitnessAffiliation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Şahidin İfade Metni / Duruşma Beyanı</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Şahidin zapt altına geçen veya yazılı olarak sunulan ifade metnini buraya yapıştırınız..."
                  value={newWitnessStatement}
                  onChange={(e) => setNewWitnessStatement(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWitnessModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  {editingWitnessId ? 'Güncellemeyi Kaydet' : 'Şahidi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Yazılı Delil Ekleme / Düzenleme */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>{editingDocId ? 'Yazılı Delili Düzenle' : 'Yeni Yazılı Delil / Belge Ekle'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕ Kapat
              </button>
            </div>

            <form onSubmit={handleAddDocSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Delil / Belge Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 2025/112 Sayılı Fatura ve Sevk İrsaliyesi"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Delil Türü</label>
                  <select
                    value={newDocType}
                    onChange={(e: any) => setNewDocType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Ticari Evrak / Senet">Ticari Evrak / Senet</option>
                    <option value="Banka Resmi Kaydı">Banka Resmi Kaydı</option>
                    <option value="Sözleşme / Protokol">Sözleşme / Protokol</option>
                    <option value="Uzman / Bilirkişi Raporu">Uzman / Bilirkişi Raporu</option>
                    <option value="Resmi Yazışma / İhtarname">Resmi Yazışma / İhtarname</option>
                    <option value="Tanık Listesi / Tutanak">Tanık Listesi / Tutanak</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">HMK İspat Değeri</label>
                  <input
                    type="text"
                    placeholder="Örn: Kesin Delil (HMK m. 199 - TTK m. 21)"
                    value={newDocValue}
                    onChange={(e) => setNewDocValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Delil İçerik Özeti / Kısa Bilgi</label>
                <textarea
                  rows={3}
                  placeholder="Belgenin dosyadaki önemi, imza durumu ve ihtilaf konusu maddesini yazınız..."
                  value={newDocPreview}
                  onChange={(e) => setNewDocPreview(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/30"
                >
                  {editingDocId ? 'Güncellemeyi Kaydet' : 'Delili Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
