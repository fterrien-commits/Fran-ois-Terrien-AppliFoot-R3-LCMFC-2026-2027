import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Award,
  Calendar,
  Camera,
  Cloud,
  Database,
  Download,
  Flame,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Shield,
  Trophy,
  Upload,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { CompositionMatch, FeuilleMatchLigne, Joueur, Match, TYPES_MATCH_CONFIG, detectTypeMatch } from './types';
import { StorageService } from './services/storage';
import { FORMATION_PRESETS } from './mockData';
import { StatsRecapitulatif } from './components/StatsRecapitulatif';
import { MatchsList } from './components/MatchsList';
import { JoueursList } from './components/JoueursList';
import { MatchDetailsModal } from './components/MatchDetailsModal';
import { JoueurDetailModal } from './components/JoueurDetailModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ImageUploadDropzone } from './components/ImageUploadDropzone';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  FirebaseDataService,
} from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recapitulatif' | 'matchs' | 'joueurs'>('recapitulatif');

  // Firebase Auth & Cloud Sync state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Club logo state
  const [clubLogo, setClubLogo] = useState<string>(() => {
    return localStorage.getItem('lcmfc_club_logo') || '/logo-lcmfc.svg';
  });
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const handleUpdateClubLogo = (newLogoUrl: string) => {
    setClubLogo(newLogoUrl);
    localStorage.setItem('lcmfc_club_logo', newLogoUrl);
    if (auth.currentUser) {
      FirebaseDataService.saveClubConfig({ clubLogo: newLogoUrl }).catch(console.error);
    }
  };

  const handleResetClubLogo = () => {
    setClubLogo('/logo-lcmfc.svg');
    localStorage.removeItem('lcmfc_club_logo');
    if (auth.currentUser) {
      FirebaseDataService.saveClubConfig({ clubLogo: '/logo-lcmfc.svg' }).catch(console.error);
    }
  };

  // Theme state: White / Red / Black by default
  const [theme, setTheme] = useState<'wrb' | 'dark'>(() => {
    return (localStorage.getItem('footstats_theme') as 'wrb' | 'dark') || 'wrb';
  });

  useEffect(() => {
    if (theme === 'wrb') {
      document.body.classList.add('theme-wrb');
    } else {
      document.body.classList.remove('theme-wrb');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'wrb' ? 'dark' : 'wrb';
    setTheme(next);
    localStorage.setItem('footstats_theme', next);
  };

  // Core entities state
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [feuillesMatch, setFeuillesMatch] = useState<FeuilleMatchLigne[]>([]);
  const [compositions, setCompositions] = useState<Record<string, CompositionMatch>>({});

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedJoueur, setSelectedJoueur] = useState<Joueur | null>(null);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Initialize data from LocalStorage & Listen to Firebase Auth
  useEffect(() => {
    setJoueurs(StorageService.getJoueurs());
    setMatchs(StorageService.getMatchs());
    setFeuillesMatch(StorageService.getFeuillesMatch());
    setCompositions(StorageService.getCompositions());

    // Listen to Firebase Authentication state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    // Attempt initial sync from Cloud Firestore if available
    const initCloudData = async () => {
      try {
        const [cloudJoueurs, cloudMatchs, cloudFeuilles, cloudComps, cloudConfig] = await Promise.allSettled([
          FirebaseDataService.getJoueurs(),
          FirebaseDataService.getMatchs(),
          FirebaseDataService.getFeuillesMatch(),
          FirebaseDataService.getCompositions(),
          FirebaseDataService.getClubConfig(),
        ]);

        if (cloudJoueurs.status === 'fulfilled' && cloudJoueurs.value && cloudJoueurs.value.length > 0) {
          setJoueurs(cloudJoueurs.value);
          StorageService.saveJoueurs(cloudJoueurs.value);
        }
        if (cloudMatchs.status === 'fulfilled' && cloudMatchs.value && cloudMatchs.value.length > 0) {
          setMatchs(cloudMatchs.value);
          StorageService.saveMatchs(cloudMatchs.value);
        }
        if (cloudFeuilles.status === 'fulfilled' && cloudFeuilles.value && cloudFeuilles.value.length > 0) {
          setFeuillesMatch(cloudFeuilles.value);
          StorageService.saveFeuillesMatch(cloudFeuilles.value);
        }
        if (cloudComps.status === 'fulfilled' && cloudComps.value && Object.keys(cloudComps.value).length > 0) {
          setCompositions(cloudComps.value);
          StorageService.saveCompositions(cloudComps.value);
        }
        if (cloudConfig.status === 'fulfilled' && cloudConfig.value?.clubLogo) {
          setClubLogo(cloudConfig.value.clubLogo);
          localStorage.setItem('lcmfc_club_logo', cloudConfig.value.clubLogo);
        }

        setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.warn('Initial Firestore sync silent check:', err);
      }
    };

    initCloudData();

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Sync to LocalStorage & auto-replicate to Firestore when authenticated
  const handleUpdateJoueurs = (newJoueurs: Joueur[]) => {
    setJoueurs(newJoueurs);
    StorageService.saveJoueurs(newJoueurs);
    if (auth.currentUser) {
      FirebaseDataService.batchSaveJoueurs(newJoueurs).catch(console.error);
    }
  };

  const handleUpdateMatchs = (newMatchs: Match[]) => {
    setMatchs(newMatchs);
    StorageService.saveMatchs(newMatchs);
    if (auth.currentUser) {
      FirebaseDataService.batchSaveMatchs(newMatchs).catch(console.error);
    }
  };

  const handleUpdateFeuillesMatch = (newFeuilles: FeuilleMatchLigne[]) => {
    setFeuillesMatch(newFeuilles);
    StorageService.saveFeuillesMatch(newFeuilles);
    if (auth.currentUser) {
      FirebaseDataService.saveFeuillesMatch(newFeuilles).catch(console.error);
    }
  };

  // Met à jour les feuilles d'un match spécifique en préservant systématiquement TOUS les autres matchs
  const handleUpdateMatchFeuilles = (matchId: string, matchFeuilles: FeuilleMatchLigne[]) => {
    setFeuillesMatch((prevFeuilles) => {
      const otherFeuilles = prevFeuilles.filter((f) => f.matchId !== matchId);
      const merged = [...otherFeuilles, ...matchFeuilles];
      StorageService.saveFeuillesMatch(merged);
      if (auth.currentUser) {
        FirebaseDataService.saveFeuillesMatch(merged).catch(console.error);
      }
      return merged;
    });
  };

  const handleUpdateCompositions = (newCompositions: Record<string, CompositionMatch>) => {
    setCompositions(newCompositions);
    StorageService.saveCompositions(newCompositions);
    if (auth.currentUser) {
      FirebaseDataService.batchSaveCompositions(newCompositions).catch(console.error);
    }
  };

  // Push all local data to Firebase Cloud
  const handlePushAllToCloud = async () => {
    setIsCloudSyncing(true);
    try {
      await Promise.all([
        FirebaseDataService.batchSaveJoueurs(joueurs),
        FirebaseDataService.batchSaveMatchs(matchs),
        FirebaseDataService.saveFeuillesMatch(feuillesMatch),
        FirebaseDataService.batchSaveCompositions(compositions),
        FirebaseDataService.saveClubConfig({ clubLogo }),
      ]);
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowStr);
      setBackupNotice('Toutes les données ont été sauvegardées sur Firestore Cloud !');
      setTimeout(() => setBackupNotice(null), 3500);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Pull all data from Firebase Cloud
  const handlePullAllFromCloud = async () => {
    setIsCloudSyncing(true);
    try {
      const [cloudJoueurs, cloudMatchs, cloudFeuilles, cloudComps, cloudConfig] = await Promise.all([
        FirebaseDataService.getJoueurs(),
        FirebaseDataService.getMatchs(),
        FirebaseDataService.getFeuillesMatch(),
        FirebaseDataService.getCompositions(),
        FirebaseDataService.getClubConfig(),
      ]);

      if (cloudJoueurs && cloudJoueurs.length > 0) {
        setJoueurs(cloudJoueurs);
        StorageService.saveJoueurs(cloudJoueurs);
      }
      if (cloudMatchs && cloudMatchs.length > 0) {
        setMatchs(cloudMatchs);
        StorageService.saveMatchs(cloudMatchs);
      }
      if (cloudFeuilles && cloudFeuilles.length > 0) {
        setFeuillesMatch(cloudFeuilles);
        StorageService.saveFeuillesMatch(cloudFeuilles);
      }
      if (cloudComps && Object.keys(cloudComps).length > 0) {
        setCompositions(cloudComps);
        StorageService.saveCompositions(cloudComps);
      }
      if (cloudConfig?.clubLogo) {
        setClubLogo(cloudConfig.clubLogo);
        localStorage.setItem('lcmfc_club_logo', cloudConfig.clubLogo);
      }

      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowStr);
      setBackupNotice('Données synchronisées depuis Firestore Cloud !');
      setTimeout(() => setBackupNotice(null), 3500);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Handle Google Login / Logout
  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  const handleGoogleLogout = async () => {
    await logoutUser();
  };

  // Add a new player
  const handleAddJoueur = (newJoueur: Joueur) => {
    handleUpdateJoueurs([...joueurs, newJoueur]);
  };

  // Edit existing player
  const handleEditJoueur = (updatedJoueur: Joueur) => {
    handleUpdateJoueurs(joueurs.map((j) => (j.id === updatedJoueur.id ? updatedJoueur : j)));
    if (selectedJoueur?.id === updatedJoueur.id) {
      setSelectedJoueur(updatedJoueur);
    }
  };

  // Delete player
  const handleDeleteJoueur = (joueurId: string) => {
    handleUpdateJoueurs(joueurs.filter((j) => j.id !== joueurId));
    handleUpdateFeuillesMatch(feuillesMatch.filter((f) => f.joueurId !== joueurId));
    // Clean up composition references
    const newCompositions = { ...compositions };
    Object.keys(newCompositions).forEach((mId) => {
      newCompositions[mId] = {
        ...newCompositions[mId],
        positions: newCompositions[mId].positions.map((p) =>
          p.joueurId === joueurId ? { ...p, joueurId: '' } : p
        ),
      };
    });
    handleUpdateCompositions(newCompositions);
    if (selectedJoueur?.id === joueurId) {
      setSelectedJoueur(null);
    }
  };

  // Delete multiple players
  const handleDeleteJoueurs = (joueurIds: string[]) => {
    const idsSet = new Set(joueurIds);
    handleUpdateJoueurs(joueurs.filter((j) => !idsSet.has(j.id)));
    handleUpdateFeuillesMatch(feuillesMatch.filter((f) => !idsSet.has(f.joueurId)));
    const newCompositions = { ...compositions };
    Object.keys(newCompositions).forEach((mId) => {
      newCompositions[mId] = {
        ...newCompositions[mId],
        positions: newCompositions[mId].positions.map((p) =>
          idsSet.has(p.joueurId) ? { ...p, joueurId: '' } : p
        ),
      };
    });
    handleUpdateCompositions(newCompositions);
    if (selectedJoueur && idsSet.has(selectedJoueur.id)) {
      setSelectedJoueur(null);
    }
  };

  // Add a new match with individual and collective data auto-saved and aggregated into stats
  const handleAddMatch = (
    newMatch: Match,
    customFeuilles?: FeuilleMatchLigne[],
    customComp?: CompositionMatch
  ) => {
    // Ensure match is marked as completed and validated for immediate stats aggregation
    const matchWithValidation: Match = {
      ...newMatch,
      statut: 'termine',
      valide: true,
      dateValidation: newMatch.dateValidation || new Date().toISOString(),
    };

    const updatedMatchs = [matchWithValidation, ...matchs];
    handleUpdateMatchs(updatedMatchs);

    // Bootstrap or apply composition for this match
    let finalComp: CompositionMatch;
    if (customComp) {
      finalComp = customComp;
    } else {
      const preset = FORMATION_PRESETS[newMatch.systemeEquipe] || FORMATION_PRESETS['4-3-3'];
      const starterJoueurs = joueurs.slice(0, 11);
      const initialPositions = preset.roles.map((role, idx) => ({
        joueurId: starterJoueurs[idx]?.id || '',
        roleLabel: role.roleLabel,
        x: role.x,
        y: role.y,
      }));
      finalComp = {
        matchId: newMatch.id,
        systeme: newMatch.systemeEquipe,
        positions: initialPositions,
      };
    }

    handleUpdateCompositions({
      ...compositions,
      [newMatch.id]: finalComp,
    });

    // Create custom or default rows in match sheet
    let finalFeuilles: FeuilleMatchLigne[];
    if (customFeuilles && customFeuilles.length > 0) {
      finalFeuilles = customFeuilles;
    } else {
      const starterJoueurs = joueurs.slice(0, 11);
      finalFeuilles = starterJoueurs.map((j) => ({
        id: `f_${newMatch.id}_${j.id}`,
        matchId: newMatch.id,
        joueurId: j.id,
        titulaire: true,
        minutesJouees: 90,
        buts: 0,
        passesDecisives: 0,
        cartonsJaunes: 0,
        cartonsRouges: 0,
        note: null,
      }));
    }

    handleUpdateFeuillesMatch([...feuillesMatch, ...finalFeuilles]);

    setBackupNotice(
      `✓ Nouveau match créé ! Données individuelles et collectives sauvegardées et agrégées dans le Tableau Annuel & Stats.`
    );
    setTimeout(() => setBackupNotice(null), 4000);
  };

  // Save edited match
  const handleSaveMatch = (updatedMatch: Match) => {
    handleUpdateMatchs(matchs.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));
    if (selectedMatch?.id === updatedMatch.id) {
      setSelectedMatch(updatedMatch);
    }
  };

  // Validate match and synchronize everything with Annual Table & Stats without overwriting other matches
  const handleValidateAndCompileMatch = (
    validatedMatch: Match,
    newComp: CompositionMatch,
    newFeuilles: FeuilleMatchLigne[]
  ) => {
    // 1. Update Match list (safe functional update)
    setMatchs((prevMatchs) => {
      const updatedMatchs = prevMatchs.map((m) => (m.id === validatedMatch.id ? validatedMatch : m));
      StorageService.saveMatchs(updatedMatchs);
      if (auth.currentUser) {
        FirebaseDataService.batchSaveMatchs(updatedMatchs).catch(console.error);
      }
      return updatedMatchs;
    });
    setSelectedMatch(validatedMatch);

    // 2. Update Composition (safe functional update)
    setCompositions((prevComps) => {
      const updatedComps = {
        ...prevComps,
        [newComp.matchId]: newComp,
      };
      StorageService.saveCompositions(updatedComps);
      if (auth.currentUser) {
        FirebaseDataService.batchSaveCompositions(updatedComps).catch(console.error);
      }
      return updatedComps;
    });

    // 3. Update Feuilles de match (CRITICAL: preserve all rows from all other matches!)
    setFeuillesMatch((prevFeuilles) => {
      const otherFeuilles = prevFeuilles.filter((f) => f.matchId !== validatedMatch.id);
      const updatedFeuilles = [...otherFeuilles, ...newFeuilles];
      StorageService.saveFeuillesMatch(updatedFeuilles);
      if (auth.currentUser) {
        FirebaseDataService.saveFeuillesMatch(updatedFeuilles).catch(console.error);
      }
      return updatedFeuilles;
    });

    const typeConfig = TYPES_MATCH_CONFIG[detectTypeMatch(validatedMatch)];
    setBackupNotice(
      `✓ Match de ${typeConfig.label} validé ! Toutes les données de tous les matchs sont conservées et compilées ensemble dans le Tableau Annuel & Stats.`
    );
    setTimeout(() => setBackupNotice(null), 4500);
  };

  // Delete match
  const handleDeleteMatch = (matchId: string) => {
    handleUpdateMatchs(matchs.filter((m) => m.id !== matchId));
    handleUpdateFeuillesMatch(feuillesMatch.filter((f) => f.matchId !== matchId));
    const newCompositions = { ...compositions };
    delete newCompositions[matchId];
    handleUpdateCompositions(newCompositions);
    if (selectedMatch?.id === matchId) {
      setSelectedMatch(null);
    }
  };

  // Delete multiple matches
  const handleDeleteMatchs = (matchIds: string[]) => {
    const idsSet = new Set(matchIds);
    handleUpdateMatchs(matchs.filter((m) => !idsSet.has(m.id)));
    handleUpdateFeuillesMatch(feuillesMatch.filter((f) => !idsSet.has(f.matchId)));
    const newCompositions = { ...compositions };
    matchIds.forEach((id) => delete newCompositions[id]);
    handleUpdateCompositions(newCompositions);
    if (selectedMatch && idsSet.has(selectedMatch.id)) {
      setSelectedMatch(null);
    }
  };

  // Update specific match composition
  const handleSaveMatchComposition = (newComp: CompositionMatch) => {
    handleUpdateCompositions({
      ...compositions,
      [newComp.matchId]: newComp,
    });
  };

  // Reset to initial demo database
  const handleConfirmResetDemoData = () => {
    StorageService.resetAll();
    setJoueurs(StorageService.getJoueurs());
    setMatchs(StorageService.getMatchs());
    setFeuillesMatch(StorageService.getFeuillesMatch());
    setCompositions(StorageService.getCompositions());
    setClubLogo('/logo-lcmfc.svg');
    localStorage.removeItem('lcmfc_club_logo');
    setBackupNotice('Données réinitialisées avec succès.');
    setTimeout(() => setBackupNotice(null), 3500);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const json = StorageService.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `footstats-saison-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (StorageService.importBackup(content)) {
        setJoueurs(StorageService.getJoueurs());
        setMatchs(StorageService.getMatchs());
        setFeuillesMatch(StorageService.getFeuillesMatch());
        setCompositions(StorageService.getCompositions());
        setBackupNotice('Sauvegarde importée avec succès.');
        setTimeout(() => setBackupNotice(null), 3500);
      } else {
        alert('Format de fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Get active composition for selected match
  const selectedMatchComposition: CompositionMatch = selectedMatch
    ? compositions[selectedMatch.id] || {
        matchId: selectedMatch.id,
        systeme: selectedMatch.systemeEquipe,
        positions: (
          FORMATION_PRESETS[selectedMatch.systemeEquipe] || FORMATION_PRESETS['4-3-3']
        ).roles.map((role, idx) => ({
          joueurId: joueurs[idx]?.id || '',
          roleLabel: role.roleLabel,
          x: role.x,
          y: role.y,
        })),
      }
    : {
        matchId: '',
        systeme: '4-3-3',
        positions: [],
      };

  const selectedMatchFeuilles = selectedMatch
    ? feuillesMatch.filter((f) => f.matchId === selectedMatch.id)
    : [];

  const joueursSuspensiblesCount = useMemo(() => {
    return joueurs.filter((j) => {
      const cj = feuillesMatch
        .filter((f) => f.joueurId === j.id)
        .reduce((acc, f) => acc + (f.cartonsJaunes || 0), 0);
      return cj >= 3;
    }).length;
  }, [joueurs, feuillesMatch]);

  return (
    <div className={`min-h-screen ${theme === 'wrb' ? 'theme-wrb bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans transition-colors duration-200`}>
      {/* App Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b-2 border-red-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            {/* Club Logo with hover action to customize */}
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="group relative h-11 sm:h-12 px-2.5 py-1 bg-white rounded-xl shadow-md border border-slate-200/90 flex items-center justify-center shrink-0 hover:border-red-500 transition-all cursor-pointer overflow-hidden"
              title="Logo officiel LCMFC (Cliquer pour afficher en grand ou personnaliser)"
            >
              <img
                src={clubLogo}
                alt="Logo officiel LCMFC"
                className="h-8 sm:h-9 w-auto max-w-[140px] sm:max-w-[190px] object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-lcmfc.svg';
                }}
              />
              <span className="absolute bottom-0 right-0 p-0.5 bg-black/60 text-white rounded-tl opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-2.5 h-2.5" />
              </span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                  Sénior R3 LCMFC
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white tracking-wider uppercase shadow-xs">
                  R3
                </span>
              </div>
              <p className="text-[11px] text-slate-300 sm:text-red-400 font-semibold mt-0.5">
                Le Cellier - Mauves Football Club
              </p>
            </div>
          </div>

          {/* Quick Actions (Firebase Cloud / Export / Import / Theme / Reset) */}
          <div className="flex items-center gap-2">
            {/* Firebase Cloud Database Status & Sync Modal trigger */}
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              title="Base de données Cloud Firebase (Firestore) - Gestion de la synchronisation et de la connexion coach"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-750 text-xs font-bold text-white transition-all shadow-xs cursor-pointer group"
            >
              <Cloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-bold text-xs">Cloud Firebase</span>
              {currentUser ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden md:inline">{currentUser.displayName?.split(' ')[0] || 'Coach'}</span>
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                  Connecté
                </span>
              )}
            </button>

            {/* Theme Switcher Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'wrb' ? 'Basculer vers le thème Sombre' : 'Basculer vers le thème Blanc/Rouge/Noir'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold transition-all shadow-xs hover:opacity-90 bg-white text-slate-900"
            >
              <div className="flex items-center gap-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-black inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 inline-block"></span>
              </div>
              <span className="hidden sm:inline font-bold">
                {theme === 'wrb' ? 'Blanc/Rouge/Noir' : 'Sombre'}
              </span>
            </button>

            <button
              onClick={handleExportBackup}
              title="Exporter les données en JSON"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              title="Importer une sauvegarde JSON"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsResetModalOpen(true)}
              title="Réinitialiser les données de démonstration"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto">
          <button
            id="tab-tableau-recapitulatif"
            onClick={() => setActiveTab('recapitulatif')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'recapitulatif'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Tableau Annuel & Stats
          </button>

          <button
            id="tab-matchs-tactique"
            onClick={() => setActiveTab('matchs')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'matchs'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Matchs & Schémas Tactiques
            <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px]">
              {matchs.length}
            </span>
          </button>

          <button
            id="tab-effectif-joueurs"
            onClick={() => setActiveTab('joueurs')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'joueurs'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Effectif Joueurs
            <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px]">
              {joueurs.length}
            </span>
            {joueursSuspensiblesCount > 0 && (
              <span
                className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full text-[10px] flex items-center gap-0.5 shadow-sm animate-pulse"
                title={`${joueursSuspensiblesCount} joueur(s) sous le coup d'une suspension (3 cartons jaunes cumulés)`}
              >
                ⚠️ {joueursSuspensiblesCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Backup Notification Alert */}
      {backupNotice && (
        <div className="bg-emerald-600/90 text-white text-xs font-semibold py-2 text-center px-4 animate-in slide-in-from-top">
          {backupNotice}
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {activeTab === 'recapitulatif' && (
          <StatsRecapitulatif
            joueurs={joueurs}
            matchs={matchs}
            feuillesMatch={feuillesMatch}
            onSelectJoueur={(j) => setSelectedJoueur(j)}
          />
        )}

        {activeTab === 'matchs' && (
          <MatchsList
            matchs={matchs}
            joueurs={joueurs}
            feuillesMatch={feuillesMatch}
            compositions={compositions}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onAddMatch={handleAddMatch}
            onDeleteMatch={handleDeleteMatch}
            onDeleteMatchs={handleDeleteMatchs}
          />
        )}

        {activeTab === 'joueurs' && (
          <JoueursList
            joueurs={joueurs}
            feuillesMatch={feuillesMatch}
            onAddJoueur={handleAddJoueur}
            onUpdateJoueur={handleEditJoueur}
            onDeleteJoueur={handleDeleteJoueur}
            onDeleteJoueurs={handleDeleteJoueurs}
            onSelectJoueur={(j) => setSelectedJoueur(j)}
          />
        )}
      </main>

      {/* Match Details & Interactive Tactical Pitch Modal */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          joueurs={joueurs}
          composition={selectedMatchComposition}
          feuilleMatch={selectedMatchFeuilles}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSaveMatch={handleSaveMatch}
          onUpdateComposition={handleSaveMatchComposition}
          onUpdateFeuillesMatch={(matchFeuilles) =>
            handleUpdateMatchFeuilles(selectedMatch.id, matchFeuilles)
          }
          onDeleteMatch={handleDeleteMatch}
          onValidateMatch={handleValidateAndCompileMatch}
          onNavigateToStats={() => {
            setSelectedMatch(null);
            setActiveTab('recapitulatif');
          }}
        />
      )}

      {/* Player Individual Record Modal */}
      {selectedJoueur && (
        <JoueurDetailModal
          joueur={selectedJoueur}
          matchs={matchs}
          feuillesMatch={feuillesMatch}
          onClose={() => setSelectedJoueur(null)}
          onOpenMatch={(m) => {
            setSelectedJoueur(null);
            setSelectedMatch(m);
          }}
          onDeleteJoueur={handleDeleteJoueur}
          onUpdateJoueur={handleEditJoueur}
        />
      )}

      {/* Reset Demo Data Modal */}
      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        title="Réinitialiser les données"
        message="Voulez-vous réinitialiser toutes les données aux valeurs de démonstration ? Toutes vos modifications actuelles (joueurs créés, matchs saisis, compositions et notes) seront effacées."
        confirmText="Réinitialiser les données"
        onConfirm={handleConfirmResetDemoData}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* Club Logo Customization & Zoom Modal */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600/15 text-red-500 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Logo du Club</h3>
                  <p className="text-xs text-slate-400">Le Cellier - Mauves Football Club (LCMFC)</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Logo Preview Card */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 shadow-inner">
              <img
                src={clubLogo}
                alt="Logo officiel LCMFC"
                className="max-h-24 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-lcmfc.svg';
                }}
              />
              <span className="text-xs font-black text-slate-900 mt-3 tracking-wide">
                Sénior R3 · LCMFC
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Le Cellier - Mauves FC
              </span>
            </div>

            {/* Upload or Dropzone */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Changer le logo (Glisser-déposer une image ou un fichier SVG) :
              </label>
              <ImageUploadDropzone
                currentImage={clubLogo}
                onImageChange={(newUrl) => handleUpdateClubLogo(newUrl)}
                onImageRemove={handleResetClubLogo}
                label="Glisser un fichier logo (PNG, JPG, SVG)"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetClubLogo}
                className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors underline"
              >
                Rétablir le logo officiel LCMFC
              </button>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Cloud Sync & Architecture Breakdown Modal */}
      <FirebaseSyncModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onPushToCloud={handlePushAllToCloud}
        onPullFromCloud={handlePullAllFromCloud}
        counts={{
          joueurs: joueurs.length,
          matchs: matchs.length,
          feuilles: feuillesMatch.length,
          compositions: Object.keys(compositions).length,
        }}
        isSyncing={isCloudSyncing}
        lastSyncTime={lastSyncTime}
      />
    </div>
  );
}
