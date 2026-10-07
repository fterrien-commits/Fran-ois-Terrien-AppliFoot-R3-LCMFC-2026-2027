import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Flame,
  Home,
  MapPin,
  Search,
  Shield,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import {
  FeuilleMatchLigne,
  FiltreLieu,
  Joueur,
  Match,
  POSTES_CONFIG,
  StatsJoueurCumulees,
  TypeMatch,
  TYPES_MATCH_CONFIG,
  TYPES_MATCH_LIST,
  detectTypeMatch,
  getLigneStatut,
} from '../types';
import { getNoteColor } from '../mockData';

interface StatsRecapitulatifProps {
  joueurs: Joueur[];
  matchs: Match[];
  feuillesMatch: FeuilleMatchLigne[];
  onSelectJoueur?: (joueur: Joueur) => void;
}

type SortField =
  | 'nom'
  | 'poste'
  | 'matchsJoues'
  | 'minutesTotales'
  | 'moyenneMinutes'
  | 'butsTotaux'
  | 'moyenneButs'
  | 'passesTotales'
  | 'moyennePasses'
  | 'cartons'
  | 'moyenneCartons'
  | 'moyenneNotes';

type ViewMode = 'complet' | 'moyennes' | 'totaux';

export const StatsRecapitulatif: React.FC<StatsRecapitulatifProps> = ({
  joueurs,
  matchs,
  feuillesMatch,
  onSelectJoueur,
}) => {
  const [filtreTypeMatch, setFiltreTypeMatch] = useState<TypeMatch | 'tous'>('tous');
  const [filtreLieu, setFiltreLieu] = useState<FiltreLieu>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('Tous');
  const [sortField, setSortField] = useState<SortField>('butsTotaux');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('complet');

  const matchMap = useMemo(() => new Map(matchs.map((m) => [m.id, m])), [matchs]);

  // 1. Filtrer les matchs : inclusion automatique dès qu'un match est terminé, validé ou contient des statistiques
  const matchsFiltres = useMemo(() => {
    return matchs.filter((m) => {
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
      const isComptabilisable =
        m.statut === 'termine' || m.valide || hasFeuilleEvents || m.scoreEquipe > 0 || m.scoreAdverse > 0;

      if (!isComptabilisable) return false;
      if (filtreLieu === 'domicile' && m.domicileExterieur !== 'domicile') return false;
      if (filtreLieu === 'exterieur' && m.domicileExterieur !== 'exterieur') return false;
      if (filtreTypeMatch !== 'tous' && detectTypeMatch(m) !== filtreTypeMatch) return false;
      return true;
    });
  }, [matchs, feuillesMatch, filtreLieu, filtreTypeMatch]);

  const matchIdsFiltres = useMemo(() => {
    return new Set(matchsFiltres.map((m) => m.id));
  }, [matchsFiltres]);

  // 2. Feuilles de match filtrées
  const feuillesFiltrees = useMemo(() => {
    return feuillesMatch.filter((f) => matchIdsFiltres.has(f.matchId));
  }, [feuillesMatch, matchIdsFiltres]);

  // 3. Calculs d'équipe globaux (totaux et moyennes par match)
  const statsEquipe = useMemo(() => {
    let victoires = 0;
    let nuls = 0;
    let defaites = 0;
    let butsMarques = 0;
    let butsConcedes = 0;
    let cleanSheets = 0;

    matchsFiltres.forEach((m) => {
      butsMarques += m.scoreEquipe;
      butsConcedes += m.scoreAdverse;
      if (m.scoreAdverse === 0) cleanSheets++;

      if (m.scoreEquipe > m.scoreAdverse) victoires++;
      else if (m.scoreEquipe === m.scoreAdverse) nuls++;
      else defaites++;
    });

    const totalMatchs = matchsFiltres.length;
    const points = victoires * 3 + nuls;
    const diffButs = butsMarques - butsConcedes;

    // Totaux et moyennes des passes décisives et cartons
    let totalPassesEquipe = 0;
    let totalJaunesEquipe = 0;
    let totalRougesEquipe = 0;
    feuillesFiltrees.forEach((f) => {
      totalPassesEquipe += f.passesDecisives || 0;
      totalJaunesEquipe += f.cartonsJaunes || 0;
      totalRougesEquipe += f.cartonsRouges || 0;
    });
    const totalCartonsEquipe = totalJaunesEquipe + totalRougesEquipe;

    const moyenneButsMarquesParMatch = totalMatchs > 0 ? butsMarques / totalMatchs : 0;
    const moyenneButsConcedesParMatch = totalMatchs > 0 ? butsConcedes / totalMatchs : 0;
    const moyennePassesParMatch = totalMatchs > 0 ? totalPassesEquipe / totalMatchs : 0;
    const moyenneCartonsParMatch = totalMatchs > 0 ? totalCartonsEquipe / totalMatchs : 0;

    // Moyenne générale de toutes les notes saisies
    const notesValides = feuillesFiltrees
      .map((f) => f.note)
      .filter((n): n is number => n !== null && n !== undefined);
    const moyenneGeneraleNotes =
      notesValides.length > 0
        ? notesValides.reduce((a, b) => a + b, 0) / notesValides.length
        : null;

    return {
      totalMatchs,
      victoires,
      nuls,
      defaites,
      points,
      butsMarques,
      butsConcedes,
      diffButs,
      cleanSheets,
      totalPassesEquipe,
      totalJaunesEquipe,
      totalRougesEquipe,
      totalCartonsEquipe,
      moyenneButsMarquesParMatch,
      moyenneButsConcedesParMatch,
      moyennePassesParMatch,
      moyenneCartonsParMatch,
      moyenneGeneraleNotes,
    };
  }, [matchsFiltres, feuillesFiltrees]);

  // 4. Agrégation automatique des joueurs match par match (sommes et moyennes)
  const statsParJoueur = useMemo<StatsJoueurCumulees[]>(() => {
    return joueurs.map((joueur) => {
      const lignesJoueur = feuillesFiltrees.filter((f) => f.joueurId === joueur.id);

      let titularisations = 0;
      let remplacements = 0;
      let blessesCount = 0;
      let absentsCount = 0;
      let maladesCount = 0;
      let nonConvoquesCount = 0;
      let suspendusCount = 0;
      let equipeBCount = 0;
      let equipeCCount = 0;
      let minutesTotales = 0;
      let butsTotaux = 0;
      let passesTotales = 0;
      let cartonsJaunesTotaux = 0;
      let cartonsRougesTotaux = 0;

      const matchsParType: Record<TypeMatch, number> = {
        championnat: 0,
        coupe_de_france: 0,
        coupe_pays_de_loire: 0,
        amical: 0,
      };
      const butsParType: Record<TypeMatch, number> = {
        championnat: 0,
        coupe_de_france: 0,
        coupe_pays_de_loire: 0,
        amical: 0,
      };

      const notes: number[] = [];

      lignesJoueur.forEach((l) => {
        const statut = getLigneStatut(l);
        const matchObj = matchMap.get(l.matchId);
        if (matchObj) {
          const mType = detectTypeMatch(matchObj);
          if (statut === 'titulaire' || statut === 'remplacant' || (l.minutesJouees && l.minutesJouees > 0)) {
            matchsParType[mType] = (matchsParType[mType] || 0) + 1;
          }
          if (l.buts) {
            butsParType[mType] = (butsParType[mType] || 0) + l.buts;
          }
        }

        switch (statut) {
          case 'titulaire':
            titularisations++;
            break;
          case 'remplacant':
            remplacements++;
            break;
          case 'blesse':
            blessesCount++;
            break;
          case 'absent':
            absentsCount++;
            break;
          case 'malade':
            maladesCount++;
            break;
          case 'non_convoque':
            nonConvoquesCount++;
            break;
          case 'suspendu':
            suspendusCount++;
            break;
          case 'equipe_b':
            equipeBCount++;
            break;
          case 'equipe_c':
            equipeCCount++;
            break;
        }

        minutesTotales += l.minutesJouees || 0;
        butsTotaux += l.buts || 0;
        passesTotales += l.passesDecisives || 0;
        cartonsJaunesTotaux += l.cartonsJaunes || 0;
        cartonsRougesTotaux += l.cartonsRouges || 0;

        // Seuls les joueurs ayant joué ou alignés avec note ont une note comptabilisée
        if (
          l.note !== null &&
          l.note !== undefined &&
          (statut === 'titulaire' || statut === 'remplacant' || l.minutesJouees > 0)
        ) {
          notes.push(l.note);
        }
      });

      const matchsJoues = titularisations + remplacements;
      // Formule : Moyenne des notes = Somme des notes / nombre de matchs joués avec note
      const sommeNotes = notes.reduce((a, b) => a + b, 0);
      const moyenneNotes = notes.length > 0 ? sommeNotes / notes.length : null;

      // Calculs automatiques des moyennes individuelles par match
      const denomMatchs = matchsJoues > 0 ? matchsJoues : 1;
      const moyenneButs = matchsJoues > 0 ? Number((butsTotaux / denomMatchs).toFixed(2)) : 0;
      const moyennePasses = matchsJoues > 0 ? Number((passesTotales / denomMatchs).toFixed(2)) : 0;
      const moyenneCartons =
        matchsJoues > 0
          ? Number(((cartonsJaunesTotaux + cartonsRougesTotaux) / denomMatchs).toFixed(2))
          : 0;
      const moyenneMinutes = matchsJoues > 0 ? Math.round(minutesTotales / denomMatchs) : 0;
      const ratioButsMinutes =
        minutesTotales > 0 ? Number(((butsTotaux * 90) / minutesTotales).toFixed(2)) : 0;

      return {
        joueur,
        matchsJoues,
        titularisations,
        remplacements,
        blessesCount,
        absentsCount,
        maladesCount,
        nonConvoquesCount,
        suspendusCount,
        equipeBCount,
        equipeCCount,
        minutesTotales,
        butsTotaux,
        passesTotales,
        cartonsJaunesTotaux,
        cartonsRougesTotaux,
        moyenneNotes,
        nombreNotes: notes.length,
        matchsParType,
        butsParType,
        moyenneButs,
        moyennePasses,
        moyenneCartons,
        moyenneMinutes,
        ratioButsMinutes,
      };
    });
  }, [joueurs, feuillesFiltrees, matchMap]);

  // 4b. Synthèse par compétition (Championnat, Coupe de France, Coupe Pays de Loire, Amical)
  const statsParCompetition = useMemo(() => {
    return TYPES_MATCH_LIST.map((typeKey) => {
      const cfg = TYPES_MATCH_CONFIG[typeKey];
      const compMatches = matchs.filter(
        (m) => (m.statut === 'termine' || m.valide) && detectTypeMatch(m) === typeKey
      );
      let v = 0;
      let n = 0;
      let d = 0;
      let bp = 0;
      let bc = 0;
      let cs = 0;
      compMatches.forEach((m) => {
        bp += m.scoreEquipe;
        bc += m.scoreAdverse;
        if (m.scoreAdverse === 0) cs++;
        if (m.scoreEquipe > m.scoreAdverse) v++;
        else if (m.scoreEquipe === m.scoreAdverse) n++;
        else d++;
      });
      return {
        type: typeKey,
        cfg,
        total: compMatches.length,
        v,
        n,
        d,
        bp,
        bc,
        cs,
        diff: bp - bc,
        points: v * 3 + n,
      };
    });
  }, [matchs]);

  // Find top scorers and assist leaders
  const maxButs = useMemo(() => Math.max(0, ...statsParJoueur.map((s) => s.butsTotaux)), [statsParJoueur]);
  const maxPasses = useMemo(() => Math.max(0, ...statsParJoueur.map((s) => s.passesTotales)), [statsParJoueur]);

  // Filter and sort players table
  const joueursFiltresEtTries = useMemo(() => {
    return statsParJoueur
      .filter((s) => {
        const fullName = `${s.joueur.prenom} ${s.joueur.nom}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        const config = POSTES_CONFIG[s.joueur.poste];
        const matchesCategory =
          selectedCategorie === 'Tous' || config.categorie === selectedCategorie;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (sortField) {
          case 'nom':
            valA = a.joueur.nom.toLowerCase();
            valB = b.joueur.nom.toLowerCase();
            break;
          case 'poste':
            valA = a.joueur.poste;
            valB = b.joueur.poste;
            break;
          case 'matchsJoues':
            valA = a.matchsJoues;
            valB = b.matchsJoues;
            break;
          case 'minutesTotales':
            valA = a.minutesTotales;
            valB = b.minutesTotales;
            break;
          case 'moyenneMinutes':
            valA = a.moyenneMinutes;
            valB = b.moyenneMinutes;
            break;
          case 'butsTotaux':
            valA = a.butsTotaux;
            valB = b.butsTotaux;
            break;
          case 'moyenneButs':
            valA = a.moyenneButs;
            valB = b.moyenneButs;
            break;
          case 'passesTotales':
            valA = a.passesTotales;
            valB = b.passesTotales;
            break;
          case 'moyennePasses':
            valA = a.moyennePasses;
            valB = b.moyennePasses;
            break;
          case 'cartons':
            valA = a.cartonsJaunesTotaux + a.cartonsRougesTotaux * 3;
            valB = b.cartonsJaunesTotaux + b.cartonsRougesTotaux * 3;
            break;
          case 'moyenneCartons':
            valA = a.moyenneCartons;
            valB = b.moyenneCartons;
            break;
          case 'moyenneNotes':
            valA = a.moyenneNotes ?? -1;
            valB = b.moyenneNotes ?? -1;
            break;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [statsParJoueur, searchTerm, selectedCategorie, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default to highest first for stats
    }
  };

  // Totaux de l'équipe pour la ligne finale
  const totauxLigneFinale = useMemo(() => {
    let totMin = 0;
    let totButs = 0;
    let totPasses = 0;
    let totJ = 0;
    let totR = 0;
    statsParJoueur.forEach((s) => {
      totMin += s.minutesTotales;
      totButs += s.butsTotaux;
      totPasses += s.passesTotales;
      totJ += s.cartonsJaunesTotaux;
      totR += s.cartonsRougesTotaux;
    });
    return { totMin, totButs, totPasses, totJ, totR };
  }, [statsParJoueur]);

  return (
    <div id="tableau-recapitulatif-container" className="flex flex-col gap-6">
      {/* 1. Header with Filters (Domicile / Extérieur) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 px-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/logo-lcmfc.svg"
              alt="Logo LCMFC"
              className="h-8 w-auto max-w-[90px] object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Tableau Récapitulatif Annuel
              </h2>
              <span className="text-xs font-bold text-red-600 bg-red-600/10 px-2 py-0.5 rounded-full border border-red-500/20">
                Sénior R3 LCMFC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Agrégation automatique des statistiques individuelles et collectives de la saison
            </p>
          </div>
        </div>

        {/* Filter Toolbars: Type de Match + Lieu */}
        <div className="flex flex-col gap-2.5 self-start md:self-auto w-full md:w-auto">
          {/* Competition Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
            <span className="text-xs font-bold text-slate-400 pl-2 pr-1 flex items-center gap-1.5 shrink-0">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Compétition :
            </span>

            <button
              id="filtre-recap-type-tous"
              onClick={() => setFiltreTypeMatch('tous')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                filtreTypeMatch === 'tous'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Toutes ({matchs.filter((m) => m.statut === 'termine' || m.valide).length})
            </button>

            {TYPES_MATCH_LIST.map((typeKey) => {
              const cfg = TYPES_MATCH_CONFIG[typeKey];
              const count = matchs.filter(
                (m) => (m.statut === 'termine' || m.valide) && detectTypeMatch(m) === typeKey
              ).length;
              const isSelected = filtreTypeMatch === typeKey;
              return (
                <button
                  key={typeKey}
                  id={`filtre-recap-type-${typeKey}`}
                  onClick={() => setFiltreTypeMatch(typeKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap border ${
                    isSelected
                      ? `${cfg.badgeClass} ring-2 ring-emerald-500/40 shadow-sm font-extrabold`
                      : 'bg-slate-900/40 text-slate-400 border-slate-800/70 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.shortLabel}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Home / Away Filter Button Group */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-end">
            <span className="text-xs font-semibold text-slate-400 pl-2 pr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Lieu :
            </span>

            <button
              id="filtre-tous-matchs"
              onClick={() => setFiltreLieu('tous')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filtreLieu === 'tous'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Tous ({matchs.filter((m) => m.statut === 'termine' && (filtreTypeMatch === 'tous' || detectTypeMatch(m) === filtreTypeMatch)).length})
            </button>

            <button
              id="filtre-domicile-matchs"
              onClick={() => setFiltreLieu('domicile')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filtreLieu === 'domicile'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-3 h-3" />
              Domicile ({matchs.filter((m) => m.statut === 'termine' && m.domicileExterieur === 'domicile' && (filtreTypeMatch === 'tous' || detectTypeMatch(m) === filtreTypeMatch)).length})
            </button>

            <button
              id="filtre-exterieur-matchs"
              onClick={() => setFiltreLieu('exterieur')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filtreLieu === 'exterieur'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MapPin className="w-3 h-3" />
              Extérieur ({matchs.filter((m) => m.statut === 'termine' && m.domicileExterieur === 'exterieur' && (filtreTypeMatch === 'tous' || detectTypeMatch(m) === filtreTypeMatch)).length})
            </button>
          </div>
        </div>
      </div>

      {/* 1b. Active Competition Filter Feedback Banner */}
      {filtreTypeMatch !== 'tous' && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
              <span>{TYPES_MATCH_CONFIG[filtreTypeMatch].icon}</span>
              Filtre actif : {TYPES_MATCH_CONFIG[filtreTypeMatch].label}
            </span>
            <span className="text-slate-400">
              • {matchsFiltres.length} match{matchsFiltres.length > 1 ? 's' : ''} pris en compte dans le tableau et les totaux
            </span>
          </div>
          <button
            onClick={() => setFiltreTypeMatch('tous')}
            className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-900/60 hover:bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 transition-colors shrink-0"
          >
            Réinitialiser (Toutes)
          </button>
        </div>
      )}

      {/* 1c. Comparatif Synthétique des 4 Types de Matchs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsParCompetition.map((c) => {
          const isSelected = filtreTypeMatch === c.type;
          return (
            <div
              key={c.type}
              onClick={() => setFiltreTypeMatch(isSelected ? 'tous' : c.type)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{c.cfg.icon}</span>
                  <span className="font-extrabold text-xs text-white truncate">
                    {c.cfg.shortLabel}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${c.cfg.badgeClass}`}
                >
                  {c.total} m.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center py-1 bg-slate-950/70 rounded-lg border border-slate-850 text-xs mb-2">
                <div>
                  <span className="text-[9px] text-slate-400 block font-medium">V - N - D</span>
                  <span className="font-bold text-white text-[11px]">
                    <span className="text-emerald-400">{c.v}</span>-
                    <span className="text-amber-400">{c.n}</span>-
                    <span className="text-rose-400">{c.d}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-medium">Buts</span>
                  <span className="font-bold text-white text-[11px]">
                    {c.bp}:{c.bc}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-medium">Diff</span>
                  <span
                    className={`font-bold text-[11px] ${
                      c.diff > 0
                        ? 'text-emerald-400'
                        : c.diff === 0
                        ? 'text-slate-300'
                        : 'text-rose-400'
                    }`}
                  >
                    {c.diff > 0 ? `+${c.diff}` : c.diff}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className={isSelected ? 'text-emerald-400 font-bold' : ''}>
                  {isSelected ? '✓ Sélectionné' : 'Cliquer pour trier'}
                </span>
                <span className="text-emerald-400 font-extrabold">
                  {c.type === 'championnat' ? `${c.points} pts` : `${c.cs} Clean sheets`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Team Overview Stats Cards (avec moyennes par match) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Bilan */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Bilan (V - N - D)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg sm:text-xl font-black text-emerald-400">{statsEquipe.victoires}V</span>
            <span className="text-sm sm:text-base font-bold text-amber-400">{statsEquipe.nuls}N</span>
            <span className="text-sm sm:text-base font-bold text-rose-400">{statsEquipe.defaites}D</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            {statsEquipe.points} pts ({statsEquipe.totalMatchs} match{statsEquipe.totalMatchs > 1 ? 's' : ''})
          </span>
        </div>

        {/* Attaque / Buts marqués & Moyenne */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span>⚽ Attaque</span>
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-white">{statsEquipe.butsMarques}</span>
            <span className="text-xs text-slate-400 font-medium">buts</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold mt-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            Moy. {statsEquipe.moyenneButsMarquesParMatch.toFixed(2)} /m
          </span>
        </div>

        {/* Passes Décisives & Moyenne */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <span>🎯 Passes</span>
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-white">{statsEquipe.totalPassesEquipe}</span>
            <span className="text-xs text-slate-400 font-medium">passes</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-blue-300 font-bold mt-1 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            Moy. {statsEquipe.moyennePassesParMatch.toFixed(2)} /m
          </span>
        </div>

        {/* Défense & Moyenne buts encaissés */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            🛡️ Défense
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-white">{statsEquipe.butsConcedes}</span>
            <span className="text-xs text-slate-400 font-medium">encaissés</span>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mt-1">
            <span>Moy. {statsEquipe.moyenneButsConcedesParMatch.toFixed(2)}/m</span>
            <span className={`font-bold ${statsEquipe.diffButs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {statsEquipe.diffButs > 0 ? `+${statsEquipe.diffButs}` : statsEquipe.diffButs}
            </span>
          </div>
        </div>

        {/* Clean Sheets */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-teal-400 uppercase tracking-wider">
            🧤 Clean Sheets
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-teal-300">{statsEquipe.cleanSheets}</span>
            <span className="text-xs text-slate-400 font-medium">matchs</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-teal-400 font-medium mt-1">
            {statsEquipe.totalMatchs > 0
              ? `${Math.round((statsEquipe.cleanSheets / statsEquipe.totalMatchs) * 100)}% des matchs`
              : '0%'}
          </span>
        </div>

        {/* Note Moyenne Équipe */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            ⭐ Note Moyenne
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-amber-300">
              {statsEquipe.moyenneGeneraleNotes ? statsEquipe.moyenneGeneraleNotes.toFixed(2) : '-'}
            </span>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            Moy. générale équipe
          </span>
        </div>

        {/* Discipline & Moyenne Cartons */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            🟨 Discipline
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-bold bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-400/30">
              🟨 {totauxLigneFinale.totJ}
            </span>
            <span className="text-xs font-bold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">
              🟥 {totauxLigneFinale.totR}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-300 mt-1 font-semibold">
            Moy. {statsEquipe.moyenneCartonsParMatch.toFixed(2)} car./m
          </span>
        </div>
      </div>

      {/* 3. Live Auto-Compile Feedback & Controls Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un joueur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['Tous', 'Gardien', 'Défense', 'Milieu', 'Attaque'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategorie(cat)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategorie === cat
                  ? 'bg-slate-700 text-white font-black shadow-xs'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Mode Selector: Complet / Moyennes par match / Totaux bruts */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            Vue :
          </span>
          <button
            onClick={() => setViewMode('complet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
              viewMode === 'complet'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Affiche les totaux et les moyennes par match pour chaque colonne"
          >
            Totaux & Moyennes
          </button>
          <button
            onClick={() => setViewMode('moyennes')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
              viewMode === 'moyennes'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Met l'accent direct sur les moyennes de performance par match"
          >
            Moyennes / match
          </button>
          <button
            onClick={() => setViewMode('totaux')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
              viewMode === 'totaux'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Affiche uniquement les totaux cumulés bruts"
          >
            Totaux bruts
          </button>
        </div>
      </div>

      {/* 4. The General Aggregated Table with Automatic Averages */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => handleSort('nom')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Joueur</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('poste')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Poste</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('matchsJoues')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Matchs (Tit/Rem)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort(viewMode === 'moyennes' ? 'moyenneMinutes' : 'minutesTotales')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{viewMode === 'moyennes' ? 'Moy. Min /m' : 'Temps (Min)'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort(viewMode === 'moyennes' ? 'moyenneButs' : 'butsTotaux')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-extrabold">
                    <span>{viewMode === 'moyennes' ? 'Moy. Buts /m ⚽' : 'Buts (Tot & Moy) ⚽'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort(viewMode === 'moyennes' ? 'moyennePasses' : 'passesTotales')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 text-blue-400 font-extrabold">
                    <span>{viewMode === 'moyennes' ? 'Moy. Passes /m 🎯' : 'Passes (Tot & Moy) 🎯'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort(viewMode === 'moyennes' ? 'moyenneCartons' : 'cartons')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 text-slate-300 font-bold">
                    <span>{viewMode === 'moyennes' ? 'Moy. Cartons /m' : 'Cartons (Tot & Moy)'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('moyenneNotes')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-extrabold">
                    <span>Moy. Notes ⭐</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {joueursFiltresEtTries.length > 0 ? (
                joueursFiltresEtTries.map((item) => {
                  const posteConfig = POSTES_CONFIG[item.joueur.poste];
                  const noteObj = getNoteColor(item.moyenneNotes);
                  const isTopScorer = maxButs > 0 && item.butsTotaux === maxButs;
                  const isTopAssister = maxPasses > 0 && item.passesTotales === maxPasses;

                  return (
                    <tr
                      key={item.joueur.id}
                      onClick={() => onSelectJoueur && onSelectJoueur(item.joueur)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Player identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                            <img
                              src={item.joueur.photo}
                              alt={item.joueur.nom}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-0 right-0 bg-slate-950 text-[9px] font-black text-white px-1 rounded-tl">
                              #{item.joueur.numero}
                            </span>
                          </div>
                          <div>
                            <span className="font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                              {item.joueur.prenom} {item.joueur.nom}
                            </span>
                            <div className="text-[11px] text-slate-400">
                              #{item.joueur.numero}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${posteConfig.color}`}
                        >
                          {item.joueur.poste}
                        </span>
                      </td>

                      {/* Matchs Joues (Titularisations / Remplacements) & Statuts */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div>
                            <span className="font-extrabold text-white">{item.matchsJoues}</span>
                            <span className="text-[11px] text-slate-400 ml-1">
                              ({item.titularisations}T / {item.remplacements}R)
                            </span>
                          </div>

                          {/* Breakdown by match type (Championnat, Coupe de France, Coupe Pays de Loire, Amical) */}
                          {filtreTypeMatch === 'tous' && item.matchsParType && (
                            <div className="flex items-center justify-center flex-wrap gap-1 max-w-[145px]">
                              {item.matchsParType.championnat > 0 && (
                                <span
                                  title={`Championnat : ${item.matchsParType.championnat} match(s)`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30"
                                >
                                  🏆 {item.matchsParType.championnat}
                                </span>
                              )}
                              {item.matchsParType.coupe_de_france > 0 && (
                                <span
                                  title={`Coupe de France : ${item.matchsParType.coupe_de_france} match(s)`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                                >
                                  🇫🇷 {item.matchsParType.coupe_de_france}
                                </span>
                              )}
                              {item.matchsParType.coupe_pays_de_loire > 0 && (
                                <span
                                  title={`Coupe Pays de la Loire : ${item.matchsParType.coupe_pays_de_loire} match(s)`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                                >
                                  🏰 {item.matchsParType.coupe_pays_de_loire}
                                </span>
                              )}
                              {item.matchsParType.amical > 0 && (
                                <span
                                  title={`Match Amical : ${item.matchsParType.amical} match(s)`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                                >
                                  🤝 {item.matchsParType.amical}
                                </span>
                              )}
                            </div>
                          )}

                          {filtreTypeMatch !== 'tous' && (
                            <div>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${
                                  TYPES_MATCH_CONFIG[filtreTypeMatch].badgeClass
                                }`}
                              >
                                {TYPES_MATCH_CONFIG[filtreTypeMatch].shortLabel}
                              </span>
                            </div>
                          )}

                          {/* Statuts hors feuille active si présents */}
                          {((item.equipeBCount || 0) > 0 ||
                            (item.equipeCCount || 0) > 0 ||
                            (item.blessesCount || 0) > 0 ||
                            (item.suspendusCount || 0) > 0 ||
                            (item.maladesCount || 0) > 0 ||
                            (item.absentsCount || 0) > 0) && (
                            <div className="flex items-center justify-center flex-wrap gap-1 max-w-[140px]">
                              {(item.equipeBCount || 0) > 0 && (
                                <span
                                  title={`En équipe B (${item.equipeBCount} match${
                                    (item.equipeBCount || 0) > 1 ? 's' : ''
                                  })`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                                >
                                  🅱️ {item.equipeBCount}
                                </span>
                              )}
                              {(item.equipeCCount || 0) > 0 && (
                                <span
                                  title={`En équipe C (${item.equipeCCount} match${
                                    (item.equipeCCount || 0) > 1 ? 's' : ''
                                  })`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                                >
                                  🅲 {item.equipeCCount}
                                </span>
                              )}
                              {(item.blessesCount || 0) > 0 && (
                                <span
                                  title={`Blessé (${item.blessesCount} match${
                                    (item.blessesCount || 0) > 1 ? 's' : ''
                                  })`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30"
                                >
                                  🩹 {item.blessesCount}
                                </span>
                              )}
                              {(item.suspendusCount || 0) > 0 && (
                                <span
                                  title={`Suspendu (${item.suspendusCount} match${
                                    (item.suspendusCount || 0) > 1 ? 's' : ''
                                  })`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-red-950/70 text-red-300 font-bold border border-red-800/40"
                                >
                                  🟥 {item.suspendusCount}
                                </span>
                              )}
                              {(item.maladesCount || 0) > 0 && (
                                <span
                                  title={`Malade (${item.maladesCount} match${
                                    (item.maladesCount || 0) > 1 ? 's' : ''
                                  })`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                                >
                                  🤒 {item.maladesCount}
                                </span>
                              )}
                              {(item.absentsCount || 0) > 0 && (
                                <span
                                  title={`Absent (${item.absentsCount} match${
                                    (item.absentsCount || 0) > 1 ? 's' : ''
                                  })`}
                                  className="px-1 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 font-bold border border-slate-700"
                                >
                                  ⚪ {item.absentsCount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Minutes & Moyenne */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          {viewMode === 'moyennes' ? (
                            <>
                              <span className="font-extrabold text-white text-sm">
                                {item.moyenneMinutes}'
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                / match
                              </span>
                            </>
                          ) : viewMode === 'totaux' ? (
                            <span className="font-bold text-slate-200">{item.minutesTotales}'</span>
                          ) : (
                            <>
                              <span className="font-bold text-slate-200">{item.minutesTotales}'</span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Moy. {item.moyenneMinutes}'/m
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Buts & Moyenne */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          {viewMode === 'moyennes' ? (
                            <>
                              <div className="inline-flex items-center gap-1">
                                <span className="font-black text-sm text-amber-300">
                                  {item.moyenneButs.toFixed(2)}
                                </span>
                                {isTopScorer && <span title="Meilleur buteur" className="text-xs">👑</span>}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                but(s)/m ({item.butsTotaux} tot.)
                              </span>
                            </>
                          ) : viewMode === 'totaux' ? (
                            <div className="inline-flex items-center gap-1">
                              <span
                                className={`font-black text-sm ${
                                  item.butsTotaux > 0 ? 'text-amber-300' : 'text-slate-400'
                                }`}
                              >
                                {item.butsTotaux}
                              </span>
                              {isTopScorer && <span title="Meilleur buteur" className="text-xs">👑</span>}
                            </div>
                          ) : (
                            <>
                              <div className="inline-flex items-center gap-1">
                                <span
                                  className={`font-black text-sm ${
                                    item.butsTotaux > 0 ? 'text-amber-300' : 'text-slate-400'
                                  }`}
                                >
                                  {item.butsTotaux}
                                </span>
                                {isTopScorer && <span title="Meilleur buteur" className="text-xs">👑</span>}
                              </div>
                              <span
                                className={`text-[10px] font-bold block ${
                                  item.moyenneButs > 0 ? 'text-amber-400/90' : 'text-slate-500'
                                }`}
                              >
                                Moy. {item.moyenneButs.toFixed(2)} /m
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Passes & Moyenne */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          {viewMode === 'moyennes' ? (
                            <>
                              <div className="inline-flex items-center gap-1">
                                <span className="font-black text-sm text-blue-300">
                                  {item.moyennePasses.toFixed(2)}
                                </span>
                                {isTopAssister && <span title="Meilleur passeur" className="text-xs">🎯</span>}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                passe(s)/m ({item.passesTotales} tot.)
                              </span>
                            </>
                          ) : viewMode === 'totaux' ? (
                            <div className="inline-flex items-center gap-1">
                              <span
                                className={`font-black text-sm ${
                                  item.passesTotales > 0 ? 'text-blue-300' : 'text-slate-400'
                                }`}
                              >
                                {item.passesTotales}
                              </span>
                              {isTopAssister && <span title="Meilleur passeur" className="text-xs">🎯</span>}
                            </div>
                          ) : (
                            <>
                              <div className="inline-flex items-center gap-1">
                                <span
                                  className={`font-black text-sm ${
                                    item.passesTotales > 0 ? 'text-blue-300' : 'text-slate-400'
                                  }`}
                                >
                                  {item.passesTotales}
                                </span>
                                {isTopAssister && <span title="Meilleur passeur" className="text-xs">🎯</span>}
                              </div>
                              <span
                                className={`text-[10px] font-bold block ${
                                  item.moyennePasses > 0 ? 'text-blue-400/90' : 'text-slate-500'
                                }`}
                              >
                                Moy. {item.moyennePasses.toFixed(2)} /m
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Cartons & Moyenne */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          {viewMode === 'moyennes' ? (
                            <>
                              <span className="font-black text-sm text-yellow-300">
                                {item.moyenneCartons.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                carton(s)/m (🟨{item.cartonsJaunesTotaux} 🟥{item.cartonsRougesTotaux})
                              </span>
                            </>
                          ) : viewMode === 'totaux' ? (
                            <div className="inline-flex items-center gap-1.5 text-xs">
                              {item.cartonsJaunesTotaux > 0 && (
                                <span className="px-1.5 py-0.2 bg-yellow-400/20 text-yellow-300 rounded font-bold">
                                  🟨 {item.cartonsJaunesTotaux}
                                </span>
                              )}
                              {item.cartonsRougesTotaux > 0 && (
                                <span className="px-1.5 py-0.2 bg-red-500/20 text-red-300 rounded font-bold">
                                  🟥 {item.cartonsRougesTotaux}
                                </span>
                              )}
                              {item.cartonsJaunesTotaux === 0 && item.cartonsRougesTotaux === 0 && (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="inline-flex items-center gap-1.5 text-xs">
                                {item.cartonsJaunesTotaux > 0 && (
                                  <span className="px-1.5 py-0.2 bg-yellow-400/20 text-yellow-300 rounded font-bold">
                                    🟨 {item.cartonsJaunesTotaux}
                                  </span>
                                )}
                                {item.cartonsRougesTotaux > 0 && (
                                  <span className="px-1.5 py-0.2 bg-red-500/20 text-red-300 rounded font-bold">
                                    🟥 {item.cartonsRougesTotaux}
                                  </span>
                                )}
                                {item.cartonsJaunesTotaux === 0 && item.cartonsRougesTotaux === 0 && (
                                  <span className="text-slate-400">-</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                Moy. {item.moyenneCartons.toFixed(2)} /m
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Moyenne des Notes */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${noteObj.bg} ${noteObj.text} ${noteObj.border}`}
                          >
                            {item.moyenneNotes !== null ? `${item.moyenneNotes.toFixed(2)} ⭐` : '-'}
                          </span>
                          {item.moyenneNotes !== null && (
                            <span className="text-[10px] text-slate-400">
                              sur {item.nombreNotes} match{item.nombreNotes > 1 ? 's' : ''} noté{item.nombreNotes > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucun joueur ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer Totaux et Moyennes d'Équipe */}
            <tfoot>
              <tr className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-700">
                <td className="py-3.5 px-4 text-emerald-400 font-extrabold">
                  TOTAUX & MOYENNES ÉQUIPE
                </td>
                <td className="py-3.5 px-3 text-slate-400 text-xs">
                  {joueurs.length} joueurs
                </td>
                <td className="py-3.5 px-3 text-center text-slate-400 text-xs">
                  {matchsFiltres.length} match{matchsFiltres.length > 1 ? 's' : ''}
                </td>
                <td className="py-3.5 px-3 text-center text-slate-200">
                  <div>
                    <span>{totauxLigneFinale.totMin}'</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Moy. {statsEquipe.totalMatchs > 0 ? Math.round(totauxLigneFinale.totMin / statsEquipe.totalMatchs) : 0}'/m
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center text-amber-400 text-base font-black">
                  <div>
                    <span>{totauxLigneFinale.totButs} ⚽</span>
                    <span className="text-[10px] text-amber-300/90 block font-bold">
                      Moy. {statsEquipe.moyenneButsMarquesParMatch.toFixed(2)} /m
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center text-blue-400 text-base font-black">
                  <div>
                    <span>{totauxLigneFinale.totPasses} 🎯</span>
                    <span className="text-[10px] text-blue-300/90 block font-bold">
                      Moy. {statsEquipe.moyennePassesParMatch.toFixed(2)} /m
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <div>
                    <span className="text-xs text-slate-300">
                      🟨 {totauxLigneFinale.totJ} | 🟥 {totauxLigneFinale.totR}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Moy. {statsEquipe.moyenneCartonsParMatch.toFixed(2)} car./m
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-400 font-black">
                  <div>
                    <span>
                      {statsEquipe.moyenneGeneraleNotes
                        ? `${statsEquipe.moyenneGeneraleNotes.toFixed(2)} ⭐`
                        : '-'}
                    </span>
                    <span className="text-[10px] text-emerald-400/70 block font-normal">
                      Moyenne générale club
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
