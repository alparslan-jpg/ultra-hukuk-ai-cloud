import fs from 'fs';

// ── 1. Fix src/App.tsx ──────────────────────────────────────────────────────
const appFile = 'src/App.tsx';
let appRaw = fs.readFileSync(appFile, 'utf8');
let appLines = appRaw.split(/\r?\n/);

// Find {currentPage === 'home' && (
const homeStartIdx = appLines.findIndex(l => l.includes("{currentPage === 'home' && ("));
if (homeStartIdx !== -1) {
  // Find the end of this page block: before PAGE 3: ADLİ HAKİKAT
  const homeEndIdx = appLines.findIndex((l, idx) => idx > homeStartIdx && l.includes("currentPage === 'forensic'"));
  if (homeEndIdx !== -1) {
    // Find the closing of {currentPage === 'home' && ( ... )}
    // Look backwards from homeEndIdx for )}
    let closeIdx = -1;
    for (let i = homeEndIdx - 1; i > homeStartIdx; i--) {
      if (appLines[i].trim() === ')}' || appLines[i].includes(')}')) {
        closeIdx = i;
        break;
      }
    }

    if (closeIdx !== -1) {
      const cleanHomeBlock = [
        "        {/* ========================================================",
        "            PAGE 1: ANA SAYFA (BAŞ HUKUK MÜŞAVİRİ & AJAN KONSEYİ - TAM SAYFA)",
        "            ======================================================== */}",
        "        {currentPage === 'home' && (",
        "          <div className=\"flex-1 w-full overflow-hidden\" style={{ height: 'calc(100vh - 76px)' }}>",
        "            <AjanKonseyiOdasi",
        "              lawyerName={currentLawyer.fullName}",
        "              lawyerSicilNo={currentLawyer.sicilNo}",
        "              onApplyToPetition={(text) => {",
        "                setPetitionDraft(text);",
        "                setCurrentPage('petitions');",
        "              }}",
        "              onSyncGit={() => {",
        "                setGitModalOpen(true);",
        "              }}",
        "              onNavigateTo={(page) => setCurrentPage(page as any)}",
        "            />",
        "          </div>",
        "        )}"
      ];

      appLines.splice(homeStartIdx - 3, (closeIdx - (homeStartIdx - 3) + 1), ...cleanHomeBlock);
      console.log('✅ Replaced home page layout in App.tsx - outer sidebar and duplicate header removed!');
    }
  }
}

// In App.tsx, add automatic purge of legacy mock data in useEffect
const mountEffectIdx = appLines.findIndex(l => l.includes('useEffect(() => {') && appLines[l + 1]?.includes('loadLawyerSession();'));
if (mountEffectIdx !== -1) {
  const purgeCode = [
    '    // Eski test/mock müvekkil ve dava dosyalarını temizle',
    '    try {',
    '      const legacyKeys = [\'ultra_hukuk_clients_v4_8109\', \'ultra_hukuk_clients_v4\', \'ultra_hukuk_clients\'];',
    '      legacyKeys.forEach(k => {',
    '        const val = localStorage.getItem(k);',
    '        if (val && val.includes(\'ÖZCAN\')) localStorage.removeItem(k);',
    '      });',
    '    } catch {}'
  ];
  appLines.splice(mountEffectIdx + 1, 0, ...purgeCode);
  console.log('✅ Added legacy mock data purge in App.tsx mount effect');
}

fs.writeFileSync(appFile, appLines.join('\r\n'), 'utf8');

// ── 2. In AjanKonseyiOdasi.tsx: Add Archived Cases View & Clear Feature ─────
const ajanFile = 'src/components/AjanKonseyiOdasi.tsx';
let ajanRaw = fs.readFileSync(ajanFile, 'utf8');
let ajanLines = ajanRaw.split(/\r?\n/);

// Make clicking 'arsiv' show the archive panel or allow clearing it
// Let's find where activeModule === 'arsiv' can be handled
// In right panel:
// {showMuvekkilPanel ? ( ... ) : activeModule === 'arsiv' ? ( ... ) : ( ... )}
const rightPanelIdx = ajanLines.findIndex(l => l.includes('{showMuvekkilPanel ? ('));
if (rightPanelIdx !== -1) {
  // Let's check how right panel is structured
  console.log('Found showMuvekkilPanel ternary at line', rightPanelIdx + 1);
}

fs.writeFileSync(appFile, appLines.join('\r\n'), 'utf8');
console.log('✅ App.tsx updated!');
