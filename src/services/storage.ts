import { CompositionMatch, FeuilleMatchLigne, Joueur, Match } from '../types';
import { INITIAL_COMPOSITIONS, INITIAL_FEUILLES_MATCH, INITIAL_JOUEURS, INITIAL_MATCHS } from '../mockData';

const STORAGE_KEYS = {
  JOUEURS: 'footstats_joueurs_v1',
  MATCHS: 'footstats_matchs_v1',
  FEUILLES: 'footstats_feuilles_v1',
  COMPOSITIONS: 'footstats_compositions_v1',
  HAS_CUSTOM_DATA: 'footstats_custom_data_v1',
};

// IndexedDB Persistent Layer (Survives ChromeOS LocalStorage wipe on browser close)
const IDB_NAME = 'footstats_offline_db';
const IDB_VERSION = 1;
const IDB_STORE = 'app_data';

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? (req.result as T) : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbSet<T>(key: string, val: T): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(val, key);
  } catch {
    // Ignore idb errors
  }
}

// Helper to strip heavy base64 photos when saving to localStorage to prevent QuotaExceededError
function sanitizeMatchsForLocalStorage(matchs: Match[]): Match[] {
  return matchs.map((m) => {
    if (!m.photos || m.photos.length === 0) return m;
    // If photos are large base64 strings, trim them in localStorage (IndexedDB & Cloud retain 100% full photos)
    const lightweightPhotos = m.photos.map((p) => (p.length > 30000 ? '' : p)).filter(Boolean);
    return { ...m, photos: lightweightPhotos };
  });
}

export const StorageService = {
  // Check if user has active custom real data (so we never resurrect demo players or matches)
  hasCustomData(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.HAS_CUSTOM_DATA) === 'true';
    } catch {
      return false;
    }
  },

  setHasCustomData(hasCustom: boolean): void {
    try {
      if (hasCustom) {
        localStorage.setItem(STORAGE_KEYS.HAS_CUSTOM_DATA, 'true');
        idbSet(STORAGE_KEYS.HAS_CUSTOM_DATA, true);
      } else {
        localStorage.removeItem(STORAGE_KEYS.HAS_CUSTOM_DATA);
        idbSet(STORAGE_KEYS.HAS_CUSTOM_DATA, false);
      }
    } catch {
      // Ignore
    }
  },

  getJoueurs(): Joueur[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOUEURS);
      if (data) {
        const parsed: Joueur[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If custom players exist, mark custom data active
          if (parsed.some((j) => j.id.startsWith('j_'))) {
            this.setHasCustomData(true);
          }
          return parsed;
        }
      }
      // If no local data, only fallback to INITIAL_JOUEURS if user doesn't have custom data
      if (this.hasCustomData()) {
        return [];
      }
      return INITIAL_JOUEURS;
    } catch (e) {
      console.warn('Erreur lecture joueurs localStorage:', e);
      return this.hasCustomData() ? [] : INITIAL_JOUEURS;
    }
  },

  saveJoueurs(joueurs: Joueur[]): void {
    if (!joueurs) return;
    if (joueurs.some((j) => j.id.startsWith('j_'))) {
      this.setHasCustomData(true);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.JOUEURS, JSON.stringify(joueurs));
    } catch (e) {
      console.warn('Erreur écriture joueurs localStorage (IndexedDB prend le relais):', e);
    }
    idbSet(STORAGE_KEYS.JOUEURS, joueurs);
  },

  getMatchs(): Match[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHS);
      if (data) {
        const parsed: Match[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.some((m) => m.id.startsWith('m_'))) {
            this.setHasCustomData(true);
          }
          return parsed;
        }
      }
      // If no local data, only fallback to INITIAL_MATCHS if user doesn't have custom data
      if (this.hasCustomData()) {
        return [];
      }
      return INITIAL_MATCHS;
    } catch (e) {
      console.warn('Erreur lecture matchs localStorage:', e);
      return this.hasCustomData() ? [] : INITIAL_MATCHS;
    }
  },

  saveMatchs(matchs: Match[]): void {
    if (!matchs) return;
    if (matchs.some((m) => m.id.startsWith('m_'))) {
      this.setHasCustomData(true);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHS, JSON.stringify(matchs));
    } catch (e) {
      // If quota exceeded due to photos, try saving lightweight version to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.MATCHS, JSON.stringify(sanitizeMatchsForLocalStorage(matchs)));
      } catch {
        console.warn('LocalStorage plein, sauvegarde intégrale sécurisée dans IndexedDB');
      }
    }
    // Full data including full photos is always saved to IndexedDB
    idbSet(STORAGE_KEYS.MATCHS, matchs);
  },

  getFeuillesMatch(): FeuilleMatchLigne[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEUILLES);
      if (data) {
        const parsed: FeuilleMatchLigne[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      if (this.hasCustomData()) {
        return [];
      }
      return INITIAL_FEUILLES_MATCH;
    } catch (e) {
      console.warn('Erreur lecture feuillesMatch localStorage:', e);
      return this.hasCustomData() ? [] : INITIAL_FEUILLES_MATCH;
    }
  },

  saveFeuillesMatch(feuilles: FeuilleMatchLigne[]): void {
    if (!feuilles) return;
    try {
      localStorage.setItem(STORAGE_KEYS.FEUILLES, JSON.stringify(feuilles));
    } catch (e) {
      console.warn('Erreur écriture feuillesMatch localStorage (sauvegarde IndexedDB en cours):', e);
    }
    idbSet(STORAGE_KEYS.FEUILLES, feuilles);
  },

  getCompositions(): Record<string, CompositionMatch> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPOSITIONS);
      if (data) {
        const parsed: Record<string, CompositionMatch> = JSON.parse(data);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
      if (this.hasCustomData()) {
        return {};
      }
      return INITIAL_COMPOSITIONS;
    } catch (e) {
      console.warn('Erreur lecture compositions localStorage:', e);
      return this.hasCustomData() ? {} : INITIAL_COMPOSITIONS;
    }
  },

  saveCompositions(compositions: Record<string, CompositionMatch>): void {
    if (!compositions) return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMPOSITIONS, JSON.stringify(compositions));
    } catch (e) {
      console.warn('Erreur écriture compositions localStorage (sauvegarde IndexedDB en cours):', e);
    }
    idbSet(STORAGE_KEYS.COMPOSITIONS, compositions);
  },

  // Load all persistent backup from IndexedDB if LocalStorage was cleared on Chromebook close
  async loadFromIndexedDB(): Promise<{
    joueurs?: Joueur[];
    matchs?: Match[];
    feuilles?: FeuilleMatchLigne[];
    compositions?: Record<string, CompositionMatch>;
    hasCustomData?: boolean;
  }> {
    const [j, m, f, c, hasCustom] = await Promise.all([
      idbGet<Joueur[]>(STORAGE_KEYS.JOUEURS),
      idbGet<Match[]>(STORAGE_KEYS.MATCHS),
      idbGet<FeuilleMatchLigne[]>(STORAGE_KEYS.FEUILLES),
      idbGet<Record<string, CompositionMatch>>(STORAGE_KEYS.COMPOSITIONS),
      idbGet<boolean>(STORAGE_KEYS.HAS_CUSTOM_DATA),
    ]);
    const hasAnyCustom: boolean =
      Boolean(hasCustom) ||
      Boolean(m && m.some((match) => match.id.startsWith('m_'))) ||
      Boolean(j && j.some((joueur) => joueur.id.startsWith('j_')));
    if (hasAnyCustom) {
      this.setHasCustomData(true);
    }
    // Re-hydrate localStorage from IndexedDB so subsequent synchronous calls find the persisted data
    try {
      if (j && j.length > 0) localStorage.setItem(STORAGE_KEYS.JOUEURS, JSON.stringify(j));
      if (m && m.length > 0) localStorage.setItem(STORAGE_KEYS.MATCHS, JSON.stringify(m));
      if (f && f.length > 0) localStorage.setItem(STORAGE_KEYS.FEUILLES, JSON.stringify(f));
      if (c && Object.keys(c).length > 0) localStorage.setItem(STORAGE_KEYS.COMPOSITIONS, JSON.stringify(c));
    } catch {
      // Ignore quota errors
    }
    return {
      joueurs: j || undefined,
      matchs: m || undefined,
      feuilles: f || undefined,
      compositions: c || undefined,
      hasCustomData: hasAnyCustom,
    };
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.JOUEURS);
    localStorage.removeItem(STORAGE_KEYS.MATCHS);
    localStorage.removeItem(STORAGE_KEYS.FEUILLES);
    localStorage.removeItem(STORAGE_KEYS.COMPOSITIONS);
    localStorage.removeItem(STORAGE_KEYS.HAS_CUSTOM_DATA);
    idbSet(STORAGE_KEYS.JOUEURS, null);
    idbSet(STORAGE_KEYS.MATCHS, null);
    idbSet(STORAGE_KEYS.FEUILLES, null);
    idbSet(STORAGE_KEYS.COMPOSITIONS, null);
    idbSet(STORAGE_KEYS.HAS_CUSTOM_DATA, false);
  },

  exportBackup(): string {
    const fullState = {
      joueurs: this.getJoueurs(),
      matchs: this.getMatchs(),
      feuilles: this.getFeuillesMatch(),
      compositions: this.getCompositions(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(fullState, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.joueurs && parsed.matchs && parsed.feuilles && parsed.compositions) {
        this.saveJoueurs(parsed.joueurs);
        this.saveMatchs(parsed.matchs);
        this.saveFeuillesMatch(parsed.feuilles);
        this.saveCompositions(parsed.compositions);
        this.setHasCustomData(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
