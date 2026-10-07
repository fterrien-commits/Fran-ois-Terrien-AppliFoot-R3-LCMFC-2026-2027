import React, { useState } from 'react';
import {
  Calendar,
  ChevronRight,
  Clock,
  CloudSun,
  Flame,
  Home,
  MapPin,
  Plus,
  Shield,
  Star,
  Trophy,
  Trash2,
  CheckSquare,
  Square,
  Check,
  CheckCircle2,
  Camera,
  Users,
  Search,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import {
  CompositionMatch,
  FeuilleMatchLigne,
  Joueur,
  Match,
  MeteoType,
  SystemeTactique,
  TypeMatch,
  TYPES_MATCH_CONFIG,
  TYPES_MATCH_LIST,
  STATUTS_MATCH_CONFIG,
  StatutMatchJoueur,
  POSTES_CONFIG,
  detectTypeMatch,
} from '../types';
import { FORMATION_PRESETS, getNoteColor } from '../mockData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { MatchPhotosManager } from './MatchPhotosManager';

export interface NewMatchJoueurEntry {
  joueurId: string;
  role: StatutMatchJoueur;
  minutes: number;
  buts: number;
  passes: number;
  cartonsJaunes: number;
  cartonsRouges: number;
  note: number | null;
}

interface MatchsListProps {
  matchs: Match[];
  joueurs: Joueur[];
  feuillesMatch: FeuilleMatchLigne[];
  compositions: Record<string, CompositionMatch>;
  onSelectMatch: (match: Match) => void;
  onAddMatch: (
    newMatch: Match,
    customFeuilles?: FeuilleMatchLigne[],
    customComp?: CompositionMatch
  ) => void;
  onDeleteMatch?: (matchId: string) => void;
  onDeleteMatchs?: (matchIds: string[]) => void;
}

const METEO_OPTIONS: MeteoType[] = [
  'Ensoleillé',
  'Nuageux',
  'Pluvieux',
  'Venteux',
  'Froid',
  'Orageux',
];

export const MatchsList: React.FC<MatchsListProps> = ({
  matchs,
  joueurs,
  feuillesMatch,
  compositions,
  onSelectMatch,
  onAddMatch,
  onDeleteMatch,
  onDeleteMatchs,
}) => {
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newMatchTab, setNewMatchTab] = useState<'collectif' | 'individuel'>('collectif');
  const [isConfirmDiscardModalOpen, setIsConfirmDiscardModalOpen] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [playerFilterCategory, setPlayerFilterCategory] = useState<
    'all' | 'titulaires' | 'remplacants' | 'autres'
  >('all');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // Deletion modals state
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState<boolean>(false);

  const [newMatchForm, setNewMatchForm] = useState<Omit<Match, 'id'>>({
    adversaire: '',
    date: new Date().toISOString().split('T')[0],
    heure: '15:00',
    lieu: 'Stade des Noues (Le Cellier)',
    meteo: 'Ensoleillé',
    domicileExterieur: 'domicile',
    scoreEquipe: 0,
    scoreAdverse: 0,
    systemeEquipe: '4-3-3',
    systemeAdverse: '4-4-2',
    typeMatch: 'championnat',
    competition: 'Championnat R3',
    statut: 'termine',
    photos: [],
  });

  // Helper to initialize players state with 11 starters by default
  const buildInitialPlayersState = () => {
    const map: Record<string, NewMatchJoueurEntry> = {};
    joueurs.forEach((j, index) => {
      const isStarter = index < 11;
      map[j.id] = {
        joueurId: j.id,
        role: isStarter ? 'titulaire' : 'remplacant',
        minutes: isStarter ? 90 : 0,
        buts: 0,
        passes: 0,
        cartonsJaunes: 0,
        cartonsRouges: 0,
        note: null,
      };
    });
    return map;
  };

  const [newMatchPlayersState, setNewMatchPlayersState] = useState<
    Record<string, NewMatchJoueurEntry>
  >(() => buildInitialPlayersState());

  const handleOpenAddMatch = () => {
    setNewMatchPlayersState(buildInitialPlayersState());
    setNewMatchTab('collectif');
    setPlayerSearchTerm('');
    setPlayerFilterCategory('all');
    setNewMatchForm({
      adversaire: '',
      date: new Date().toISOString().split('T')[0],
      heure: '15:00',
      lieu: 'Stade des Noues (Le Cellier)',
      meteo: 'Ensoleillé',
      domicileExterieur: 'domicile',
      scoreEquipe: 0,
      scoreAdverse: 0,
      systemeEquipe: '4-3-3',
      systemeAdverse: '4-4-2',
      typeMatch: 'championnat',
      competition: 'Championnat R3',
      statut: 'termine',
      photos: [],
    });
    setIsAddingMatch(true);
  };

  const handleUpdatePlayerEntry = (
    joueurId: string,
    updates: Partial<NewMatchJoueurEntry>
  ) => {
    setNewMatchPlayersState((prev) => {
      const current = prev[joueurId] || {
        joueurId,
        role: 'remplacant',
        minutes: 0,
        buts: 0,
        passes: 0,
        cartonsJaunes: 0,
        cartonsRouges: 0,
        note: null,
      };
      const nextEntry = { ...current, ...updates };
      const nextState = { ...prev, [joueurId]: nextEntry };

      // Synchronisation automatique : Si les buts des joueurs dépassent le score collectif, on ajuste le score de l'équipe
      if (updates.buts !== undefined) {
        const sumGoals = Object.values(nextState).reduce(
          (acc, p) => acc + (p.buts || 0),
          0
        );
        if (sumGoals > newMatchForm.scoreEquipe) {
          setNewMatchForm((f) => ({ ...f, scoreEquipe: sumGoals }));
        }
      }

      return nextState;
    });
  };

  // Helper pour demander confirmation avant d'effacer les informations de saisie
  const handleRequestCloseAddMatch = () => {
    const totalGoals = Object.values(newMatchPlayersState).reduce(
      (acc, p) => acc + (p.buts || 0),
      0
    );
    const totalPasses = Object.values(newMatchPlayersState).reduce(
      (acc, p) => acc + (p.passes || 0),
      0
    );
    const totalCartons = Object.values(newMatchPlayersState).reduce(
      (acc, p) => acc + (p.cartonsJaunes || 0) + (p.cartonsRouges || 0),
      0
    );
    const hasNotes = Object.values(newMatchPlayersState).some((p) => p.note !== null);

    const hasModifications =
      newMatchForm.adversaire.trim() !== '' ||
      newMatchForm.scoreEquipe > 0 ||
      newMatchForm.scoreAdverse > 0 ||
      totalGoals > 0 ||
      totalPasses > 0 ||
      totalCartons > 0 ||
      hasNotes ||
      (newMatchForm.photos && newMatchForm.photos.length > 0);

    if (hasModifications) {
      setIsConfirmDiscardModalOpen(true);
    } else {
      setIsAddingMatch(false);
    }
  };

  // Filter by match type in the list
  const [filtreType, setFiltreType] = useState<TypeMatch | 'tous'>('tous');

  const joueursMap = new Map(joueurs.map((j) => [j.id, j]));

  // Computed player entries array
  const playerEntriesArray = joueurs.map((j) => {
    const entry = newMatchPlayersState[j.id] || {
      joueurId: j.id,
      role: 'non_convoque' as StatutMatchJoueur,
      minutes: 0,
      buts: 0,
      passes: 0,
      cartonsJaunes: 0,
      cartonsRouges: 0,
      note: null,
    };
    return { joueur: j, entry };
  });

  const nbTitulairesCount = playerEntriesArray.filter((p) => p.entry.role === 'titulaire').length;
  const nbRemplacantsCount = playerEntriesArray.filter((p) => p.entry.role === 'remplacant').length;
  const totalButsIndividuels = playerEntriesArray.reduce(
    (acc, p) => acc + (p.entry.buts || 0),
    0
  );
  const totalPassesIndividuelles = playerEntriesArray.reduce(
    (acc, p) => acc + (p.entry.passes || 0),
    0
  );
  const totalJaunesIndividuels = playerEntriesArray.reduce(
    (acc, p) => acc + (p.entry.cartonsJaunes || 0),
    0
  );
  const totalRougesIndividuels = playerEntriesArray.reduce(
    (acc, p) => acc + (p.entry.cartonsRouges || 0),
    0
  );
  const totalNotesCount = playerEntriesArray.filter((p) => p.entry.note !== null).length;

  const toggleSelectMatch = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === matchs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(matchs.map((m) => m.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleConfirmSingleDelete = () => {
    if (matchToDelete && onDeleteMatch) {
      onDeleteMatch(matchToDelete.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(matchToDelete.id);
        return next;
      });
      setMatchToDelete(null);
    }
  };

  const handleConfirmBatchDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    if (onDeleteMatchs) {
      onDeleteMatchs(idsToDelete);
    } else if (onDeleteMatch) {
      idsToDelete.forEach((id) => onDeleteMatch(id));
    }

    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setIsBatchDeleteModalOpen(false);
  };

  const selectedMatches = matchs.filter((m) => selectedIds.has(m.id));

  const handleSubmitNewMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchForm.adversaire.trim()) {
      setNewMatchTab('collectif');
      return;
    }

    const matchId = `m_${Date.now()}`;
    const newMatch: Match = {
      ...newMatchForm,
      id: matchId,
      statut: 'termine',
      valide: true,
      dateValidation: new Date().toISOString(),
      photos: newMatchForm.photos || [],
    };

    // Bootstrap composition based on titular players chosen
    const preset =
      FORMATION_PRESETS[newMatchForm.systemeEquipe] || FORMATION_PRESETS['4-3-3'];
    const starters = playerEntriesArray
      .filter((p) => p.entry.role === 'titulaire')
      .map((p) => p.joueur);

    const initialPositions = preset.roles.map((role, idx) => ({
      joueurId: starters[idx]?.id || '',
      roleLabel: role.roleLabel,
      x: role.x,
      y: role.y,
    }));

    const customComp: CompositionMatch = {
      matchId,
      systeme: newMatchForm.systemeEquipe,
      positions: initialPositions,
    };

    // Bootstrap sheet rows with all entered individual stats
    const customFeuilles: FeuilleMatchLigne[] = playerEntriesArray.map(
      ({ joueur, entry }) => {
        const isActif = entry.role === 'titulaire' || entry.role === 'remplacant';
        return {
          id: `f_${matchId}_${joueur.id}`,
          matchId,
          joueurId: joueur.id,
          titulaire: entry.role === 'titulaire',
          statut: entry.role,
          minutesJouees: isActif ? entry.minutes : 0,
          buts: isActif ? entry.buts : 0,
          passesDecisives: isActif ? entry.passes : 0,
          cartonsJaunes: isActif ? entry.cartonsJaunes : 0,
          cartonsRouges: isActif ? entry.cartonsRouges : 0,
          note: isActif ? entry.note : null,
        };
      }
    );

    onAddMatch(newMatch, customFeuilles, customComp);
    setIsAddingMatch(false);
    onSelectMatch(newMatch);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Add Match Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Matchs de la Saison ({matchs.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Consultez les résultats, feuilles de match et schémas tactiques interactifs avec notes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {matchs.length > 0 && (
            <button
              id="btn-selection-matchs"
              onClick={() => {
                if (isSelectionMode && selectedIds.size === 0) {
                  setIsSelectionMode(false);
                } else {
                  setIsSelectionMode(true);
                }
              }}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border transition-all ${
                isSelectionMode || selectedIds.size > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-750'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isSelectionMode || selectedIds.size > 0 ? 'Mode Sélection' : 'Sélectionner'}</span>
            </button>
          )}

          <button
            id="btn-ajouter-nouveau-match"
            onClick={handleOpenAddMatch}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouveau Match
          </button>
        </div>
      </div>

      {/* Batch Action Toolbar when Selection is active */}
      {(isSelectionMode || selectedIds.size > 0) && (
        <div className="bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {selectedIds.size === matchs.length && matchs.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.size === matchs.length && matchs.length > 0
                  ? 'Tout désélectionner'
                  : `Tout sélectionner (${matchs.length})`}
              </span>
            </button>

            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-supprimer-selection-matchs"
              disabled={selectedIds.size === 0}
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-rose-950/40"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer la sélection ({selectedIds.size})</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {matchs.length === 0 && (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Aucun match enregistré</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5">
            Votre calendrier de saison est vide. Ajoutez un nouveau match pour commencer à préparer votre composition et saisir les statistiques.
          </p>
          <button
            onClick={handleOpenAddMatch}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Créer un premier match
          </button>
        </div>
      )}

      {/* Modal / Form Add Match with Individual & Collective Data */}
      {isAddingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Créer un Nouveau Match & Renseigner les Données
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saisissez les données collectives et individuelles de la rencontre
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestCloseAddMatch}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Banner : Sauvegarde automatique & Agrégation */}
            <div className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-b border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span>
                <strong className="text-white">Sauvegarde automatique & Agrégation :</strong>{' '}
                Chaque donnée individuelle (titulaires, remplaçants, minutes, buts, passes, cartons, notes) et collective (score, système, résultat) sera automatiquement sauvegardée et immédiatement compilée dans le Tableau Annuel & Stats.
              </span>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-slate-950/40">
              <button
                type="button"
                id="btn-creation-tab-collectif"
                onClick={() => setNewMatchTab('collectif')}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  newMatchTab === 'collectif'
                    ? 'border-emerald-400 text-emerald-300 bg-slate-900 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>1. Données Collectives</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-200">
                  {newMatchForm.scoreEquipe}-{newMatchForm.scoreAdverse}
                </span>
              </button>

              <button
                type="button"
                id="btn-creation-tab-individuel"
                onClick={() => setNewMatchTab('individuel')}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  newMatchTab === 'individuel'
                    ? 'border-emerald-400 text-emerald-300 bg-slate-900 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>2. Données Individuelles & Effectif</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span>{nbTitulairesCount} titu</span>
                  <span>•</span>
                  <span>{totalButsIndividuels} ⚽</span>
                  <span>•</span>
                  <span>{totalPassesIndividuelles} 🎯</span>
                </span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitNewMatch} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 text-xs">
              {/* TAB 1: DONNEES COLLECTIVES */}
              {newMatchTab === 'collectif' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                  {/* Type de Match Selector */}
                  <div>
                    <label className="text-slate-300 font-bold block mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Type de match (Compétition) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TYPES_MATCH_LIST.map((typeKey) => {
                        const cfg = TYPES_MATCH_CONFIG[typeKey];
                        const isSelected = (newMatchForm.typeMatch || 'championnat') === typeKey;
                        return (
                          <button
                            key={typeKey}
                            type="button"
                            onClick={() => {
                              setNewMatchForm((prev) => ({
                                ...prev,
                                typeMatch: typeKey,
                                competition: cfg.defaultCompetition,
                              }));
                            }}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                              isSelected
                                ? `${cfg.badgeClass} ring-2 ring-emerald-500 shadow-md`
                                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-lg mb-1">{cfg.icon}</span>
                            <span className="font-extrabold text-[11px] leading-tight">
                              {cfg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Équipe adverse *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: FC Rouen, US Creteil..."
                        value={newMatchForm.adversaire}
                        onChange={(e) =>
                          setNewMatchForm({ ...newMatchForm, adversaire: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">
                        Intitulé / Journée (ex: R3 - J5, 4ème tour...)
                      </label>
                      <input
                        type="text"
                        value={newMatchForm.competition}
                        onChange={(e) =>
                          setNewMatchForm({ ...newMatchForm, competition: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Date</label>
                      <input
                        type="date"
                        value={newMatchForm.date}
                        onChange={(e) =>
                          setNewMatchForm({ ...newMatchForm, date: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Heure du coup d'envoi</label>
                      <input
                        type="time"
                        value={newMatchForm.heure}
                        onChange={(e) =>
                          setNewMatchForm({ ...newMatchForm, heure: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Lieu (Stade / Ville)</label>
                      <input
                        type="text"
                        value={newMatchForm.lieu}
                        onChange={(e) =>
                          setNewMatchForm({ ...newMatchForm, lieu: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Lieu de la rencontre</label>
                      <select
                        value={newMatchForm.domicileExterieur}
                        onChange={(e) =>
                          setNewMatchForm({
                            ...newMatchForm,
                            domicileExterieur: e.target.value as 'domicile' | 'exterieur',
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="domicile">Domicile 🏠</option>
                        <option value="exterieur">Extérieur 🚗</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Système de jeu (Notre équipe)</label>
                      <select
                        value={newMatchForm.systemeEquipe}
                        onChange={(e) =>
                          setNewMatchForm({
                            ...newMatchForm,
                            systemeEquipe: e.target.value as SystemeTactique,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-bold px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {Object.keys(FORMATION_PRESETS).map((f) => (
                          <option key={f} value={f}>
                            {f} ({FORMATION_PRESETS[f as SystemeTactique].label})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Système adverse</label>
                      <input
                        type="text"
                        placeholder="ex: 4-4-2, 3-5-2..."
                        value={newMatchForm.systemeAdverse}
                        onChange={(e) =>
                          setNewMatchForm({ ...newMatchForm, systemeAdverse: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Conditions météo</label>
                      <select
                        value={newMatchForm.meteo}
                        onChange={(e) =>
                          setNewMatchForm({
                            ...newMatchForm,
                            meteo: e.target.value as MeteoType,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {METEO_OPTIONS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 flex items-center justify-between">
                        <span>Score final (Équipe - Adv)</span>
                        {totalButsIndividuels > 0 && (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            ⚽ Synchronisé ({totalButsIndividuels} buts joueurs)
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={newMatchForm.scoreEquipe}
                          onChange={(e) =>
                            setNewMatchForm({
                              ...newMatchForm,
                              scoreEquipe: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16 bg-slate-950 border border-slate-700 text-white font-bold text-center py-2 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-slate-500 font-bold">-</span>
                        <input
                          type="number"
                          min="0"
                          value={newMatchForm.scoreAdverse}
                          onChange={(e) =>
                            setNewMatchForm({
                              ...newMatchForm,
                              scoreAdverse: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16 bg-slate-950 border border-slate-700 text-white font-bold text-center py-2 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photos associated with the match (1 or 2 photos) */}
                  <div className="pt-2 border-t border-slate-800">
                    <MatchPhotosManager
                      photos={newMatchForm.photos || []}
                      maxPhotos={2}
                      onChange={(photos) => setNewMatchForm({ ...newMatchForm, photos })}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: DONNEES INDIVIDUELLES & EFFECTIF */}
              {newMatchTab === 'individuel' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                  {/* Summary Counters Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Titulaires</span>
                      <span className={`text-base font-black ${nbTitulairesCount === 11 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {nbTitulairesCount} / 11
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Remplaçants</span>
                      <span className="text-base font-black text-blue-400">
                        {nbRemplacantsCount}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Buts saisis ⚽</span>
                      <span className="text-base font-black text-amber-400">
                        {totalButsIndividuels}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Passes 🎯</span>
                      <span className="text-base font-black text-sky-400">
                        {totalPassesIndividuelles}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Cartons</span>
                      <span className="text-base font-black text-yellow-400">
                        {totalJaunesIndividuels} 🟨 {totalRougesIndividuels > 0 ? `/ ${totalRougesIndividuels} 🟥` : ''}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Notes saisies ★</span>
                      <span className="text-base font-black text-purple-400">
                        {totalNotesCount}
                      </span>
                    </div>
                  </div>

                  {/* Toolbar & Filters for Player Selection */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Rechercher un joueur..."
                          value={playerSearchTerm}
                          onChange={(e) => setPlayerSearchTerm(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white pl-8 pr-3 py-1.5 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setPlayerFilterCategory('all')}
                          className={`px-2 py-1 rounded text-[11px] font-bold ${
                            playerFilterCategory === 'all'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tous
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlayerFilterCategory('titulaires')}
                          className={`px-2 py-1 rounded text-[11px] font-bold ${
                            playerFilterCategory === 'titulaires'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          Titulaires ({nbTitulairesCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlayerFilterCategory('remplacants')}
                          className={`px-2 py-1 rounded text-[11px] font-bold ${
                            playerFilterCategory === 'remplacants'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-blue-400'
                          }`}
                        >
                          Remplaçants ({nbRemplacantsCount})
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...newMatchPlayersState };
                        joueurs.forEach((j, i) => {
                          const isStarter = i < 11;
                          next[j.id] = {
                            ...(next[j.id] || {
                              joueurId: j.id,
                              buts: 0,
                              passes: 0,
                              cartonsJaunes: 0,
                              cartonsRouges: 0,
                              note: null,
                            }),
                            role: isStarter ? 'titulaire' : 'remplacant',
                            minutes: isStarter ? 90 : 0,
                          };
                        });
                        setNewMatchPlayersState(next);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 transition-colors"
                      title="Réassigner les 11 premiers joueurs en titulaires (90 min)"
                    >
                      Reset 11 Titulaires
                    </button>
                  </div>

                  {/* Player Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Joueur</th>
                          <th className="py-2.5 px-2 text-center min-w-[140px]">Rôle</th>
                          <th className="py-2.5 px-2 text-center">Minutes</th>
                          <th className="py-2.5 px-2 text-center text-amber-400">Buts ⚽</th>
                          <th className="py-2.5 px-2 text-center text-blue-400">Passes 🎯</th>
                          <th className="py-2.5 px-2 text-center text-yellow-400">🟨 CJ</th>
                          <th className="py-2.5 px-2 text-center text-red-400">🟥 CR</th>
                          <th className="py-2.5 px-3 text-center text-emerald-400">Note / 10 ⭐</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {playerEntriesArray
                          .filter(({ joueur, entry }) => {
                            if (playerFilterCategory === 'titulaires') return entry.role === 'titulaire';
                            if (playerFilterCategory === 'remplacants') return entry.role === 'remplacant';
                            if (playerFilterCategory === 'autres')
                              return entry.role !== 'titulaire' && entry.role !== 'remplacant';
                            if (!playerSearchTerm) return true;
                            const term = playerSearchTerm.toLowerCase();
                            return (
                              joueur.nom.toLowerCase().includes(term) ||
                              joueur.prenom.toLowerCase().includes(term) ||
                              (joueur.surnom && joueur.surnom.toLowerCase().includes(term)) ||
                              joueur.poste.toLowerCase().includes(term) ||
                              String(joueur.numero).includes(term)
                            );
                          })
                          .map(({ joueur, entry }) => {
                            const isActif = entry.role === 'titulaire' || entry.role === 'remplacant';
                            const noteColor = getNoteColor(entry.note);

                            return (
                              <tr
                                key={joueur.id}
                                className={`hover:bg-slate-900/60 transition-colors ${
                                  entry.role === 'titulaire'
                                    ? 'bg-emerald-950/15'
                                    : entry.role === 'remplacant'
                                    ? 'bg-blue-950/10'
                                    : 'opacity-70'
                                }`}
                              >
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={joueur.photo}
                                      alt={joueur.nom}
                                      className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div>
                                      <span className="font-bold text-white block truncate max-w-[140px]">
                                        {joueur.prenom} {joueur.nom}
                                      </span>
                                      <span className="text-slate-500 text-[10px]">
                                        #{joueur.numero} • {joueur.poste}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Role Selection */}
                                <td className="py-1.5 px-2 text-center">
                                  <select
                                    value={entry.role}
                                    onChange={(e) => {
                                      const newRole = e.target.value as StatutMatchJoueur;
                                      const isTit = newRole === 'titulaire';
                                      handleUpdatePlayerEntry(joueur.id, {
                                        role: newRole,
                                        minutes: isTit ? (entry.minutes > 0 ? entry.minutes : 90) : entry.minutes,
                                      });
                                    }}
                                    className={`w-full max-w-[140px] px-2 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer outline-none ${
                                      STATUTS_MATCH_CONFIG[entry.role]?.selectClass ||
                                      'bg-slate-900 text-slate-300 border-slate-700'
                                    }`}
                                  >
                                    <option value="titulaire" className="bg-slate-900 text-emerald-400 font-semibold">
                                      🟢 Titulaire
                                    </option>
                                    <option value="remplacant" className="bg-slate-900 text-blue-400 font-semibold">
                                      🔵 Remplaçant
                                    </option>
                                    <option value="blesse" className="bg-slate-900 text-rose-400 font-semibold">
                                      🩹 Blessé
                                    </option>
                                    <option value="absent" className="bg-slate-900 text-slate-300 font-semibold">
                                      ⚪ Absent
                                    </option>
                                    <option value="malade" className="bg-slate-900 text-amber-400 font-semibold">
                                      🤒 Malade
                                    </option>
                                    <option value="suspendu" className="bg-slate-900 text-red-400 font-semibold">
                                      🟥 Suspendu
                                    </option>
                                    <option value="equipe_b" className="bg-slate-900 text-indigo-400 font-semibold">
                                      🅱️ Équipe B
                                    </option>
                                    <option value="equipe_c" className="bg-slate-900 text-purple-400 font-semibold">
                                      🅲 Équipe C
                                    </option>
                                    <option value="non_convoque" className="bg-slate-900 text-zinc-400 font-semibold">
                                      📋 Non convoqué
                                    </option>
                                  </select>
                                </td>

                                {/* Minutes */}
                                <td className="py-1.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    disabled={!isActif}
                                    value={entry.minutes}
                                    onChange={(e) =>
                                      handleUpdatePlayerEntry(joueur.id, {
                                        minutes: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-14 bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-center font-mono text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Buts ⚽ */}
                                <td className="py-1.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    disabled={!isActif}
                                    value={entry.buts}
                                    onChange={(e) =>
                                      handleUpdatePlayerEntry(joueur.id, {
                                        buts: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Passes 🎯 */}
                                <td className="py-1.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    disabled={!isActif}
                                    value={entry.passes}
                                    onChange={(e) =>
                                      handleUpdatePlayerEntry(joueur.id, {
                                        passes: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-blue-300 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Cartons Jaunes 🟨 */}
                                <td className="py-1.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="2"
                                    disabled={!isActif}
                                    value={entry.cartonsJaunes}
                                    onChange={(e) =>
                                      handleUpdatePlayerEntry(joueur.id, {
                                        cartonsJaunes: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-yellow-300 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Cartons Rouges 🟥 */}
                                <td className="py-1.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    disabled={!isActif}
                                    value={entry.cartonsRouges}
                                    onChange={(e) =>
                                      handleUpdatePlayerEntry(joueur.id, {
                                        cartonsRouges: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-red-400 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Note ⭐ / 10 */}
                                <td className="py-1.5 px-3 text-center">
                                  {isActif ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        placeholder="-"
                                        value={entry.note !== null ? entry.note : ''}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                          handleUpdatePlayerEntry(joueur.id, {
                                            note: val,
                                          });
                                        }}
                                        className="w-14 bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-center font-bold text-xs focus:ring-1 focus:ring-emerald-500"
                                      />
                                      {entry.note !== null && (
                                        <span
                                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${noteColor.bg} ${noteColor.text} ${noteColor.border}`}
                                        >
                                          {noteColor.label}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-600 italic">Non aligné</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Form Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800 bg-slate-900">
                <button
                  type="button"
                  onClick={handleRequestCloseAddMatch}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-center cursor-pointer"
                >
                  Annuler
                </button>

                <div className="flex items-center gap-2">
                  {newMatchTab === 'collectif' ? (
                    <button
                      type="button"
                      onClick={() => setNewMatchTab('individuel')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Renseigner l'effectif & stats</span>
                      <span>➔</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNewMatchTab('collectif')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>⬅️ Revoir les données collectives</span>
                    </button>
                  )}

                  <button
                    id="btn-valider-creation-match"
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Créer le match & Enregistrer tout</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal when Discarding New Match creation with entered data */}
      <ConfirmDeleteModal
        isOpen={isConfirmDiscardModalOpen}
        title="Effacer les informations saisies ?"
        message="Êtes-vous sûr de vouloir annuler ? Toutes les données individuelles et collectives renseignées pour ce nouveau match seront effacées et ne seront pas enregistrées."
        confirmText="Effacer et fermer"
        onConfirm={() => {
          setIsConfirmDiscardModalOpen(false);
          setIsAddingMatch(false);
        }}
        onClose={() => setIsConfirmDiscardModalOpen(false)}
      />

      {/* Filter by Match Type toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 pl-2 pr-1 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Compétition :
          </span>

          <button
            type="button"
            id="filtre-type-tous"
            onClick={() => setFiltreType('tous')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filtreType === 'tous'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Tous ({matchs.length})
          </button>

          {TYPES_MATCH_LIST.map((typeKey) => {
            const cfg = TYPES_MATCH_CONFIG[typeKey];
            const count = matchs.filter((m) => detectTypeMatch(m) === typeKey).length;
            const isSelected = filtreType === typeKey;
            return (
              <button
                key={typeKey}
                type="button"
                id={`filtre-type-${typeKey}`}
                onClick={() => setFiltreType(typeKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? `${cfg.badgeClass} ring-2 ring-emerald-500/40 shadow-sm font-extrabold`
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.shortLabel}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {filtreType !== 'tous' && (
          <button
            type="button"
            onClick={() => setFiltreType('tous')}
            className="text-[11px] font-semibold text-slate-400 hover:text-white underline ml-auto"
          >
            Réinitialiser le filtre
          </button>
        )}
      </div>

      {/* Match Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchs
          .filter((m) => filtreType === 'tous' || detectTypeMatch(m) === filtreType)
          .map((match) => {
            const matchType = detectTypeMatch(match);
            const typeCfg = TYPES_MATCH_CONFIG[matchType];
            const isSelected = selectedIds.has(match.id);
            const matchFeuilles = feuillesMatch.filter((f) => f.matchId === match.id);
            const comp = compositions[match.id];

            // Determine outcome
            const isWin = match.scoreEquipe > match.scoreAdverse;
            const isDraw = match.scoreEquipe === match.scoreAdverse;
            const outcomeBadge = isWin
              ? { text: 'Victoire', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
              : isDraw
              ? { text: 'Match Nul', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
              : { text: 'Défaite', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };

            // Scorers in this match
            const buteurs = matchFeuilles
              .filter((f) => f.buts > 0)
              .map((f) => {
                const j = joueursMap.get(f.joueurId);
                return `${j?.nom || 'Joueur'} (${f.buts > 1 ? `${f.buts}⚽` : '⚽'})`;
              });

            // Top rated player in this match
            const notesWithPlayer = matchFeuilles
              .filter((f) => f.note !== null && f.note !== undefined)
              .map((f) => ({ joueur: joueursMap.get(f.joueurId), note: f.note as number }))
              .sort((a, b) => b.note - a.note);

            const hommeDuMatch = notesWithPlayer.length > 0 ? notesWithPlayer[0] : null;

            return (
              <div
                key={match.id}
                onClick={() => {
                  if (isSelectionMode || selectedIds.size > 0) {
                    toggleSelectMatch(match.id);
                  } else {
                    onSelectMatch(match);
                  }
                }}
                className={`border rounded-2xl p-5 shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-2xl ${
                  isSelected
                    ? 'bg-slate-900/95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-950/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-950/20'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Select Checkbox */}
                      {(isSelectionMode || selectedIds.size > 0) && (
                        <button
                          type="button"
                          onClick={(e) => toggleSelectMatch(match.id, e)}
                          className={`p-1 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                          }`}
                          title={isSelected ? 'Désélectionner' : 'Sélectionner'}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Match Type Badge */}
                      <span
                        className={`text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${typeCfg.badgeClass}`}
                      >
                        <span>{typeCfg.icon}</span>
                        <span>{typeCfg.shortLabel}</span>
                      </span>

                      <span className="text-[11px] font-bold text-slate-300">
                        {match.competition}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        {match.domicileExterieur === 'domicile' ? (
                          <>
                            <Home className="w-3 h-3 text-emerald-400" />
                            Domicile
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 text-sky-400" />
                            Extérieur
                          </>
                        )}
                      </span>
                    </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${outcomeBadge.bg}`}
                    >
                      {outcomeBadge.text}
                    </span>

                    {match.valide ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0"
                        title="Informations du match validées et compilées dans le Tableau Annuel & Stats"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline">Validé stats</span>
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0"
                        title="Informations à valider pour compiler dans le Tableau Annuel"
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">À valider</span>
                      </span>
                    )}

                    {onDeleteMatch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMatchToDelete(match);
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                        title="Supprimer ce match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Match Fixture Score */}
                <div className="flex items-center justify-between py-2 gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 px-1 bg-white rounded-md border border-slate-200 flex items-center justify-center shrink-0">
                        <img
                          src="/logo-lcmfc.svg"
                          alt="LCMFC"
                          className="h-3.5 w-auto max-w-[32px] object-contain"
                        />
                      </div>
                      <span className="text-sm font-extrabold text-white block truncate">LCMFC</span>
                    </div>
                    <span className="text-xs text-red-500 font-semibold pl-0.5">
                      {match.systemeEquipe}
                    </span>
                  </div>

                  <div className="px-4 py-1.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xl sm:text-2xl font-black text-white flex items-center gap-2 shadow-inner">
                    <span className={isWin ? 'text-emerald-400' : 'text-white'}>
                      {match.scoreEquipe}
                    </span>
                    <span className="text-slate-600">-</span>
                    <span>{match.scoreAdverse}</span>
                  </div>

                  <div className="flex-1 text-right">
                    <span className="text-sm font-extrabold text-white block truncate">
                      {match.adversaire}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {match.systemeAdverse}
                    </span>
                  </div>
                </div>

                {/* Match context chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {match.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {match.lieu}
                  </span>
                  <span className="flex items-center gap-1">
                    <CloudSun className="w-3.5 h-3.5 text-slate-500" />
                    {match.meteo}
                  </span>
                </div>

                {/* Scorers info if any */}
                {buteurs.length > 0 && (
                  <div className="mt-2 text-xs text-amber-300 flex items-center gap-1.5 truncate">
                    <span>⚽ Buts :</span>
                    <span className="font-semibold text-slate-200">{buteurs.join(', ')}</span>
                  </div>
                )}

                {/* Man of the match if rated */}
                {hommeDuMatch && (
                  <div className="mt-1.5 flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      Meilleure note :{' '}
                      <span className="text-white font-bold">
                        {hommeDuMatch.joueur?.nom}
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        getNoteColor(hommeDuMatch.note).bg
                      } ${getNoteColor(hommeDuMatch.note).text}`}
                    >
                      {hommeDuMatch.note.toFixed(1)} / 10
                    </span>
                  </div>
                )}

                {/* Match Photos Preview (1 or 2 photos) */}
                {match.photos && match.photos.length > 0 && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow">
                    <div
                      className={`grid gap-1 ${
                        match.photos.length === 2 ? 'grid-cols-2 h-24' : 'grid-cols-1 h-28'
                      }`}
                    >
                      {match.photos.slice(0, 2).map((photoUrl, pIdx) => (
                        <div key={pIdx} className="relative w-full h-full overflow-hidden bg-slate-900 group/img">
                          <img
                            src={photoUrl}
                            alt={`Photo ${pIdx + 1} du match`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="px-2.5 py-1 bg-slate-950/95 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Camera className="w-3 h-3" />
                        {match.photos.length} photo{match.photos.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-slate-500">Cliquer pour agrandir</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span>Ouvrir Schéma Tactique & Valider</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-medium text-emerald-400">
                    {typeCfg.shortLabel}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Single Match Deletion */}
      <ConfirmDeleteModal
        isOpen={!!matchToDelete}
        title="Supprimer le match"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le match contre ${matchToDelete?.adversaire} du ${matchToDelete?.date} (Score : ${matchToDelete?.scoreEquipe}-${matchToDelete?.scoreAdverse}) ? Toutes les informations collectives (score, système, photos) et individuelles (notes, buts, passes, cartons, temps de jeu de chaque joueur) seront effacées et retirées du tableau annuel des stats.`}
        confirmText="Supprimer le match"
        onConfirm={handleConfirmSingleDelete}
        onClose={() => setMatchToDelete(null)}
      />

      {/* Confirmation Modal for Multiple Matches Deletion */}
      <ConfirmDeleteModal
        isOpen={isBatchDeleteModalOpen}
        title={`Supprimer ${selectedIds.size} match${selectedIds.size > 1 ? 's' : ''}`}
        message={`Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedIds.size} match(s) de votre saison ? Toutes les données collectives (scores, systèmes, photos) et individuelles associées (buts, passes, cartons, temps de jeu et notes de tous les joueurs) seront définitivement effacées et retirées du tableau annuel des stats.`}
        itemNames={selectedMatches.map((m) => `vs ${m.adversaire} (${m.date}) - Score: ${m.scoreEquipe}-${m.scoreAdverse}`)}
        confirmText={`Supprimer les ${selectedIds.size} matchs`}
        onConfirm={handleConfirmBatchDelete}
        onClose={() => setIsBatchDeleteModalOpen(false)}
      />
    </div>
  );
};
