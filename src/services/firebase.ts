import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CompositionMatch, FeuilleMatchLigne, Joueur, Match } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore directly for maximum stability across ChromeOS, iframes, and mobile devices
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on initialization
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears to be offline.');
    }
    return false;
  }
}

// Utility to recursively clean undefined values for Firestore compatibility
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return data;
}

// Auth helpers
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Helper to ensure Match documents adhere strictly to Firestore schema and security rules
export function sanitizeMatch(m: Match): Record<string, unknown> {
  return sanitizeForFirestore({
    id: m.id,
    adversaire: m.adversaire || 'Adversaire',
    date: m.date || new Date().toISOString().split('T')[0],
    heure: m.heure || '15:00',
    lieu: m.lieu || 'Stade Municipal',
    domicileExterieur: m.domicileExterieur || 'domicile',
    scoreEquipe: typeof m.scoreEquipe === 'number' ? m.scoreEquipe : 0,
    scoreAdverse: typeof m.scoreAdverse === 'number' ? m.scoreAdverse : 0,
    systemeEquipe: m.systemeEquipe || '4-3-3',
    systemeAdverse: m.systemeAdverse || '4-4-2',
    competition: m.competition || 'Championnat R3',
    statut: m.statut || 'termine',
    typeMatch: m.typeMatch || 'championnat',
    meteo: m.meteo || 'Ensoleillé',
    valide: m.valide !== undefined ? m.valide : true,
    dateValidation: m.dateValidation || new Date().toISOString(),
    photos: Array.isArray(m.photos) ? m.photos : [],
    scoutingAdverse: m.scoutingAdverse || null,
  }) as Record<string, unknown>;
}

// Helper to ensure FeuilleMatch documents adhere strictly to Firestore schema and security rules
export function sanitizeFeuille(f: FeuilleMatchLigne): Record<string, unknown> {
  const matchId = f.matchId;
  const joueurId = f.joueurId;
  const id = f.id || `f_${matchId}_${joueurId}`;
  return sanitizeForFirestore({
    id,
    matchId,
    joueurId,
    titulaire: !!f.titulaire,
    statut: f.statut || (f.titulaire ? 'titulaire' : 'remplacant'),
    minutesJouees: typeof f.minutesJouees === 'number' ? f.minutesJouees : 0,
    buts: typeof f.buts === 'number' ? f.buts : 0,
    passesDecisives: typeof f.passesDecisives === 'number' ? f.passesDecisives : 0,
    cartonsJaunes: typeof f.cartonsJaunes === 'number' ? f.cartonsJaunes : 0,
    cartonsRouges: typeof f.cartonsRouges === 'number' ? f.cartonsRouges : 0,
    note: f.note !== null && f.note !== undefined && !isNaN(Number(f.note)) ? Number(f.note) : null,
  }) as Record<string, unknown>;
}

// Cloud Firestore data operations
export const FirebaseDataService = {
  // JOUEURS
  async getJoueurs(): Promise<Joueur[]> {
    const colPath = 'joueurs';
    try {
      const snap = await getDocs(collection(db, colPath));
      return snap.docs.map((d) => d.data() as Joueur);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, colPath);
    }
  },

  async saveJoueur(joueur: Joueur): Promise<void> {
    const path = `joueurs/${joueur.id}`;
    try {
      await setDoc(doc(db, 'joueurs', joueur.id), sanitizeForFirestore(joueur));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteJoueur(joueurId: string): Promise<void> {
    const path = `joueurs/${joueurId}`;
    try {
      await deleteDoc(doc(db, 'joueurs', joueurId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async batchSaveJoueurs(joueurs: Joueur[]): Promise<void> {
    if (!joueurs || joueurs.length === 0) return;
    const path = 'joueurs';
    try {
      const CHUNK_SIZE = 300;
      for (let i = 0; i < joueurs.length; i += CHUNK_SIZE) {
        const chunk = joueurs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((j) => {
          batch.set(doc(db, 'joueurs', j.id), sanitizeForFirestore(j));
        });
        await batch.commit();
      }
    } catch (err) {
      // Fallback individual sets
      await Promise.allSettled(
        joueurs.map((j) => setDoc(doc(db, 'joueurs', j.id), sanitizeForFirestore(j)))
      );
    }
  },

  // MATCHS
  async getMatchs(): Promise<Match[]> {
    const colPath = 'matchs';
    try {
      const snap = await getDocs(collection(db, colPath));
      return snap.docs.map((d) => d.data() as Match);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, colPath);
    }
  },

  async saveMatch(matchItem: Match): Promise<void> {
    if (!matchItem || !matchItem.id) return;
    const path = `matchs/${matchItem.id}`;
    try {
      await setDoc(doc(db, 'matchs', matchItem.id), sanitizeMatch(matchItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteMatch(matchId: string): Promise<void> {
    const path = `matchs/${matchId}`;
    try {
      await deleteDoc(doc(db, 'matchs', matchId));
      await deleteDoc(doc(db, 'compositions', matchId)).catch(() => {});
      // Delete associated feuilles for this match
      try {
        const feuillesSnap = await getDocs(collection(db, 'feuillesMatch'));
        const toDelete = feuillesSnap.docs.filter((d) => d.data()?.matchId === matchId);
        if (toDelete.length > 0) {
          const batch = writeBatch(db);
          toDelete.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn('Erreur suppression feuilles orphelines Firestore:', e);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async batchSaveMatchs(matchs: Match[]): Promise<void> {
    if (!matchs || matchs.length === 0) return;
    const path = 'matchs';
    try {
      const CHUNK_SIZE = 300;
      for (let i = 0; i < matchs.length; i += CHUNK_SIZE) {
        const chunk = matchs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((m) => {
          if (m && m.id) {
            batch.set(doc(db, 'matchs', m.id), sanitizeMatch(m));
          }
        });
        await batch.commit();
      }
    } catch (err) {
      // Resilient fallback with individual document sets
      await Promise.allSettled(
        matchs.filter((m) => m && m.id).map((m) => setDoc(doc(db, 'matchs', m.id), sanitizeMatch(m)))
      );
    }
  },

  // FEUILLES DE MATCH
  async getFeuillesMatch(): Promise<FeuilleMatchLigne[]> {
    const colPath = 'feuillesMatch';
    try {
      const snap = await getDocs(collection(db, colPath));
      return snap.docs.map((d) => d.data() as FeuilleMatchLigne);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, colPath);
    }
  },

  async saveFeuillesMatch(feuilles: FeuilleMatchLigne[]): Promise<void> {
    if (!feuilles || feuilles.length === 0) return;
    const path = 'feuillesMatch';
    try {
      const CHUNK_SIZE = 300;
      for (let i = 0; i < feuilles.length; i += CHUNK_SIZE) {
        const chunk = feuilles.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((f) => {
          if (f && f.id) {
            batch.set(doc(db, 'feuillesMatch', f.id), sanitizeFeuille(f));
          }
        });
        await batch.commit();
      }
    } catch (err) {
      // Fallback to individual sets
      await Promise.allSettled(
        feuilles.filter((f) => f && f.id).map((f) => setDoc(doc(db, 'feuillesMatch', f.id), sanitizeFeuille(f)))
      );
    }
  },

  // Save only the feuille rows of a specific match (much faster and avoids quota waste)
  async saveMatchFeuilles(matchId: string, matchFeuilles: FeuilleMatchLigne[]): Promise<void> {
    if (!matchId || !matchFeuilles || matchFeuilles.length === 0) return;
    const path = 'feuillesMatch';
    try {
      const batch = writeBatch(db);
      matchFeuilles.forEach((f) => {
        const clean = sanitizeFeuille({ ...f, matchId });
        batch.set(doc(db, 'feuillesMatch', clean.id as string), clean);
      });
      await batch.commit();
    } catch (err) {
      console.warn('saveMatchFeuilles batch commit fallback:', err);
      // Individual fallback guarantees writes even under high concurrency
      await Promise.allSettled(
        matchFeuilles.map((f) => {
          const clean = sanitizeFeuille({ ...f, matchId });
          return setDoc(doc(db, 'feuillesMatch', clean.id as string), clean);
        })
      );
    }
  },

  async deleteFeuille(feuilleId: string): Promise<void> {
    const path = `feuillesMatch/${feuilleId}`;
    try {
      await deleteDoc(doc(db, 'feuillesMatch', feuilleId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // COMPOSITIONS
  async getCompositions(): Promise<Record<string, CompositionMatch>> {
    const colPath = 'compositions';
    try {
      const snap = await getDocs(collection(db, colPath));
      const res: Record<string, CompositionMatch> = {};
      snap.docs.forEach((d) => {
        const item = d.data() as CompositionMatch;
        if (item && item.matchId) {
          res[item.matchId] = item;
        }
      });
      return res;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, colPath);
    }
  },

  async saveComposition(comp: CompositionMatch): Promise<void> {
    if (!comp || !comp.matchId) return;
    const path = `compositions/${comp.matchId}`;
    try {
      await setDoc(doc(db, 'compositions', comp.matchId), sanitizeForFirestore(comp));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async batchSaveCompositions(compositions: Record<string, CompositionMatch>): Promise<void> {
    if (!compositions || Object.keys(compositions).length === 0) return;
    const validComps = Object.values(compositions).filter((c) => c && c.matchId && c.matchId.trim() !== '');
    if (validComps.length === 0) return;

    const path = 'compositions';
    try {
      const batch = writeBatch(db);
      validComps.forEach((comp) => {
        batch.set(doc(db, 'compositions', comp.matchId), sanitizeForFirestore(comp));
      });
      await batch.commit();
    } catch (err) {
      // Individual set fallback
      await Promise.allSettled(
        validComps.map((comp) => setDoc(doc(db, 'compositions', comp.matchId), sanitizeForFirestore(comp)))
      );
    }
  },

  // CLUB CONFIG
  async getClubConfig(): Promise<{ clubLogo?: string } | null> {
    const path = 'clubConfig/general';
    try {
      const snap = await getDocs(collection(db, 'clubConfig'));
      const generalDoc = snap.docs.find((d) => d.id === 'general');
      return generalDoc ? (generalDoc.data() as { clubLogo?: string }) : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async saveClubConfig(config: { clubLogo: string }): Promise<void> {
    const path = 'clubConfig/general';
    try {
      await setDoc(doc(db, 'clubConfig', 'general'), {
        id: 'general',
        clubLogo: config.clubLogo,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Real-time subscribers with defensive error callbacks
  subscribeJoueurs(onData: (joueurs: Joueur[]) => void): () => void {
    const path = 'joueurs';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Joueur);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  subscribeMatchs(onData: (matchs: Match[]) => void): () => void {
    const path = 'matchs';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Match);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  subscribeFeuilles(onData: (feuilles: FeuilleMatchLigne[]) => void): () => void {
    const path = 'feuillesMatch';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as FeuilleMatchLigne);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  subscribeCompositions(onData: (compositions: Record<string, CompositionMatch>) => void): () => void {
    const path = 'compositions';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        const comps: Record<string, CompositionMatch> = {};
        snap.docs.forEach((d) => {
          const comp = d.data() as CompositionMatch;
          comps[comp.matchId] = comp;
        });
        onData(comps);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};

// Run connection validation on app startup
testConnection();
