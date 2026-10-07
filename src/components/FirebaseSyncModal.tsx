import React, { useState } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  Database,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  X,
  RefreshCw,
  Layers,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onPushToCloud: () => Promise<void>;
  onPullFromCloud: () => Promise<void>;
  counts: {
    joueurs: number;
    matchs: number;
    feuilles: number;
    compositions: number;
  };
  isSyncing: boolean;
  lastSyncTime: string | null;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onPushToCloud,
  onPullFromCloud,
  counts,
  isSyncing,
  lastSyncTime,
}) => {
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await onPushToCloud();
      setActionMessage({
        type: 'success',
        text: 'Toutes les données ont été sauvegardées avec succès dans Firestore Cloud !',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde cloud';
      setActionMessage({
        type: 'error',
        text: msg.includes('permission') || msg.includes('Missing or insufficient')
          ? 'Permission refusée : Veuillez vous connecter avec votre compte Google Coach pour écrire dans Firestore.'
          : msg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePull = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await onPullFromCloud();
      setActionMessage({
        type: 'success',
        text: 'Données rechargées avec succès depuis Firestore Cloud !',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuth = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      if (currentUser) {
        await onLogout();
        setActionMessage({ type: 'success', text: 'Déconnexion effectuée.' });
      } else {
        await onLogin();
        setActionMessage({ type: 'success', text: 'Connexion Google réussie ! Vos modifications sont maintenant synchronisées sur le Cloud.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur d’authentification Google';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Base de données Cloud Firebase
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-normal">
                  Firestore Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sauvegarde permanente et synchronisation temps réel de l'effectif et des matchs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Action notification banner */}
          {actionMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <span className="leading-snug">{actionMessage.text}</span>
            </div>
          )}

          {/* Coach Authentication Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Coach'}
                  className="w-11 h-11 rounded-full border-2 border-red-500 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {currentUser?.displayName || (currentUser ? 'Coach connecté' : 'Session Invité / Consultation')}
                  </span>
                  {currentUser ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Droits Écriture Cloud
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                      Lecture Seule Cloud
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs">
                  {currentUser?.email || 'Connectez-vous avec Google pour enregistrer directement dans Firestore'}
                </p>
              </div>
            </div>

            <button
              onClick={handleAuth}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0 ${
                currentUser
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-red-600 hover:bg-red-500 text-white border border-red-500 font-bold'
              }`}
            >
              {currentUser ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Connexion Coach Google
                </>
              )}
            </button>
          </div>

          {/* Cloud Sync Status & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handlePush}
              disabled={isProcessing}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center gap-3.5 text-left transition-all group cursor-pointer"
            >
              <div className="p-3 bg-red-600/20 group-hover:bg-red-600/30 text-red-400 rounded-xl border border-red-500/30 transition-colors">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                  Sauvegarder vers Firestore
                </span>
                <span className="block text-xs text-slate-400">
                  Pousse joueurs, matchs et compositions vers la base cloud
                </span>
              </div>
            </button>

            <button
              onClick={handlePull}
              disabled={isProcessing}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center gap-3.5 text-left transition-all group cursor-pointer"
            >
              <div className="p-3 bg-sky-600/20 group-hover:bg-sky-600/30 text-sky-400 rounded-xl border border-sky-500/30 transition-colors">
                <CloudDownload className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                  Recharger depuis Firestore
                </span>
                <span className="block text-xs text-slate-400">
                  Récupère l'état le plus récent de la base distante
                </span>
              </div>
            </button>
          </div>

          {/* Counts and Entities in Cloud */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              Entités synchronisées en base
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Joueurs</span>
                <span className="text-xl font-black text-white">{counts.joueurs}</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">/joueurs</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Matchs</span>
                <span className="text-xl font-black text-white">{counts.matchs}</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">/matchs</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Lignes Feuilles</span>
                <span className="text-xl font-black text-white">{counts.feuilles}</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">/feuillesMatch</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Compositions</span>
                <span className="text-xl font-black text-white">{counts.compositions}</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">/compositions</span>
              </div>
            </div>
            {lastSyncTime && (
              <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-slate-400" />
                Dernière synchronisation locale/cloud : {lastSyncTime}
              </p>
            )}
          </div>

          {/* Firestore Schema & Architecture Breakdown */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Architecture & Schéma Cloud provisionné
            </h4>
            <div className="space-y-2 text-xs text-slate-300 font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2">
                <div>
                  <strong className="text-emerald-400">/joueurs/{'{joueurId}'}</strong>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Fiche joueur : nom, prénom, numéro, poste (G, DC, DD, DG, MDC, MC, MO, AD, AG, BU), âge, taille, poids, pied fort, VMA, photo.
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">Entity: Joueur</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2">
                <div>
                  <strong className="text-emerald-400">/matchs/{'{matchId}'}</strong>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Calendrier R3, score, domicile/extérieur, formation, adversaire, météo, photos souvenirs et scouting adverse.
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">Entity: Match</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2">
                <div>
                  <strong className="text-emerald-400">/feuillesMatch/{'{feuilleId}'}</strong>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Statistiques de chaque joueur par match : minutes jouées, buts, passes décisives, cartons, statut et note sur 10.
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">Entity: FeuilleMatchLigne</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2">
                <div>
                  <strong className="text-emerald-400">/compositions/{'{matchId}'}</strong>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Coordonnées tactiques x,y sur le terrain pour les 11 titulaires selon le système sélectionné.
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">Entity: CompositionMatch</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2">
                <div>
                  <strong className="text-emerald-400">/clubConfig/general</strong>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Logo officiel du LCMFC et personnalisations du club synchronisés.
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">Entity: ClubConfig</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-sans space-y-1">
              <p>
                <strong>Projet Cloud :</strong> <span className="font-mono text-slate-300">{firebaseConfig.projectId}</span>
              </p>
              <p>
                <strong>Base Firestore :</strong> <span className="font-mono text-slate-300">{firebaseConfig.firestoreDatabaseId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Enterprise provisionné
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
