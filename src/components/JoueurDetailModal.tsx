import React, { useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  Camera,
  Check,
  Edit2,
  Flame,
  Gauge,
  MapPin,
  RefreshCw,
  Ruler,
  Scale,
  Shield,
  Star,
  Trash2,
  Trophy,
  UploadCloud,
  User,
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
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const playerFeuilles = feuillesMatch.filter(
    (f) => f.joueurId === joueur.id && matchIdsComptabilises.has(f.matchId)
  );

  // Calculations
  const totalMinutes = playerFeuilles.reduce((acc, f) => acc + f.minutesJouees, 0);
  const totalButs = playerFeuilles.reduce((acc, f) => acc + f.buts, 0);
  const totalPasses = playerFeuilles.reduce((acc, f) => acc + f.passesDecisives, 0);
  const totalJaunes = playerFeuilles.reduce((acc, f) => acc + f.cartonsJaunes, 0);
  const totalRouges = playerFeuilles.reduce((acc, f) => acc + f.cartonsRouges, 0);

  const notesValides = playerFeuilles
    .map((f) => f.note)
    .filter((n): n is number => n !== null && n !== undefined);
  const moyenneNotes =
    notesValides.length > 0 ? notesValides.reduce((a, b) => a + b, 0) / notesValides.length : null;

  const nbMatchsJoues = playerFeuilles.filter(
    (f) => f.titulaire || f.statut === 'remplacant' || (f.minutesJouees && f.minutesJouees > 0)
  ).length;
  const denom = nbMatchsJoues > 0 ? nbMatchsJoues : 1;
  const moyButs = nbMatchsJoues > 0 ? (totalButs / denom).toFixed(2) : '0';
  const moyPasses = nbMatchsJoues > 0 ? (totalPasses / denom).toFixed(2) : '0';
  const moyCartons = nbMatchsJoues > 0 ? ((totalJaunes + totalRouges) / denom).toFixed(2) : '0';
  const moyMin = nbMatchsJoues > 0 ? Math.round(totalMinutes / denom) : 0;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={joueur.photo}
                alt={joueur.nom}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow">
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
                    title="Changer la photo depuis l'ordinateur"
                    className="absolute inset-0 bg-slate-950/75 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isUploadingPhoto ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-emerald-400 mb-0.5" />
                        <span className="text-[10px] font-bold">Modifier</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">
                  {joueur.prenom} {joueur.nom}
                </h2>
                {joueur.surnom && (
                  <span className="text-emerald-400 font-bold italic text-sm">
                    « {joueur.surnom} »
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border ${config.color}`}
                >
                  {joueur.poste} • {config.label}
                </span>
                <span className="text-xs text-slate-400">
                  {playerFeuilles.length} apparition{playerFeuilles.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onUpdateJoueur && (
              <button
                onClick={() => {
                  if (isEditingProfile) {
                    setIsEditingProfile(false);
                  } else {
                    handleStartEdit();
                  }
                }}
                className={`p-2 rounded-xl transition-colors border text-xs font-bold flex items-center gap-1.5 ${
                  isEditingProfile
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border-slate-700'
                }`}
                title="Modifier les caractéristiques du joueur"
              >
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">{isEditingProfile ? 'Fermer' : 'Modifier'}</span>
              </button>
            )}

            {onDeleteJoueur && (
              <button
                onClick={() => setIsConfirmDeleteOpen(true)}
                title="Supprimer ce joueur de l'effectif"
                className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/80 rounded-xl transition-colors border border-rose-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* In-Modal Profile Editor */}
        {isEditingProfile ? (
          <form onSubmit={handleSaveEdit} className="p-6 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-3.5 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                Modifier le profil du joueur
              </span>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Annuler
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Surnom / Alias</label>
                <input
                  type="text"
                  placeholder="Ex: La Flèche, Tom..."
                  value={editForm.surnom}
                  onChange={(e) => setEditForm({ ...editForm, surnom: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Poste *</label>
                <select
                  value={editForm.poste}
                  onChange={(e) => setEditForm({ ...editForm, poste: e.target.value as PosteJoueur })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                >
                  {POSTES_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p} - {POSTES_CONFIG[p].label}
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
                  value={editForm.numero}
                  onChange={(e) => setEditForm({ ...editForm, numero: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Pied fort (latéralité) *</label>
                <select
                  value={editForm.piedFort}
                  onChange={(e) => setEditForm({ ...editForm, piedFort: e.target.value as PiedFort })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Droitier">👟 Droitier</option>
                  <option value="Gaucher">👟 Gaucher</option>
                  <option value="Ambidextre">👟 Ambidextre</option>
                </select>
              </div>
            </div>

            {/* Age, Taille, Poids, VMA */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Âge (ans)</label>
                <input
                  type="number"
                  min="12"
                  max="60"
                  placeholder="Ex: 24"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Taille (cm)</label>
                <input
                  type="number"
                  min="120"
                  max="225"
                  placeholder="Ex: 182"
                  value={editForm.taille}
                  onChange={(e) => setEditForm({ ...editForm, taille: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Poids (kg)</label>
                <input
                  type="number"
                  min="35"
                  max="150"
                  placeholder="Ex: 75"
                  value={editForm.poids}
                  onChange={(e) => setEditForm({ ...editForm, poids: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-emerald-400 font-bold block mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>VMA (km/h)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="8"
                  max="25"
                  placeholder="Ex: 16.5"
                  value={editForm.vma}
                  onChange={(e) => setEditForm({ ...editForm, vma: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition-colors"
              >
                Enregistrer le profil
              </button>
            </div>
          </form>
        ) : (
          /* Profile & Athletic Attributes Showcase Tiles */
          <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Profil & Caractéristiques Athlétiques
              </span>
              {imc && (
                <span className="text-[10px] text-slate-400 lowercase font-normal">
                  IMC : <strong className="text-slate-200">{imc} kg/m²</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Âge */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Âge
                </span>
                <div className="mt-1">
                  <span className="text-lg font-extrabold text-white">
                    {joueur.age !== undefined && joueur.age !== null ? `${joueur.age}` : '-'}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">ans</span>
                </div>
              </div>

              {/* Taille */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-slate-400" />
                  Taille
                </span>
                <div className="mt-1">
                  <span className="text-lg font-extrabold text-white">
                    {joueur.taille || '-'}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">cm</span>
                </div>
              </div>

              {/* Poids */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-slate-400" />
                  Poids
                </span>
                <div className="mt-1">
                  <span className="text-lg font-extrabold text-white">
                    {joueur.poids || '-'}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">kg</span>
                </div>
              </div>

              {/* Pied fort */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>👟</span>
                  Pied fort
                </span>
                <div className="mt-1">
                  <span className="text-sm font-black text-white">
                    {joueur.piedFort || 'Droitier'}
                  </span>
                </div>
              </div>

              {/* VMA */}
              <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-3 rounded-xl flex flex-col justify-between shadow-sm">
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  VMA
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-300">
                    {joueur.vma !== undefined && joueur.vma !== null ? joueur.vma.toFixed(1) : '-'}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-medium">km/h</span>
                </div>
                {joueur.vma && (
                  <span className="text-[9px] text-emerald-300/80 font-medium truncate mt-0.5">
                    {getVmaTier(joueur.vma).label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disciplinary Alert if 3+ Yellow Cards (Suspension risk) */}
        {totalJaunes >= 3 ? (
          <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border-2 border-amber-500/50 shadow-lg flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-amber-300">
                  Suspension potentielle pour la prochaine rencontre officielle
                </h4>
                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black">
                  {totalJaunes} Cartons Jaunes Cumulés
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Ce joueur a cumulé <strong>{totalJaunes} cartons jaunes</strong> au fil de ses rencontres cette saison. Conformément aux règlements sportifs officiels (FFF - 3 avertissements reçus), il encourt automatiquement <strong>1 match de suspension ferme</strong>.
              </p>
            </div>
          </div>
        ) : totalJaunes === 2 ? (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-yellow-950/40 border border-yellow-500/40 text-yellow-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>
              <strong>Avertissement discipline :</strong> Ce joueur a déjà reçu <strong>2 cartons jaunes</strong> cette saison. Tout nouvel avertissement entraînera une suspension automatique (3 CJ).
            </span>
          </div>
        ) : null}

        {/* Aggregate Stats Tiles with per-match averages */}
        <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 border-b border-slate-800">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400">⭐ Moyenne Notes</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-2xl font-black ${
                  getNoteColor(moyenneNotes).text
                }`}
              >
                {moyenneNotes !== null ? moyenneNotes.toFixed(2) : '-'}
              </span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              sur {notesValides.length} match{notesValides.length > 1 ? 's' : ''} noté{notesValides.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400">⏱️ Temps de jeu</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-white">{totalMinutes}</span>
              <span className="text-xs text-slate-500">min</span>
            </div>
            <span className="text-[10px] text-slate-300 font-semibold mt-1">
              Moy. {moyMin}' / match ({nbMatchsJoues} m.)
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400">⚽ Efficacité Offensive</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-amber-300">{totalButs} ⚽</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xl font-black text-blue-300">{totalPasses} 🎯</span>
            </div>
            <div className="text-[10px] text-slate-300 font-bold mt-1 flex items-center gap-1.5">
              <span className="text-amber-300">Moy. {moyButs} ⚽/m</span>
              <span>•</span>
              <span className="text-blue-300">Moy. {moyPasses} 🎯/m</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl flex flex-col justify-between border transition-all ${
              totalJaunes >= 3
                ? 'bg-amber-950/40 border-amber-500/60 shadow-md'
                : totalJaunes === 2
                ? 'bg-yellow-950/30 border-yellow-500/40'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>🟨 Discipline</span>
              {totalJaunes >= 3 && (
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Suspendable
                </span>
              )}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  totalJaunes >= 3
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                    : 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                }`}
              >
                🟨 {totalJaunes}
              </span>
              <span className="text-xs font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                🟥 {totalRouges}
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold mt-1 ${
                totalJaunes >= 3 ? 'text-amber-300 font-bold' : 'text-slate-300'
              }`}
            >
              {totalJaunes >= 3
                ? '⚠️ 3 CJ : suspension FFF'
                : totalJaunes === 2
                ? '⚠️ 2 CJ (à 1 de suspension)'
                : `Moy. ${moyCartons} carton / match`}
            </span>
          </div>
        </div>

        {/* Match-by-Match History & Evolution Chart */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Evolution Line Chart of Ratings on last 10 matches */}
          <JoueurNotesChart
            joueurId={joueur.id}
            joueurNom={`${joueur.prenom} ${joueur.nom}`}
            matchs={matchs}
            feuillesMatch={feuillesMatch}
            onOpenMatch={(match) => {
              if (onOpenMatch) {
                onClose();
                onOpenMatch(match);
              }
            }}
          />

          {(() => {
            const statCounts: Record<string, number> = {};
            playerFeuilles.forEach((f) => {
              const s = getLigneStatut(f);
              statCounts[s] = (statCounts[s] || 0) + 1;
            });

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Historique des Matchs & Rôles
                  </h3>

                  {/* Summary Status Badges */}
                  <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    {statCounts['titulaire'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                        🟢 {statCounts['titulaire']} Tit.
                      </span>
                    )}
                    {statCounts['remplacant'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30">
                        🔵 {statCounts['remplacant']} Rempl.
                      </span>
                    )}
                    {statCounts['blesse'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30">
                        🩹 {statCounts['blesse']} Blessé
                      </span>
                    )}
                    {statCounts['suspendu'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 font-bold border border-red-800/40">
                        🟥 {statCounts['suspendu']} Susp.
                      </span>
                    )}
                    {statCounts['equipe_b'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30">
                        🅱️ {statCounts['equipe_b']} Éq. B
                      </span>
                    )}
                    {statCounts['equipe_c'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30">
                        🅲 {statCounts['equipe_c']} Éq. C
                      </span>
                    )}
                    {statCounts['malade'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                        🤒 {statCounts['malade']} Malade
                      </span>
                    )}
                    {statCounts['absent'] > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        ⚪ {statCounts['absent']} Absent
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {playerFeuilles.map((feuille) => {
                    const match = matchsMap.get(feuille.matchId);
                    if (!match) return null;
                    const noteObj = getNoteColor(feuille.note);
                    const statut = getLigneStatut(feuille);
                    const config = STATUTS_MATCH_CONFIG[statut];
                    const isActif = config.isActif;

                    return (
                      <div
                        key={feuille.id}
                        onClick={() => {
                          if (onOpenMatch) {
                            onClose();
                            onOpenMatch(match);
                          }
                        }}
                        className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              match.scoreEquipe > match.scoreAdverse
                                ? 'bg-emerald-400'
                                : match.scoreEquipe === match.scoreAdverse
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                          />
                          <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              vs {match.adversaire} ({match.scoreEquipe} - {match.scoreAdverse})
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{match.date}</span>
                              <span>•</span>
                              <span>{match.domicileExterieur === 'domicile' ? 'Domicile' : 'Extérieur'}</span>
                              <span>•</span>
                              <span>{match.competition}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* Role Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${config.badgeClass} whitespace-nowrap`}
                          >
                            {config.icon} {config.label}
                          </span>

                          {isActif ? (
                            <>
                              <span className="text-slate-300 font-medium">{feuille.minutesJouees}'</span>

                              <div className="flex items-center gap-1.5 min-w-[50px]">
                                {feuille.buts > 0 && (
                                  <span className="text-amber-400 font-bold">
                                    {feuille.buts}⚽
                                  </span>
                                )}
                                {feuille.passesDecisives > 0 && (
                                  <span className="text-blue-400 font-bold">
                                    {feuille.passesDecisives}🎯
                                  </span>
                                )}
                                {feuille.cartonsJaunes > 0 && <span>🟨</span>}
                                {feuille.cartonsRouges > 0 && <span>🟥</span>}
                              </div>

                              <div
                                className={`px-2.5 py-0.5 rounded-full font-black border ${noteObj.bg} ${noteObj.text} ${noteObj.border}`}
                              >
                                {noteObj.label} / 10
                              </div>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Non aligné sur ce match
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
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
