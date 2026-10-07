import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  CloudSun,
  Edit2,
  MapPin,
  Save,
  Shield,
  ShieldAlert,
  Trash2,
  Trophy,
  Users,
  X,
  Plus,
  Check,
  CheckCircle2,
  Camera,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import {
  CompositionMatch,
  FeuilleMatchLigne,
  Joueur,
  Match,
  MeteoType,
  STATUTS_MATCH_CONFIG,
  StatutMatchJoueur,
  SystemeTactique,
  TypeMatch,
  TYPES_MATCH_CONFIG,
  TYPES_MATCH_LIST,
  detectTypeMatch,
  getLigneStatut,
} from '../types';
import { FORMATION_PRESETS, getNoteColor } from '../mockData';
import { PitchTactique } from './PitchTactique';
import { PitchAdverseTactique } from './PitchAdverseTactique';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { MatchPhotosManager } from './MatchPhotosManager';

interface MatchDetailsModalProps {
  match: Match;
  joueurs: Joueur[];
  composition: CompositionMatch;
  feuilleMatch: FeuilleMatchLigne[];
  isOpen: boolean;
  onClose: () => void;
  onSaveMatch: (updatedMatch: Match) => void;
  onUpdateComposition: (newComp: CompositionMatch) => void;
  onUpdateFeuillesMatch: (newFeuilles: FeuilleMatchLigne[]) => void;
  onDeleteMatch?: (matchId: string) => void;
  onValidateMatch?: (match: Match, composition: CompositionMatch, feuilles: FeuilleMatchLigne[]) => void;
  onNavigateToStats?: () => void;
}

const METEO_OPTIONS: MeteoType[] = [
  'Ensoleillé',
  'Nuageux',
  'Pluvieux',
  'Venteux',
  'Froid',
  'Orageux',
];

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  joueurs,
  composition,
  feuilleMatch,
  isOpen,
  onClose,
  onSaveMatch,
  onUpdateComposition,
  onUpdateFeuillesMatch,
  onDeleteMatch,
  onValidateMatch,
  onNavigateToStats,
}) => {
  const [activeTab, setActiveTab] = useState<'tactique' | 'adverse' | 'feuille' | 'photos'>('tactique');
  const [matchData, setMatchData] = useState<Match>(match);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [feuilleFilter, setFeuilleFilter] = useState<'all' | 'actifs' | 'indisponibles'>('all');
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [autoSaveNotice, setAutoSaveNotice] = useState<string | null>(null);

  const isTacticalTab = activeTab === 'tactique' || activeTab === 'adverse' || activeTab === 'feuille';
  const effectiveFullScreen = isTacticalTab ? isFullScreen : false;

  useEffect(() => {
    setMatchData(match);
  }, [match]);

  const triggerAutoSaveNotice = (msg: string = 'Enregistré automatiquement ✓') => {
    setAutoSaveNotice(msg);
    setTimeout(() => {
      setAutoSaveNotice(null);
    }, 2800);
  };

  if (!isOpen) return null;

  // Single line update for Feuille de match avec enregistrement automatique et compilation
  const handleUpdateFeuilleLigne = (updatedLigne: FeuilleMatchLigne) => {
    const exists = feuilleMatch.some((f) => f.joueurId === updatedLigne.joueurId);
    let updated: FeuilleMatchLigne[];
    if (exists) {
      updated = feuilleMatch.map((f) =>
        f.joueurId === updatedLigne.joueurId ? updatedLigne : f
      );
    } else {
      updated = [...feuilleMatch, updatedLigne];
    }
    onUpdateFeuillesMatch(updated);

    // Synchronisation automatique du score de l'équipe et statut du match
    const totalGoalsJoueurs = updated.reduce((acc, f) => acc + (f.buts || 0), 0);
    let matchHasChanged = false;
    let nextMatchData = { ...matchData };

    if (totalGoalsJoueurs > nextMatchData.scoreEquipe) {
      nextMatchData.scoreEquipe = totalGoalsJoueurs;
      matchHasChanged = true;
    }
    if (nextMatchData.statut !== 'termine') {
      nextMatchData.statut = 'termine';
      matchHasChanged = true;
    }

    if (matchHasChanged) {
      setMatchData(nextMatchData);
      onSaveMatch(nextMatchData);
    }

    triggerAutoSaveNotice('Statistiques enregistrées automatiquement ✓ (compilées dans les moyennes du Tableau Annuel)');
  };

  // Set player role/status in squad (starter, sub, injured, absent, sick, suspended, team B, team C, not called)
  const handleSetPlayerStatut = (joueurId: string, newStatut: StatutMatchJoueur) => {
    const isTitulaire = newStatut === 'titulaire';
    const isRemplacant = newStatut === 'remplacant';
    const isActif = isTitulaire || isRemplacant;

    let updated: FeuilleMatchLigne[];
    const existing = feuilleMatch.find((f) => f.joueurId === joueurId);
    if (existing) {
      updated = feuilleMatch.map((f) => {
        if (f.joueurId !== joueurId) return f;
        return {
          ...f,
          statut: newStatut,
          titulaire: isTitulaire,
          minutesJouees: isTitulaire
            ? (f.minutesJouees > 0 ? f.minutesJouees : 90)
            : isRemplacant
            ? f.minutesJouees
            : 0,
          buts: isActif ? f.buts : 0,
          passesDecisives: isActif ? f.passesDecisives : 0,
          cartonsJaunes: isActif ? f.cartonsJaunes : 0,
          cartonsRouges: isActif ? f.cartonsRouges : 0,
          note: isActif ? f.note : null,
        };
      });
    } else {
      updated = [
        ...feuilleMatch,
        {
          id: `f_${match.id}_${joueurId}`,
          matchId: match.id,
          joueurId,
          titulaire: isTitulaire,
          statut: newStatut,
          minutesJouees: isTitulaire ? 90 : 0,
          buts: 0,
          passesDecisives: 0,
          cartonsJaunes: 0,
          cartonsRouges: 0,
          note: null,
        },
      ];
    }
    onUpdateFeuillesMatch(updated);
    triggerAutoSaveNotice('Rôle du joueur et feuille enregistrés automatiquement ✓');
  };

  const handleSaveMatchInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMatch(matchData);
    setIsEditingInfo(false);
  };

  const mType = detectTypeMatch(matchData);
  const typeCfg = TYPES_MATCH_CONFIG[mType];

  const currentMatchRows = joueurs.map((j) => {
    const l = feuilleMatch.find((f) => f.joueurId === j.id);
    return {
      joueur: j,
      statut: getLigneStatut(l),
      ligne: l,
    };
  });
  const nbTitulaires = currentMatchRows.filter((r) => r.statut === 'titulaire').length;
  const nbRemplacants = currentMatchRows.filter((r) => r.statut === 'remplacant').length;
  const nbNotes = feuilleMatch.filter(
    (f) => f.matchId === match.id && f.note !== null && f.note !== undefined
  ).length;

  const handleValidateAll = (andNavigateToStats: boolean = false) => {
    setIsValidating(true);
    const validatedMatch: Match = {
      ...matchData,
      statut: 'termine', // Garantit l'inclusion immédiate dans le Tableau Annuel & Stats
      valide: true,
      dateValidation: new Date().toISOString(),
    };

    setMatchData(validatedMatch);

    if (onValidateMatch) {
      onValidateMatch(validatedMatch, composition, feuilleMatch);
    } else {
      onSaveMatch(validatedMatch);
      onUpdateComposition(composition);
      onUpdateFeuillesMatch(feuilleMatch);
    }

    setValidationNotice(
      `Toutes les informations du match (${typeCfg.label}) ont été validées et enregistrées ! Notre système (${composition.systeme}), le système adverse, la feuille de match (${nbTitulaires} titu., ${nbRemplacants} remp.) et les photos (${matchData.photos?.length || 0}/2) sont enregistrés et compilés dans le Tableau Annuel & Stats.`
    );

    setTimeout(() => {
      setIsValidating(false);
      if (andNavigateToStats && onNavigateToStats) {
        onNavigateToStats();
      }
    }, 250);
  };

  const renderTabBottomValidationCard = (
    currentTabName: 'notre_systeme' | 'systeme_adverse' | 'feuille_match' | 'photos'
  ) => {
    return (
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 my-6 shadow-2xl animate-in fade-in duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${typeCfg.badgeClass}`}
              >
                <span>{typeCfg.icon}</span>
                <span>{typeCfg.label}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-bold text-slate-300">
                LCMFC vs {matchData.adversaire}
              </span>
              {matchData.valide && (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Compilé dans le Tableau Annuel & Stats
                </span>
              )}
            </div>

            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Valider les informations du match ({typeCfg.label})
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Enregistrez et conservez l'intégralité des éléments complétés (
              <strong className="text-emerald-300">notre système</strong>,{' '}
              <strong className="text-rose-300">système adverse</strong>,{' '}
              <strong className="text-amber-300">feuille de match</strong>,{' '}
              <strong className="text-sky-300">photos</strong>) et transmettez-les au{' '}
              <strong className="text-white">Tableau Annuel & Stats</strong> qui compile automatiquement tous les matchs.
            </p>

            {/* Checklist des 4 blocs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-1">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Notre système
                </span>
                <span className="font-mono text-emerald-400 font-bold text-xs">{composition.systeme}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-1">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Système adv.
                </span>
                <span className="font-mono text-rose-300 font-bold text-xs truncate max-w-[80px]">
                  {matchData.systemeAdverse || '4-4-2'}
                </span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-1">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  Feuille match
                </span>
                <span className="font-mono text-amber-300 font-bold text-xs">
                  {nbTitulaires}T / {nbRemplacants}R ({nbNotes}★)
                </span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-1">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  Photos
                </span>
                <span className="font-mono text-sky-300 font-bold text-xs">
                  {matchData.photos?.length || 0}/2
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              id={`btn-valider-infos-match-tab-${currentTabName}`}
              type="button"
              onClick={() => handleValidateAll(false)}
              disabled={isValidating}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-emerald-950/60 border border-emerald-400/40 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>Valider les informations du match</span>
              <span className="text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-400/30 uppercase font-black">
                {typeCfg.shortLabel}
              </span>
            </button>

            {onNavigateToStats && (
              <button
                type="button"
                onClick={() => handleValidateAll(true)}
                disabled={isValidating}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-700 hover:border-emerald-500/40 transition-all shadow-md cursor-pointer"
                title="Valider et basculer directement vers le Tableau Annuel & Stats"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Valider & Aller au Tableau Annuel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={
        effectiveFullScreen
          ? 'fixed inset-0 z-50 flex flex-col bg-slate-950 w-screen h-screen overflow-hidden p-0'
          : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto'
      }
    >
      <div
        className={
          effectiveFullScreen
            ? 'bg-slate-900 w-full h-full flex flex-col overflow-hidden rounded-none border-0 shadow-none'
            : 'bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200'
        }
      >
        {/* Modal Top Header */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                matchData.scoreEquipe > matchData.scoreAdverse
                  ? 'bg-emerald-400'
                  : matchData.scoreEquipe === matchData.scoreAdverse
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const mType = detectTypeMatch(matchData);
                  const cfg = TYPES_MATCH_CONFIG[mType];
                  return (
                    <span
                      className={`text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${cfg.badgeClass}`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                  );
                })()}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {matchData.competition}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  {matchData.domicileExterieur === 'domicile' ? 'À Domicile' : 'À l\'Extérieur'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5">
                  <div className="h-6 px-1.5 bg-white rounded-md border border-slate-200 flex items-center justify-center shrink-0">
                    <img
                      src="/logo-lcmfc.svg"
                      alt="LCMFC"
                      className="h-4 w-auto max-w-[40px] object-contain"
                    />
                  </div>
                  <span>LCMFC</span>
                </div>
                <span className="bg-slate-800 text-white font-mono px-2 py-0.5 rounded text-base border border-slate-700">
                  {matchData.scoreEquipe} - {matchData.scoreAdverse}
                </span>
                <span>{matchData.adversaire}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTacticalTab && (
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  isFullScreen
                    ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
                }`}
                title={isFullScreen ? 'Réduire la fenêtre' : 'Afficher en plein écran'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Fenêtré</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Plein écran</span>
                  </>
                )}
              </button>
            )}

            {/* Quick header validation button */}
            <button
              id="btn-quick-valider-match-header"
              type="button"
              onClick={() => handleValidateAll(false)}
              disabled={isValidating}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                matchData.valide
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
              }`}
              title="Valider et sauvegarder toutes les informations du match et les compiler dans le Tableau Annuel"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {matchData.valide ? 'Validé ✓' : 'Valider le match'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                activeTab === 'photos'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                  : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
              }`}
              title="Gérer les photos du match"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{matchData.photos?.length || 0}/2 photo{matchData.photos && matchData.photos.length > 1 ? 's' : ''}</span>
            </button>

            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/80"
              title="Modifier les informations du match"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {onDeleteMatch && (
              <button
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors border border-rose-500/20"
                title="Supprimer ce match"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Confirmation Notification */}
        {validationNotice && (
          <div className="bg-emerald-950/95 border-b border-emerald-500/50 px-4 sm:px-6 py-3 text-xs text-white flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-emerald-300">
                  Informations du match validées avec succès !
                </p>
                <p className="text-slate-300 text-xs mt-0.5 line-clamp-2">
                  {validationNotice}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onNavigateToStats && (
                <button
                  type="button"
                  onClick={onNavigateToStats}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Voir le Tableau Annuel & Stats</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setValidationNotice(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Edit Match Info Bar (toggleable) */}
        {isEditingInfo && (
          <form
            onSubmit={handleSaveMatchInfo}
            className="bg-slate-950/90 border-b border-slate-800 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
          >
            <div>
              <label className="text-slate-400 block mb-1">Type de match</label>
              <select
                value={detectTypeMatch(matchData)}
                onChange={(e) => {
                  const newType = e.target.value as TypeMatch;
                  const cfg = TYPES_MATCH_CONFIG[newType];
                  setMatchData({
                    ...matchData,
                    typeMatch: newType,
                    competition: matchData.competition || cfg.defaultCompetition,
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg font-semibold"
              >
                {TYPES_MATCH_LIST.map((t) => (
                  <option key={t} value={t}>
                    {TYPES_MATCH_CONFIG[t].icon} {TYPES_MATCH_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Compétition / Détail</label>
              <input
                type="text"
                value={matchData.competition}
                onChange={(e) => setMatchData({ ...matchData, competition: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Adversaire</label>
              <input
                type="text"
                value={matchData.adversaire}
                onChange={(e) => setMatchData({ ...matchData, adversaire: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Score Équipe / Adversaire</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={matchData.scoreEquipe}
                  onChange={(e) =>
                    setMatchData({ ...matchData, scoreEquipe: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 bg-slate-900 border border-slate-700 text-white px-2 py-1.5 rounded-lg text-center font-bold"
                />
                <span className="text-slate-500 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  value={matchData.scoreAdverse}
                  onChange={(e) =>
                    setMatchData({ ...matchData, scoreAdverse: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 bg-slate-900 border border-slate-700 text-white px-2 py-1.5 rounded-lg text-center font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Date & Heure</label>
              <div className="flex gap-1">
                <input
                  type="date"
                  value={matchData.date}
                  onChange={(e) => setMatchData({ ...matchData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1.5 rounded-lg"
                />
                <input
                  type="time"
                  value={matchData.heure}
                  onChange={(e) => setMatchData({ ...matchData, heure: e.target.value })}
                  className="w-20 bg-slate-900 border border-slate-700 text-white px-1.5 py-1.5 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Stade & Lieu</label>
              <input
                type="text"
                value={matchData.lieu}
                onChange={(e) => setMatchData({ ...matchData, lieu: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Lieu (Dom / Ext)</label>
              <select
                value={matchData.domicileExterieur}
                onChange={(e) =>
                  setMatchData({
                    ...matchData,
                    domicileExterieur: e.target.value as 'domicile' | 'exterieur',
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg"
              >
                <option value="domicile">Domicile</option>
                <option value="exterieur">Extérieur</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Météo</label>
              <select
                value={matchData.meteo}
                onChange={(e) =>
                  setMatchData({ ...matchData, meteo: e.target.value as MeteoType })
                }
                className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg"
              >
                {METEO_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Système adverse</label>
              <input
                type="text"
                value={matchData.systemeAdverse}
                onChange={(e) => setMatchData({ ...matchData, systemeAdverse: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-slate-800">
              <MatchPhotosManager
                photos={matchData.photos || []}
                maxPhotos={2}
                onChange={(photos) => setMatchData({ ...matchData, photos })}
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 md:col-span-3">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </button>
            </div>
          </form>
        )}

        {/* Quick Meta Sub-bar */}
        <div className="bg-slate-900/60 px-4 sm:px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {matchData.date} à {matchData.heure}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {matchData.lieu}
            </span>
            <span className="flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-slate-500" />
              {matchData.meteo}
            </span>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setActiveTab('tactique')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                activeTab === 'tactique'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Notre système
            </button>
            <button
              onClick={() => setActiveTab('adverse')}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg transition-all ${
                activeTab === 'adverse'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Système adverse</span>
            </button>
            <button
              onClick={() => setActiveTab('feuille')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                activeTab === 'feuille'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Feuille de match ({feuilleMatch.length} notés)
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-3 py-1 font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'photos'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos ({matchData.photos?.length || 0}/2)</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className={`overflow-y-auto flex-1 ${effectiveFullScreen ? 'p-2 sm:p-4' : 'p-4 sm:p-6'}`}>
          {activeTab === 'tactique' ? (
            <div className="flex flex-col">
              <PitchTactique
                match={matchData}
                composition={composition}
                feuilleMatch={feuilleMatch}
                joueurs={joueurs}
                onUpdateComposition={onUpdateComposition}
                onUpdateFeuilleLigne={handleUpdateFeuilleLigne}
              />
              {renderTabBottomValidationCard('notre_systeme')}
            </div>
          ) : activeTab === 'adverse' ? (
            <div className="flex flex-col">
              <PitchAdverseTactique
                match={matchData}
                onSaveScouting={(scouting) => {
                  const updatedMatch = {
                    ...matchData,
                    scoutingAdverse: scouting,
                    systemeAdverse: scouting.systeme,
                  };
                  setMatchData(updatedMatch);
                  onSaveMatch(updatedMatch);
                }}
              />
              {renderTabBottomValidationCard('systeme_adverse')}
            </div>
          ) : activeTab === 'feuille' ? (
            /* Complete Match Sheet Table View */
            (() => {
              const matchRows = joueurs.map((joueur) => {
                const ligne = feuilleMatch.find((f) => f.joueurId === joueur.id) || {
                  id: `f_${match.id}_${joueur.id}`,
                  matchId: match.id,
                  joueurId: joueur.id,
                  titulaire: false,
                  statut: 'non_convoque' as StatutMatchJoueur,
                  minutesJouees: 0,
                  buts: 0,
                  passesDecisives: 0,
                  cartonsJaunes: 0,
                  cartonsRouges: 0,
                  note: null,
                };
                const statut = getLigneStatut(ligne);
                return { joueur, ligne, statut };
              });

              const nbTitulaires = matchRows.filter((r) => r.statut === 'titulaire').length;
              const nbRemplacants = matchRows.filter((r) => r.statut === 'remplacant').length;
              const nbBlesses = matchRows.filter((r) => r.statut === 'blesse').length;
              const nbAbsents = matchRows.filter((r) => r.statut === 'absent').length;
              const nbMalades = matchRows.filter((r) => r.statut === 'malade').length;
              const nbSuspendus = matchRows.filter((r) => r.statut === 'suspendu').length;
              const nbEquipeB = matchRows.filter((r) => r.statut === 'equipe_b').length;
              const nbEquipeC = matchRows.filter((r) => r.statut === 'equipe_c').length;
              const nbNonConvoques = matchRows.filter((r) => r.statut === 'non_convoque').length;
              const nbActifs = nbTitulaires + nbRemplacants;
              const nbIndisponibles = matchRows.length - nbActifs;

              const filteredRows = matchRows.filter((r) => {
                if (feuilleFilter === 'actifs') return r.statut === 'titulaire' || r.statut === 'remplacant';
                if (feuilleFilter === 'indisponibles') return r.statut !== 'titulaire' && r.statut !== 'remplacant';
                return true;
              });

              return (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Feuille de Match & Rôles des Joueurs</span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          {nbTitulaires} Titulaires • {nbRemplacants} Remplaçants
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Assignez à chaque joueur son rôle : titulaire, remplaçant, blessé, absent, malade, non convoqué, suspendu, en équipe B ou en équipe C.
                      </p>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFeuilleFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          feuilleFilter === 'all'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Tous ({matchRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeuilleFilter('actifs')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          feuilleFilter === 'actifs'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-emerald-400'
                        }`}
                      >
                        Convoqués R3 ({nbActifs})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeuilleFilter('indisponibles')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          feuilleFilter === 'indisponibles'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-rose-400'
                        }`}
                      >
                        Indisponibles & Autres ({nbIndisponibles})
                      </button>
                    </div>
                  </div>

                  {/* Badges Summary Counts */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Effectif du Match :
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                      🟢 {nbTitulaires} Titulaire{nbTitulaires > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
                      🔵 {nbRemplacants} Remplaçant{nbRemplacants > 1 ? 's' : ''}
                    </span>
                    {nbBlesses > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold">
                        🩹 {nbBlesses} Blessé{nbBlesses > 1 ? 's' : ''}
                      </span>
                    )}
                    {nbSuspendus > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/50 text-red-300 border border-red-800/40 font-semibold">
                        🟥 {nbSuspendus} Suspendu{nbSuspendus > 1 ? 's' : ''}
                      </span>
                    )}
                    {nbEquipeB > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                        🅱️ {nbEquipeB} en Équipe B
                      </span>
                    )}
                    {nbEquipeC > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                        🅲 {nbEquipeC} en Équipe C
                      </span>
                    )}
                    {nbMalades > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                        🤒 {nbMalades} Malade{nbMalades > 1 ? 's' : ''}
                      </span>
                    )}
                    {nbAbsents > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        ⚪ {nbAbsents} Absent{nbAbsents > 1 ? 's' : ''}
                      </span>
                    )}
                    {nbNonConvoques > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-700 font-semibold">
                        📋 {nbNonConvoques} Non convoqué{nbNonConvoques > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Auto-Save & Stats Live Compilation Banner */}
                  <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="font-extrabold text-white">
                          Enregistrement automatique & Compilation en continu
                        </span>
                        <p className="text-[11px] text-slate-300">
                          Tous les buts marqués, passes, cartons et notes saisis sont automatiquement conservés et compilés sous forme de moyennes dans le Tableau Annuel & Stats.
                        </p>
                      </div>
                    </div>
                    {autoSaveNotice ? (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 self-start sm:self-auto shrink-0 animate-in fade-in">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        {autoSaveNotice}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0 self-start sm:self-auto">
                        Auto-save actif ✓
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                            <th className="py-3 px-3">Joueur</th>
                            <th className="py-3 px-2 text-center min-w-[155px]">Rôle / Statut</th>
                            <th className="py-3 px-2 text-center">Minutes</th>
                            <th className="py-3 px-2 text-center text-amber-400">Buts ⚽</th>
                            <th className="py-3 px-2 text-center text-blue-400">Passes 🎯</th>
                            <th className="py-3 px-2 text-center text-yellow-400">🟨 Jaune</th>
                            <th className="py-3 px-2 text-center text-red-400">🟥 Rouge</th>
                            <th className="py-3 px-3 text-center text-emerald-400 font-bold">
                              Note / 10 ⭐
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filteredRows.map(({ joueur, ligne, statut }) => {
                            const noteObj = getNoteColor(ligne.note);
                            const isActif = STATUTS_MATCH_CONFIG[statut].isActif;

                            return (
                              <tr
                                key={joueur.id}
                                className={`hover:bg-slate-900/60 transition-colors ${
                                  statut === 'titulaire'
                                    ? 'bg-emerald-950/10'
                                    : statut === 'remplacant'
                                    ? 'bg-blue-950/10'
                                    : 'opacity-80 hover:opacity-100'
                                }`}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={joueur.photo}
                                      alt={joueur.nom}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div>
                                      <span className="font-bold text-white block">
                                        {joueur.prenom} {joueur.nom}
                                      </span>
                                      <span className="text-slate-500 text-[10px]">
                                        #{joueur.numero} • {joueur.poste}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Role Selector with 9 options */}
                                <td className="py-2 px-2 text-center">
                                  <select
                                    id={`select-role-${joueur.id}`}
                                    value={statut}
                                    onChange={(e) =>
                                      handleSetPlayerStatut(joueur.id, e.target.value as StatutMatchJoueur)
                                    }
                                    className={`w-full max-w-[155px] px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer outline-none shadow-sm ${
                                      STATUTS_MATCH_CONFIG[statut].selectClass
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
                                    <option value="non_convoque" className="bg-slate-900 text-zinc-400 font-semibold">
                                      📋 Non convoqué
                                    </option>
                                    <option value="suspendu" className="bg-slate-900 text-red-400 font-semibold">
                                      🟥 Suspendu
                                    </option>
                                    <option value="equipe_b" className="bg-slate-900 text-indigo-400 font-semibold">
                                      🅱️ En équipe B
                                    </option>
                                    <option value="equipe_c" className="bg-slate-900 text-purple-400 font-semibold">
                                      🅲 En équipe C
                                    </option>
                                  </select>
                                </td>

                                {/* Minutes */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    disabled={!isActif}
                                    value={ligne.minutesJouees}
                                    onChange={(e) =>
                                      handleUpdateFeuilleLigne({
                                        ...ligne,
                                        minutesJouees: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-14 bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-center font-mono text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Buts */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    disabled={!isActif}
                                    value={ligne.buts}
                                    onChange={(e) =>
                                      handleUpdateFeuilleLigne({
                                        ...ligne,
                                        buts: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Passes Décisives */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    disabled={!isActif}
                                    value={ligne.passesDecisives}
                                    onChange={(e) =>
                                      handleUpdateFeuilleLigne({
                                        ...ligne,
                                        passesDecisives: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-blue-300 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Carton Jaune */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="2"
                                    disabled={!isActif}
                                    value={ligne.cartonsJaunes}
                                    onChange={(e) =>
                                      handleUpdateFeuilleLigne({
                                        ...ligne,
                                        cartonsJaunes: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-yellow-300 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Carton Rouge */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    disabled={!isActif}
                                    value={ligne.cartonsRouges}
                                    onChange={(e) =>
                                      handleUpdateFeuilleLigne({
                                        ...ligne,
                                        cartonsRouges: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className={`w-12 bg-slate-900 border border-slate-700 text-red-400 font-bold rounded px-1.5 py-1 text-center text-xs focus:ring-1 focus:ring-emerald-500 ${
                                      !isActif ? 'opacity-30 cursor-not-allowed bg-slate-950 text-slate-600' : ''
                                    }`}
                                  />
                                </td>

                                {/* Note / 10 */}
                                <td className="py-2 px-3 text-center">
                                  {isActif ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        placeholder="-"
                                        value={ligne.note !== null && ligne.note !== undefined ? ligne.note : ''}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                          handleUpdateFeuilleLigne({
                                            ...ligne,
                                            note: val,
                                          });
                                        }}
                                        className="w-14 bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-center font-bold text-xs focus:ring-1 focus:ring-emerald-500"
                                      />
                                      <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${noteObj.bg} ${noteObj.text} ${noteObj.border}`}
                                      >
                                        {noteObj.label}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-500 italic">
                                      Non aligné
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {renderTabBottomValidationCard('feuille_match')}
                  </div>
                </div>
              );
            })()
          ) : (
            /* Tab: Photos du Match */
            <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    Photos & Souvenirs du Match
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Associez 1 ou 2 photos marquantes à ce match (photo d'équipe, causerie dans le vestiaire, célébration de but, action décisive). Les photos sont importées depuis votre ordinateur et enregistrées directement dans l'application.
                  </p>
                </div>

                <MatchPhotosManager
                  photos={matchData.photos || []}
                  maxPhotos={2}
                  onChange={(newPhotos) => {
                    const updated = { ...matchData, photos: newPhotos };
                    setMatchData(updated);
                    onSaveMatch(updated);
                  }}
                />
              </div>

              {renderTabBottomValidationCard('photos')}
            </div>
          )}
        </div>

        {/* Sticky Bottom Dock: "Valider les informations du match" */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xl z-20">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Match Type Badge */}
            <span
              className={`text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shrink-0 ${typeCfg.badgeClass}`}
            >
              <span>{typeCfg.icon}</span>
              <span>{typeCfg.label}</span>
            </span>

            {/* Match Score & Opponent */}
            <div className="flex items-center gap-1.5 text-xs text-white font-bold">
              <span className="text-slate-400">Score:</span>
              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                LCMFC {matchData.scoreEquipe} - {matchData.scoreAdverse} {matchData.adversaire}
              </span>
            </div>

            {/* Validation compilation status */}
            {matchData.valide ? (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Compilé dans le Tableau Annuel
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Prêt à être validé
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-valider-informations-match-dock"
              type="button"
              onClick={() => handleValidateAll(false)}
              disabled={isValidating}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>Valider les informations du match</span>
              <span className="hidden lg:inline-flex text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-400/30 font-bold uppercase tracking-wider">
                {typeCfg.shortLabel}
              </span>
            </button>

            {onNavigateToStats && (
              <button
                id="btn-valider-et-aller-stats-dock"
                type="button"
                onClick={() => handleValidateAll(true)}
                disabled={isValidating}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 hover:border-emerald-500/30 transition-all shadow-md cursor-pointer"
                title="Valider et basculer immédiatement vers le Tableau Annuel & Stats"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Valider & Tableau Annuel</span>
                <span className="sm:hidden">Stats</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Match Deletion */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        title="Supprimer ce match"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le match contre ${match.adversaire} du ${match.date} (Score: ${matchData.scoreEquipe}-${matchData.scoreAdverse}) ? Toutes les données collectives (score, système, photos) et individuelles (notes, buts, passes, cartons, temps de jeu de tous les joueurs) seront effacées et retirées du tableau annuel des stats.`}
        confirmText="Supprimer le match"
        onConfirm={() => {
          if (onDeleteMatch) {
            onDeleteMatch(match.id);
            onClose();
          }
        }}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
