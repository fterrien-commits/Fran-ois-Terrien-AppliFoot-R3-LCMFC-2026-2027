import { CompositionMatch, FeuilleMatchLigne, Joueur, Match } from '../types';
import { INITIAL_COMPOSITIONS, INITIAL_FEUILLES_MATCH, INITIAL_JOUEURS, INITIAL_MATCHS } from '../mockData';

const STORAGE_KEYS = {
  JOUEURS: 'footstats_joueurs_v1',
  MATCHS: 'footstats_matchs_v1',
  FEUILLES: 'footstats_feuilles_v1',
  COMPOSITIONS: 'footstats_compositions_v1',
};

export const StorageService = {
  getJoueurs(): Joueur[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOUEURS);
      if (!data) {
        this.saveJoueurs(INITIAL_JOUEURS);
        return INITIAL_JOUEURS;
      }
      const parsed: Joueur[] = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_JOUEURS;
    } catch (e) {
      console.warn('Erreur lecture joueurs localStorage:', e);
      return INITIAL_JOUEURS;
    }
  },

  saveJoueurs(joueurs: Joueur[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.JOUEURS, JSON.stringify(joueurs));
    } catch (e) {
      console.error('Erreur écriture joueurs localStorage (quota probable):', e);
    }
  },

  getMatchs(): Match[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHS);
      if (!data) {
        this.saveMatchs(INITIAL_MATCHS);
        return INITIAL_MATCHS;
      }
      const parsed: Match[] = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_MATCHS;
    } catch (e) {
      console.warn('Erreur lecture matchs localStorage:', e);
      return INITIAL_MATCHS;
    }
  },

  saveMatchs(matchs: Match[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHS, JSON.stringify(matchs));
    } catch (e) {
      console.error('Erreur écriture matchs localStorage (quota probable):', e);
    }
  },

  getFeuillesMatch(): FeuilleMatchLigne[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEUILLES);
      if (!data) {
        this.saveFeuillesMatch(INITIAL_FEUILLES_MATCH);
        return INITIAL_FEUILLES_MATCH;
      }
      const parsed: FeuilleMatchLigne[] = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_FEUILLES_MATCH;
    } catch (e) {
      console.warn('Erreur lecture feuillesMatch localStorage:', e);
      return INITIAL_FEUILLES_MATCH;
    }
  },

  saveFeuillesMatch(feuilles: FeuilleMatchLigne[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FEUILLES, JSON.stringify(feuilles));
    } catch (e) {
      console.error('Erreur écriture feuillesMatch localStorage (quota probable):', e);
    }
  },

  getCompositions(): Record<string, CompositionMatch> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPOSITIONS);
      if (!data) {
        this.saveCompositions(INITIAL_COMPOSITIONS);
        return INITIAL_COMPOSITIONS;
      }
      const parsed: Record<string, CompositionMatch> = JSON.parse(data);
      return parsed && typeof parsed === 'object' ? parsed : INITIAL_COMPOSITIONS;
    } catch (e) {
      console.warn('Erreur lecture compositions localStorage:', e);
      return INITIAL_COMPOSITIONS;
    }
  },

  saveCompositions(compositions: Record<string, CompositionMatch>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPOSITIONS, JSON.stringify(compositions));
    } catch (e) {
      console.error('Erreur écriture compositions localStorage (quota probable):', e);
    }
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.JOUEURS);
    localStorage.removeItem(STORAGE_KEYS.MATCHS);
    localStorage.removeItem(STORAGE_KEYS.FEUILLES);
    localStorage.removeItem(STORAGE_KEYS.COMPOSITIONS);
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
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
