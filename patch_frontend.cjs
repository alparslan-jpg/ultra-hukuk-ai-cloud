const fs = require('fs');
let code = fs.readFileSync('src/components/DavaDerinAnaliz.tsx', 'utf8');

// The tab buttons block starts exactly with:
//               <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
//                 <button
//                   onClick={() => setActiveViewTab('overview')}
// and ends with </div>
const tabButtonsRegex = /<div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">[\s\S]*?<\/div>/;

const newTabButtons = `              <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
                {[
                  { id: 'basHukukMusaviri', label: 'Baş Hukuk Müşaviri Sentezi', icon: Target },
                  { id: 'usulAjani', label: 'Usul & Süre Ajanı', icon: FileWarning },
                  { id: 'emsalAjani', label: 'Yargıtay Emsal Ajanı', icon: Scale },
                  { id: 'seytaninAvukati', label: 'Şeytanın Avukatı', icon: Ghost },
                  { id: 'dilekceMimari', label: 'Dilekçe Mimarı', icon: FileText }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveViewTab(t.id)}
                    className={\`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition flex items-center gap-2 \${
                      activeViewTab === t.id
                        ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                        : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    }\`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>`;

code = code.replace(tabButtonsRegex, newTabButtons);

// Replace render content
const renderStart = code.indexOf('{activeViewTab === \'overview\' && (');
const renderEnd = code.indexOf('{/* Bottom Action Bar */}');

if (renderStart > -1 && renderEnd > -1) {
  const newRender = `
              {activeViewTab === 'basHukukMusaviri' && analysisResult.basHukukMusaviriSentezi && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                    <h4 className="text-indigo-400 font-bold flex items-center gap-2"><Target className="w-4 h-4"/> Yönetici Özeti ve Hukuki Teşhis</h4>
                    <p className="text-slate-200 text-sm leading-relaxed">{analysisResult.basHukukMusaviriSentezi.davaOzetiVeTeshis}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
                    <h4 className="text-emerald-400 font-bold flex items-center gap-2"><Brain className="w-4 h-4"/> Ajanların Verilerini Birleştiren Derin Analiz</h4>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      {analysisResult.basHukukMusaviriSentezi.tumAjanlarinVerileriniBirlestirenDerinAnaliz}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
                      <span className="text-xs text-emerald-500 font-bold block mb-1">Kazanma İhtimali</span>
                      <span className="text-2xl font-black text-emerald-400">%{(analysisResult.basHukukMusaviriSentezi.kazanmaIhtimali || 0)}</span>
                    </div>
                    <div className="bg-sky-950/20 border border-sky-900/40 rounded-xl p-4">
                      <span className="text-xs text-sky-500 font-bold block mb-1">Stratejik Yol Haritası</span>
                      <span className="text-sm text-sky-200 block">{analysisResult.basHukukMusaviriSentezi.stratejikYolHaritasiVurgusu}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeViewTab === 'usulAjani' && analysisResult.usulSuresiAjaniRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 space-y-2">
                      <h4 className="text-rose-400 text-xs font-bold uppercase tracking-wider">Zamanaşımı ve Hak Düşürücü Süreler</h4>
                      <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                        {(analysisResult.usulSuresiAjaniRaporu.zamanasimiVeHakDusurucuSureler || []).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 space-y-2">
                      <h4 className="text-amber-400 text-xs font-bold uppercase tracking-wider">HMK Uyarısı & Acil Adımlar</h4>
                      <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                        {(analysisResult.usulSuresiAjaniRaporu.hmkUyarisiVeAcilAdimlar || []).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-sm flex justify-between items-center">
                    <div><span className="text-slate-400 block text-xs">Görevli ve Yetkili Mahkeme</span><span className="text-sky-300 font-bold">{analysisResult.usulSuresiAjaniRaporu.gorevliYetkiliMahkeme}</span></div>
                    <div className="text-right"><span className="text-slate-400 block text-xs">Arabuluculuk Şartı</span><span className="text-emerald-300 font-bold">{analysisResult.usulSuresiAjaniRaporu.arabuluculukDavaSarti}</span></div>
                  </div>
                </div>
              )}

              {activeViewTab === 'emsalAjani' && analysisResult.yargitayEmsalAjaniRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-sky-400 font-bold mb-2">Benzer Vakıalarda Yargıtay Yaklaşımı</h4>
                    <p className="text-slate-300 text-sm">{analysisResult.yargitayEmsalAjaniRaporu.benzerVakialardaYargitayYaklasimi}</p>
                  </div>
                  <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-5">
                    <h4 className="text-indigo-400 font-bold mb-3">HGK, Daire & BAM İlke Kararları</h4>
                    <div className="space-y-2">
                      {(analysisResult.yargitayEmsalAjaniRaporu.hgkDaiveBamIlkeKararlari || []).map((k, i) => (
                        <div key={i} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 text-slate-300 text-sm border-l-2 border-l-indigo-500">
                          {k}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-sm">
                    <h4 className="text-emerald-400 font-bold mb-2">Lehe ve Aleyhe Emsal Karşılaştırması</h4>
                    <p className="text-slate-300">{analysisResult.yargitayEmsalAjaniRaporu.leheVeAleyheEmsalKarsilastirmasi}</p>
                  </div>
                </div>
              )}

              {activeViewTab === 'seytaninAvukati' && analysisResult.seytaninAvukatiRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-5">
                    <h4 className="text-rose-400 font-bold flex items-center gap-2 mb-2"><Ghost className="w-4 h-4"/> Karşı Taraf Ne Yapar? (En Kötü Senaryo)</h4>
                    <p className="text-rose-200 text-sm">{analysisResult.seytaninAvukatiRaporu.karsiTarafNeYapar}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                      <h4 className="text-amber-400 font-bold mb-2 text-sm">Dosyadaki Zayıf Halkalar & Açıklar</h4>
                      <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                        {(analysisResult.seytaninAvukatiRaporu.dosyadakiZayifHalkalarVeAciklar || []).map((z, i) => <li key={i}>{z}</li>)}
                      </ul>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                      <h4 className="text-amber-400 font-bold mb-2 text-sm">Delil Çelişki ve Riskleri</h4>
                      <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                        {(analysisResult.seytaninAvukatiRaporu.delilCeliskiVeRiskleri || []).map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
                    <h4 className="text-emerald-400 font-bold mb-2">Karşı Savunma & Panzehir Stratejisi</h4>
                    <p className="text-emerald-200 text-sm">{analysisResult.seytaninAvukatiRaporu.karsiSavunmaStratejisi}</p>
                  </div>
                </div>
              )}

              {activeViewTab === 'dilekceMimari' && analysisResult.dilekceMimariRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-sky-950/20 border border-sky-900/40 rounded-xl p-5">
                    <h4 className="text-sky-400 font-bold mb-2">UYAP Netice-i Talep Önerisi</h4>
                    <p className="text-sky-100 text-sm font-mono p-3 bg-slate-950/50 rounded-lg border border-slate-800">{analysisResult.dilekceMimariRaporu.uyapNeticeiTalepOnerisi}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-indigo-400 font-bold mb-3">Dilekçe Kurgusu Hiyerarşisi</h4>
                    <div className="space-y-2">
                      {(analysisResult.dilekceMimariRaporu.dilekceKurgusuHiyerarsisi || []).map((k, i) => (
                        <div key={i} className="flex gap-3 items-start p-2 bg-slate-800/30 rounded-lg">
                          <span className="text-indigo-500 font-black">{i+1}.</span>
                          <span className="text-slate-300 text-sm">{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4">
                    <h4 className="text-amber-400 font-bold mb-2 text-sm">Tensip ve Müzekkere Talepleri</h4>
                    <ul className="list-disc list-inside text-amber-200/80 text-xs space-y-1">
                      {(analysisResult.dilekceMimariRaporu.tensipVeMuzekkereTalepleri || []).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              )}

`;
  code = code.slice(0, renderStart) + newRender + code.slice(renderEnd);
} else {
  console.log('Render boundaries not found.');
}

// Ensure activeViewTab initializes to 'basHukukMusaviri' instead of 'overview'
code = code.replace(/const \[activeViewTab, setActiveViewTab\] = useState<string>\('overview'\);/, 'const [activeViewTab, setActiveViewTab] = useState<string>(\'basHukukMusaviri\');');
// Change where it switches tab on success
code = code.replace(/setActiveViewTab\('overview'\);/g, 'setActiveViewTab(\'basHukukMusaviri\');');

// Also update the icons if Ghost or Target isn't imported
if(!code.includes('Ghost')) {
  code = code.replace(/import \{/, 'import { Ghost, Target, Brain, ');
}

fs.writeFileSync('src/components/DavaDerinAnaliz.tsx', code, 'utf8');
console.log('Done rewriting component render.');
