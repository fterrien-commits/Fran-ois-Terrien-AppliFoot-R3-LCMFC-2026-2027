import React, { useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  Move,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  CompositionMatch,
  FeuilleMatchLigne,
  Joueur,
  Match,
  PositionTactique,
  StatutMatchJoueur,
  SystemeTactique,
  STATUTS_MATCH_CONFIG,
  getLigneStatut,
} from '../types';
import { FORMATION_PRESETS, NOTE_PRESETS, getNoteColor } from '../mockData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface PitchTactiqueProps {
  match: Match;
  composition: CompositionMatch;
  feuilleMatch: FeuilleMatchLigne[];
  joueurs: Joueur[];
  onUpdateComposition: (newComp: CompositionMatch) => void;
  onUpdateFeuilleLigne: (updatedLigne: FeuilleMatchLigne) => void;
  readOnly?: boolean;
}

export const PitchTactique: React.FC<PitchTactiqueProps> = ({
  match,
  composition,
  feuilleMatch,
  joueurs,
  onUpdateComposition,
  onUpdateFeuilleLigne,
  readOnly = false,
}) => {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [selectedJoueurId, setSelectedJoueurId] = useState<string | null>(null);
  const [selectedPositionIndex, setSelectedPositionIndex] = useState<number | null>(null);
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState<'all' | 'G' | 'D' | 'M' | 'A'>('all');
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [exportingImage, setExportingImage] = useState(false);

  // Direct 0 to 10 player rating state
  const [ratingJoueurId, setRatingJoueurId] = useState<string | null>(null);

  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragMovedRef = useRef<boolean>(false);

  // Helper map for quick player lookup
  const joueursMap = new Map(joueurs.map((j) => [j.id, j]));
  const feuilleMap = new Map(feuilleMatch.map((f) => [f.joueurId, f]));

  // Selected position & player data for quick editing modal
  const selectedPosition: PositionTactique | null =
    selectedPositionIndex !== null && composition.positions[selectedPositionIndex]
      ? composition.positions[selectedPositionIndex]
      : composition.positions.find((p) => p.joueurId === selectedJoueurId) || null;

  const effectiveSelectedJoueurId = selectedPosition?.joueurId || selectedJoueurId;
  const selectedJoueur = effectiveSelectedJoueurId ? joueursMap.get(effectiveSelectedJoueurId) : null;
  const selectedFeuille = effectiveSelectedJoueurId ? feuilleMap.get(effectiveSelectedJoueurId) : null;

  // Rating modal target player
  const [clearRatingJoueurId, setClearRatingJoueurId] = useState<string | null>(null);
  const ratingJoueur = ratingJoueurId ? joueursMap.get(ratingJoueurId) : null;
  const ratingJoueurFeuille = ratingJoueurId ? feuilleMap.get(ratingJoueurId) : null;
  const isRatingJoueurStarter = ratingJoueurId
    ? composition.positions.some((p) => p.joueurId === ratingJoueurId)
    : false;

  // Starters IDs on the field
  const starterIds = new Set(composition.positions.map((p) => p.joueurId).filter(Boolean));

  // Substitutes (non-starters) sorted with bench / played players first
  const remplacants = joueurs
    .filter((j) => !starterIds.has(j.id))
    .sort((a, b) => {
      const fA = feuilleMap.get(a.id);
      const fB = feuilleMap.get(b.id);
      const isRempA = fA?.statut === 'remplacant' || (fA && fA.minutesJouees > 0) || (fA && fA.note !== null);
      const isRempB = fB?.statut === 'remplacant' || (fB && fB.minutesJouees > 0) || (fB && fB.note !== null);
      if (isRempA && !isRempB) return -1;
      if (!isRempA && isRempB) return 1;
      return (a.numero || 99) - (b.numero || 99);
    });

  // Direct Note update helper (for 0 to 10 rating popup)
  const handleDirectRating = (targetJoueurId: string, newNote: number | null) => {
    if (readOnly) return;
    const existing = feuilleMap.get(targetJoueurId);
    const isStarter = composition.positions.some((p) => p.joueurId === targetJoueurId);
    if (existing) {
      onUpdateFeuilleLigne({
        ...existing,
        note: newNote,
      });
    } else {
      onUpdateFeuilleLigne({
        id: `f_${match.id}_${targetJoueurId}`,
        matchId: match.id,
        joueurId: targetJoueurId,
        titulaire: isStarter,
        statut: isStarter ? 'titulaire' : 'remplacant',
        minutesJouees: isStarter ? 90 : 0,
        buts: 0,
        passesDecisives: 0,
        cartonsJaunes: 0,
        cartonsRouges: 0,
        note: newNote,
      });
    }
  };

  // Handle formation change
  const handleSystemeChange = (newSysteme: SystemeTactique) => {
    const preset = FORMATION_PRESETS[newSysteme];
    if (!preset) return;

    // Preserve existing players in order or map them
    const currentPositions = composition.positions;
    const newPositions = preset.roles.map((role, idx) => {
      const existingPlayerId = currentPositions[idx]?.joueurId || '';
      return {
        joueurId: existingPlayerId,
        roleLabel: role.roleLabel,
        x: role.x,
        y: role.y,
      };
    });

    onUpdateComposition({
      ...composition,
      systeme: newSysteme,
      positions: newPositions,
    });
  };

  // Reset positions to default preset coordinates
  const handleResetPositions = () => {
    const preset = FORMATION_PRESETS[composition.systeme] || FORMATION_PRESETS['4-3-3'];
    const newPositions = composition.positions.map((pos, idx) => {
      const defaultRole = preset.roles[idx] || { x: 50, y: 50, roleLabel: 'Joueur' };
      return {
        ...pos,
        roleLabel: defaultRole.roleLabel,
        x: defaultRole.x,
        y: defaultRole.y,
      };
    });
    onUpdateComposition({
      ...composition,
      positions: newPositions,
    });
  };

  // Dragging logic for repositioning players
  const handleMouseDown = (idx: number, joueurId: string, e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragMovedRef.current = false;
    setIsDragging(joueurId);
    setSelectedPositionIndex(idx);
    setSelectedJoueurId(joueurId);
  };

  const handleTouchStart = (idx: number, joueurId: string, e: React.TouchEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    if (e.touches[0]) {
      dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    dragMovedRef.current = false;
    setIsDragging(joueurId);
    setSelectedPositionIndex(idx);
    setSelectedJoueurId(joueurId);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !pitchRef.current) return;
    if (
      Math.hypot(clientX - dragStartPos.current.x, clientY - dragStartPos.current.y) > 6
    ) {
      dragMovedRef.current = true;
    }
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));

    const newPositions = composition.positions.map((pos) =>
      pos.joueurId === isDragging
        ? { ...pos, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
        : pos
    );

    onUpdateComposition({
      ...composition,
      positions: newPositions,
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
    if (isDragging) {
      setIsDragging(null);
    }
  };

  // Handle clicking on a token on the pitch
  const handleTokenClick = (idx: number, pos: PositionTactique) => {
    if (dragMovedRef.current) return; // user was dragging coordinates
    setSelectedPositionIndex(idx);
    setSelectedJoueurId(pos.joueurId);
    if (!readOnly) {
      setIsPlayerPickerOpen(true);
    }
  };

  // Assign or Swap a player to a specific pitch position
  const handleAssignPlayerToPosition = (newJoueurId: string, positionIndex: number) => {
    const targetPos = composition.positions[positionIndex];
    if (!targetPos) return;

    const oldJoueurId = targetPos.joueurId;
    if (oldJoueurId === newJoueurId) {
      setIsPlayerPickerOpen(false);
      return;
    }

    // Check if newJoueurId is already at another position on the pitch
    const existingPitchIdx = composition.positions.findIndex(
      (p, i) => i !== positionIndex && p.joueurId === newJoueurId
    );

    const newPositions = [...composition.positions];
    if (existingPitchIdx !== -1) {
      // SWAP the positions of both players
      newPositions[positionIndex] = { ...targetPos, joueurId: newJoueurId };
      newPositions[existingPitchIdx] = {
        ...newPositions[existingPitchIdx],
        joueurId: oldJoueurId,
      };
    } else {
      // Place newJoueurId at target position
      newPositions[positionIndex] = { ...targetPos, joueurId: newJoueurId };

      // Old player becomes substitute if replaced and not elsewhere
      if (oldJoueurId) {
        const oldFeuille = feuilleMap.get(oldJoueurId);
        if (oldFeuille) {
          onUpdateFeuilleLigne({
            ...oldFeuille,
            titulaire: false,
            statut: 'remplacant',
          });
        }
      }
    }

    // New player becomes starter
    const newFeuille = feuilleMap.get(newJoueurId);
    if (newFeuille) {
      onUpdateFeuilleLigne({
        ...newFeuille,
        titulaire: true,
        statut: 'titulaire',
        minutesJouees: newFeuille.minutesJouees > 0 ? newFeuille.minutesJouees : 90,
      });
    } else {
      onUpdateFeuilleLigne({
        id: `f_${match.id}_${newJoueurId}`,
        matchId: match.id,
        joueurId: newJoueurId,
        titulaire: true,
        statut: 'titulaire',
        minutesJouees: 90,
        buts: 0,
        passesDecisives: 0,
        cartonsJaunes: 0,
        cartonsRouges: 0,
        note: null,
      });
    }

    onUpdateComposition({
      ...composition,
      positions: newPositions,
    });

    setSelectedJoueurId(newJoueurId);
    setIsPlayerPickerOpen(false);
  };

  // Export tactical image using HTML5 Canvas (including player photos and notes)
  const handleExportImage = async () => {
    setExportingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 900;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setExportingImage(false);
        return;
      }

      // Preload player images for canvas rendering
      const imageMap = new Map<string, HTMLImageElement>();
      await Promise.all(
        composition.positions.map(async (pos) => {
          const joueur = joueursMap.get(pos.joueurId);
          if (joueur?.photo) {
            try {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise<void>((resolve) => {
                img.onload = () => {
                  imageMap.set(joueur.id, img);
                  resolve();
                };
                img.onerror = () => resolve();
                img.src = joueur.photo;
              });
            } catch {
              // Ignore load error
            }
          }
        })
      );

      // 1. Draw Field Background with grass stripes
      const stripeCount = 10;
      const stripeHeight = height / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1b5e20' : '#2e7d32';
        ctx.fillRect(0, i * stripeHeight, width, stripeHeight);
      }

      // 2. Draw Pitch Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 4;

      const margin = 40;
      const pW = width - 2 * margin;
      const pH = height - 2 * margin;

      // Pitch Outer border
      ctx.strokeRect(margin, margin, pW, pH);

      // Halfway Line
      ctx.beginPath();
      ctx.moveTo(margin, height / 2);
      ctx.lineTo(width - margin, height / 2);
      ctx.stroke();

      // Center Circle
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 85, 0, Math.PI * 2);
      ctx.stroke();

      // Center Spot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Top Penalty Area (Opponent)
      ctx.strokeRect(width / 2 - 160, margin, 320, 160);
      ctx.strokeRect(width / 2 - 80, margin, 160, 60);
      ctx.beginPath();
      ctx.arc(width / 2, margin + 110, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width / 2, margin + 110, 60, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();

      // Bottom Penalty Area (Our goal)
      ctx.strokeRect(width / 2 - 160, height - margin - 160, 320, 160);
      ctx.strokeRect(width / 2 - 80, height - margin - 60, 160, 60);
      ctx.beginPath();
      ctx.arc(width / 2, height - margin - 110, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width / 2, height - margin - 110, 60, 1.25 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();

      // Top Goal & Bottom Goal
      ctx.strokeRect(width / 2 - 50, margin - 16, 100, 16);
      ctx.strokeRect(width / 2 - 50, height - margin, 100, 16);

      // Header Banner with Match Info
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(margin, margin + 8, pW, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Notre Équipe ${match.scoreEquipe} - ${match.scoreAdverse} ${match.adversaire}`,
        width / 2,
        margin + 36
      );
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        `${match.competition} • Système : ${composition.systeme} • ${match.lieu} (${match.domicileExterieur === 'domicile' ? 'Dom.' : 'Ext.'})`,
        width / 2,
        margin + 58
      );

      // 3. Draw Players, Photos, and Notes Badges
      composition.positions.forEach((pos) => {
        const joueur = joueursMap.get(pos.joueurId);
        const fLigne = feuilleMap.get(pos.joueurId);
        const px = margin + (pos.x / 100) * pW;
        const py = margin + (pos.y / 100) * pH;
        const radius = 28;

        // Player photo or circle
        const loadedImg = joueur ? imageMap.get(joueur.id) : null;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.clip();

        if (loadedImg) {
          ctx.drawImage(loadedImg, px - radius, py - radius, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${joueur?.numero || '?'}`, px, py);
        }
        ctx.restore();

        // Border circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Jersey number badge at bottom-left if photo is displayed
        if (loadedImg && joueur?.numero) {
          ctx.save();
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(px - 18, py + 18, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${joueur.numero}`, px - 18, py + 18);
          ctx.restore();
        }

        // Name plate under circle with role
        const nom = joueur ? `${joueur.nom}` : 'Joueur';
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        const textWidth = ctx.measureText(nom).width;
        ctx.fillRect(px - textWidth / 2 - 10, py + 32, textWidth + 20, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nom, px, py + 43);
        ctx.restore();

        // Note badge incrustation with exact requested nuances (CRITICAL: Displays obtained rating)
        const note = fLigne?.note;
        const noteColorCfg = getNoteColor(note);
        const noteBg = noteColorCfg.hex;
        const noteTextColor = noteColorCfg.textHex;

        const noteText = note !== null && note !== undefined ? `★ ${note.toFixed(1)}` : '-';
        ctx.save();
        ctx.fillStyle = noteBg;
        ctx.beginPath();
        ctx.arc(px + 22, py - 18, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = noteTextColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(noteText, px + 22, py - 18);
        ctx.restore();

        // Goals badge if scored
        if (fLigne && fLigne.buts > 0) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(px - 22, py - 18, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`⚽${fLigne.buts > 1 ? fLigne.buts : ''}`, px - 22, py - 18);
        }
      });

      // Trigger download
      const link = document.createElement('a');
      link.download = `compo-tactique-${match.adversaire.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExportingImage(false);
    }
  };

  // Quick note update helper
  const handleUpdateNote = (newNote: number | null) => {
    if (!effectiveSelectedJoueurId) return;
    const existing = feuilleMap.get(effectiveSelectedJoueurId);
    if (existing) {
      onUpdateFeuilleLigne({
        ...existing,
        note: newNote,
      });
    } else {
      onUpdateFeuilleLigne({
        id: `f_${match.id}_${effectiveSelectedJoueurId}`,
        matchId: match.id,
        joueurId: effectiveSelectedJoueurId,
        titulaire: true,
        minutesJouees: 90,
        buts: 0,
        passesDecisives: 0,
        cartonsJaunes: 0,
        cartonsRouges: 0,
        note: newNote,
      });
    }
  };

  const handleUpdateField = (field: keyof FeuilleMatchLigne, val: number) => {
    if (!effectiveSelectedJoueurId) return;
    const existing = feuilleMap.get(effectiveSelectedJoueurId);
    if (existing) {
      onUpdateFeuilleLigne({
        ...existing,
        [field]: Math.max(0, val),
      });
    }
  };

  const handleUpdateStatut = (newStatut: StatutMatchJoueur) => {
    if (!effectiveSelectedJoueurId) return;
    const isTitulaire = newStatut === 'titulaire';
    const isRemplacant = newStatut === 'remplacant';
    const isActif = isTitulaire || isRemplacant;

    const existing = feuilleMap.get(effectiveSelectedJoueurId);
    if (existing) {
      onUpdateFeuilleLigne({
        ...existing,
        statut: newStatut,
        titulaire: isTitulaire,
        minutesJouees: !isActif ? 0 : isTitulaire ? Math.max(existing.minutesJouees, 90) : existing.minutesJouees,
      });
    } else {
      onUpdateFeuilleLigne({
        id: `f_${match.id}_${effectiveSelectedJoueurId}`,
        matchId: match.id,
        joueurId: effectiveSelectedJoueurId,
        titulaire: isTitulaire,
        statut: newStatut,
        minutesJouees: isTitulaire ? 90 : 0,
        buts: 0,
        passesDecisives: 0,
        cartonsJaunes: 0,
        cartonsRouges: 0,
        note: null,
      });
    }
  };

  // Filtered players for the Player Picker modal
  const filteredPickerJoueurs = joueurs.filter((j) => {
    // Category filter
    if (pickerCategory === 'G' && j.poste !== 'G') return false;
    if (pickerCategory === 'D' && !['DC', 'DD', 'DG'].includes(j.poste)) return false;
    if (pickerCategory === 'M' && !['MDC', 'MC', 'MO'].includes(j.poste)) return false;
    if (pickerCategory === 'A' && !['BU', 'AD', 'AG'].includes(j.poste)) return false;

    // Search query
    if (!pickerSearch.trim()) return true;
    const q = pickerSearch.toLowerCase();
    return (
      j.nom.toLowerCase().includes(q) ||
      j.prenom.toLowerCase().includes(q) ||
      (j.surnom && j.surnom.toLowerCase().includes(q)) ||
      j.numero.toString().includes(q) ||
      j.poste.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col xl:flex-row items-start gap-6 max-w-7xl mx-auto py-2">
      {/* Tactical Pitch Board Column with Field + Lateral Substitutes Bench */}
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Pitch Toolbar */}
        <div className="w-full max-w-[850px] flex items-center justify-between gap-3 mb-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl shadow-md">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Système de jeu :
            </label>
            <select
              id="select-systeme-tactique"
              value={composition.systeme}
              onChange={(e) => handleSystemeChange(e.target.value as SystemeTactique)}
              disabled={readOnly}
              className="bg-slate-800 border border-slate-700 text-emerald-400 font-semibold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {Object.keys(FORMATION_PRESETS).map((key) => (
                <option key={key} value={key}>
                  {key} - {FORMATION_PRESETS[key as SystemeTactique].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                id="btn-reinit-positions"
                onClick={handleResetPositions}
                title="Réaligner les positions du système"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Réaligner</span>
              </button>
            )}

            <button
              id="btn-exporter-image-terrain"
              onClick={handleExportImage}
              disabled={exportingImage}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportingImage ? 'Génération...' : 'Télécharger l\'image tactique'}</span>
            </button>
          </div>
        </div>

        {/* Guidance Hint */}
        {!readOnly && (
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-3 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-800/60 shadow-xs max-w-[850px] w-full">
            <span className="text-emerald-400 font-bold">💡 Astuce :</span>
            <span>
              Cliquez directement sur la <strong className="text-amber-300">photo d'un joueur</strong> (sur le terrain ou le banc) pour <strong className="text-white">choisir sa note de 0 à 10</strong>
            </span>
          </div>
        )}

        {/* Interactive Pitch Stage & Lateral Substitutes Side-by-Side */}
        <div className="w-full max-w-[850px] flex flex-col lg:flex-row items-stretch justify-center gap-4">
          {/* Pitch Canvas Field */}
          <div
            ref={pitchRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseUp={handlePointerUp}
            onTouchEnd={handlePointerUp}
            className="relative w-full max-w-[500px] aspect-[2/3] min-h-[480px] bg-emerald-900 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl select-none mx-auto shrink-0"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, #15803d 0px, #15803d 36px, #16a34a 36px, #16a34a 72px)`,
            }}
          >
            {/* Subtle grass vignette */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/35 pointer-events-none" />

            {/* SVG Pitch Markings */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 150" preserveAspectRatio="none">
              {/* Outer line */}
              <rect x="5" y="5" width="90" height="140" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />

              {/* Halfway line */}
              <line x1="5" y1="75" x2="95" y2="75" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />

              {/* Center circle */}
              <circle cx="50" cy="75" r="14" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.9)" />

              {/* Top Penalty Area (Adversaire) */}
              <rect x="22" y="5" width="56" height="24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <rect x="34" y="5" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              <circle cx="50" cy="18" r="0.8" fill="rgba(255,255,255,0.9)" />
              <path d="M 40 29 A 10 10 0 0 0 60 29" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
              {/* Top Goal */}
              <rect x="42" y="2.5" width="16" height="2.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />

              {/* Bottom Penalty Area (Notre équipe / Gardien) */}
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

            {/* Tactical Direction Arrow Watermark */}
            <div className="absolute top-4 left-6 text-[10px] font-bold tracking-wider uppercase text-white/40 flex items-center gap-1 pointer-events-none">
              <span>Sens d'attaque ➔</span>
            </div>

            {/* 11 Players Positioning with Photos and Ratings */}
            {composition.positions.map((pos, idx) => {
              const joueur = joueursMap.get(pos.joueurId);
              const fLigne = feuilleMap.get(pos.joueurId);
              const noteObj = getNoteColor(fLigne?.note ?? null);
              const isSelected =
                selectedPositionIndex === idx || effectiveSelectedJoueurId === pos.joueurId;

              return (
                <div
                  key={`${pos.joueurId || idx}`}
                  id={`token-joueur-${pos.joueurId || idx}`}
                  onMouseDown={(e) => handleMouseDown(idx, pos.joueurId, e)}
                  onTouchStart={(e) => handleTouchStart(idx, pos.joueurId, e)}
                  onClick={() => handleTokenClick(idx, pos)}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute cursor-pointer group touch-none transition-all active:scale-95 z-10 ${
                    isSelected ? 'scale-110 z-30' : ''
                  }`}
                >
                  {/* Player Token Container */}
                  <div className="relative flex flex-col items-center">
                    {/* NOTE OBTENUE BADGE (CRITICAL REQUIREMENT - CLICKABLE TO RATE) */}
                    <button
                      type="button"
                      title={
                        fLigne?.note !== null && fLigne?.note !== undefined
                          ? `Note obtenue : ${fLigne.note.toFixed(1)}/10 (Cliquer pour modifier de 0 à 10)`
                          : 'Non noté (Cliquer pour noter de 0 à 10)'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (joueur) {
                          setRatingJoueurId(joueur.id);
                        } else {
                          handleTokenClick(idx, pos);
                        }
                      }}
                      className={`absolute -top-2.5 -right-2.5 z-20 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black shadow-lg border flex items-center gap-0.5 transition-transform hover:scale-125 cursor-pointer ${
                        fLigne?.note !== null && fLigne?.note !== undefined
                          ? `${noteObj.bg} ${noteObj.text} ${noteObj.border}`
                          : 'bg-slate-900/95 text-slate-400 border-slate-700'
                      }`}
                    >
                      {fLigne?.note !== null && fLigne?.note !== undefined ? (
                        <>
                          <span className="text-[9px]">★</span>
                          <span>{fLigne.note.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="px-0.5 font-bold text-[9px]">-</span>
                      )}
                    </button>

                    {/* Goal / Assist / Card Badges at top-left */}
                    <div className="absolute -top-2 -left-3 z-20 flex flex-col gap-0.5 pointer-events-none">
                      {fLigne && fLigne.buts > 0 && (
                        <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-1 rounded-full shadow border border-amber-300">
                          ⚽{fLigne.buts > 1 ? fLigne.buts : ''}
                        </span>
                      )}
                      {fLigne && fLigne.passesDecisives > 0 && (
                        <span className="bg-blue-400 text-blue-950 font-black text-[9px] px-1 rounded-full shadow border border-blue-300">
                          🎯{fLigne.passesDecisives > 1 ? fLigne.passesDecisives : ''}
                        </span>
                      )}
                      {fLigne && fLigne.cartonsJaunes > 0 && (
                        <span className="w-2.5 h-3.5 bg-yellow-400 rounded-[2px] shadow border border-yellow-300 inline-block" />
                      )}
                      {fLigne && fLigne.cartonsRouges > 0 && (
                        <span className="w-2.5 h-3.5 bg-red-600 rounded-[2px] shadow border border-red-500 inline-block" />
                      )}
                    </div>

                    {/* Player Round Token with PHOTO (CRITICAL: CLICK DIRECTEMENT SUR PHOTO POUR NOTER) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (joueur) {
                          setRatingJoueurId(joueur.id);
                        } else {
                          handleTokenClick(idx, pos);
                        }
                      }}
                      title={
                        joueur
                          ? `Cliquer sur la photo pour noter ${joueur.prenom} ${joueur.nom} (de 0 à 10)`
                          : 'Poste vacant - Cliquer pour assigner un joueur'
                      }
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center shadow-xl transition-all cursor-pointer group/photo ${
                        isSelected
                          ? 'border-yellow-300 ring-4 ring-yellow-400/50 scale-105'
                          : 'border-white/90 bg-slate-900 group-hover:border-amber-400 group-hover:scale-105'
                      }`}
                    >
                      {joueur?.photo ? (
                        <img
                          src={joueur.photo}
                          alt={joueur.nom}
                          className="w-full h-full object-cover pointer-events-none"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.player-photo-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`player-photo-fallback w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900 text-white font-extrabold ${
                          joueur?.photo ? 'hidden' : 'flex'
                        }`}
                      >
                        <span className="text-sm font-black text-amber-300">#{joueur?.numero || idx + 1}</span>
                        <span className="text-[8px] uppercase font-bold text-slate-300">{pos.roleLabel}</span>
                      </div>

                      {/* Hover Overlay: Cliquer pour noter */}
                      {joueur && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px] opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center text-white transition-opacity pointer-events-none">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-[8px] font-black uppercase tracking-wider text-amber-300">Noter</span>
                        </div>
                      )}
                    </div>

                    {/* Jersey Number Micro-badge at bottom-left */}
                    <span className="absolute -bottom-1 -left-1 z-20 bg-slate-950/95 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full border border-slate-700 shadow-md">
                      #{joueur?.numero || idx + 1}
                    </span>

                    {/* Name Tag Below Token */}
                    <div className="mt-1 flex flex-col items-center">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950/90 backdrop-blur-xs text-white font-bold text-[10px] sm:text-[11px] leading-tight shadow border border-white/20 whitespace-nowrap max-w-[90px] truncate">
                        {joueur ? `${joueur.nom}` : `Pos ${idx + 1}`}
                      </span>
                      <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/80 px-1 rounded border border-emerald-700/50 mt-0.5">
                        {pos.roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* REMPLAÇANTS SUR LE CÔTÉ DU TERRAIN (BANC DE TOUCHE OFFICIEL AVEC NOTES)    */}
          {/* ========================================================================= */}
          <div
            id="panel-remplacants-lateral"
            className="w-full lg:w-72 xl:w-80 bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col shrink-0"
          >
            {/* Header of lateral dugout */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center font-bold text-xs border border-red-500/30">
                  <Users className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Remplaçants
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Banc de touche ({remplacants.length} joueurs)
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>Photo = Noter</span>
              </span>
            </div>

            {/* List of Substitutes */}
            <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2 pr-1 custom-scrollbar">
              {remplacants.map((j) => {
                const f = feuilleMap.get(j.id);
                const noteCfg = getNoteColor(f?.note);
                const isSelected = effectiveSelectedJoueurId === j.id;

                return (
                  <div
                    key={j.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Substitute Photo (CLICK DIRECTEMENT POUR NOTER DE 0 À 10) */}
                      <div
                        onClick={() => setRatingJoueurId(j.id)}
                        className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-slate-700 hover:border-amber-400 cursor-pointer shrink-0 group/subphoto transition-all hover:scale-105 shadow"
                        title={`Cliquer sur la photo pour noter ${j.prenom} ${j.nom} (de 0 à 10)`}
                      >
                        {j.photo ? (
                          <img
                            src={j.photo}
                            alt={j.nom}
                            className="w-full h-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.sub-photo-fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`sub-photo-fallback w-full h-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs ${
                            j.photo ? 'hidden' : 'flex'
                          }`}
                        >
                          #{j.numero}
                        </div>

                        {/* Hover Overlay indicating clicking rates the player */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/subphoto:opacity-100 flex flex-col items-center justify-center text-white transition-opacity pointer-events-none">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-[7px] font-black uppercase text-amber-300">Noter</span>
                        </div>

                        {/* Micro jersey number */}
                        <span className="absolute -bottom-1 -left-1 bg-slate-950 text-white font-black text-[8px] px-1 rounded-full border border-slate-700 shadow">
                          #{j.numero}
                        </span>
                      </div>

                      {/* Name, Position & Performance preview */}
                      <div
                        onClick={() => {
                          setSelectedJoueurId(j.id);
                          setSelectedPositionIndex(null);
                        }}
                        className="min-w-0 flex-1 cursor-pointer"
                        title="Cliquer pour inspecter ou remplacer sur le terrain"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs truncate max-w-[105px]">
                            {j.prenom} {j.nom}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-1 py-0.2 rounded border border-slate-700">
                            {j.poste}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                          {f && f.minutesJouees > 0 ? (
                            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded">
                              ⏱ {f.minutesJouees}'
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">Banc</span>
                          )}
                          {f && f.buts > 0 && <span className="text-amber-400 font-bold">⚽{f.buts}</span>}
                          {f && f.passesDecisives > 0 && <span className="text-blue-400 font-bold">🎯{f.passesDecisives}</span>}
                          {f && f.cartonsJaunes > 0 && <span className="w-2 h-3 bg-yellow-400 rounded-[1px] inline-block" />}
                        </div>
                      </div>
                    </div>

                    {/* Note Badge on the side (Clickable to rate 0 to 10!) */}
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      <button
                        type="button"
                        onClick={() => setRatingJoueurId(j.id)}
                        className={`px-2 py-1 rounded-lg text-xs font-black shadow-xs border transition-all hover:scale-110 cursor-pointer flex items-center gap-0.5 ${
                          noteCfg.bg
                        } ${noteCfg.text} ${noteCfg.border}`}
                        title={`Note obtenue : ${
                          f?.note !== null && f?.note !== undefined ? f.note.toFixed(1) : 'Non noté'
                        } (Cliquer pour noter de 0 à 10)`}
                      >
                        <span className="text-[10px]">★</span>
                        <span>{f?.note !== null && f?.note !== undefined ? f.note.toFixed(1) : '-'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {remplacants.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Tous les joueurs sont actuellement sur le terrain.
                </div>
              )}
            </div>

            {/* Quick helper footer for side dugout */}
            <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{remplacants.filter((j) => (feuilleMap.get(j.id)?.note !== null && feuilleMap.get(j.id)?.note !== undefined)).length} notés</span>
              <button
                type="button"
                onClick={() => {
                  if (remplacants[0]) setRatingJoueurId(remplacants[0].id);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Noter un remplaçant ➔
              </button>
            </div>
          </div>
        </div>

        {/* Global Squad Quick bar (Effectif complet disponible / indisponible) */}
        <div className="w-full max-w-[850px] mt-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Effectif & Convocations du match
            </h4>
            <span className="text-[11px] text-slate-500">
              {joueurs.length} joueurs au club • {composition.positions.length} sur le terrain • {remplacants.length} remplaçants
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {joueurs.map((j) => {
              const isStarter = starterIds.has(j.id);
              const f = feuilleMap.get(j.id);
              const statut = f ? getLigneStatut(f) : isStarter ? 'titulaire' : 'remplacant';
              const cfg = STATUTS_MATCH_CONFIG[statut];
              const isSelected = selectedJoueurId === j.id;
              const noteCfg = getNoteColor(f?.note);

              return (
                <button
                  key={j.id}
                  onClick={() => {
                    setSelectedJoueurId(j.id);
                    setSelectedPositionIndex(null);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 text-white ring-1 ring-amber-400'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setRatingJoueurId(j.id);
                    }}
                    className="relative w-4 h-4 rounded-full overflow-hidden border border-slate-700 hover:border-amber-400 shrink-0"
                    title="Cliquer sur la photo pour noter (0 à 10)"
                  >
                    {j.photo ? (
                      <img
                        src={j.photo}
                        alt={j.nom}
                        className="w-full h-full object-cover pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">#{j.numero}</span>
                  <span className="font-semibold truncate max-w-[80px]">{j.nom}</span>
                  <span className={`text-[10px] px-1 rounded font-bold border ml-0.5 ${cfg.badgeClass}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  {f?.note !== null && f?.note !== undefined && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setRatingJoueurId(j.id);
                      }}
                      className={`text-[9px] px-1 rounded font-black border ${noteCfg.bg} ${noteCfg.text} ${noteCfg.border}`}
                    >
                      ★ {f.note.toFixed(1)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side Panel: Quick Player Inspection, Position Assignment & Note Editing */}
      <div className="w-full xl:w-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Poste & Note de Match
            </h3>
          </div>
          {effectiveSelectedJoueurId && (
            <button
              onClick={() => {
                setSelectedJoueurId(null);
                setSelectedPositionIndex(null);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {selectedPosition && !readOnly && (
          <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-600/40 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                Poste sélectionné : <strong className="text-white">{selectedPosition.roleLabel}</strong>
              </span>
              <button
                onClick={() => setIsPlayerPickerOpen(true)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                Parcourir
              </button>
            </div>
            <button
              id="btn-ouvrir-selecteur-joueur-pitch"
              onClick={() => setIsPlayerPickerOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Choisir le joueur pour ce poste</span>
            </button>
          </div>
        )}

        {selectedJoueur ? (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Player Info Card */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <img
                src={selectedJoueur.photo}
                alt={selectedJoueur.nom}
                className="w-12 h-12 rounded-full object-cover border border-emerald-500/50 shadow"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-white truncate">
                    {selectedJoueur.prenom} {selectedJoueur.nom}
                  </span>
                  {selectedJoueur.surnom && (
                    <span className="text-emerald-400 font-bold italic text-xs">
                      « {selectedJoueur.surnom} »
                    </span>
                  )}
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                    #{selectedJoueur.numero}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                  <span>Poste : {selectedJoueur.poste}</span>
                  {selectedJoueur.age !== undefined && <span>• {selectedJoueur.age} ans</span>}
                  {selectedJoueur.piedFort && <span>• 👟 {selectedJoueur.piedFort}</span>}
                  {selectedJoueur.vma !== undefined && (
                    <span className="text-emerald-400 font-bold">• ⚡ VMA {selectedJoueur.vma} km/h</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Dropdown: Assign/Switch Player at this spot */}
            {selectedPositionIndex !== null && !readOnly && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Joueur à ce poste ({selectedPosition?.roleLabel}) :</span>
                  <button
                    onClick={() => setIsPlayerPickerOpen(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px]"
                  >
                    + Vue effectif
                  </button>
                </label>
                <select
                  id="select-changement-joueur-pitch"
                  value={selectedPosition?.joueurId || ''}
                  onChange={(e) => handleAssignPlayerToPosition(e.target.value, selectedPositionIndex)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  {joueurs.map((j) => {
                    const isAlreadyOnPitch = composition.positions.some(
                      (p, idx) => idx !== selectedPositionIndex && p.joueurId === j.id
                    );
                    return (
                      <option key={j.id} value={j.id}>
                        #{j.numero} {j.prenom} {j.nom} ({j.poste}){' '}
                        {isAlreadyOnPitch ? '— (déjà titulaire - permutera)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Rôle & Statut sur ce match */}
            {(() => {
              const currentStatut = selectedFeuille ? getLigneStatut(selectedFeuille) : 'non_convoque';
              const cfg = STATUTS_MATCH_CONFIG[currentStatut];
              return (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Rôle / Statut sur ce match :
                    </label>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${cfg.badgeClass}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  {!readOnly && (
                    <select
                      id="select-statut-joueur-pitch"
                      value={currentStatut}
                      onChange={(e) => handleUpdateStatut(e.target.value as StatutMatchJoueur)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    >
                      {(Object.keys(STATUTS_MATCH_CONFIG) as StatutMatchJoueur[]).map((key) => {
                        const c = STATUTS_MATCH_CONFIG[key];
                        return (
                          <option key={key} value={key}>
                            {c.icon} {c.label}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              );
            })()}

            {/* Note Editor Slider & Quick Buttons */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  Note obtenue au match :
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-sm font-black shadow-sm ${
                      getNoteColor(selectedFeuille?.note ?? null).bg
                    } ${getNoteColor(selectedFeuille?.note ?? null).text}`}
                  >
                    {selectedFeuille?.note !== null && selectedFeuille?.note !== undefined
                      ? `★ ${selectedFeuille.note.toFixed(1)} / 10`
                      : 'Non noté'}
                  </span>
                </div>
              </div>

              {/* Range input slider */}
              <input
                id="slider-note-joueur"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={selectedFeuille?.note ?? 6.0}
                onChange={(e) => handleUpdateNote(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              {/* 11 Buttons from 0 to 10 with exact requested nuanced colors */}
              <div className="grid grid-cols-6 gap-1 pt-1">
                {NOTE_PRESETS.map((p) => {
                  const isSelected =
                    selectedFeuille?.note !== null &&
                    selectedFeuille?.note !== undefined &&
                    Math.round(selectedFeuille.note) === p.note;
                  const colorCfg = getNoteColor(p.note);

                  return (
                    <button
                      key={p.note}
                      type="button"
                      onClick={() => handleUpdateNote(p.note)}
                      className={`py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                        colorCfg.bg
                      } ${colorCfg.border} ${
                        isSelected
                          ? 'ring-2 ring-white scale-105 z-10 shadow-md'
                          : 'opacity-85 hover:opacity-100 hover:scale-102'
                      } ${colorCfg.text}`}
                      title={p.label}
                    >
                      {p.note}
                    </button>
                  );
                })}
              </div>

              {/* Button to open direct rating dialog */}
              {effectiveSelectedJoueurId && (
                <button
                  type="button"
                  onClick={() => setRatingJoueurId(effectiveSelectedJoueurId)}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-950/80 border border-amber-700/60 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Ouvrir sélecteur grand format 0-10</span>
                </button>
              )}

              {selectedFeuille?.note !== null && selectedFeuille?.note !== undefined && (
                <button
                  onClick={() => handleUpdateNote(null)}
                  className="text-[11px] text-slate-400 hover:text-rose-400 underline text-right transition-colors"
                >
                  Effacer la note
                </button>
              )}
            </div>

            {/* Quick Match Performance Counters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-400">Temps de jeu (min)</span>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      handleUpdateField('minutesJouees', (selectedFeuille?.minutesJouees || 0) - 15)
                    }
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-white text-sm">
                    {selectedFeuille?.minutesJouees || 0}'
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateField('minutesJouees', (selectedFeuille?.minutesJouees || 0) + 15)
                    }
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-400">Buts marqués ⚽</span>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      handleUpdateField('buts', (selectedFeuille?.buts || 0) - 1)
                    }
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-amber-400 text-sm">
                    {selectedFeuille?.buts || 0}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateField('buts', (selectedFeuille?.buts || 0) + 1)
                    }
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-400">Passes décs 🎯</span>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      handleUpdateField('passesDecisives', (selectedFeuille?.passesDecisives || 0) - 1)
                    }
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-blue-400 text-sm">
                    {selectedFeuille?.passesDecisives || 0}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateField('passesDecisives', (selectedFeuille?.passesDecisives || 0) + 1)
                    }
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                <span className="text-slate-400">Cartons (J / R)</span>
                <div className="flex items-center justify-around">
                  <button
                    onClick={() =>
                      handleUpdateField(
                        'cartonsJaunes',
                        (selectedFeuille?.cartonsJaunes || 0) === 0 ? 1 : 0
                      )
                    }
                    className={`px-2 py-0.5 rounded font-bold ${
                      (selectedFeuille?.cartonsJaunes || 0) > 0
                        ? 'bg-yellow-400 text-yellow-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    🟨 {(selectedFeuille?.cartonsJaunes || 0)}
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateField(
                        'cartonsRouges',
                        (selectedFeuille?.cartonsRouges || 0) === 0 ? 1 : 0
                      )
                    }
                    className={`px-2 py-0.5 rounded font-bold ${
                      (selectedFeuille?.cartonsRouges || 0) > 0
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    🟥 {(selectedFeuille?.cartonsRouges || 0)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <UserCheck className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Aucun joueur sélectionné</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Cliquez sur une pastille sur le terrain pour choisir le joueur à ce poste et ajuster sa note.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Choisir le joueur pour ce poste (CRITICAL REQUIREMENT) */}
      {isPlayerPickerOpen && selectedPosition && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                    <span>Choisir le joueur pour le poste :</span>
                    <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-md text-sm">
                      {selectedPosition.roleLabel}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Système : <strong>{composition.systeme}</strong> • Cliquez sur un joueur pour l'assigner à ce poste.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPlayerPickerOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Occupant summary bar */}
            {selectedJoueur && (
              <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-400">Actuellement à ce poste :</span>
                  <img
                    src={selectedJoueur.photo}
                    alt={selectedJoueur.nom}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-500/50"
                    referrerPolicy="no-referrer"
                  />
                  <strong className="text-white">
                    #{selectedJoueur.numero} {selectedJoueur.prenom} {selectedJoueur.nom}
                  </strong>
                </div>
                {selectedFeuille?.note !== null && selectedFeuille?.note !== undefined && (
                  <span className="text-emerald-400 font-bold">
                    Note actuelle : ★ {selectedFeuille.note.toFixed(1)}/10
                  </span>
                )}
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, surnom, numéro ou poste..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'Tous' },
                    { id: 'G', label: 'Gardiens' },
                    { id: 'D', label: 'Défenseurs' },
                    { id: 'M', label: 'Milieux' },
                    { id: 'A', label: 'Attaquants' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setPickerCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                      pickerCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Grid List */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPickerJoueurs.map((j) => {
                const isCurrentOccupant = selectedPosition.joueurId === j.id;
                const otherPitchPos = composition.positions.find(
                  (p, idx) => idx !== selectedPositionIndex && p.joueurId === j.id
                );
                const isElsewhereOnPitch = !!otherPitchPos;
                const f = feuilleMap.get(j.id);
                const noteVal = f?.note;

                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() =>
                      handleAssignPlayerToPosition(j.id, selectedPositionIndex!)
                    }
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isCurrentOccupant
                        ? 'bg-emerald-950/50 border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-md'
                        : isElsewhereOnPitch
                        ? 'bg-slate-950/70 border-blue-500/40 hover:border-blue-400 hover:bg-slate-900'
                        : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/70 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Photo Avatar */}
                      <div className="relative shrink-0">
                        {j.photo ? (
                          <img
                            src={j.photo}
                            alt={j.nom}
                            className="w-11 h-11 rounded-full object-cover border border-slate-700 shadow"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-xs">
                            #{j.numero}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -left-1 bg-slate-950 text-white font-extrabold text-[9px] px-1 py-0.2 rounded-full border border-slate-700 shadow">
                          #{j.numero}
                        </span>
                      </div>

                      {/* Info Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-white text-sm truncate">
                            {j.prenom} {j.nom}
                          </span>
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-slate-700">
                            {j.poste}
                          </span>
                        </div>

                        {/* Status Label */}
                        <div className="flex items-center gap-1.5 mt-1 text-xs">
                          {f?.statut === 'suspendu' ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                              ⛔ Suspendu pour ce match
                            </span>
                          ) : isCurrentOccupant ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              En place à ce poste
                            </span>
                          ) : isElsewhereOnPitch ? (
                            <span className="text-blue-400 font-semibold flex items-center gap-1 text-[11px]">
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              Permutera avec {otherPitchPos.roleLabel}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              Disponible sur le banc / groupe
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Note badge if already graded */}
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      {noteVal !== null && noteVal !== undefined ? (
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-black shadow-xs ${
                            getNoteColor(noteVal).bg
                          } ${getNoteColor(noteVal).text}`}
                        >
                          ★ {noteVal.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-medium">
                          Non noté
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isCurrentOccupant
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 group-hover:bg-emerald-600 group-hover:text-white'
                        }`}
                      >
                        {isCurrentOccupant ? 'Sélectionné' : 'Choisir'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredPickerJoueurs.length === 0 && (
                <div className="col-span-2 py-8 text-center text-slate-400">
                  <p className="text-sm font-semibold">Aucun joueur trouvé</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Essayez de modifier votre recherche ou le filtre de catégorie.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {joueurs.length} joueurs au total dans l'effectif
              </span>
              <button
                type="button"
                onClick={() => setIsPlayerPickerOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : NOTER DIRECTEMENT LE JOUEUR (DE 0 À 10)                           */}
      {/* ========================================================================= */}
      {ratingJoueur && (
        <div
          id="modal-noter-joueur-direct"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRatingJoueurId(null);
          }}
        >
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {ratingJoueur.photo ? (
                    <img
                      src={ratingJoueur.photo}
                      alt={ratingJoueur.nom}
                      className="w-13 h-13 rounded-full object-cover border-2 border-slate-600 shadow"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base">
                      #{ratingJoueur.numero}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -left-1 bg-slate-950 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full border border-slate-700 shadow">
                    #{ratingJoueur.numero}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {ratingJoueur.prenom} {ratingJoueur.nom}
                    </h3>
                    <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700">
                      {ratingJoueur.poste}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs font-semibold ${isRatingJoueurStarter ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isRatingJoueurStarter ? '⚽ Titulaire sur le terrain' : '🪑 Remplaçant sur le côté'}
                    </span>
                    {ratingJoueurFeuille?.note !== null && ratingJoueurFeuille?.note !== undefined ? (
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-black shadow-xs ${
                          getNoteColor(ratingJoueurFeuille.note).bg
                        } ${getNoteColor(ratingJoueurFeuille.note).text} ${
                          getNoteColor(ratingJoueurFeuille.note).border
                        } border`}
                      >
                        ★ {ratingJoueurFeuille.note.toFixed(1)} / 10
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Non noté</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRatingJoueurId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note Selector Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Attribuer une note (choix de 0 à 10) :
                </label>
                {ratingJoueurFeuille?.note !== null && ratingJoueurFeuille?.note !== undefined && (
                  <button
                    type="button"
                    onClick={() => setClearRatingJoueurId(ratingJoueur.id)}
                    className="text-xs text-slate-400 hover:text-rose-400 underline transition-colors cursor-pointer"
                  >
                    Effacer la note
                  </button>
                )}
              </div>

              {/* 11 Buttons from 0 to 10 with exact requested nuanced colors */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {NOTE_PRESETS.map((p) => {
                  const isSelected =
                    ratingJoueurFeuille?.note !== null &&
                    ratingJoueurFeuille?.note !== undefined &&
                    Math.round(ratingJoueurFeuille.note) === p.note;
                  const colorCfg = getNoteColor(p.note);

                  return (
                    <button
                      key={p.note}
                      type="button"
                      onClick={() => handleDirectRating(ratingJoueur.id, p.note)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all active:scale-95 shadow-md cursor-pointer ${
                        colorCfg.bg
                      } ${colorCfg.border} ${
                        isSelected
                          ? 'ring-4 ring-white/80 scale-105 z-10 shadow-xl'
                          : 'hover:scale-105 hover:brightness-110 opacity-90 hover:opacity-100'
                      }`}
                      title={p.label}
                    >
                      <span className={`text-2xl font-black ${colorCfg.text}`}>
                        {p.note}
                      </span>
                      <span className="text-[10px] font-bold opacity-90 mt-0.5 truncate max-w-[65px] text-center">
                        {p.note === 0 && 'Noir'}
                        {p.note === 1 && 'Rouge f.'}
                        {p.note === 2 && 'Rouge'}
                        {p.note === 3 && 'Orange f.'}
                        {p.note === 4 && 'Orange'}
                        {p.note === 5 && 'Ambre'}
                        {p.note === 6 && 'Jaune'}
                        {p.note === 7 && 'Vert clair'}
                        {p.note === 8 && 'Vert foncé'}
                        {p.note === 9 && 'Bleu ciel'}
                        {p.note === 10 && 'Bleu roi'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Half-point (+0.5) quick adjustments */}
              <div className="mt-3 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-400">
                  Précision demi-point :
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleDirectRating(ratingJoueur.id, val)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        ratingJoueurFeuille?.note === val
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-300'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Match Stats for this player */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 mb-2 block">
                Statistiques du joueur sur ce match :
              </span>
              <div className="grid grid-cols-4 gap-2">
                {/* Minutes */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400">Minutes</span>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = ratingJoueurFeuille?.minutesJouees ?? 0;
                        handleDirectRating(ratingJoueur.id, ratingJoueurFeuille?.note ?? null);
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({ ...ratingJoueurFeuille, minutesJouees: Math.max(0, cur - 15) });
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-white min-w-[28px] text-center">
                      {ratingJoueurFeuille?.minutesJouees ?? 0}'
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = ratingJoueurFeuille?.minutesJouees ?? 0;
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({ ...ratingJoueurFeuille, minutesJouees: Math.min(120, cur + 15) });
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buts */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400">⚽ Buts</span>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = ratingJoueurFeuille?.buts ?? 0;
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({ ...ratingJoueurFeuille, buts: Math.max(0, cur - 1) });
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-amber-400 min-w-[20px] text-center">
                      {ratingJoueurFeuille?.buts ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = ratingJoueurFeuille?.buts ?? 0;
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({ ...ratingJoueurFeuille, buts: cur + 1 });
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Passes */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400">🎯 Passes</span>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = ratingJoueurFeuille?.passesDecisives ?? 0;
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({ ...ratingJoueurFeuille, passesDecisives: Math.max(0, cur - 1) });
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-blue-400 min-w-[20px] text-center">
                      {ratingJoueurFeuille?.passesDecisives ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = ratingJoueurFeuille?.passesDecisives ?? 0;
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({ ...ratingJoueurFeuille, passesDecisives: cur + 1 });
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cartons */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-between">
                  <span className="text-[10px] text-slate-400">Cartons</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({
                            ...ratingJoueurFeuille,
                            cartonsJaunes: ratingJoueurFeuille.cartonsJaunes > 0 ? 0 : 1,
                          });
                        }
                      }}
                      className={`w-4 h-6 rounded-[2px] border transition-all cursor-pointer ${
                        ratingJoueurFeuille && ratingJoueurFeuille.cartonsJaunes > 0
                          ? 'bg-yellow-400 border-yellow-300 ring-2 ring-yellow-400/50'
                          : 'bg-yellow-950/40 border-yellow-800/60 opacity-40 hover:opacity-80'
                      }`}
                      title="Carton Jaune"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (ratingJoueurFeuille) {
                          onUpdateFeuilleLigne({
                            ...ratingJoueurFeuille,
                            cartonsRouges: ratingJoueurFeuille.cartonsRouges > 0 ? 0 : 1,
                          });
                        }
                      }}
                      className={`w-4 h-6 rounded-[2px] border transition-all cursor-pointer ${
                        ratingJoueurFeuille && ratingJoueurFeuille.cartonsRouges > 0
                          ? 'bg-red-600 border-red-500 ring-2 ring-red-500/50'
                          : 'bg-red-950/40 border-red-800/60 opacity-40 hover:opacity-80'
                      }`}
                      title="Carton Rouge"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedJoueurId(ratingJoueur.id);
                  setRatingJoueurId(null);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Inspecter le poste et statut ➔
              </button>
              <button
                type="button"
                onClick={() => setRatingJoueurId(null)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Terminer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear Rating */}
      <ConfirmDeleteModal
        isOpen={clearRatingJoueurId !== null}
        title="Effacer la note du joueur"
        message="Êtes-vous sûr de vouloir effacer la note attribuée à ce joueur pour ce match ? La note sera retirée du calcul des moyennes du match et du tableau annuel des stats."
        confirmText="Effacer la note"
        onConfirm={() => {
          if (clearRatingJoueurId) {
            handleDirectRating(clearRatingJoueurId, null);
            setClearRatingJoueurId(null);
          }
        }}
        onClose={() => setClearRatingJoueurId(null)}
      />
    </div>
  );
};
