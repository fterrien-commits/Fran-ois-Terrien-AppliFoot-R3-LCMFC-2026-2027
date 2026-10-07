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
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CompositionMatch, FeuilleMatchLigne, Joueur, Match } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId
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
    const path = 'joueurs';
    try {
      const batch = writeBatch(db);
      joueurs.forEach((j) => {
        batch.set(doc(db, 'joueurs', j.id), sanitizeForFirestore(j));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
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
    const path = `matchs/${matchItem.id}`;
    try {
      await setDoc(doc(db, 'matchs', matchItem.id), sanitizeForFirestore(matchItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteMatch(matchId: string): Promise<void> {
    const path = `matchs/${matchId}`;
    try {
      await deleteDoc(doc(db, 'matchs', matchId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async batchSaveMatchs(matchs: Match[]): Promise<void> {
    const path = 'matchs';
    try {
      const batch = writeBatch(db);
      matchs.forEach((m) => {
        batch.set(doc(db, 'matchs', m.id), sanitizeForFirestore(m));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
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
    const path = 'feuillesMatch';
    try {
      const batch = writeBatch(db);
      feuilles.forEach((f) => {
        batch.set(doc(db, 'feuillesMatch', f.id), sanitizeForFirestore(f));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
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
        res[item.matchId] = item;
      });
      return res;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, colPath);
    }
  },

  async saveComposition(comp: CompositionMatch): Promise<void> {
    const path = `compositions/${comp.matchId}`;
    try {
      await setDoc(doc(db, 'compositions', comp.matchId), sanitizeForFirestore(comp));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async batchSaveCompositions(compositions: Record<string, CompositionMatch>): Promise<void> {
    const path = 'compositions';
    try {
      const batch = writeBatch(db);
      Object.values(compositions).forEach((comp) => {
        batch.set(doc(db, 'compositions', comp.matchId), sanitizeForFirestore(comp));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
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
