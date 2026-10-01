/**
 * patch_muvekkil.mjs
 * MuvekkilYonetimi panelini AjanKonseyiOdasi'ya entegre eder:
 * 1. Import ekle
 * 2. showMuvekkilPanel state ekle
 * 3. Sidebar'a "Müvekkil Yönetimi" ilk sıraya ekle
 * 4. Sağ panelde koşullu render ekle
 */
import { readFileSync, writeFileSync } from 'fs';
const file = './src/components/AjanKonseyiOdasi.tsx';
let src = readFileSync(file, 'utf8');

// 1. Import MuvekkilYonetimi
src = src.replace(
  `import { CaseFileItem } from './MuvekkilDavaPortali';`,
  `import { CaseFileItem } from './MuvekkilDavaPortali';
import { MuvekkilYonetimi } from './MuvekkilYonetimi';`
);

// 2. showMuvekkilPanel state — orchestratorModel'den sonra
src = src.replace(
  `  const [orchestratorModel, setOrchestratorModel] = useState<'pro' | 'flash'>('pro');`,
  `  const [orchestratorModel, setOrchestratorModel] = useState<'pro' | 'flash'>('pro');
  const [showMuvekkilPanel, setShowMuvekkilPanel] = useState(false);`
);

// 3. Sidebar: "Müvekkil Yönetimi" ilk sıraya ekle
// Find the sidebar module array opening
src = src.replace(
  `            {[
              { id:'arsiv',`,
  `            {/* Müvekkil Yönetimi - 1. sıra özel butonu */}
            <button type="button"
              onClick={() => { setShowMuvekkilPanel(p => !p); setActiveModule('muvekkil'); }}
              title="Müvekkil & Dava Dosyaları"
              className={\`w-full flex items-center gap-2 px-2 py-1.5 transition text-left border-b border-slate-100 dark:border-slate-800 \${showMuvekkilPanel ? 'bg-indigo-50 dark:bg-indigo-950/40 border-r-2 border-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}\`}
            >
              <Users className="w-3.5 h-3.5 shrink-0 text-violet-500" />
              {sidebarOpen && (
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">Müvekkil Yönetimi</span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 truncate">Ekle & Dava Dosyası</span>
                </span>
              )}
              {sidebarOpen && showMuvekkilPanel && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </button>

            {[
              { id:'arsiv',`
);

// 4. Users import ekle
src = src.replace(
  `  ChevronRight\n} from 'lucide-react';`,
  `  ChevronRight,\n  Users\n} from 'lucide-react';`
);

// 5. Sağ paneli koşullu yap: showMuvekkilPanel ise MuvekkilYonetimi, değilse chat
// Find "RIGHT: Chat Panel" div and add conditional
src = src.replace(
  `        {/* RIGHT: Chat Panel */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>

      {/* Main Conversation & Roadmap Display */}`,
  `        {/* RIGHT: Müvekkil Paneli veya Chat */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>

      {showMuvekkilPanel && (
        <MuvekkilYonetimi
          onCaseSelected={(ctx) => {
            setSelectedCaseNote(\`Müvekkil: \${ctx.clientName} | Dava: \${ctx.caseNumber} - \${ctx.subject}\`);
            setAttachedFiles(ctx.files.map(f => ({ name: f.name, content: f.content || '', type: f.type || 'Hukuki Belge' })));
            setShowMuvekkilPanel(false);
            setActiveModule('musavir');
          }}
        />
      )}

      {!showMuvekkilPanel && (
      <>{/* Main Conversation & Roadmap Display */}`
);

// 6. Close the !showMuvekkilPanel block — add </> before the right panel closing
// Find the "end main conv div" comment and add closing fragment before right panel ends
src = src.replace(
  `      </div>{/* end main conv div */}
        </div>{/* end right panel */}`,
  `      </div>{/* end main conv div */}
      </>
      )}{/* end !showMuvekkilPanel */}
        </div>{/* end right panel */}`
);

writeFileSync(file, src, 'utf8');
console.log('✅ Müvekkil panel entegrasyonu tamamlandı');
