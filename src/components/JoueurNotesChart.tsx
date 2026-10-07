import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  Target,
} from 'lucide-react';
import { FeuilleMatchLigne, Match } from '../types';
import { getNoteColor } from '../mockData';

export interface JoueurNotesChartProps {
  joueurId: string;
  joueurNom: string;
  matchs: Match[];
  feuillesMatch: FeuilleMatchLigne[];
  onOpenMatch?: (match: Match) => void;
}

interface MatchNotePoint {
  matchId: string;
  match: Match;
  feuille: FeuilleMatchLigne;
  note: number;
  cumulativeAverage: number;
  matchNumber: number;
  dateFormatted: string;
}

export const JoueurNotesChart: React.FC<JoueurNotesChartProps> = ({
  joueurId,
  joueurNom,
  matchs,
  feuillesMatch,
  onOpenMatch,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const matchsMap = new Map(matchs.map((m) => [m.id, m]));

  // Find all matches played where this player has an assigned note
  const rawRatedMatches = feuillesMatch
    .filter(
      (f) =>
        f.joueurId === joueurId &&
        f.note !== null &&
        f.note !== undefined &&
        matchsMap.has(f.matchId)
    )
    .map((f) => ({
      feuille: f,
      match: matchsMap.get(f.matchId)!,
      note: Number(f.note),
    }))
    // Sort chronologically ascending (oldest to newest)
    .sort((a, b) => new Date(a.match.date).getTime() - new Date(b.match.date).getTime());

  // Keep the last 10 played & rated matches
  const last10 = rawRatedMatches.slice(-10);

  // Compute cumulative rolling average for each point
  const points: MatchNotePoint[] = last10.map((item, idx) => {
    const subsetNotes = last10.slice(0, idx + 1).map((x) => x.note);
    const cumulativeAverage =
      subsetNotes.reduce((acc, curr) => acc + curr, 0) / subsetNotes.length;

    let dateFormatted = item.match.date;
    try {
      const parts = item.match.date.split('-');
      if (parts.length === 3) {
        dateFormatted = `${parts[2]}/${parts[1]}`;
      }
    } catch {
      // keep original
    }

    return {
      matchId: item.match.id,
      match: item.match,
      feuille: item.feuille,
      note: item.note,
      cumulativeAverage: Number(cumulativeAverage.toFixed(2)),
      matchNumber: idx + 1,
      dateFormatted,
    };
  });

  if (points.length === 0) {
    return (
      <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
          <Award className="w-4 h-4 text-slate-500" />
          <span>Aucune note attribuée sur les derniers matchs joués</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Attribuez des notes aux joueurs sur la feuille de match ou le terrain tactique pour visualiser leur évolution.
        </p>
      </div>
    );
  }

  // Statistics across these matches
  const notesValues = points.map((p) => p.note);
  const avgNote = (
    notesValues.reduce((a, b) => a + b, 0) / notesValues.length
  ).toFixed(2);
  const minNote = Math.min(...notesValues);
  const maxNote = Math.max(...notesValues);

  // Recent trend (compare last 2-3 matches with earlier ones)
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendDelta = 0;
  if (points.length >= 3) {
    const recentCount = Math.min(3, Math.floor(points.length / 2));
    const recent = points.slice(-recentCount).map((p) => p.note);
    const earlier = points.slice(0, -recentCount).map((p) => p.note);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    trendDelta = Number((avgRecent - avgEarlier).toFixed(2));
    if (trendDelta >= 0.25) trend = 'up';
    else if (trendDelta <= -0.25) trend = 'down';
  }

  const avgColor = getNoteColor(Number(avgNote));

  // SVG Chart Geometry
  const width = 640;
  const height = 210;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 42;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Y-axis from 0 to 10
  const minY = 0;
  const maxY = 10;

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padTop + chartH - ((clamped - minY) / (maxY - minY)) * chartH;
  };

  const getX = (idx: number) => {
    if (points.length === 1) return padLeft + chartW / 2;
    return padLeft + (idx / (points.length - 1)) * chartW;
  };

  const noteCoords = points.map((p, i) => ({
    x: getX(i),
    y: getY(p.note),
    point: p,
  }));

  const avgCoords = points.map((p, i) => ({
    x: getX(i),
    y: getY(p.cumulativeAverage),
    point: p,
  }));

  // Line paths
  const noteLinePath = noteCoords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const noteAreaPath =
    noteCoords.length > 1
      ? `${noteLinePath} L ${noteCoords[noteCoords.length - 1].x.toFixed(1)} ${getY(
          0
        )} L ${noteCoords[0].x.toFixed(1)} ${getY(0)} Z`
      : '';

  const avgLinePath = avgCoords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  // Grid tick marks
  const yTicks = [0, 2, 4, 6, 8, 10];
  const refLineY = getY(6.0); // 6.0/10 reference threshold (good standard performance)

  const activeHover = hoveredIndex !== null ? points[hoveredIndex] : null;
  const activeCoord = hoveredIndex !== null ? noteCoords[hoveredIndex] : null;

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner">
      {/* Chart Header & KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
              Évolution des Notes Moyennes
            </h4>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
              {points.length === 10
                ? '10 derniers matchs'
                : `${points.length} dernier${points.length > 1 ? 's' : ''} match${
                    points.length > 1 ? 's' : ''
                  }`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Trajectoire match par match : notes individuelles et moyenne cumulée
          </p>
        </div>

        {/* Quick summary stats pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* 10-match average */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] font-semibold">Moyenne :</span>
            <span
              className={`font-black text-xs px-1.5 py-0.2 rounded border ${avgColor.bg} ${avgColor.text} ${avgColor.border}`}
            >
              {avgNote} / 10
            </span>
          </div>

          {/* Min / Max */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800/80">
            <span>Min <strong className="text-slate-200">{minNote}</strong></span>
            <span>•</span>
            <span>Max <strong className="text-emerald-300">{maxNote}</strong></span>
          </div>

          {/* Trend badge */}
          {points.length >= 3 && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-xl font-bold text-[10px] border ${
                trend === 'up'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : trend === 'down'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
              {trend === 'stable' && <Minus className="w-3 h-3 text-slate-400" />}
              <span>
                {trend === 'up'
                  ? `Progression (+${trendDelta})`
                  : trend === 'down'
                  ? `Baisse (${trendDelta})`
                  : 'Régulier'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-400 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.75 bg-emerald-400 rounded-full" />
          <span className="font-semibold text-slate-300">Note du match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
          <span className="font-semibold text-slate-300">Moyenne cumulée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-slate-600" />
          <span className="text-slate-500">Seuil 6.0/10</span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Area gradient for individual notes */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines & Y labels */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val} className="text-[10px]">
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeOpacity={val === 0 ? '0.6' : '0.25'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* 6.0 reference dashed benchmark line */}
          <line
            x1={padLeft}
            y1={refLineY}
            x2={width - padRight}
            y2={refLineY}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="4 4"
            strokeOpacity="0.5"
          />

          {/* Area fill */}
          {noteAreaPath && (
            <path d={noteAreaPath} fill="url(#areaGradient)" />
          )}

          {/* Cumulative Average Line (Dashed Cyan) */}
          {points.length > 1 && (
            <path
              d={avgLinePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />
          )}

          {/* Note Line (Vibrant Emerald) */}
          {points.length > 1 && (
            <path
              d={noteLinePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}

          {/* Active Hover vertical indicator */}
          {hoveredIndex !== null && activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={padTop}
                x2={activeCoord.x}
                y2={padTop + chartH}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Data points for notes */}
          {noteCoords.map((coord, idx) => {
            const isHovered = hoveredIndex === idx;
            const noteObj = getNoteColor(coord.point.note);
            return (
              <g
                key={coord.point.matchId}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onOpenMatch && onOpenMatch(coord.point.match)}
              >
                {/* Touch/mouse hover hit area */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="18"
                  fill="transparent"
                />

                {/* Outer halo when hovered */}
                {isHovered && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="9"
                    fill="#10b981"
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Main point */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? 6 : 4.5}
                  fill="#0f172a"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* Note value pill above the point */}
                <text
                  x={coord.x}
                  y={coord.y - (isHovered ? 11 : 8)}
                  textAnchor="middle"
                  fill={isHovered ? '#34d399' : '#94a3b8'}
                  fontSize={isHovered ? '10' : '8.5'}
                  fontWeight="bold"
                >
                  {coord.point.note}
                </text>

                {/* X-axis tick: Date or Match label */}
                <text
                  x={coord.x}
                  y={height - padBottom + 16}
                  textAnchor="middle"
                  fill={isHovered ? '#f8fafc' : '#64748b'}
                  fontSize="9"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {coord.point.dateFormatted}
                </text>

                {/* Opponent abbreviated name */}
                <text
                  x={coord.x}
                  y={height - padBottom + 28}
                  textAnchor="middle"
                  fill={isHovered ? '#34d399' : '#475569'}
                  fontSize="8"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  className="truncate"
                >
                  {coord.point.match.adversaire.length > 7
                    ? `${coord.point.match.adversaire.slice(0, 6)}.`
                    : coord.point.match.adversaire}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Floating Tooltip (HTML overlay) */}
        {activeHover && activeCoord && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-100"
            style={{
              left: `${Math.min(
                Math.max(activeCoord.x, 120),
                width - 120
              ) / width * 100}%`,
              top: '8px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-2.5 shadow-2xl text-xs min-w-[210px] text-white">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="font-bold text-white text-[11px] truncate">
                  vs {activeHover.match.adversaire}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                    activeHover.match.scoreEquipe > activeHover.match.scoreAdverse
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : activeHover.match.scoreEquipe === activeHover.match.scoreAdverse
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {activeHover.match.scoreEquipe} - {activeHover.match.scoreAdverse}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Note du match :</span>
                  <span
                    className={`font-black px-1.5 py-0.2 rounded ${
                      getNoteColor(activeHover.note).bg
                    } ${getNoteColor(activeHover.note).text}`}
                  >
                    {activeHover.note} / 10
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Moyenne cumulée :</span>
                  <span className="font-bold text-cyan-300">
                    {activeHover.cumulativeAverage} / 10
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
                  <span>
                    {activeHover.match.date} • {activeHover.match.domicileExterieur === 'domicile' ? 'Dom.' : 'Ext.'}
                  </span>
                  <span>{activeHover.feuille.minutesJouees}'</span>
                </div>

                {(activeHover.feuille.buts > 0 ||
                  activeHover.feuille.passesDecisives > 0 ||
                  activeHover.feuille.cartonsJaunes > 0 ||
                  activeHover.feuille.cartonsRouges > 0) && (
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-amber-300 font-bold">
                    {activeHover.feuille.buts > 0 && <span>⚽ {activeHover.feuille.buts}</span>}
                    {activeHover.feuille.passesDecisives > 0 && <span>🎯 {activeHover.feuille.passesDecisives}</span>}
                    {activeHover.feuille.cartonsJaunes > 0 && <span>🟨</span>}
                    {activeHover.feuille.cartonsRouges > 0 && <span>🟥</span>}
                  </div>
                )}
              </div>

              {onOpenMatch && (
                <div className="mt-1.5 pt-1 border-t border-slate-800 text-[9px] text-emerald-400/90 font-medium flex items-center justify-center gap-1">
                  <span>Cliquer pour ouvrir le match</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
