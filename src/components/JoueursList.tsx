import React, { useState, useMemo } from 'react';
import {
  Edit2,
  Plus,
  Trash2,
  User,
  Users,
  X,
  Star,
  Award,
  Shield,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Search,
  Activity,
  CheckSquare,
  Square,
  Check,
  Link as LinkIcon,
  Globe,
  Zap,
  Gauge,
} from 'lucide-react';
import { FeuilleMatchLigne, Joueur, PiedFort, PosteJoueur, POSTES_CONFIG } from '../types';
import { getNoteColor } from '../mockData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ImageUploadDropzone } from './ImageUploadDropzone';

interface JoueursListProps {
  joueurs: Joueur[];
  feuillesMatch: FeuilleMatchLigne[];
  onAddJoueur: (joueur: Joueur) => void;
  onUpdateJoueur: (joueur: Joueur) => void;
  onDeleteJoueur: (joueurId: string) => void;
  onDeleteJoueurs?: (joueurIds: string[]) => void;
  onSelectJoueur?: (joueur: Joueur) => void;
}

const POSTES_OPTIONS: PosteJoueur[] = [
  'G',
  'DC',
  'DD',
  'DG',
  'MDC',
  'MC',
  'MO',
  'AD',
  'AG',
  'BU',
];

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
];

export const JoueursList: React.FC<JoueursListProps> = ({
  joueurs,
  feuillesMatch,
  onAddJoueur,
  onUpdateJoueur,
  onDeleteJoueur,
  onDeleteJoueurs,
  onSelectJoueur,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJoueur, setEditingJoueur] = useState<Joueur | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // Deletion modals state
  const [playerToDelete, setPlayerToDelete] = useState<Joueur | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState<boolean>(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'suspendus' | 'avertis' | 'G' | 'D' | 'M' | 'A'
  >('all');

  // Compute aggregated player stats & yellow cards accumulation
  const statsParJoueur = useMemo(() => {
    const map = new Map<
      string,
      {
        totalButs: number;
        totalPasses: number;
        totalMin: number;
        totalCartonsJaunes: number;
        totalCartonsRouges: number;
        moyenneNote: number | null;
        isSuspenduCJ: boolean;
        isWarningCJ: boolean;
      }
    >();

    for (const j of joueurs) {
      const jFeuilles = feuillesMatch.filter((f) => f.joueurId === j.id);
      const totalButs = jFeuilles.reduce((acc, f) => acc + (f.buts || 0), 0);
      const totalPasses = jFeuilles.reduce((acc, f) => acc + (f.passesDecisives || 0), 0);
      const totalMin = jFeuilles.reduce((acc, f) => acc + (f.minutesJouees || 0), 0);
      const totalCartonsJaunes = jFeuilles.reduce((acc, f) => acc + (f.cartonsJaunes || 0), 0);
      const totalCartonsRouges = jFeuilles.reduce((acc, f) => acc + (f.cartonsRouges || 0), 0);

      const notes = jFeuilles
        .map((f) => f.note)
        .filter((n): n is number => n !== null && n !== undefined);
      const moyenneNote =
        notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null;

      map.set(j.id, {
        totalButs,
        totalPasses,
        totalMin,
        totalCartonsJaunes,
        totalCartonsRouges,
        moyenneNote,
        isSuspenduCJ: totalCartonsJaunes >= 3,
        isWarningCJ: totalCartonsJaunes === 2,
      });
    }

    return map;
  }, [joueurs, feuillesMatch]);

  const joueursSuspensibles = useMemo(() => {
    return joueurs
      .filter((j) => {
        const s = statsParJoueur.get(j.id);
        return s && s.isSuspenduCJ;
      })
      .map((j) => ({
        joueur: j,
        stats: statsParJoueur.get(j.id)!,
      }));
  }, [joueurs, statsParJoueur]);

  const joueursAvertis = useMemo(() => {
    return joueurs
      .filter((j) => {
        const s = statsParJoueur.get(j.id);
        return s && s.isWarningCJ;
      })
      .map((j) => ({
        joueur: j,
        stats: statsParJoueur.get(j.id)!,
      }));
  }, [joueurs, statsParJoueur]);

  const filteredJoueurs = useMemo(() => {
    return joueurs.filter((j) => {
      const stats = statsParJoueur.get(j.id);
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const match =
          j.nom.toLowerCase().includes(q) ||
          j.prenom.toLowerCase().includes(q) ||
          (j.surnom && j.surnom.toLowerCase().includes(q)) ||
          j.numero.toString().includes(q) ||
          j.poste.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filterMode === 'suspendus') {
        return stats?.isSuspenduCJ;
      }
      if (filterMode === 'avertis') {
        return stats?.isWarningCJ;
      }
      if (filterMode === 'G') {
        return j.poste === 'G';
      }
      if (filterMode === 'D') {
        return ['DC', 'DD', 'DG'].includes(j.poste);
      }
      if (filterMode === 'M') {
        return ['MDC', 'MC', 'MO'].includes(j.poste);
      }
      if (filterMode === 'A') {
        return ['AD', 'AG', 'BU'].includes(j.poste);
      }
      return true;
    });
  }, [joueurs, statsParJoueur, searchTerm, filterMode]);

  const [formData, setFormData] = useState<{
    nom: string;
    prenom: string;
    surnom: string;
    poste: PosteJoueur;
    numero: number;
    photo: string;
    age: number | '';
    taille: number | '';
    poids: number | '';
    piedFort: PiedFort;
    vma: number | '';
  }>({
    nom: '',
    prenom: '',
    surnom: '',
    poste: 'MC',
    numero: 10,
    photo: DEFAULT_AVATARS[0],
    age: '',
    taille: '',
    poids: '',
    piedFort: 'Droitier',
    vma: '',
  });

  const toggleSelectJoueur = (id: string, e?: React.MouseEvent) => {
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
    if (selectedIds.size === joueurs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(joueurs.map((j) => j.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleConfirmSingleDelete = () => {
    if (playerToDelete) {
      onDeleteJoueur(playerToDelete.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(playerToDelete.id);
        return next;
      });
      setPlayerToDelete(null);
    }
  };

  const handleConfirmBatchDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    if (onDeleteJoueurs) {
      onDeleteJoueurs(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteJoueur(id));
    }

    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setIsBatchDeleteModalOpen(false);
  };

  const selectedPlayers = joueurs.filter((j) => selectedIds.has(j.id));

  const handleOpenAdd = () => {
    setEditingJoueur(null);
    setFormData({
      nom: '',
      prenom: '',
      surnom: '',
      poste: 'MC',
      numero: Math.max(1, ...joueurs.map((j) => j.numero)) + 1,
      photo: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
      age: '',
      taille: '',
      poids: '',
      piedFort: 'Droitier',
      vma: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (joueur: Joueur, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJoueur(joueur);
    setFormData({
      nom: joueur.nom,
      prenom: joueur.prenom,
      surnom: joueur.surnom || '',
      poste: joueur.poste,
      numero: joueur.numero,
      photo: joueur.photo,
      age: joueur.age !== undefined && joueur.age !== null ? joueur.age : '',
      taille: joueur.taille !== undefined && joueur.taille !== null ? joueur.taille : '',
      poids: joueur.poids !== undefined && joueur.poids !== null ? joueur.poids : '',
      piedFort: joueur.piedFort || 'Droitier',
      vma: joueur.vma !== undefined && joueur.vma !== null ? joueur.vma : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim()) return;

    const payload: Omit<Joueur, 'id'> = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      surnom: formData.surnom.trim() || undefined,
      poste: formData.poste,
      numero: Number(formData.numero) || 1,
      photo: formData.photo,
      age: formData.age !== '' ? Number(formData.age) : undefined,
      taille: formData.taille !== '' ? Number(formData.taille) : undefined,
      poids: formData.poids !== '' ? Number(formData.poids) : undefined,
      piedFort: formData.piedFort,
      vma: formData.vma !== '' ? Number(formData.vma) : undefined,
    };

    if (editingJoueur) {
      onUpdateJoueur({
        ...editingJoueur,
        ...payload,
      });
    } else {
      onAddJoueur({
        id: `j_${Date.now()}`,
        ...payload,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Effectif de l'Équipe ({joueurs.length} Joueurs)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gérez la liste de vos joueurs, leurs postes de prédilection, numéros de maillot et photos
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {joueurs.length > 0 && (
            <button
              id="btn-selection-joueurs"
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
            id="btn-ajouter-nouveau-joueur"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Joueur
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
              {selectedIds.size === joueurs.length && joueurs.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.size === joueurs.length && joueurs.length > 0
                  ? 'Tout désélectionner'
                  : `Tout sélectionner (${joueurs.length})`}
              </span>
            </button>

            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-supprimer-selection-joueurs"
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

      {/* Disciplinary Alert Banner: Automatic Alert for Players with 3 Yellow Cards */}
      {joueursSuspensibles.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-amber-300 tracking-tight flex items-center gap-1.5">
                  Alerte Discipline : {joueursSuspensibles.length} Joueur{joueursSuspensibles.length > 1 ? 's' : ''} sous le coup d'une suspension
                </h3>
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                  3 Cartons Jaunes Cumulés
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Règlement sportif officiel (FFF) : tout joueur ayant accumulé <strong>3 cartons jaunes</strong> encourt une suspension automatique pour la prochaine rencontre officielle. Veillez à anticiper votre composition d'équipe.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {joueursSuspensibles.map(({ joueur: j, stats }) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => onSelectJoueur && onSelectJoueur(j)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-sm"
                    title="Cliquer pour afficher la fiche détaillée du joueur"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <img
                      src={j.photo}
                      alt={j.nom}
                      className="w-5 h-5 rounded-full object-cover border border-amber-400"
                    />
                    <span>
                      {j.prenom} {j.nom} (#{j.numero})
                    </span>
                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black text-[10px]">
                      {stats.totalCartonsJaunes} CJ
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode(filterMode === 'suspendus' ? 'all' : 'suspendus')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                filterMode === 'suspendus'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>
                {filterMode === 'suspendus' ? 'Afficher tout l’effectif' : 'Voir uniquement les suspendus'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      {joueurs.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher joueur, poste, numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              Tous ({joueurs.length})
            </button>

            {joueursSuspensibles.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('suspendus')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  filterMode === 'suspendus'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspendus (3 CJ) ({joueursSuspensibles.length})</span>
              </button>
            )}

            {joueursAvertis.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('avertis')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  filterMode === 'avertis'
                    ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow'
                    : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25'
                }`}
              >
                <span>À surveiller (2 CJ) ({joueursAvertis.length})</span>
              </button>
            )}

            <span className="w-px h-5 bg-slate-800 mx-1 hidden sm:inline-block" />

            {(
              [
                { id: 'G', label: 'Gardiens' },
                { id: 'D', label: 'Défenseurs' },
                { id: 'M', label: 'Milieux' },
                { id: 'A', label: 'Attaquants' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterMode(cat.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  filterMode === cat.id
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {joueurs.length === 0 && (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Aucun joueur dans l'effectif</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5">
            L'effectif est vide. Ajoutez vos premiers joueurs pour pouvoir composer vos matchs et suivre leurs statistiques.
          </p>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Créer un premier joueur
          </button>
        </div>
      )}

      {/* Empty Filter State */}
      {joueurs.length > 0 && filteredJoueurs.length === 0 && (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Aucun joueur trouvé</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Aucun joueur ne correspond aux filtres ou à la recherche en cours.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilterMode('all');
            }}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredJoueurs.map((joueur) => {
          const isSelected = selectedIds.has(joueur.id);
          const config = POSTES_CONFIG[joueur.poste];
          const stats = statsParJoueur.get(joueur.id) || {
            totalButs: 0,
            totalPasses: 0,
            totalMin: 0,
            totalCartonsJaunes: 0,
            totalCartonsRouges: 0,
            moyenneNote: null,
            isSuspenduCJ: false,
            isWarningCJ: false,
          };
          const noteObj = getNoteColor(stats.moyenneNote);

          return (
            <div
              key={joueur.id}
              onClick={() => {
                if (isSelectionMode || selectedIds.size > 0) {
                  toggleSelectJoueur(joueur.id);
                } else if (onSelectJoueur) {
                  onSelectJoueur(joueur);
                }
              }}
              className={`border rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group relative ${
                isSelected
                  ? 'bg-slate-900/95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-950/20'
                  : stats.isSuspenduCJ
                  ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/70 ring-2 ring-amber-500/40 shadow-amber-950/40'
                  : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              <div>
                {/* Suspension Alert Banner if 3+ Yellow Cards */}
                {stats.isSuspenduCJ && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 flex items-center justify-between text-xs font-bold shadow-sm">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span className="text-amber-300 font-extrabold truncate">Suspension potentielle</span>
                    </span>
                    <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black shrink-0">
                      {stats.totalCartonsJaunes} CJ cumulés
                    </span>
                  </div>
                )}

                {/* Top card: Selection checkbox + Photo + Number + Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {/* Select Checkbox */}
                    {(isSelectionMode || selectedIds.size > 0) && (
                      <button
                        type="button"
                        onClick={(e) => toggleSelectJoueur(joueur.id, e)}
                        className={`mt-1 p-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                        title={isSelected ? 'Désélectionner' : 'Sélectionner'}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Square className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <div className="relative">
                      <img
                        src={joueur.photo}
                        alt={joueur.nom}
                        className={`w-16 h-16 rounded-2xl object-cover border-2 transition-colors shadow-md ${
                          stats.isSuspenduCJ
                            ? 'border-amber-500 group-hover:border-amber-400'
                            : 'border-slate-700 group-hover:border-emerald-500'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg shadow border border-emerald-300">
                        #{joueur.numero}
                      </span>
                      {stats.isSuspenduCJ && (
                        <span
                          className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 rounded-full p-1 shadow border border-amber-300 z-10 animate-pulse"
                          title={`Alerte : ${stats.totalCartonsJaunes} cartons jaunes cumulés - Risque de suspension pour le prochain match`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleOpenEdit(joueur, e)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Modifier les infos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayerToDelete(joueur);
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20 cursor-pointer"
                      title="Supprimer ce joueur"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Identity & Position */}
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-white text-base leading-tight group-hover:text-emerald-400 transition-colors">
                      {joueur.prenom} {joueur.nom}
                    </h3>
                    {joueur.surnom && (
                      <span className="text-emerald-400 font-semibold italic text-xs">
                        « {joueur.surnom} »
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${config.color}`}
                    >
                      {joueur.poste} • {config.label}
                    </span>
                    {joueur.age !== undefined && (
                      <span className="text-[11px] text-slate-400">
                        {joueur.age} ans
                      </span>
                    )}
                  </div>

                  {/* Disciplinary Warning Tag if 2 or 3 CJ */}
                  {stats.isSuspenduCJ && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Suspendable (3 CJ FFF)</span>
                    </div>
                  )}
                  {stats.isWarningCJ && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0" />
                      <span>Attention : 2 CJ (1 avant suspension)</span>
                    </div>
                  )}

                  {/* Profil physique & VMA */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                    {joueur.piedFort && (
                      <span className="bg-slate-950/80 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-medium">
                        👟 {joueur.piedFort}
                      </span>
                    )}
                    {(joueur.taille || joueur.poids) && (
                      <span className="bg-slate-950/80 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-medium">
                        {[joueur.taille ? `${joueur.taille} cm` : '', joueur.poids ? `${joueur.poids} kg` : ''].filter(Boolean).join(' • ')}
                      </span>
                    )}
                    {joueur.vma !== undefined && (
                      <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>VMA {joueur.vma} km/h</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Season Mini Stats: 4 Columns (Buts, Passes, Cartons avec alerte, Moy. Note) */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-center text-xs">
                  <div className="p-1.5 bg-slate-950/60 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Buts</span>
                    <span className="font-extrabold text-amber-400">
                      {stats.totalButs} ⚽
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/60 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Passes</span>
                    <span className="font-extrabold text-blue-400">
                      {stats.totalPasses} 🎯
                    </span>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg border transition-all ${
                      stats.isSuspenduCJ
                        ? 'bg-amber-950/50 border-amber-500/60 text-amber-300'
                        : stats.isWarningCJ
                        ? 'bg-yellow-950/30 border-yellow-500/30 text-yellow-300'
                        : 'bg-slate-950/60 border-slate-800/40'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-0.5">
                      {stats.isSuspenduCJ && <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                      Cartons
                    </span>
                    <span
                      className={`font-black text-xs ${
                        stats.isSuspenduCJ
                          ? 'text-amber-400 font-extrabold'
                          : stats.isWarningCJ
                          ? 'text-yellow-400 font-extrabold'
                          : 'text-slate-300'
                      }`}
                    >
                      {stats.totalCartonsJaunes > 0 ? `${stats.totalCartonsJaunes} 🟨` : '0'}
                      {stats.totalCartonsRouges > 0 ? ` ${stats.totalCartonsRouges} 🟥` : ''}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/60 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Moy. Note</span>
                    <span className={`font-black text-[11px] ${noteObj.text}`}>
                      {stats.moyenneNote !== null ? stats.moyenneNote.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 text-right">
                {stats.totalMin} minutes jouées
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Single Player Deletion */}
      <ConfirmDeleteModal
        isOpen={!!playerToDelete}
        title="Supprimer le joueur"
        message={`Êtes-vous sûr de vouloir supprimer ${playerToDelete?.prenom} ${playerToDelete?.nom} (#${playerToDelete?.numero}) de l'effectif ? Ses apparitions et notes seront également retirées des feuilles de match.`}
        confirmText="Supprimer le joueur"
        onConfirm={handleConfirmSingleDelete}
        onClose={() => setPlayerToDelete(null)}
      />

      {/* Confirmation Modal for Multiple Players Deletion */}
      <ConfirmDeleteModal
        isOpen={isBatchDeleteModalOpen}
        title={`Supprimer ${selectedIds.size} joueur${selectedIds.size > 1 ? 's' : ''}`}
        message={`Êtes-vous sûr de vouloir supprimer ces ${selectedIds.size} joueur(s) de votre effectif ? Toutes leurs données et statistiques de match seront également supprimées.`}
        itemNames={selectedPlayers.map((j) => `${j.prenom} ${j.nom} (#${j.numero} - ${j.poste})`)}
        confirmText={`Supprimer les ${selectedIds.size} joueurs`}
        onConfirm={handleConfirmBatchDelete}
        onClose={() => setIsBatchDeleteModalOpen(false)}
      />

      {/* Modal Add / Edit Player */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                {editingJoueur ? 'Modifier le Joueur' : 'Ajouter un Nouveau Joueur'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Surnom & Pied Fort */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Surnom / Alias (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: La Flèche, Tom, Le Roc..."
                    value={formData.surnom}
                    onChange={(e) => setFormData({ ...formData, surnom: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Latéralité (Pied fort) *</label>
                  <select
                    value={formData.piedFort}
                    onChange={(e) =>
                      setFormData({ ...formData, piedFort: e.target.value as PiedFort })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Droitier">👟 Droitier</option>
                    <option value="Gaucher">👟 Gaucher</option>
                    <option value="Ambidextre">👟 Ambidextre (Deux pieds)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Poste de prédilection *</label>
                  <select
                    value={formData.poste}
                    onChange={(e) =>
                      setFormData({ ...formData, poste: e.target.value as PosteJoueur })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {POSTES_OPTIONS.map((poste) => (
                      <option key={poste} value={poste}>
                        {poste} - {POSTES_CONFIG[poste].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Numéro de maillot *</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={formData.numero}
                    onChange={(e) =>
                      setFormData({ ...formData, numero: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Bloc Profil Physique & Athlétique (Age, Taille, Poids, VMA) */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Caractéristiques Physiques & VMA</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Âge (ans)</label>
                    <input
                      type="number"
                      min="12"
                      max="60"
                      placeholder="Ex: 24"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value === '' ? '' : parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Taille (cm)</label>
                    <input
                      type="number"
                      min="120"
                      max="225"
                      placeholder="Ex: 182"
                      value={formData.taille}
                      onChange={(e) =>
                        setFormData({ ...formData, taille: e.target.value === '' ? '' : parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Poids (kg)</label>
                    <input
                      type="number"
                      min="35"
                      max="150"
                      placeholder="Ex: 75"
                      value={formData.poids}
                      onChange={(e) =>
                        setFormData({ ...formData, poids: e.target.value === '' ? '' : parseInt(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>VMA (km/h)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="8"
                      max="25"
                      placeholder="Ex: 16.5"
                      value={formData.vma}
                      onChange={(e) =>
                        setFormData({ ...formData, vma: e.target.value === '' ? '' : parseFloat(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-emerald-500/50 text-emerald-300 font-bold px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  * La VMA (Vitesse Maximale Aérobie) sert d'étalon pour le calibrage de l'endurance et des efforts à haute intensité.
                </p>
              </div>

              {/* Photo Upload from Computer & Avatars */}
              <div className="space-y-2">
                <ImageUploadDropzone
                  id="joueur-photo-upload"
                  label="Photo du joueur (depuis l'ordinateur)"
                  sublabel="Glissez-déposez le portrait du joueur ou cliquez pour parcourir"
                  currentImage={formData.photo}
                  onImageChange={(dataUrl) => setFormData({ ...formData, photo: dataUrl })}
                  onImageRemove={() => setFormData({ ...formData, photo: DEFAULT_AVATARS[0] })}
                  shape="round"
                  maxWidth={400}
                  maxHeight={400}
                />

                {/* Optional Alternative: Preset Avatars or URL */}
                <details className="text-xs text-slate-400 group">
                  <summary className="cursor-pointer hover:text-emerald-400 select-none py-1 flex items-center gap-1.5 transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Ou choisir parmi les avatars par défaut / URL web</span>
                  </summary>

                  <div className="pt-2 pl-2 border-l-2 border-slate-800 mt-1 space-y-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.photo.startsWith('data:') ? '' : formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {DEFAULT_AVATARS.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Avatar preset"
                          onClick={() => setFormData({ ...formData, photo: url })}
                          className={`w-9 h-9 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                            formData.photo === url
                              ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  </div>
                </details>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl shadow transition-all"
                >
                  {editingJoueur ? 'Enregistrer' : 'Créer le Joueur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
