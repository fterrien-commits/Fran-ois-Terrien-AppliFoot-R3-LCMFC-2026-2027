import React, { useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Download,
  Edit2,
  Flame,
  HelpCircle,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
  Target,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  JoueurAdverseTactique,
  Match,
  NiveauJoueurAdverse,
  ScoutingAdverse,
  SystemeTactique,
} from '../types';
import { FORMATION_PRESETS } from '../mockData';

export const NIVEAU_CONFIG: Record<
  NiveauJoueurAdverse,
  {
    label: string;
    shortLabel: string;
    colorBadge: string;
    borderRing: string;
    bgPill: string;
    textPill: string;
    barColor: string;
    hex: string;
    icon: string;
    description: string;
  }
> = {
  'faible +': {
    label: 'Très faible',
    shortLabel: 'TRÈS FAIBLE',
    colorBadge: 'bg-red-600 text-white border-red-500 shadow-md font-bold',
    borderRing: 'ring-4 ring-red-500 ring-offset-2 ring-offset-slate-900',
    bgPill: 'bg-red-600/15 border-red-500/40 text-red-400',
    textPill: 'text-red-400',
    barColor: 'bg-red-600',
    hex: '#dc2626',
    icon: '🔴',
    description: 'Point faible critique identifié ! Cible prioritaire à presser et attaquer lors du match retour.',
  },
  'faible': {
    label: 'Faible',
    shortLabel: 'FAIBLE',
    colorBadge: 'bg-orange-500 text-white border-orange-400 shadow-sm font-bold',
    borderRing: 'ring-4 ring-orange-500 ring-offset-2 ring-offset-slate-900',
    bgPill: 'bg-orange-500/15 border-orange-500/40 text-orange-400',
    textPill: 'text-orange-400',
    barColor: 'bg-orange-500',
    hex: '#ea580c',
    icon: '🟠',
    description: 'Manque de vitesse ou relance fébrile. Zone propice pour presser haut.',
  },
  'moyen': {
    label: 'Correct',
    shortLabel: 'CORRECT',
    colorBadge: 'bg-yellow-400 text-slate-950 border-yellow-300 font-black shadow-sm',
    borderRing: 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-900',
    bgPill: 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400',
    textPill: 'text-yellow-400',
    barColor: 'bg-yellow-400',
    hex: '#facc15',
    icon: '🟡',
    description: 'Niveau équilibré. Gagner les duels individuels sans consignes spécifiques.',
  },
  'fort': {
    label: 'Bon joueur',
    shortLabel: 'BON JOUEUR',
    colorBadge: 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold',
    borderRing: 'ring-4 ring-emerald-500 ring-offset-2 ring-offset-slate-900',
    bgPill: 'bg-emerald-600/15 border-emerald-500/40 text-emerald-400',
    textPill: 'text-emerald-400',
    barColor: 'bg-emerald-600',
    hex: '#16a34a',
    icon: '🟢',
    description: 'Très bon niveau technique ou physique. Réduire ses espaces et limiter ses relances.',
  },
  'fort+': {
    label: 'Très bon joueur',
    shortLabel: 'TRÈS BON',
    colorBadge: 'bg-blue-600 text-white border-blue-500 shadow-md font-bold',
    borderRing: 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900',
    bgPill: 'bg-blue-600/15 border-blue-500/40 text-blue-400',
    textPill: 'text-blue-400',
    barColor: 'bg-blue-600',
    hex: '#2563eb',
    icon: '🔵',
    description: 'Joueur clé / Menace majeure. Prise à deux ou couverture obligatoire pour le match retour.',
  },
};

export const NIVEAUX_LIST: NiveauJoueurAdverse[] = [
  'faible +',
  'faible',
  'moyen',
  'fort',
  'fort+',
];

export interface AnnotationOption {
  id: string;
  label: string;
  icon: string;
  category: 'Qualités & Forces' | 'Faiblesses à cibler' | 'Profil & Spécialité';
}

export const ANNOTATIONS_PROPOSEES: AnnotationOption[] = [
  // Qualités & Forces
  { id: 'rapide', label: 'Très rapide', icon: '⚡', category: 'Qualités & Forces' },
  { id: 'technique', label: 'Technique / Dribbleur', icon: '🤹', category: 'Qualités & Forces' },
  { id: 'tete', label: 'Fort de la tête', icon: '✈️', category: 'Qualités & Forces' },
  { id: 'physique', label: 'Gros impact physique', icon: '🥊', category: 'Qualités & Forces' },
  { id: 'solide_1v1', label: 'Solide en 1v1', icon: '🧱', category: 'Qualités & Forces' },
  { id: 'meneur', label: 'Meneur / Créateur', icon: '🧠', category: 'Qualités & Forces' },
  { id: 'volume', label: 'Gros volume de jeu', icon: '🏃', category: 'Qualités & Forces' },
  { id: 'relanceur', label: 'Bon relanceur', icon: '🎯', category: 'Qualités & Forces' },
  { id: 'frappe', label: 'Grosse frappe lointaine', icon: '🚀', category: 'Qualités & Forces' },

  // Faiblesses à cibler
  { id: 'lent', label: 'Manque de vitesse', icon: '🐢', category: 'Faiblesses à cibler' },
  { id: 'pressing_febril', label: 'Fébrile sous pressing', icon: '⚠️', category: 'Faiblesses à cibler' },
  { id: 'mauvaise_relance', label: 'Mauvaise relance', icon: '❌', category: 'Faiblesses à cibler' },
  { id: 'sorties_aeriennes', label: 'Friable sorties aériennes', icon: '🧤', category: 'Faiblesses à cibler' },
  { id: 'mauvais_pied', label: 'Pied faible inexploité', icon: '🦿', category: 'Faiblesses à cibler' },
  { id: 'agressif', label: 'Agressif / Carton facile', icon: '🟨', category: 'Faiblesses à cibler' },
  { id: 'oublie_repli', label: 'Oublie le repli défensif', icon: '🔄', category: 'Faiblesses à cibler' },
  { id: 'dos_au_jeu', label: 'Vulnérable dans son dos', icon: '🎯', category: 'Faiblesses à cibler' },

  // Profil & Spécialité
  { id: 'gaucher', label: 'Bon pied gauche (Gaucher)', icon: '👟', category: 'Profil & Spécialité' },
  { id: 'droitier_exclusif', label: 'Droitier exclusif', icon: '👟', category: 'Profil & Spécialité' },
  { id: 'coup_franc', label: 'Tireur coup franc', icon: '🎯', category: 'Profil & Spécialité' },
  { id: 'penaltys', label: 'Tireur de pénalty', icon: '⚽', category: 'Profil & Spécialité' },
  { id: 'capitaine', label: 'Capitaine / Leader', icon: '👑', category: 'Profil & Spécialité' },
  { id: 'dos_au_but', label: 'Bon jeu dos au but', icon: '🧱', category: 'Profil & Spécialité' },
];

export function getPlayerAnnotations(player?: JoueurAdverseTactique): string[] {
  if (!player) return [];
  if (Array.isArray(player.annotations) && player.annotations.length > 0) {
    return player.annotations;
  }
  if (player.caracteristique) {
    return player.caracteristique
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function generateDefaultScouting(match: Match): ScoutingAdverse {
  // Check if system matches a preset
  const sysKey = (match.systemeAdverse as SystemeTactique) in FORMATION_PRESETS
    ? (match.systemeAdverse as SystemeTactique)
    : '4-4-2';

  const preset = FORMATION_PRESETS[sysKey] || FORMATION_PRESETS['4-4-2'];

  const defaultIndications: NiveauJoueurAdverse[] = [
    'moyen',    // G
    'faible +', // DG (souvent point à attaquer)
    'fort',     // DCG
    'moyen',    // DCD
    'faible',   // DD
    'fort',     // Milieu central / sentinelle
    'moyen',    // Milieu
    'faible',   // Milieu
    'moyen',    // Ailier / Meneur
    'fort+',    // Buteur vedette
    'moyen',    // 2e attaquant
  ];

  const defaultNotes: string[] = [
    'Gardien sur sa ligne, hésitant sur les sorties aériennes.',
    'Latéral friable défensivement : cibler son couloir sur nos transitions !',
    'Capitaine athlétique, bon dans le jeu de tête.',
    'Défenseur central lourd dans le dos, à prendre de vitesse.',
    'Latéral offensif mais oublie le repli.',
    'Sentinelle agressive, met beaucoup d\'impact au milieu.',
    'Relayeur technique, orienter son mauvais pied.',
    'Perd des ballons sous pressing haut.',
    'Meneur créateur, fermer l\'axe pour couper ses passes clés.',
    'Buteur très rapide et clinique : marquage serré et couverture permanente !',
    'Attaquant d\'appui, bon jeu dos au but.',
  ];

  const defaultCaracteristiques: string[] = [
    '🧤 Friable sorties aériennes',
    '⚠️ Fébrile sous pressing',
    '✈️ Fort de la tête',
    '🐢 Manque de vitesse',
    '💨 Rapide sur l\'aile',
    '🥊 Impact physique',
    '👟 Bon pied gauche',
    '🎯 Bon relanceur',
    '🎯 Tireur coup franc',
    '⚡ Très rapide',
    '🧱 Bon dos au but',
  ];

  const joueurs: JoueurAdverseTactique[] = preset.roles.map((role, idx) => ({
    id: `adv_${match.id}_${idx + 1}`,
    numero: idx === 0 ? 1 : idx + 1,
    nom: `${role.roleLabel} adverse`,
    roleLabel: role.roleLabel,
    indication: defaultIndications[idx] || 'moyen',
    notes: defaultNotes[idx] || '',
    caracteristique: defaultCaracteristiques[idx] || '',
    x: role.x,
    y: role.y,
  }));

  return {
    matchId: match.id,
    systeme: sysKey,
    joueurs,
    consignesRetour: `Plan tactique match retour contre ${match.adversaire} : Isoler leur numéro 9 (danger permanent), presser haut le côté gauche de leur défense (talon d'Achille identifié), et exploiter les transitions rapides sur les ailes.`,
  };
}

interface PitchAdverseTactiqueProps {
  match: Match;
  onSaveScouting: (scouting: ScoutingAdverse) => void;
}

export const PitchAdverseTactique: React.FC<PitchAdverseTactiqueProps> = ({
  match,
  onSaveScouting,
}) => {
  // Initialize scouting state
  const [scouting, setScouting] = useState<ScoutingAdverse>(() => {
    return match.scoutingAdverse && match.scoutingAdverse.joueurs?.length === 11
      ? match.scoutingAdverse
      : generateDefaultScouting(match);
  });

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [evalModalPlayerId, setEvalModalPlayerId] = useState<string | null>(null);
  const [customAnnotationInput, setCustomAnnotationInput] = useState('');
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'synthese'>('editor');

  const pitchRef = useRef<HTMLDivElement>(null);

  // Sync when match changes
  useEffect(() => {
    if (match.scoutingAdverse && match.scoutingAdverse.joueurs?.length === 11) {
      setScouting(match.scoutingAdverse);
    } else {
      const generated = generateDefaultScouting(match);
      setScouting(generated);
      onSaveScouting(generated);
    }
  }, [match.id]);

  // Selected player reference
  const selectedPlayer = scouting.joueurs.find((j) => j.id === selectedPlayerId) || scouting.joueurs[0];
  const evaluatingPlayer = scouting.joueurs.find((j) => j.id === evalModalPlayerId) || null;

  // Helper to commit changes
  const updateScouting = (newScouting: ScoutingAdverse) => {
    setScouting(newScouting);
    onSaveScouting(newScouting);
  };

  // Change opponent formation
  const handleSystemeChange = (newSys: string) => {
    const preset = (newSys in FORMATION_PRESETS
      ? FORMATION_PRESETS[newSys as SystemeTactique]
      : FORMATION_PRESETS['4-4-2']);

    const updatedJoueurs = scouting.joueurs.map((j, idx) => {
      const role = preset.roles[idx] || { roleLabel: 'Joueur', x: 50, y: 50 };
      return {
        ...j,
        roleLabel: role.roleLabel,
        x: role.x,
        y: role.y,
      };
    });

    updateScouting({
      ...scouting,
      systeme: newSys,
      joueurs: updatedJoueurs,
    });
  };

  // Reset positions to preset coordinates
  const handleResetPositions = () => {
    const preset = (scouting.systeme in FORMATION_PRESETS
      ? FORMATION_PRESETS[scouting.systeme as SystemeTactique]
      : FORMATION_PRESETS['4-4-2']);

    const updatedJoueurs = scouting.joueurs.map((j, idx) => {
      const role = preset.roles[idx] || { roleLabel: j.roleLabel, x: 50, y: 50 };
      return {
        ...j,
        roleLabel: role.roleLabel,
        x: role.x,
        y: role.y,
      };
    });

    updateScouting({
      ...scouting,
      joueurs: updatedJoueurs,
    });
  };

  // Dragging logic
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(id);
    setSelectedPlayerId(id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(id);
    setSelectedPlayerId(id);
    if (e.touches[0]) {
      setDragStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(6, Math.min(94, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(6, Math.min(94, ((clientY - rect.top) / rect.height) * 100));

    const updated = scouting.joueurs.map((j) =>
      j.id === isDragging
        ? { ...j, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
        : j
    );

    updateScouting({
      ...scouting,
      joueurs: updated,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handlePointerMove(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(null);
  };

  // Update a single player's scouting info
  const handleUpdatePlayer = (updatedPlayer: JoueurAdverseTactique) => {
    const updatedJoueurs = scouting.joueurs.map((j) =>
      j.id === updatedPlayer.id ? updatedPlayer : j
    );
    updateScouting({
      ...scouting,
      joueurs: updatedJoueurs,
    });
  };

  // Quick indication (level) change: Très faible, Faible, Correct, Bon joueur, Très bon joueur
  const setPlayerIndication = (playerId: string, indication: NiveauJoueurAdverse) => {
    const updatedJoueurs = scouting.joueurs.map((j) =>
      j.id === playerId ? { ...j, indication } : j
    );
    updateScouting({
      ...scouting,
      joueurs: updatedJoueurs,
    });
  };

  // Multiple annotations management
  const toggleAnnotationForPlayer = (playerId: string, annotationLabel: string) => {
    const target = scouting.joueurs.find((j) => j.id === playerId);
    if (!target) return;
    const currentList = getPlayerAnnotations(target);
    const exists = currentList.includes(annotationLabel);
    const nextList = exists
      ? currentList.filter((a) => a !== annotationLabel)
      : [...currentList, annotationLabel];

    handleUpdatePlayer({
      ...target,
      annotations: nextList,
      caracteristique: nextList.join(', '),
    });
  };

  const addCustomAnnotationForPlayer = (playerId: string, customLabel: string) => {
    const trimmed = customLabel.trim();
    if (!trimmed) return;
    const target = scouting.joueurs.find((j) => j.id === playerId);
    if (!target) return;
    const currentList = getPlayerAnnotations(target);
    if (!currentList.includes(trimmed)) {
      const nextList = [...currentList, trimmed];
      handleUpdatePlayer({
        ...target,
        annotations: nextList,
        caracteristique: nextList.join(', '),
      });
    }
    setCustomAnnotationInput('');
  };

  const removeAnnotationFromPlayer = (playerId: string, labelToRemove: string) => {
    const target = scouting.joueurs.find((j) => j.id === playerId);
    if (!target) return;
    const currentList = getPlayerAnnotations(target);
    const nextList = currentList.filter((a) => a !== labelToRemove);
    handleUpdatePlayer({
      ...target,
      annotations: nextList,
      caracteristique: nextList.join(', '),
    });
  };

  // Threat count breakdown
  const statsThreat = {
    'faible +': scouting.joueurs.filter((j) => j.indication === 'faible +'),
    'faible': scouting.joueurs.filter((j) => j.indication === 'faible'),
    'moyen': scouting.joueurs.filter((j) => j.indication === 'moyen'),
    'fort': scouting.joueurs.filter((j) => j.indication === 'fort'),
    'fort+': scouting.joueurs.filter((j) => j.indication === 'fort+'),
  };

  // Export Canvas Image of the Opponent Pitch
  const handleExportScouting = () => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    const width = 900;
    const height = 1150;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Title banner
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, width, 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SCOUTING ADVERSE : ${match.adversaire.toUpperCase()}`, width / 2, 45);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(
      `Système : ${scouting.systeme} • Préparation du match retour • FootStats Season`,
      width / 2,
      72
    );

    // Draw football pitch
    const pX = 50;
    const pY = 95;
    const pW = 800;
    const pH = 900;

    // Grass stripes
    ctx.fillStyle = '#166534';
    ctx.fillRect(pX, pY, pW, pH);

    ctx.fillStyle = '#15803d';
    const stripes = 6;
    for (let i = 0; i < stripes; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(pX, pY + (i * pH) / stripes, pW, pH / stripes);
      }
    }

    // Pitch white lines
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(pX, pY, pW, pH);

    // Center line and circle
    ctx.beginPath();
    ctx.moveTo(pX, pY + pH / 2);
    ctx.lineTo(pX + pW, pY + pH / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pX + pW / 2, pY + pH / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    ctx.strokeRect(pX + pW / 2 - 130, pY, 260, 120);
    ctx.strokeRect(pX + pW / 2 - 130, pY + pH - 120, 260, 120);

    // Draw players
    scouting.joueurs.forEach((j) => {
      const px = pX + (j.x / 100) * pW;
      const py = pY + (j.y / 100) * pH;

      // Outer ring based on threat level
      ctx.save();
      const nCfg = NIVEAU_CONFIG[j.indication];
      const strokeColor = nCfg.hex;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${j.numero}`, px, py);

      // Name plate
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      const textWidth = Math.max(70, ctx.measureText(j.nom).width);
      ctx.fillRect(px - textWidth / 2 - 6, py + 30, textWidth + 12, 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(j.nom, px, py + 41);

      // Characteristic badge if present
      if (j.caracteristique) {
        ctx.fillStyle = '#f59e0b';
        const caracWidth = ctx.measureText(j.caracteristique).width;
        ctx.fillRect(px - caracWidth / 2 - 4, py + 54, caracWidth + 8, 16);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(j.caracteristique, px, py + 62);
      }

      // Indication badge
      ctx.fillStyle = strokeColor;
      ctx.fillRect(px - 36, py - 38, 72, 17);
      ctx.fillStyle = j.indication === 'moyen' ? '#000000' : '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(nCfg.shortLabel, px, py - 29);
    });

    // Bottom notes
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(
      `Plan match retour : ${scouting.consignesRetour?.slice(0, 110) || 'Préparation active'}...`,
      width / 2,
      height - 25
    );

    // Download link
    const link = document.createElement('a');
    link.download = `scouting-adverse-${match.adversaire.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsExporting(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                Scouting Tactique Adverse
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-semibold">
                Anticipation Match Retour
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Schéma de jeu de {match.adversaire}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Opponent System Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Système adverse :</span>
            <select
              value={scouting.systeme}
              onChange={(e) => handleSystemeChange(e.target.value)}
              className="bg-transparent text-red-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="4-4-2 Losange">4-4-2 Losange (4-1-2-1-2)</option>
              <option value="4-3-3">4-3-3 Classique</option>
              <option value="4-2-3-1">4-2-3-1 Équilibré</option>
              <option value="4-4-2">4-4-2 À plat</option>
              <option value="3-5-2">3-5-2 Moderne</option>
              <option value="3-4-3">3-4-3 Offensif</option>
              <option value="5-3-2">5-3-2 Défensif</option>
              <option value="4-1-4-1">4-1-4-1 Bloc Médian</option>
            </select>
          </div>

          <button
            onClick={handleResetPositions}
            title="Réinitialiser le positionnement par défaut"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aligner</span>
          </button>

          <button
            onClick={handleExportScouting}
            disabled={isExporting}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-3 rounded-xl transition-colors text-xs flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Export...' : 'Exporter Schéma'}</span>
          </button>
        </div>
      </div>

      {/* Threat Distribution Summary Strip - Order: Très faible (Rouge), Faible (Orange), Correct (Jaune), Bon joueur (Vert), Très bon joueur (Bleu) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {NIVEAUX_LIST.map((lvl) => {
          const cfg = NIVEAU_CONFIG[lvl];
          const count = statsThreat[lvl].length;
          return (
            <div
              key={lvl}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                count > 0
                  ? `${cfg.bgPill} border-current/30`
                  : 'bg-slate-900/60 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </span>
                <span className="text-lg font-black">{count}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {lvl === 'faible +' && '🔴 Rouge - Cible prioritaire'}
                {lvl === 'faible' && '🟠 Orange - À presser'}
                {lvl === 'moyen' && '🟡 Jaune - Équilibré'}
                {lvl === 'fort' && '🟢 Vert - Danger réel'}
                {lvl === 'fort+' && '🔵 Bleu - Menace n°1'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Pitch & Tactical Editor Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start justify-center">
        {/* TACTICAL PITCH (Visible full screen without scrolling) */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div
            ref={pitchRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseUp={handlePointerUp}
            onTouchEnd={handlePointerUp}
            className="tactical-pitch-field relative aspect-[2/3] w-full max-w-[520px] min-h-[480px] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 select-none cursor-default bg-emerald-900 mx-auto"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #15803d 0px, #15803d 36px, #16a34a 36px, #16a34a 72px)',
            }}
          >
            {/* Subtle grass vignette */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/35 pointer-events-none" />

            {/* SVG Pitch Markings - Official Soccer Field */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 150" preserveAspectRatio="none">
              {/* Outer line */}
              <rect x="5" y="5" width="90" height="140" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />

              {/* Halfway line */}
              <line x1="5" y1="75" x2="95" y2="75" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />

              {/* Center circle */}
              <circle cx="50" cy="75" r="14" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.9)" />

              {/* Top Penalty Area (Adversaire - Attaque) */}
              <rect x="22" y="5" width="56" height="24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <rect x="34" y="5" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <circle cx="50" cy="18" r="0.8" fill="rgba(255,255,255,0.9)" />
              <path d="M 40 29 A 10 10 0 0 0 60 29" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              {/* Top Goal */}
              <rect x="42" y="2.5" width="16" height="2.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />

              {/* Bottom Penalty Area (Adversaire - Gardien) */}
              <rect x="22" y="121" width="56" height="24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <rect x="34" y="136" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <circle cx="50" cy="132" r="0.8" fill="rgba(255,255,255,0.9)" />
              <path d="M 40 121 A 10 10 0 0 1 60 121" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              {/* Bottom Goal */}
              <rect x="42" y="145" width="16" height="2.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />

              {/* Corner Arcs */}
              <path d="M 5 8 A 3 3 0 0 0 8 5" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
              <path d="M 92 5 A 3 3 0 0 0 95 8" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
              <path d="M 5 142 A 3 3 0 0 1 8 145" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
              <path d="M 92 145 A 3 3 0 0 1 95 142" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
            </svg>

            {/* Banner Overlays on Pitch */}
            <div className="absolute top-4 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
              <span className="bg-black/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 shadow">
                🛡️ {match.adversaire} ({scouting.systeme})
              </span>
              <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                Terrain Tactique Adverse
              </span>
            </div>

            {/* 11 Opponent Players on Pitch (CLICK TO CHOOSE LEVEL & PARTICULAR ANNOTATIONS) */}
            {scouting.joueurs.map((joueur) => {
              const cfg = NIVEAU_CONFIG[joueur.indication];
              const isSelected = selectedPlayer?.id === joueur.id;
              const playerAnnots = getPlayerAnnotations(joueur);

              return (
                <div
                  key={joueur.id}
                  onMouseDown={(e) => handleMouseDown(joueur.id, e)}
                  onTouchStart={(e) => handleTouchStart(joueur.id, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlayerId(joueur.id);
                    setEvalModalPlayerId(joueur.id);
                  }}
                  style={{
                    left: `${joueur.x}%`,
                    top: `${joueur.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group z-20 transition-all ${
                    isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                  }`}
                  title="Cliquer pour choisir le niveau (Très faible à Très bon) et les annotations"
                >
                  {/* Evaluation Badge above Player (Niveau de Très faible à Très bon) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerId(joueur.id);
                      setEvalModalPlayerId(joueur.id);
                    }}
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider mb-1 shadow-md whitespace-nowrap flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${cfg.colorBadge}`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.shortLabel}</span>
                  </button>

                  {/* Jersey Token Circle - Clean, High Contrast with Number (NO PHOTO) */}
                  <div
                    className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full overflow-hidden shadow-xl bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-950 scale-105 shadow-2xl'
                        : cfg.borderRing
                    }`}
                  >
                    <span className="text-white font-black text-lg sm:text-xl tracking-tight leading-none">
                      {joueur.numero}
                    </span>
                    <span className="text-[8px] uppercase font-bold text-slate-300 tracking-wider">
                      {joueur.roleLabel}
                    </span>
                  </div>

                  {/* Role & Name Tag below Player */}
                  <div className="mt-1 bg-slate-950/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md border border-slate-700/80 shadow text-center max-w-[95px]">
                    <span className="block text-[11px] font-extrabold truncate leading-tight">
                      {joueur.nom}
                    </span>
                  </div>

                  {/* Particular Multiple Annotations Badges */}
                  {playerAnnots.length > 0 && (
                    <div className="mt-1 flex flex-col items-center gap-0.5 max-w-[110px]">
                      {playerAnnots.slice(0, 2).map((annot, idx) => (
                        <span
                          key={idx}
                          title={annot}
                          className="bg-slate-950/95 text-amber-300 px-1.5 py-0.2 rounded text-[8px] font-bold border border-amber-400/40 shadow-xs truncate w-full text-center"
                        >
                          {annot}
                        </span>
                      ))}
                      {playerAnnots.length > 2 && (
                        <span className="text-[7.5px] font-black text-amber-300 bg-amber-950/70 border border-amber-400/30 px-1 rounded-full">
                          +{playerAnnots.length - 2} autre{playerAnnots.length - 2 > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mt-2 text-center flex items-center justify-center gap-1.5">
            <span>💡</span>
            <span>
              <strong>Glissez</strong> pour déplacer les joueurs. <strong>Cliquez</strong> sur un joueur pour choisir son <strong>niveau</strong> (rouge à bleu) et ses <strong>annotations</strong>.
            </span>
          </p>
        </div>

        {/* SIDEBAR : INDIVIDUAL SCOUTING EDITOR & MATCH RETOUR PLAN */}
        <div className="w-full lg:w-96 max-h-[calc(100vh-210px)] overflow-y-auto flex flex-col gap-3 pr-1">
          {/* Tabs for Sidebar: Player Edition vs Return Match Strategy */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Joueur Adverse N°{selectedPlayer.numero}</span>
            </button>
            <button
              onClick={() => setActiveTab('synthese')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'synthese'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Plan Match Retour</span>
            </button>
          </div>

          {activeTab === 'editor' ? (
            /* Selected Player Scouting Editor Card */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-md">
              {/* Header with Jersey Number & Quick Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-red-500/60 shadow flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">N°</span>
                  <span className="text-xl font-black text-white">{selectedPlayer.numero}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-sm truncate">
                      {selectedPlayer.nom}
                    </span>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {selectedPlayer.roleLabel}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
                        NIVEAU_CONFIG[selectedPlayer.indication].colorBadge
                      }`}
                    >
                      <span>{NIVEAU_CONFIG[selectedPlayer.indication].icon}</span>
                      <span>{NIVEAU_CONFIG[selectedPlayer.indication].label}</span>
                    </span>
                    {selectedPlayer.caracteristique && (
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {selectedPlayer.caracteristique}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Numéro de maillot */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block">N° de maillot</label>
                  <span className="text-[10px] text-slate-400">Numéro floqué de l'adversaire</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdatePlayer({
                        ...selectedPlayer,
                        numero: Math.max(1, selectedPlayer.numero - 1),
                      })
                    }
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 text-sm transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={selectedPlayer.numero}
                    onChange={(e) =>
                      handleUpdatePlayer({
                        ...selectedPlayer,
                        numero: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-14 bg-slate-900 border border-slate-700 text-white px-1.5 py-1.5 rounded-lg text-sm font-black text-center focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdatePlayer({
                        ...selectedPlayer,
                        numero: Math.min(99, selectedPlayer.numero + 1),
                      })
                    }
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Player Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nom / Rôle identifié</label>
                <input
                  type="text"
                  value={selectedPlayer.nom}
                  onChange={(e) =>
                    handleUpdatePlayer({ ...selectedPlayer, nom: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Choix du Niveau (5 niveaux avec couleurs rouge -> bleu) */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Niveau du joueur adverse :</span>
                  <span className="text-[10px] text-slate-400 font-normal">Rouge à Bleu</span>
                </label>

                <div className="grid grid-cols-1 gap-1.5">
                  {NIVEAUX_LIST.map((lvl) => {
                    const cfg = NIVEAU_CONFIG[lvl];
                    const isActive = selectedPlayer.indication === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPlayerIndication(selectedPlayer.id, lvl)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border cursor-pointer ${
                          isActive
                            ? `${cfg.colorBadge} ring-2 ring-white/60 shadow-lg scale-[1.01]`
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{cfg.icon}</span>
                          <span>{cfg.label}</span>
                        </span>
                        {isActive && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10.5px] text-slate-400 mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                  ℹ️ {NIVEAU_CONFIG[selectedPlayer.indication].description}
                </p>
              </div>

              {/* Choix de plusieurs annotations particulières parmi celles proposées */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Annotations particulières :</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {getPlayerAnnotations(selectedPlayer).length} active{getPlayerAnnotations(selectedPlayer).length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Badges des annotations actuellement sélectionnées */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-950 rounded-xl border border-slate-800 mb-2.5">
                  {getPlayerAnnotations(selectedPlayer).length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">
                      Aucune annotation sélectionnée. Cliquez ci-dessous pour en ajouter.
                    </span>
                  ) : (
                    getPlayerAnnotations(selectedPlayer).map((annot, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[11px] font-black border border-amber-300 shadow-xs"
                      >
                        <span>{annot}</span>
                        <button
                          type="button"
                          onClick={() => removeAnnotationFromPlayer(selectedPlayer.id, annot)}
                          className="hover:bg-amber-500 rounded-full w-3.5 h-3.5 flex items-center justify-center text-slate-950 hover:text-white transition-colors cursor-pointer"
                          title="Supprimer cette annotation"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Catalogue des annotations proposées groupées par catégorie */}
                <div className="space-y-2">
                  {(['Qualités & Forces', 'Faiblesses à cibler', 'Profil & Spécialité'] as const).map(
                    (cat) => {
                      const tagsInCat = ANNOTATIONS_PROPOSEES.filter((a) => a.category === cat);
                      const currentAnnots = getPlayerAnnotations(selectedPlayer);
                      return (
                        <div key={cat} className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                            {cat}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {tagsInCat.map((opt) => {
                              const isSelected = currentAnnots.includes(opt.label);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => toggleAnnotationForPlayer(selectedPlayer.id, opt.label)}
                                  className={`text-[10.5px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-xs'
                                      : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                                  }`}
                                >
                                  <span>{opt.icon}</span>
                                  <span>{opt.label}</span>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Ajout d'une annotation personnalisée */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customAnnotationInput}
                    placeholder="Ajouter une autre annotation personnalisée..."
                    onChange={(e) => setCustomAnnotationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAnnotationForPlayer(selectedPlayer.id, customAnnotationInput);
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      addCustomAnnotationForPlayer(selectedPlayer.id, customAnnotationInput)
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>

              {/* Return Match Specific Notes & Markings */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-red-400">
                    <Target className="w-3.5 h-3.5" />
                    Consignes & Faiblesses pour le match retour
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={selectedPlayer.notes || ''}
                  placeholder="Ex : Attaquer son dos sur transition, mauvais pied gauche, s'énerve si pressé haut, marquage individuel..."
                  onChange={(e) =>
                    handleUpdatePlayer({ ...selectedPlayer, notes: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>
          ) : (
            /* Return Match Plan & Synthesis Card */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-md">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-500" />
                  Plan Tactique Match Retour
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consignes tactiques synthétisées pour renverser ou dominer {match.adversaire}.
                </p>
              </div>

              {/* Danger list: Très bon joueur & Bon joueur */}
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl">
                <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Joueurs majeurs ({statsThreat['fort+'].length + statsThreat['fort'].length})
                </span>
                <div className="space-y-1.5 text-xs">
                  {[...statsThreat['fort+'], ...statsThreat['fort']].length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Aucun joueur classé Bon ou Très bon joueur.</p>
                  ) : (
                    [...statsThreat['fort+'], ...statsThreat['fort']].map((j) => (
                      <div
                        key={j.id}
                        onClick={() => {
                          setSelectedPlayerId(j.id);
                          setActiveTab('editor');
                        }}
                        className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-red-500/20 cursor-pointer hover:border-red-500 transition-colors"
                      >
                        <span className="text-red-400 font-bold">#{j.numero}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs">{j.nom}</span>
                            {j.caracteristique && (
                              <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1 py-0.2 rounded font-semibold">
                                {j.caracteristique}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {j.notes || 'Menace offensive majeure.'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Weakness list: Faible and Très faible */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Faiblesses à cibler ({statsThreat['faible +'].length + statsThreat['faible'].length})
                </span>
                <div className="space-y-1.5 text-xs">
                  {[...statsThreat['faible +'], ...statsThreat['faible']].length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Aucun point faible encore identifié.</p>
                  ) : (
                    [...statsThreat['faible +'], ...statsThreat['faible']].map((j) => (
                      <div
                        key={j.id}
                        onClick={() => {
                          setSelectedPlayerId(j.id);
                          setActiveTab('editor');
                        }}
                        className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20 cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <span className="text-emerald-400 font-bold">#{j.numero}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs">{j.nom}</span>
                            {j.caracteristique && (
                              <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1 py-0.2 rounded font-semibold">
                                {j.caracteristique}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {j.notes || 'Zone friable à exploiter.'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* General Return Match Guidelines */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Consignes générales causerie match retour :
                </label>
                <textarea
                  rows={3}
                  value={scouting.consignesRetour || ''}
                  onChange={(e) =>
                    updateScouting({ ...scouting, consignesRetour: e.target.value })
                  }
                  placeholder="Notes de causerie, déclencheurs de pressing, consignes sur coups de pied arrêtés..."
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL D'ÉVALUATION DIRECTE DU JOUEUR ADVERSE (Clic sur pastille/icône joueur) */}
      {evaluatingPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={() => setEvalModalPlayerId(null)}
        >
          <div
            className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4.5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 flex flex-col items-center justify-center shadow-lg ${
                    NIVEAU_CONFIG[evaluatingPlayer.indication].borderRing
                  }`}
                >
                  <span className="text-[9px] text-slate-400 font-bold uppercase">N°</span>
                  <span className="text-xl font-black text-white">{evaluatingPlayer.numero}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Évaluer : {evaluatingPlayer.nom}
                    </h3>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono font-bold">
                      {evaluatingPlayer.roleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Schéma adverse de {match.adversaire}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEvalModalPlayerId(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: Choix du niveau (Très faible, Faible, Correct, Bon joueur, Très bon joueur) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Niveau du joueur adverse :</span>
                </label>
                <span className="text-xs font-bold text-slate-400">
                  Actuel :{' '}
                  <span
                    className={`font-black px-1.5 py-0.5 rounded text-[11px] ${
                      NIVEAU_CONFIG[evaluatingPlayer.indication].colorBadge
                    }`}
                  >
                    {NIVEAU_CONFIG[evaluatingPlayer.indication].label}
                  </span>
                </span>
              </div>

              {/* 5 Boutons de niveau avec les couleurs exactes demandées */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {NIVEAUX_LIST.map((lvl) => {
                  const cfg = NIVEAU_CONFIG[lvl];
                  const isActive = evaluatingPlayer.indication === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPlayerIndication(evaluatingPlayer.id, lvl)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? `${cfg.colorBadge} ring-4 ring-white/80 scale-105 shadow-xl`
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-2xl mb-1">{cfg.icon}</span>
                      <span className="text-xs font-black text-center leading-tight">
                        {cfg.label}
                      </span>
                      <span className="text-[9.5px] opacity-80 mt-0.5 capitalize font-semibold">
                        {lvl === 'faible +' && 'Rouge'}
                        {lvl === 'faible' && 'Orange'}
                        {lvl === 'moyen' && 'Jaune'}
                        {lvl === 'fort' && 'Vert'}
                        {lvl === 'fort+' && 'Bleu'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 text-[11px] text-slate-400 p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <span className="text-base shrink-0">
                  {NIVEAU_CONFIG[evaluatingPlayer.indication].icon}
                </span>
                <span>{NIVEAU_CONFIG[evaluatingPlayer.indication].description}</span>
              </div>
            </div>

            {/* SECTION 2: Choix de plusieurs annotations particulières parmi celles proposées */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span>Annotations particulières :</span>
                </label>
                <span className="text-xs text-slate-400">
                  {getPlayerAnnotations(evaluatingPlayer).length} sélectionnée
                  {getPlayerAnnotations(evaluatingPlayer).length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Active Annotations Pills */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 bg-slate-950 rounded-2xl border border-slate-800 mb-3">
                {getPlayerAnnotations(evaluatingPlayer).length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Aucune annotation sélectionnée. Cliquez sur les propositions ci-dessous pour en ajouter.
                  </span>
                ) : (
                  getPlayerAnnotations(evaluatingPlayer).map((annot, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-xs font-black border border-amber-300 shadow-sm"
                    >
                      <span>{annot}</span>
                      <button
                        type="button"
                        onClick={() => removeAnnotationFromPlayer(evaluatingPlayer.id, annot)}
                        className="hover:bg-amber-500 rounded-full w-4 h-4 flex items-center justify-center text-slate-950 hover:text-white transition-colors cursor-pointer"
                        title="Retirer cette annotation"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Proposed catalogue grouped by category */}
              <div className="space-y-2.5">
                {(['Qualités & Forces', 'Faiblesses à cibler', 'Profil & Spécialité'] as const).map(
                  (cat) => {
                    const tagsInCat = ANNOTATIONS_PROPOSEES.filter((a) => a.category === cat);
                    const currentAnnots = getPlayerAnnotations(evaluatingPlayer);
                    return (
                      <div
                        key={cat}
                        className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80"
                      >
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                          {cat}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {tagsInCat.map((opt) => {
                            const isSelected = currentAnnots.includes(opt.label);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  toggleAnnotationForPlayer(evaluatingPlayer.id, opt.label)
                                }
                                className={`text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                  isSelected
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md scale-102'
                                    : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                                }`}
                              >
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Custom annotation input */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={customAnnotationInput}
                  placeholder="Ou tapez une annotation spécifique sur-mesure..."
                  onChange={(e) => setCustomAnnotationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomAnnotationForPlayer(evaluatingPlayer.id, customAnnotationInput);
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    addCustomAnnotationForPlayer(evaluatingPlayer.id, customAnnotationInput)
                  }
                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: Détails joueur (Numéro, Nom, Consignes retour) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-400 block">N° de maillot</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={evaluatingPlayer.numero}
                    onChange={(e) =>
                      handleUpdatePlayer({
                        ...evaluatingPlayer,
                        numero: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded-lg text-sm font-black text-center focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Nom identifié</label>
                  <input
                    type="text"
                    value={evaluatingPlayer.nom}
                    onChange={(e) =>
                      handleUpdatePlayer({ ...evaluatingPlayer, nom: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Consignes match retour :
                </label>
                <input
                  type="text"
                  value={evaluatingPlayer.notes || ''}
                  placeholder="Ex : Presser dès la réception, couvrir son pied fort..."
                  onChange={(e) =>
                    handleUpdatePlayer({ ...evaluatingPlayer, notes: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-2 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setEvalModalPlayerId(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Valider & Fermer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
