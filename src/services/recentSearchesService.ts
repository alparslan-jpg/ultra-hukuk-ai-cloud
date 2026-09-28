/**
 * recentSearchesService.ts
 * Manages the last 5 searched legal terms for quick access in the Legislation & Terminology module.
 * Stores data locally in localStorage for 100% privacy (KVKK compliant).
 */

export interface RecentSearchItem {
  id: string;
  term: string;
  category?: string;
  timestamp: string; // ISO string
  source: 'glossary' | 'mevzuat';
  searchCount: number;
}

const STORAGE_KEY = 'ultra_hukuk_recent_searches_legal_terms';
const MAX_RECENT_SEARCHES = 5;

// Initial curated set of foundational Turkish legal terms
export const DEFAULT_RECENT_TERMS: RecentSearchItem[] = [
  {
    id: 'rec-1',
    term: 'Tenkis Davası',
    category: 'Medeni & Miras (TMK)',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    source: 'glossary',
    searchCount: 3
  },
  {
    id: 'rec-2',
    term: 'Senetle İspat Zorunluluğu',
    category: 'Usul Hukuku (HMK)',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    source: 'mevzuat',
    searchCount: 4
  },
  {
    id: 'rec-3',
    term: 'Muris Muvazaası',
    category: 'Medeni & Miras (TMK / TBK)',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    source: 'glossary',
    searchCount: 2
  },
  {
    id: 'rec-4',
    term: 'Munzam Zarar (Aşkın Zarar)',
    category: 'Borçlar Hukuku (TBK)',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    source: 'glossary',
    searchCount: 1
  },
  {
    id: 'rec-5',
    term: 'İhtiyati Tedbir',
    category: 'Usul Hukuku (HMK)',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    source: 'mevzuat',
    searchCount: 5
  }
];

type Listener = (items: RecentSearchItem[]) => void;
const listeners: Set<Listener> = new Set();

/**
 * Retrieves the stored recent searches (always max 5 items).
 */
export function getRecentSearches(): RecentSearchItem[] {
  if (typeof window === 'undefined') return DEFAULT_RECENT_TERMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECENT_TERMS));
      return DEFAULT_RECENT_TERMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_RECENT_SEARCHES);
    }
    return DEFAULT_RECENT_TERMS;
  } catch (err) {
    console.warn('Failed to load recent legal searches:', err);
    return DEFAULT_RECENT_TERMS;
  }
}

/**
 * Adds or moves a searched legal term to the top of the recent searches list.
 * Guarantees that only the last 5 searched terms are retained.
 */
export function addRecentSearch(
  term: string,
  category?: string,
  source: 'glossary' | 'mevzuat' = 'glossary'
): RecentSearchItem[] {
  const cleanTerm = term.trim();
  if (!cleanTerm || cleanTerm.length < 2) return getRecentSearches();

  const current = getRecentSearches();
  const existingIdx = current.findIndex(
    (item) => item.term.toLowerCase() === cleanTerm.toLowerCase()
  );

  let updatedItem: RecentSearchItem;

  if (existingIdx !== -1) {
    const existing = current[existingIdx];
    updatedItem = {
      ...existing,
      term: cleanTerm,
      category: category || existing.category,
      timestamp: new Date().toISOString(),
      source,
      searchCount: (existing.searchCount || 1) + 1
    };
  } else {
    updatedItem = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      term: cleanTerm,
      category: category || inferCategory(cleanTerm),
      timestamp: new Date().toISOString(),
      source,
      searchCount: 1
    };
  }

  // Filter out existing and prepend updated to the very top, slicing to max 5
  const newList = [
    updatedItem,
    ...current.filter((item) => item.term.toLowerCase() !== cleanTerm.toLowerCase())
  ].slice(0, MAX_RECENT_SEARCHES);

  saveAndNotify(newList);
  return newList;
}

/**
 * Removes a single term from recent searches.
 */
export function removeRecentSearch(termOrId: string): RecentSearchItem[] {
  const current = getRecentSearches();
  const newList = current.filter(
    (item) => item.id !== termOrId && item.term.toLowerCase() !== termOrId.toLowerCase()
  );
  saveAndNotify(newList);
  return newList;
}

/**
 * Clears all recent searches.
 */
export function clearRecentSearches(): RecentSearchItem[] {
  const empty: RecentSearchItem[] = [];
  saveAndNotify(empty);
  return empty;
}

/**
 * Resets recent searches back to the foundational legal terms.
 */
export function resetToDefaultRecentSearches(): RecentSearchItem[] {
  saveAndNotify(DEFAULT_RECENT_TERMS);
  return DEFAULT_RECENT_TERMS;
}

/**
 * Subscribes to changes in recent searches across the application.
 */
export function subscribeRecentSearches(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function saveAndNotify(items: RecentSearchItem[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save recent legal searches to localStorage:', e);
    }
  }
  listeners.forEach((listener) => {
    try {
      listener(items);
    } catch (e) {
      console.error('Error in recent searches listener:', e);
    }
  });
}

function inferCategory(term: string): string {
  const lower = term.toLowerCase();
  if (lower.includes('miras') || lower.includes('tenkis') || lower.includes('vasiyet') || lower.includes('boşanma') || lower.includes('velayet') || lower.includes('nafaka')) {
    return 'Medeni & Miras (TMK)';
  }
  if (lower.includes('ispat') || lower.includes('hmk') || lower.includes('yetki') || lower.includes('tedbir') || lower.includes('ıslah') || lower.includes('bekletici')) {
    return 'Usul Hukuku (HMK)';
  }
  if (lower.includes('icra') || lower.includes('haciz') || lower.includes('iptal') || lower.includes('menfi')) {
    return 'İcra & İflas (İİK)';
  }
  if (lower.includes('sözleşme') || lower.includes('tazminat') || lower.includes('faiz') || lower.includes('temerrüt') || lower.includes('zarar') || lower.includes('tbk')) {
    return 'Borçlar Hukuku (TBK)';
  }
  if (lower.includes('şirket') || lower.includes('çek') || lower.includes('poliçe') || lower.includes('ttk')) {
    return 'Ticaret & Şirketler (TTK)';
  }
  return 'Genel Hukuk Terimi';
}
