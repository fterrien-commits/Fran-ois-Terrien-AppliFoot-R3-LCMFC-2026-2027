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
      // Seamlessly backfill profile attributes (age, taille, poids, piedFort, surnom, vma) if missing on initial roster
      const initialMap = new Map(INITIAL_JOUEURS.map((j) => [j.id, j]));
      let hasUpdates = false;
      const upgraded = parsed.map((j) => {
        const init = initialMap.get(j.id);
        if (init) {
          const merged: Joueur = {
            ...init,
            ...j,
            age: j.age ?? init.age,
            taille: j.taille ?? init.taille,
            poids: j.poids ?? init.poids,
            piedFort: j.piedFort ?? init.piedFort,
            surnom: j.surnom ?? init.surnom,
            vma: j.vma ?? init.vma,
          };
          if (
            j.age !== merged.age ||
            j.taille !== merged.taille ||
            j.poids !== merged.poids ||
            j.piedFort !== merged.piedFort ||
            j.surnom !== merged.surnom ||
            j.vma !== merged.vma
          ) {
            hasUpdates = true;
          }
          return merged;
        }
        return j;
      });
      if (hasUpdates) {
        this.saveJoueurs(upgraded);
      }
      return upgraded;
    } catch {
      return INITIAL_JOUEURS;
    }
  },

  saveJoueurs(joueurs: Joueur[]): void {
    localStorage.setItem(STORAGE_KEYS.JOUEURS, JSON.stringify(joueurs));
  },

  getMatchs(): Match[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHS);
      if (!data) {
        this.saveMatchs(INITIAL_MATCHS);
        return INITIAL_MATCHS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_MATCHS;
    }
  },

  saveMatchs(matchs: Match[]): void {
    localStorage.setItem(STORAGE_KEYS.MATCHS, JSON.stringify(matchs));
  },

  getFeuillesMatch(): FeuilleMatchLigne[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEUILLES);
      if (!data) {
        this.saveFeuillesMatch(INITIAL_FEUILLES_MATCH);
        return INITIAL_FEUILLES_MATCH;
      }
      const parsed: FeuilleMatchLigne[] = JSON.parse(data);
      // Sécurité & Restauration automatique : si des matchs initiaux sont manquants
      // (par exemple suite à un écrasement antérieur d'un match unique), on conserve les données existantes
      // et on réintègre les feuilles des autres matchs afin qu'aucun match ne soit écrasé ou perdu
      const existingMatchIds = new Set(parsed.map((f) => f.matchId));
      const missingInitialRows = INITIAL_FEUILLES_MATCH.filter(
        (f) => !existingMatchIds.has(f.matchId)
      );
      if (missingInitialRows.length > 0) {
        const merged = [...parsed, ...missingInitialRows];
        this.saveFeuillesMatch(merged);
        return merged;
      }
      return parsed;
    } catch {
      return INITIAL_FEUILLES_MATCH;
    }
  },

  saveFeuillesMatch(feuilles: FeuilleMatchLigne[]): void {
    localStorage.setItem(STORAGE_KEYS.FEUILLES, JSON.stringify(feuilles));
  },

  getCompositions(): Record<string, CompositionMatch> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPOSITIONS);
      if (!data) {
        this.saveCompositions(INITIAL_COMPOSITIONS);
        return INITIAL_COMPOSITIONS;
      }
      const parsed: Record<string, CompositionMatch> = JSON.parse(data);
      let hasMissing = false;
      const merged = { ...INITIAL_COMPOSITIONS, ...parsed };
      for (const k of Object.keys(INITIAL_COMPOSITIONS)) {
        if (!parsed[k]) {
          hasMissing = true;
          break;
        }
      }
      if (hasMissing) {
        this.saveCompositions(merged);
        return merged;
      }
      return parsed;
    } catch {
      return INITIAL_COMPOSITIONS;
    }
  },

  saveCompositions(compositions: Record<string, CompositionMatch>): void {
    localStorage.setItem(STORAGE_KEYS.COMPOSITIONS, JSON.stringify(compositions));
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
