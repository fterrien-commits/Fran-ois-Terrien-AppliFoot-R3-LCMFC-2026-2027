import React, { useRef, useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  Camera,
  Check,
  Clock,
  Edit2,
  ExternalLink,
  Flame,
  Gauge,
  HelpCircle,
  MapPin,
  Maximize2,
  Minimize2,
  RefreshCw,
  Ruler,
  Scale,
  Search,
  Shield,
  Star,
  Target,
  Trash2,
  Trophy,
  UploadCloud,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  FeuilleMatchLigne,
  Joueur,
  Match,
  PiedFort,
  PosteJoueur,
  POSTES_CONFIG,
  STATUTS_MATCH_CONFIG,
  TYPES_MATCH_CONFIG,
  detectTypeMatch,
  getLigneStatut,
} from '../types';
import { getNoteColor } from '../mockData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { processAndCompressImage } from '../utils/imageUtils';
import { JoueurNotesChart } from './JoueurNotesChart';

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

interface JoueurDetailModalProps {
  joueur: Joueur | null;
  matchs: Match[];
  feuillesMatch: FeuilleMatchLigne[];
  onClose: () => void;
  onOpenMatch?: (match: Match) => void;
  onDeleteJoueur?: (joueurId: string) => void;
  onUpdateJoueur?: (joueur: Joueur) => void;
}

export const JoueurDetailModal: React.FC<JoueurDetailModalProps> = ({
  joueur,
  matchs,
  feuillesMatch,
  onClose,
  onOpenMatch,
  onDeleteJoueur,
  onUpdateJoueur,
}) => {
  // Modal opens in full screen by default as requested
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [matchFilter, setMatchFilter] = useState<'all' | 'titulaire' | 'remplacant' | 'notes'>('all');
  const [matchSearchTerm, setMatchSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    prenom: string;
    nom: string;
    surnom: string;
    poste: PosteJoueur;
    numero: number;
    piedFort: PiedFort;
    age: number | '';
    taille: number | '';
    poids: number | '';
    vma: number | '';
  }>({
    prenom: '',
    nom: '',
    surnom: '',
    poste: 'MC',
    numero: 10,
    piedFort: 'Droitier',
    age: '',
    taille: '',
    poids: '',
    vma: '',
  });

  if (!joueur) return null;

  const handleStartEdit = () => {
    setEditForm({
      prenom: joueur.prenom,
      nom: joueur.nom,
      surnom: joueur.surnom || '',
      poste: joueur.poste,
      numero: joueur.numero,
      piedFort: joueur.piedFort || 'Droitier',
      age: joueur.age !== undefined && joueur.age !== null ? joueur.age : '',
      taille: joueur.taille !== undefined && joueur.taille !== null ? joueur.taille : '',
      poids: joueur.poids !== undefined && joueur.poids !== null ? joueur.poids : '',
      vma: joueur.vma !== undefined && joueur.vma !== null ? joueur.vma : '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateJoueur || !editForm.prenom.trim() || !editForm.nom.trim()) return;

    onUpdateJoueur({
      ...joueur,
      prenom: editForm.prenom.trim(),
      nom: editForm.nom.trim(),
      surnom: editForm.surnom.trim() || undefined,
      poste: editForm.poste,
      numero: Number(editForm.numero) || 1,
      piedFort: editForm.piedFort,
      age: editForm.age !== '' ? Number(editForm.age) : undefined,
      taille: editForm.taille !== '' ? Number(editForm.taille) : undefined,
      poids: editForm.poids !== '' ? Number(editForm.poids) : undefined,
      vma: editForm.vma !== '' ? Number(editForm.vma) : undefined,
    });
    setIsEditingProfile(false);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpdateJoueur) {
      const file = e.target.files[0];
      try {
        setIsUploadingPhoto(true);
        const dataUrl = await processAndCompressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.85,
        });
        onUpdateJoueur({
          ...joueur,
          photo: dataUrl,
        });
      } catch (err) {
        console.error('Erreur changement photo:', err);
      } finally {
        setIsUploadingPhoto(false);
        e.target.value = '';
      }
    }
  };

  const config = POSTES_CONFIG[joueur.poste];

  // Matchs comptabilisés : terminés, validés, ou avec statistiques
  const matchIdsComptabilises = new Set(
    matchs
      .filter((m) => {
        const hasFeuilleEvents = feuillesMatch.some(
          (f) =>
            f.matchId === m.id &&
            ((f.minutesJouees && f.minutesJouees > 0) ||
              (f.buts && f.buts > 0) ||
              (f.passesDecisives && f.passesDecisives > 0) ||
              (f.cartonsJaunes && f.cartonsJaunes > 0) ||
              (f.cartonsRouges && f.cartonsRouges > 0) ||
              (f.note !== null && f.note !== undefined))
        );
        return m.statut === 'termine' || m.valide || hasFeuilleEvents || m.scoreEquipe > 0 || m.scoreAdverse > 0;
      })
      .map((m) => m.id)
  );

  const playerFeuilles = feuillesMatch
    .filter((f) => f.joueurId === joueur.id && matchIdsComptabilises.has(f.matchId))
    .sort((a, b) => {
      const mA = matchs.find((m) => m.id === a.matchId);
      const mB = matchs.find((m) => m.id === b.matchId);
      return (mB?.date || '').localeCompare(mA?.date || '');
    });

  // Aggregated calculations
  const totalMinutes = playerFeuilles.reduce((acc, f) => acc + (f.minutesJouees || 0), 0);
  const totalButs = playerFeuilles.reduce((acc, f) => acc + (f.buts || 0), 0);
  const totalPasses = playerFeuilles.reduce((acc, f) => acc + (f.passesDecisives || 0), 0);
  const totalJaunes = playerFeuilles.reduce((acc, f) => acc + (f.cartonsJaunes || 0), 0);
  const totalRouges = playerFeuilles.reduce((acc, f) => acc + (f.cartonsRouges || 0), 0);

  const notesValides = playerFeuilles
    .map((f) => f.note)
    .filter((n): n is number => n !== null && n !== undefined);
  const moyenneNotes =
    notesValides.length > 0 ? notesValides.reduce((a, b) => a + b, 0) / notesValides.length : null;

  const minNote = notesValides.length > 0 ? Math.min(...notesValides) : null;
  const maxNote = notesValides.length > 0 ? Math.max(...notesValides) : null;

  const nbMatchsJoues = playerFeuilles.filter(
    (f) => f.titulaire || f.statut === 'remplacant' || (f.minutesJouees && f.minutesJouees > 0)
  ).length;
  const nbTitulaire = playerFeuilles.filter((f) => f.titulaire).length;
  const nbRemplacant = playerFeuilles.filter(
    (f) => !f.titulaire && (f.statut === 'remplacant' || (f.minutesJouees && f.minutesJouees > 0))
  ).length;

  const denom = nbMatchsJoues > 0 ? nbMatchsJoues : 1;
  const moyButs = nbMatchsJoues > 0 ? (totalButs / denom).toFixed(2) : '0.00';
  const moyPasses = nbMatchsJoues > 0 ? (totalPasses / denom).toFixed(2) : '0.00';
  const moyCartons = nbMatchsJoues > 0 ? ((totalJaunes + totalRouges) / denom).toFixed(2) : '0.00';
  const moyMin = nbMatchsJoues > 0 ? Math.round(totalMinutes / denom) : 0;
  const minPerGoal = totalButs > 0 ? Math.round(totalMinutes / totalButs) : null;
  const titularisationPct = nbMatchsJoues > 0 ? Math.round((nbTitulaire / nbMatchsJoues) * 100) : 0;

  const matchsMap = new Map(matchs.map((m) => [m.id, m]));

  const handleDeleteConfirm = () => {
    if (onDeleteJoueur && joueur) {
      onDeleteJoueur(joueur.id);
      onClose();
    }
  };

  // IMC Calculation
  const imc =
    joueur.taille && joueur.poids
      ? (joueur.poids / Math.pow(joueur.taille / 100, 2)).toFixed(1)
      : null;

  // VMA Tier descriptor
  const getVmaTier = (vma: number) => {
    if (vma >= 18.0) return { label: 'Élite / Aérobie Exceptionnelle', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (vma >= 17.0) return { label: 'Très Haute Intensité', color: 'text-teal-300 bg-teal-500/10 border-teal-500/30' };
    if (vma >= 16.0) return { label: 'Bonne Endurance', color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' };
    return { label: 'Base / Reprise', color: 'text-slate-300 bg-slate-800 border-slate-700' };
  };

  // Filtered match sheets for the bottom table
  const filteredPlayerFeuilles = playerFeuilles.filter((f) => {
    const match = matchsMap.get(f.matchId);
    if (!match) return false;

    if (matchFilter === 'titulaire' && !f.titulaire) return false;
    if (matchFilter === 'remplacant' && f.titulaire) return false;
    if (matchFilter === 'notes' && (f.note === null || f.note === undefined)) return false;

    if (matchSearchTerm) {
      const q = matchSearchTerm.toLowerCase();
      const matchAdv = match.adversaire.toLowerCase();
      const matchComp = (match.competition || '').toLowerCase();
      const matchLieu = (match.lieu || '').toLowerCase();
      return matchAdv.includes(q) || matchComp.includes(q) || matchLieu.includes(q);
    }

    return true;
  });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-all duration-200 ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullScreen
            ? 'w-screen h-screen max-w-none max-h-none rounded-none'
            : 'w-full max-w-6xl max-h-[94vh] rounded-3xl'
        }`}
      >
        {/* TOP BAR / HEADER (Sticky Full-Width) */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={joueur.photo}
                alt={joueur.nom}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border-2 border-emerald-500 shadow"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-md shadow">
                #{joueur.numero}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                  {joueur.prenom} {joueur.nom}
                </h1>
                {joueur.surnom && (
                  <span className="text-emerald-400 font-bold italic text-xs hidden sm:inline">
                    « {joueur.surnom} »
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${config.color}`}>
                  {joueur.poste} • {config.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Fiche Joueur Officielle · LCMFC Sénior R3 · Saison 2025-2026
              </p>
            </div>
          </div>

          {/* Action buttons (Edit, Delete, Toggle Fullscreen, Close) */}
          <div className="flex items-center gap-2 shrink-0">
            {onUpdateJoueur && (
              <button
                type="button"
                onClick={() => {
                  if (isEditingProfile) {
                    setIsEditingProfile(false);
                  } else {
                    handleStartEdit();
                  }
                }}
                className={`px-3 py-1.5 rounded-xl transition-all border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isEditingProfile
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border-slate-700'
                }`}
                title="Modifier les caractéristiques et informations du joueur"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{isEditingProfile ? 'Fermer édition' : 'Modifier profil'}</span>
              </button>
            )}

            {onDeleteJoueur && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                title="Supprimer ce joueur de l'effectif"
                className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/80 rounded-xl transition-colors border border-rose-500/30 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Toggle Full Screen / Windowed button */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 cursor-pointer"
              title={isFullScreen ? 'Réduire la fenêtre' : 'Afficher en plein écran'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Fermer la fiche joueur (Échap)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE MAIN CONTENT */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* ========================================================= */}
          {/* 1. PARTIE HAUTE DE L'ÉCRAN : INFOS JOUEUR (GAUCHE) & GRAPHIQUE DES NOTES (DROITE) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* PARTIE HAUT ET GAUCHE : INFORMATIONS COMPLÈTES DU JOUEUR */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
                {isEditingProfile ? (
                  /* Formulaire d'édition de profil */
                  <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                        Modifier la fiche joueur
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Prénom *</label>
                        <input
                          type="text"
                          required
                          value={editForm.prenom}
                          onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Nom *</label>
                        <input
                          type="text"
                          required
                          value={editForm.nom}
                          onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="col-span-2">
                        <label className="text-slate-400 block mb-1">Surnom / Alias</label>
                        <input
                          type="text"
                          placeholder="Ex: La Flèche, Tom..."
                          value={editForm.surnom}
                          onChange={(e) => setEditForm({ ...editForm, surnom: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">N° Maillot *</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          required
                          value={editForm.numero}
                          onChange={(e) => setEditForm({ ...editForm, numero: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl font-black text-center focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Poste *</label>
                        <select
                          value={editForm.poste}
                          onChange={(e) => setEditForm({ ...editForm, poste: e.target.value as PosteJoueur })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-emerald-500"
                        >
                          {POSTES_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p} - {POSTES_CONFIG[p].label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Pied fort *</label>
                        <select
                          value={editForm.piedFort}
                          onChange={(e) => setEditForm({ ...editForm, piedFort: e.target.value as PiedFort })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Droitier">👟 Droitier</option>
                          <option value="Gaucher">👟 Gaucher</option>
                          <option value="Ambidextre">👟 Ambidextre</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-800">
                      <div>
                        <label className="text-slate-400 block mb-1">Âge</label>
                        <input
                          type="number"
                          min="14"
                          max="55"
                          placeholder="24"
                          value={editForm.age}
                          onChange={(e) => setEditForm({ ...editForm, age: e.target.value === '' ? '' : parseInt(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1.5 rounded-xl text-center"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Taille cm</label>
                        <input
                          type="number"
                          min="140"
                          max="220"
                          placeholder="182"
                          value={editForm.taille}
                          onChange={(e) => setEditForm({ ...editForm, taille: e.target.value === '' ? '' : parseInt(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1.5 rounded-xl text-center"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Poids kg</label>
                        <input
                          type="number"
                          min="45"
                          max="130"
                          placeholder="75"
                          value={editForm.poids}
                          onChange={(e) => setEditForm({ ...editForm, poids: e.target.value === '' ? '' : parseInt(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1.5 rounded-xl text-center"
                        />
                      </div>
                      <div>
                        <label className="text-emerald-400 font-bold block mb-1">VMA</label>
                        <input
                          type="number"
                          step="0.1"
                          min="10"
                          max="24"
                          placeholder="16.5"
                          value={editForm.vma}
                          onChange={(e) => setEditForm({ ...editForm, vma: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold px-2 py-1.5 rounded-xl text-center"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-colors cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Affichage complet du profil joueur */
                  <div className="space-y-4">
                    {/* Header: Photo + Noms + Numéro */}
                    <div className="flex items-start gap-4">
                      <div className="relative group shrink-0">
                        <img
                          src={joueur.photo}
                          alt={joueur.nom}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-sm px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-md">
                          #{joueur.numero}
                        </span>

                        {onUpdateJoueur && (
                          <>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingPhoto}
                              title="Changer la photo du joueur"
                              className="absolute inset-0 bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              {isUploadingPhoto ? (
                                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                              ) : (
                                <>
                                  <Camera className="w-6 h-6 text-emerald-400 mb-1" />
                                  <span className="text-[10px] font-bold">Modifier</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {joueur.prenom} {joueur.nom}
                          </h2>
                        </div>
                        {joueur.surnom && (
                          <p className="text-emerald-400 font-bold italic text-sm mt-0.5">
                            « {joueur.surnom} »
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-black border shadow-xs ${config.color}`}
                          >
                            {joueur.poste} • {config.label}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            {nbMatchsJoues} match{nbMatchsJoues > 1 ? 's' : ''} disputé{nbMatchsJoues > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grille des caractéristiques physiques & athlétiques */}
                    <div className="pt-2 border-t border-slate-800">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          Profil & Attributs Athlétiques
                        </span>
                        {imc && (
                          <span className="text-[10.5px] text-slate-400 font-medium">
                            IMC : <strong className="text-slate-200">{imc} kg/m²</strong>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {/* Âge */}
                        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Âge
                          </span>
                          <div className="mt-1">
                            <span className="text-base font-black text-white">
                              {joueur.age !== undefined && joueur.age !== null ? `${joueur.age}` : '-'}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">ans</span>
                          </div>
                        </div>

                        {/* Taille */}
                        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                            <Ruler className="w-3 h-3 text-slate-400" />
                            Taille
                          </span>
                          <div className="mt-1">
                            <span className="text-base font-black text-white">
                              {joueur.taille || '-'}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">cm</span>
                          </div>
                        </div>

                        {/* Poids */}
                        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                            <Scale className="w-3 h-3 text-slate-400" />
                            Poids
                          </span>
                          <div className="mt-1">
                            <span className="text-base font-black text-white">
                              {joueur.poids || '-'}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">kg</span>
                          </div>
                        </div>

                        {/* Pied Fort */}
                        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                            <span>👟</span>
                            Pied fort
                          </span>
                          <div className="mt-1">
                            <span className="text-xs font-black text-white truncate">
                              {joueur.piedFort || 'Droitier'}
                            </span>
                          </div>
                        </div>

                        {/* VMA */}
                        <div className="col-span-2 sm:col-span-2 bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 p-2.5 rounded-xl flex flex-col justify-between shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] text-emerald-400 font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Vitesse Maximale Aérobie (VMA)
                            </span>
                            {joueur.vma && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                {getVmaTier(joueur.vma).label}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-emerald-300">
                              {joueur.vma !== undefined && joueur.vma !== null ? joueur.vma.toFixed(1) : '-'}
                            </span>
                            <span className="text-xs text-emerald-400/80 font-medium">km/h</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disciplinary Alert if Yellow Cards accumulated */}
                    {totalJaunes >= 3 ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-950 to-amber-950/70 border-2 border-amber-500/60 shadow-md flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-black text-amber-300">
                              Suspension automatique encourue (Règlement FFF)
                            </h4>
                            <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded text-[10px] font-black">
                              {totalJaunes} Cartons Jaunes
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                            Ce joueur a accumulé 3 avertissements. Il sera suspendu pour 1 match officiel ferme.
                          </p>
                        </div>
                      </div>
                    ) : totalJaunes === 2 ? (
                      <div className="p-2.5 rounded-xl bg-yellow-950/40 border border-yellow-500/40 text-yellow-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                        <span>
                          <strong>Alerte discipline :</strong> 2 cartons jaunes cumulés. Tout nouvel avertissement entraînera une suspension ferme.
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* PARTIE HAUT ET DROITE : LE GRAPHIQUE AVEC LES NOTES */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xs">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        Évolution & Graphique des Notes
                      </h3>
                      <p className="text-xs text-slate-400">
                        Performance individuelle chronologique sur les 10 derniers matchs disputés
                      </p>
                    </div>
                  </div>

                  {moyenneNotes !== null && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-bold">Moyenne :</span>
                      <span className={`text-sm font-black ${getNoteColor(moyenneNotes).text}`}>
                        {moyenneNotes.toFixed(2)}/10
                      </span>
                    </div>
                  )}
                </div>

                {/* Graph Component */}
                <div className="pt-3 flex-1 flex flex-col justify-center">
                  <JoueurNotesChart
                    joueurId={joueur.id}
                    joueurNom={`${joueur.prenom} ${joueur.nom}`}
                    matchs={matchs}
                    feuillesMatch={feuillesMatch}
                    onOpenMatch={(m) => {
                      if (onOpenMatch) {
                        onClose();
                        onOpenMatch(m);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. PARTIE BASSE DE L'ÉCRAN : LES MOYENNES DES DIFFÉRENTES STATS */}
          {/* ========================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-xs">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Moyennes & Performances de la Saison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Statistiques individuelles compilées sur {nbMatchsJoues} match{nbMatchsJoues > 1 ? 's' : ''} joués
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  {nbTitulaire} Titularisation{nbTitulaire > 1 ? 's' : ''} ({titularisationPct}%)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30">
                  {nbRemplacant} Remplacement{nbRemplacant > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Grid des cartes de moyennes & totaux */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              {/* Carte 1 : Moyenne des notes */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Moyenne Notes
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-black ${getNoteColor(moyenneNotes).text}`}>
                      {moyenneNotes !== null ? moyenneNotes.toFixed(2) : '-'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 10</span>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-400 pt-2 border-t border-slate-800/80">
                  {notesValides.length > 0 ? (
                    <span>
                      sur {notesValides.length} noté{notesValides.length > 1 ? 's' : ''} • Min {minNote} / Max {maxNote}
                    </span>
                  ) : (
                    <span>Aucune note attribuée</span>
                  )}
                </div>
              </div>

              {/* Carte 2 : Temps de jeu */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Temps de Jeu
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">{moyMin}</span>
                    <span className="text-xs text-sky-400 font-bold">min / match</span>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Total : <strong className="text-white">{totalMinutes} min</strong></span>
                  <span className="text-slate-500">({nbMatchsJoues} m.)</span>
                </div>
              </div>

              {/* Carte 3 : Buts */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Efficacité Buts
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-amber-300">{moyButs}</span>
                    <span className="text-xs text-amber-400/80 font-bold">but / match</span>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Total : <strong className="text-amber-300">{totalButs} ⚽</strong></span>
                  {minPerGoal && (
                    <span className="text-slate-400 text-[10px]">{minPerGoal}' / but</span>
                  )}
                </div>
              </div>

              {/* Carte 4 : Passes Décisives */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  Passes Décisives
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-blue-300">{moyPasses}</span>
                    <span className="text-xs text-blue-400/80 font-bold">passe / match</span>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Total : <strong className="text-blue-300">{totalPasses} 🎯</strong></span>
                  <span className="text-slate-400 text-[10px]">{totalButs + totalPasses} imp.</span>
                </div>
              </div>

              {/* Carte 5 : Discipline (Cartons) */}
              <div
                className={`p-4 rounded-2xl flex flex-col justify-between border shadow-xs ${
                  totalJaunes >= 3
                    ? 'bg-amber-950/40 border-amber-500/60'
                    : totalJaunes === 2
                    ? 'bg-yellow-950/30 border-yellow-500/40'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">🟨 Discipline</span>
                  {totalJaunes >= 3 && (
                    <span className="text-[9.5px] font-black text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/40">
                      Suspendable
                    </span>
                  )}
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">{moyCartons}</span>
                    <span className="text-xs text-slate-400 font-bold">carton / m.</span>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-yellow-400 font-bold">🟨 {totalJaunes}</span>
                  <span className="text-rose-400 font-bold">🟥 {totalRouges}</span>
                  <span className="text-slate-400 text-[10px]">
                    {totalJaunes >= 3 ? '3 CJ FFF' : `${3 - totalJaunes} CJ restant`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. PUIS ENCORE EN DESSOUS : LES NOTES ET STATS POUR CHAQUE MATCH */}
          {/* ========================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Notes & Détail Match par Match
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {filteredPlayerFeuilles.length} match{filteredPlayerFeuilles.length > 1 ? 's' : ''}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Historique chronologique avec temps de jeu, rôle sur le terrain et note individuelle attribuée
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={matchSearchTerm}
                    onChange={(e) => setMatchSearchTerm(e.target.value)}
                    placeholder="Adversaire, lieu..."
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setMatchFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      matchFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFilter('titulaire')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      matchFilter === 'titulaire'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Titulaires
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFilter('remplacant')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      matchFilter === 'remplacant'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Remplaçants
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFilter('notes')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      matchFilter === 'notes'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Notés
                  </button>
                </div>
              </div>
            </div>

            {/* Table match par match */}
            {filteredPlayerFeuilles.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">
                  Aucun match trouvé pour ce filtre
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Modifiez votre filtre ou recherchez un autre adversaire.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-wider text-[10.5px] font-black">
                      <th className="py-3 px-4 min-w-[200px]">Rencontre</th>
                      <th className="py-3 px-3 min-w-[130px]">Compétition</th>
                      <th className="py-3 px-3 text-center min-w-[110px]">Rôle</th>
                      <th className="py-3 px-3 text-center">Temps</th>
                      <th className="py-3 px-3 text-center">Buts</th>
                      <th className="py-3 px-3 text-center">Passes</th>
                      <th className="py-3 px-3 text-center">Cartons</th>
                      <th className="py-3 px-4 text-center min-w-[100px]">Note (/10)</th>
                      <th className="py-3 px-3 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPlayerFeuilles.map((feuille) => {
                      const match = matchsMap.get(feuille.matchId);
                      if (!match) return null;

                      const noteObj = getNoteColor(feuille.note);
                      const statut = getLigneStatut(feuille);
                      const statutCfg = STATUTS_MATCH_CONFIG[statut];
                      const typeMatch = detectTypeMatch(match);
                      const typeCfg = TYPES_MATCH_CONFIG[typeMatch];

                      const isWin = match.scoreEquipe > match.scoreAdverse;
                      const isDraw = match.scoreEquipe === match.scoreAdverse;

                      return (
                        <tr
                          key={feuille.id}
                          onClick={() => {
                            if (onOpenMatch) {
                              onClose();
                              onOpenMatch(match);
                            }
                          }}
                          className="hover:bg-slate-900/80 transition-colors cursor-pointer group"
                        >
                          {/* Match & Date */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  isWin ? 'bg-emerald-400' : isDraw ? 'bg-amber-400' : 'bg-rose-500'
                                }`}
                                title={isWin ? 'Victoire' : isDraw ? 'Match nul' : 'Défaite'}
                              />
                              <div>
                                <div className="font-extrabold text-white text-xs group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                  <span>vs {match.adversaire}</span>
                                  <span className="font-black text-slate-300 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800 text-[11px]">
                                    {match.scoreEquipe} - {match.scoreAdverse}
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{match.date}</span>
                                  <span>•</span>
                                  <span>{match.domicileExterieur === 'domicile' ? 'Dom.' : 'Ext.'}</span>
                                  {match.lieu && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[120px]">{match.lieu}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Compétition */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${typeCfg.badgeClass}`}
                            >
                              <span>{typeCfg.icon}</span>
                              <span className="truncate max-w-[110px]">{typeCfg.shortLabel}</span>
                            </span>
                          </td>

                          {/* Rôle */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-extrabold border ${statutCfg.badgeClass}`}
                            >
                              {statutCfg.icon} {statutCfg.label}
                            </span>
                          </td>

                          {/* Temps */}
                          <td className="py-3 px-3 text-center font-bold text-white">
                            {feuille.minutesJouees > 0 ? `${feuille.minutesJouees}'` : '-'}
                          </td>

                          {/* Buts */}
                          <td className="py-3 px-3 text-center">
                            {feuille.buts > 0 ? (
                              <span className="font-black text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md">
                                {feuille.buts} ⚽
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Passes */}
                          <td className="py-3 px-3 text-center">
                            {feuille.passesDecisives > 0 ? (
                              <span className="font-black text-blue-300 bg-blue-950/60 border border-blue-500/40 px-2 py-0.5 rounded-md">
                                {feuille.passesDecisives} 🎯
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Cartons */}
                          <td className="py-3 px-3 text-center">
                            {feuille.cartonsJaunes > 0 || feuille.cartonsRouges > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                {feuille.cartonsJaunes > 0 && <span>🟨</span>}
                                {feuille.cartonsRouges > 0 && <span>🟥</span>}
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Note */}
                          <td className="py-3 px-4 text-center">
                            {feuille.note !== null && feuille.note !== undefined ? (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black border ${noteObj.bg} ${noteObj.text} ${noteObj.border} shadow-xs`}
                              >
                                {noteObj.label} / 10
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Non noté</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenMatch) {
                                  onClose();
                                  onOpenMatch(match);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all mx-auto cursor-pointer"
                              title="Ouvrir la feuille de ce match"
                            >
                              <span>Voir</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Player */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        title="Supprimer ce joueur de l'effectif"
        message={`Voulez-vous vraiment supprimer définitivement ${joueur.prenom} ${joueur.nom} (#${joueur.numero}) ? Ses statistiques et apparitions sur les feuilles de match seront également supprimées.`}
        confirmText="Supprimer le joueur"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
