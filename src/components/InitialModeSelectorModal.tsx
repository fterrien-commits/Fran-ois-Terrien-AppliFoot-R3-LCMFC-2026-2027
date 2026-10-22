import React, { useState } from 'react';
import { Eye, Edit3, Lock, ShieldCheck, Trophy, Calendar, Users, CheckCircle2, ArrowRight } from 'lucide-react';

interface InitialModeSelectorModalProps {
  isOpen: boolean;
  onSelectLecteur: () => void;
  onSelectEditeur: () => void;
}

export const InitialModeSelectorModal: React.FC<InitialModeSelectorModalProps> = ({
  isOpen,
  onSelectLecteur,
  onSelectEditeur,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden p-6 sm:p-8 relative border-t-4 border-t-red-600">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider mb-3">
            Séniors R3 LCMFC
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Bienvenue sur l'Espace d'Équipe
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
            Veuillez sélectionner votre profil d'utilisation pour cette session :
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Option 1: Mode Lecteur (Dirigeants) */}
          <button
            type="button"
            onClick={onSelectLecteur}
            className="group relative bg-slate-950/80 hover:bg-slate-950 border-2 border-slate-800 hover:border-amber-500/60 rounded-2xl p-5 text-left transition-all duration-200 shadow-lg hover:shadow-amber-950/20 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-black text-white text-base group-hover:text-amber-300 transition-colors">
                  Mode Lecteur
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                  Dirigeants
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Consultation libre de toutes les données : Tableau annuel, statistiques complètes, résultats, schémas tactiques et fiches joueurs.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Accès direct sans mot de passe</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Option 2: Mode Éditeur (Entraîneur) */}
          <button
            type="button"
            onClick={onSelectEditeur}
            className="group relative bg-slate-950/80 hover:bg-slate-950 border-2 border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 text-left transition-all duration-200 shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Edit3 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-black text-white text-base group-hover:text-emerald-400 transition-colors">
                  Mode Éditeur
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Coach
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Gestion intégrale : création de nouveaux matchs, modification des compositions tactiques, saisie des notes, buteurs, cartons et effectif.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Nécessite le mot de passe</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-400">
          💡 Vous pourrez changer de mode à tout moment via le bouton dédié dans la barre supérieure.
        </p>
      </div>
    </div>
  );
};
