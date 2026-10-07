import { CompositionMatch, FeuilleMatchLigne, Joueur, Match, PositionTactique, SystemeTactique } from './types';

// Schémas tactiques par défaut (11 positions coordonnées en % X et Y)
// X: 0% (gauche) à 100% (droite), Y: 0% (attaque/but adverse) à 100% (défense/but gardien)
export const FORMATION_PRESETS: Record<SystemeTactique, { label: string; roles: { roleLabel: string; x: number; y: number }[] }> = {
  '4-3-3': {
    label: '4-3-3 Classique',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DG', x: 18, y: 72 },
      { roleLabel: 'DCG', x: 38, y: 75 },
      { roleLabel: 'DCD', x: 62, y: 75 },
      { roleLabel: 'DD', x: 82, y: 72 },
      { roleLabel: 'MDC', x: 50, y: 56 },
      { roleLabel: 'MCG', x: 34, y: 44 },
      { roleLabel: 'MCD', x: 66, y: 44 },
      { roleLabel: 'AG', x: 20, y: 22 },
      { roleLabel: 'BU', x: 50, y: 16 },
      { roleLabel: 'AD', x: 80, y: 22 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1 Équilibré',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DG', x: 18, y: 72 },
      { roleLabel: 'DCG', x: 38, y: 75 },
      { roleLabel: 'DCD', x: 62, y: 75 },
      { roleLabel: 'DD', x: 82, y: 72 },
      { roleLabel: 'MDC1', x: 38, y: 58 },
      { roleLabel: 'MDC2', x: 62, y: 58 },
      { roleLabel: 'MOG', x: 22, y: 35 },
      { roleLabel: 'MOC', x: 50, y: 35 },
      { roleLabel: 'MOD', x: 78, y: 35 },
      { roleLabel: 'BU', x: 50, y: 16 },
    ],
  },
  '3-5-2': {
    label: '3-5-2 Moderne',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DCG', x: 28, y: 75 },
      { roleLabel: 'DCC', x: 50, y: 77 },
      { roleLabel: 'DCD', x: 72, y: 75 },
      { roleLabel: 'Piston G', x: 14, y: 50 },
      { roleLabel: 'MDC', x: 50, y: 58 },
      { roleLabel: 'MCG', x: 35, y: 42 },
      { roleLabel: 'MCD', x: 65, y: 42 },
      { roleLabel: 'Piston D', x: 86, y: 50 },
      { roleLabel: 'BUG', x: 38, y: 18 },
      { roleLabel: 'BUD', x: 62, y: 18 },
    ],
  },
  '4-4-2': {
    label: '4-4-2 À plat',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DG', x: 18, y: 72 },
      { roleLabel: 'DCG', x: 38, y: 75 },
      { roleLabel: 'DCD', x: 62, y: 75 },
      { roleLabel: 'DD', x: 82, y: 72 },
      { roleLabel: 'MG', x: 20, y: 46 },
      { roleLabel: 'MCG', x: 40, y: 48 },
      { roleLabel: 'MCD', x: 60, y: 48 },
      { roleLabel: 'MD', x: 80, y: 46 },
      { roleLabel: 'BUG', x: 38, y: 18 },
      { roleLabel: 'BUD', x: 62, y: 18 },
    ],
  },
  '4-4-2 Losange': {
    label: '4-4-2 Losange (4-1-2-1-2)',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DG', x: 18, y: 72 },
      { roleLabel: 'DCG', x: 38, y: 75 },
      { roleLabel: 'DCD', x: 62, y: 75 },
      { roleLabel: 'DD', x: 82, y: 72 },
      { roleLabel: 'MDC', x: 50, y: 60 },
      { roleLabel: 'MCG', x: 30, y: 45 },
      { roleLabel: 'MCD', x: 70, y: 45 },
      { roleLabel: 'MOC', x: 50, y: 30 },
      { roleLabel: 'BUG', x: 38, y: 16 },
      { roleLabel: 'BUD', x: 62, y: 16 },
    ],
  },
  '3-4-3': {
    label: '3-4-3 Offensif',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DCG', x: 28, y: 75 },
      { roleLabel: 'DCC', x: 50, y: 77 },
      { roleLabel: 'DCD', x: 72, y: 75 },
      { roleLabel: 'MLG', x: 16, y: 48 },
      { roleLabel: 'MC1', x: 40, y: 50 },
      { roleLabel: 'MC2', x: 60, y: 50 },
      { roleLabel: 'MLD', x: 84, y: 48 },
      { roleLabel: 'AG', x: 22, y: 22 },
      { roleLabel: 'BU', x: 50, y: 16 },
      { roleLabel: 'AD', x: 78, y: 22 },
    ],
  },
  '5-3-2': {
    label: '5-3-2 Défensif',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DG', x: 15, y: 70 },
      { roleLabel: 'DCG', x: 32, y: 75 },
      { roleLabel: 'DCC', x: 50, y: 77 },
      { roleLabel: 'DCD', x: 68, y: 75 },
      { roleLabel: 'DD', x: 85, y: 70 },
      { roleLabel: 'MCG', x: 32, y: 48 },
      { roleLabel: 'MDC', x: 50, y: 56 },
      { roleLabel: 'MCD', x: 68, y: 48 },
      { roleLabel: 'BUG', x: 38, y: 18 },
      { roleLabel: 'BUD', x: 62, y: 18 },
    ],
  },
  '4-1-4-1': {
    label: '4-1-4-1 Bloc Médian',
    roles: [
      { roleLabel: 'G', x: 50, y: 88 },
      { roleLabel: 'DG', x: 18, y: 72 },
      { roleLabel: 'DCG', x: 38, y: 75 },
      { roleLabel: 'DCD', x: 62, y: 75 },
      { roleLabel: 'DD', x: 82, y: 72 },
      { roleLabel: 'MDC', x: 50, y: 60 },
      { roleLabel: 'MG', x: 20, y: 38 },
      { roleLabel: 'MCG', x: 40, y: 40 },
      { roleLabel: 'MCD', x: 60, y: 40 },
      { roleLabel: 'MD', x: 80, y: 38 },
      { roleLabel: 'BU', x: 50, y: 16 },
    ],
  },
};

export const INITIAL_JOUEURS: Joueur[] = [
  { id: 'j1', nom: 'Lemaire', prenom: 'Hugo', surnom: 'Le Mur', poste: 'G', numero: 1, age: 26, taille: 189, poids: 84, piedFort: 'Droitier', vma: 15.2, photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'j2', nom: 'Diallo', prenom: 'Mamadou', surnom: 'Mamad', poste: 'DD', numero: 2, age: 24, taille: 178, poids: 73, piedFort: 'Droitier', vma: 17.5, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'j3', nom: 'Garnier', prenom: 'Thomas', surnom: 'Tom', poste: 'DC', numero: 4, age: 28, taille: 186, poids: 81, piedFort: 'Droitier', vma: 16.0, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'j4', nom: 'Kouassi', prenom: 'Arthur', surnom: 'Le Roc', poste: 'DC', numero: 5, age: 25, taille: 188, poids: 83, piedFort: 'Droitier', vma: 16.2, photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { id: 'j5', nom: 'Moreau', prenom: 'Lucas', surnom: 'Lulu', poste: 'DG', numero: 3, age: 23, taille: 175, poids: 70, piedFort: 'Gaucher', vma: 17.8, photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  { id: 'j6', nom: 'Benali', prenom: 'Yanis', surnom: 'Le Maestro', poste: 'MDC', numero: 6, age: 27, taille: 181, poids: 77, piedFort: 'Droitier', vma: 17.2, photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { id: 'j7', nom: 'Dubois', prenom: 'Mathieu', surnom: 'Mat', poste: 'MC', numero: 8, age: 25, taille: 180, poids: 74, piedFort: 'Ambidextre', vma: 17.0, photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { id: 'j8', nom: 'Camara', prenom: 'Ousmane', surnom: 'Ous', poste: 'MO', numero: 10, age: 22, taille: 176, poids: 69, piedFort: 'Droitier', vma: 16.8, photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { id: 'j9', nom: 'Roux', prenom: 'Nathan', surnom: 'La Flèche', poste: 'AD', numero: 7, age: 21, taille: 177, poids: 71, piedFort: 'Droitier', vma: 18.0, photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { id: 'j10', nom: 'Mercier', prenom: 'Romain', surnom: 'El Pistolero', poste: 'BU', numero: 9, age: 27, taille: 184, poids: 79, piedFort: 'Droitier', vma: 16.5, photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: 'j11', nom: 'Traoré', prenom: 'Bakary', surnom: 'Bako', poste: 'AG', numero: 11, age: 23, taille: 173, poids: 68, piedFort: 'Gaucher', vma: 17.7, photo: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80' },
  // Remplaçants
  { id: 'j12', nom: 'Bernard', prenom: 'Julien', surnom: 'Juju', poste: 'G', numero: 16, age: 22, taille: 187, poids: 82, piedFort: 'Droitier', vma: 15.0, photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80' },
  { id: 'j13', nom: 'Fabre', prenom: 'Clément', surnom: 'Clem', poste: 'DC', numero: 13, age: 21, taille: 185, poids: 78, piedFort: 'Gaucher', vma: 16.4, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'j14', nom: 'Sanchez', prenom: 'Enzo', surnom: 'Zouzou', poste: 'MC', numero: 14, age: 20, taille: 179, poids: 72, piedFort: 'Droitier', vma: 17.3, photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: 'j15', nom: 'Laurent', prenom: 'Kévin', surnom: 'Kev', poste: 'BU', numero: 19, age: 24, taille: 182, poids: 77, piedFort: 'Droitier', vma: 16.7, photo: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&auto=format&fit=crop&q=80' },
  { id: 'j16', nom: 'Girard', prenom: 'Adrien', surnom: 'Adri', poste: 'AD', numero: 17, age: 19, taille: 176, poids: 69, piedFort: 'Gaucher', vma: 17.9, photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
];

export const INITIAL_MATCHS: Match[] = [
  {
    id: 'm1',
    adversaire: 'AS Saint-Germain',
    date: '2026-09-06',
    heure: '15:00',
    lieu: 'Stade des Noues (Le Cellier)',
    meteo: 'Ensoleillé',
    domicileExterieur: 'domicile',
    scoreEquipe: 3,
    scoreAdverse: 1,
    systemeEquipe: '4-3-3',
    systemeAdverse: '4-4-2',
    typeMatch: 'championnat',
    competition: 'Championnat R3 - J1',
    statut: 'termine',
    photos: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'm2',
    adversaire: 'FC Val de Seine',
    date: '2026-09-13',
    heure: '15:30',
    lieu: 'Complexe Sportif Beauregard',
    meteo: 'Nuageux',
    domicileExterieur: 'exterieur',
    scoreEquipe: 2,
    scoreAdverse: 0,
    systemeEquipe: '4-2-3-1',
    systemeAdverse: '4-3-3',
    typeMatch: 'championnat',
    competition: 'Championnat R3 - J2',
    statut: 'termine',
    photos: [
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'm3',
    adversaire: 'Olympique Montreuil',
    date: '2026-09-20',
    heure: '15:00',
    lieu: 'Stade des Noues (Le Cellier)',
    meteo: 'Pluvieux',
    domicileExterieur: 'domicile',
    scoreEquipe: 1,
    scoreAdverse: 1,
    systemeEquipe: '4-3-3',
    systemeAdverse: '3-5-2',
    typeMatch: 'championnat',
    competition: 'Championnat R3 - J3',
    statut: 'termine',
  },
  {
    id: 'm4',
    adversaire: 'Racing Club Sud',
    date: '2026-09-27',
    heure: '16:00',
    lieu: 'Stade Gabriel Péri',
    meteo: 'Venteux',
    domicileExterieur: 'exterieur',
    scoreEquipe: 4,
    scoreAdverse: 2,
    systemeEquipe: '3-5-2',
    systemeAdverse: '4-2-3-1',
    typeMatch: 'championnat',
    competition: 'Championnat R3 - J4',
    statut: 'termine',
  },
  {
    id: 'm5',
    adversaire: 'Étoile Rouge Athlétique',
    date: '2026-10-04',
    heure: '15:00',
    lieu: 'Stade des Noues (Le Cellier)',
    meteo: 'Ensoleillé',
    domicileExterieur: 'domicile',
    scoreEquipe: 2,
    scoreAdverse: 0,
    systemeEquipe: '4-3-3',
    systemeAdverse: '5-3-2',
    typeMatch: 'coupe_de_france',
    competition: 'Coupe de France - T3',
    statut: 'termine',
  },
  {
    id: 'm6',
    adversaire: 'ES Vertou',
    date: '2026-10-11',
    heure: '15:00',
    lieu: 'Stade des Échalonnières',
    meteo: 'Nuageux',
    domicileExterieur: 'exterieur',
    scoreEquipe: 2,
    scoreAdverse: 1,
    systemeEquipe: '4-2-3-1',
    systemeAdverse: '4-3-3',
    typeMatch: 'coupe_pays_de_loire',
    competition: 'Coupe des Pays de la Loire - T2',
    statut: 'termine',
  },
  {
    id: 'm7',
    adversaire: 'US Thouaré',
    date: '2026-08-30',
    heure: '19:30',
    lieu: 'Stade des Noues (Le Cellier)',
    meteo: 'Ensoleillé',
    domicileExterieur: 'domicile',
    scoreEquipe: 4,
    scoreAdverse: 1,
    systemeEquipe: '4-3-3',
    systemeAdverse: '4-4-2',
    typeMatch: 'amical',
    competition: 'Match Amical de Préparation',
    statut: 'termine',
  },
];

export const INITIAL_FEUILLES_MATCH: FeuilleMatchLigne[] = [
  // Match 1 (Domicile, 3-1 contre AS Saint-Germain)
  { id: 'f1_1', matchId: 'm1', joueurId: 'j1', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f1_2', matchId: 'm1', joueurId: 'j2', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f1_3', matchId: 'm1', joueurId: 'j3', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 0, note: 6.5 },
  { id: 'f1_4', matchId: 'm1', joueurId: 'j4', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f1_5', matchId: 'm1', joueurId: 'j5', titulaire: true, minutesJouees: 75, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f1_6', matchId: 'm1', joueurId: 'j6', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 0, note: 7.0 },
  { id: 'f1_7', matchId: 'm1', joueurId: 'j7', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f1_8', matchId: 'm1', joueurId: 'j8', titulaire: true, minutesJouees: 80, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.5 },
  { id: 'f1_9', matchId: 'm1', joueurId: 'j9', titulaire: true, minutesJouees: 65, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f1_10', matchId: 'm1', joueurId: 'j10', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f1_11', matchId: 'm1', joueurId: 'j11', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f1_12', matchId: 'm1', joueurId: 'j15', titulaire: false, statut: 'remplacant', minutesJouees: 25, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },
  { id: 'f1_13', matchId: 'm1', joueurId: 'j14', titulaire: false, statut: 'remplacant', minutesJouees: 10, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f1_14', matchId: 'm1', joueurId: 'j12', titulaire: false, statut: 'blesse', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f1_15', matchId: 'm1', joueurId: 'j16', titulaire: false, statut: 'equipe_b', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f1_16', matchId: 'm1', joueurId: 'j17', titulaire: false, statut: 'equipe_c', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f1_17', matchId: 'm1', joueurId: 'j18', titulaire: false, statut: 'malade', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },

  // Match 2 (Extérieur, 2-0 contre FC Val de Seine)
  { id: 'f2_1', matchId: 'm2', joueurId: 'j1', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.5 },
  { id: 'f2_2', matchId: 'm2', joueurId: 'j2', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 0, note: 7.0 },
  { id: 'f2_3', matchId: 'm2', joueurId: 'j3', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f2_4', matchId: 'm2', joueurId: 'j4', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f2_5', matchId: 'm2', joueurId: 'j5', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f2_6', matchId: 'm2', joueurId: 'j6', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f2_7', matchId: 'm2', joueurId: 'j7', titulaire: true, minutesJouees: 70, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f2_8', matchId: 'm2', joueurId: 'j8', titulaire: true, minutesJouees: 85, buts: 1, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 9.0 },
  { id: 'f2_9', matchId: 'm2', joueurId: 'j9', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f2_10', matchId: 'm2', joueurId: 'j10', titulaire: true, minutesJouees: 60, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },
  { id: 'f2_11', matchId: 'm2', joueurId: 'j11', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f2_12', matchId: 'm2', joueurId: 'j15', titulaire: false, statut: 'remplacant', minutesJouees: 30, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f2_13', matchId: 'm2', joueurId: 'j12', titulaire: false, statut: 'blesse', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f2_14', matchId: 'm2', joueurId: 'j16', titulaire: false, statut: 'equipe_b', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },

  // Match 3 (Domicile, 1-1 contre Olympique Montreuil)
  { id: 'f3_1', matchId: 'm3', joueurId: 'j1', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },
  { id: 'f3_2', matchId: 'm3', joueurId: 'j2', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f3_3', matchId: 'm3', joueurId: 'j3', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },
  { id: 'f3_4', matchId: 'm3', joueurId: 'j4', titulaire: true, minutesJouees: 45, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 1, note: 4.5 },
  { id: 'f3_5', matchId: 'm3', joueurId: 'j5', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f3_6', matchId: 'm3', joueurId: 'j6', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 0, note: 7.0 },
  { id: 'f3_7', matchId: 'm3', joueurId: 'j7', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f3_8', matchId: 'm3', joueurId: 'j8', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f3_9', matchId: 'm3', joueurId: 'j9', titulaire: true, minutesJouees: 80, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },
  { id: 'f3_10', matchId: 'm3', joueurId: 'j10', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f3_11', matchId: 'm3', joueurId: 'j11', titulaire: true, minutesJouees: 60, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 5.5 },
  { id: 'f3_12', matchId: 'm3', joueurId: 'j13', titulaire: false, statut: 'remplacant', minutesJouees: 45, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f3_13', matchId: 'm3', joueurId: 'j12', titulaire: false, statut: 'blesse', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },

  // Match 4 (Extérieur, 4-2 contre Racing Club Sud)
  { id: 'f4_1', matchId: 'm4', joueurId: 'j1', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f4_2', matchId: 'm4', joueurId: 'j2', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f4_3', matchId: 'm4', joueurId: 'j3', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f4_4', matchId: 'm4', joueurId: 'j13', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 0, note: 7.0 },
  { id: 'f4_5', matchId: 'm4', joueurId: 'j5', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f4_6', matchId: 'm4', joueurId: 'j6', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f4_7', matchId: 'm4', joueurId: 'j7', titulaire: true, minutesJouees: 80, buts: 1, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 8.5 },
  { id: 'f4_8', matchId: 'm4', joueurId: 'j8', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 2, cartonsJaunes: 0, cartonsRouges: 0, note: 9.5 },
  { id: 'f4_9', matchId: 'm4', joueurId: 'j10', titulaire: true, minutesJouees: 75, buts: 2, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 9.0 },
  { id: 'f4_10', matchId: 'm4', joueurId: 'j11', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f4_11', matchId: 'm4', joueurId: 'j16', titulaire: true, minutesJouees: 65, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f4_12', matchId: 'm4', joueurId: 'j15', titulaire: false, statut: 'remplacant', minutesJouees: 15, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },
  { id: 'f4_13', matchId: 'm4', joueurId: 'j4', titulaire: false, statut: 'suspendu', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f4_14', matchId: 'm4', joueurId: 'j12', titulaire: false, statut: 'blesse', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f4_15', matchId: 'm4', joueurId: 'j17', titulaire: false, statut: 'equipe_b', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f4_16', matchId: 'm4', joueurId: 'j14', titulaire: false, statut: 'malade', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },

  // Match 5 (Domicile, 2-0 contre Étoile Rouge Athlétique)
  { id: 'f5_1', matchId: 'm5', joueurId: 'j1', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f5_2', matchId: 'm5', joueurId: 'j2', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f5_3', matchId: 'm5', joueurId: 'j3', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f5_4', matchId: 'm5', joueurId: 'j4', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f5_5', matchId: 'm5', joueurId: 'j5', titulaire: true, minutesJouees: 80, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f5_6', matchId: 'm5', joueurId: 'j6', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 0, note: 7.5 },
  { id: 'f5_7', matchId: 'm5', joueurId: 'j7', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f5_8', matchId: 'm5', joueurId: 'j8', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 8.5 },
  { id: 'f5_9', matchId: 'm5', joueurId: 'j9', titulaire: true, minutesJouees: 75, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f5_10', matchId: 'm5', joueurId: 'j10', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f5_11', matchId: 'm5', joueurId: 'j11', titulaire: true, minutesJouees: 85, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f5_12', matchId: 'm5', joueurId: 'j15', titulaire: false, statut: 'remplacant', minutesJouees: 15, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },
  { id: 'f5_13', matchId: 'm5', joueurId: 'j12', titulaire: false, statut: 'blesse', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f5_14', matchId: 'm5', joueurId: 'j16', titulaire: false, statut: 'equipe_b', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f5_15', matchId: 'm5', joueurId: 'j17', titulaire: false, statut: 'equipe_c', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },
  { id: 'f5_16', matchId: 'm5', joueurId: 'j18', titulaire: false, statut: 'absent', minutesJouees: 0, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: null },

  // Match 6 (Extérieur, 2-1 contre ES Vertou - Coupe des Pays de la Loire)
  { id: 'f6_1', matchId: 'm6', joueurId: 'j1', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f6_2', matchId: 'm6', joueurId: 'j2', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f6_3', matchId: 'm6', joueurId: 'j3', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 1, cartonsRouges: 0, note: 7.0 },
  { id: 'f6_4', matchId: 'm6', joueurId: 'j4', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.5 },
  { id: 'f6_5', matchId: 'm6', joueurId: 'j5', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f6_6', matchId: 'm6', joueurId: 'j6', titulaire: true, minutesJouees: 80, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f6_7', matchId: 'm6', joueurId: 'j7', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f6_8', matchId: 'm6', joueurId: 'j8', titulaire: true, minutesJouees: 90, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f6_9', matchId: 'm6', joueurId: 'j9', titulaire: true, minutesJouees: 70, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f6_10', matchId: 'm6', joueurId: 'j10', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f6_11', matchId: 'm6', joueurId: 'j11', titulaire: true, minutesJouees: 65, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f6_12', matchId: 'm6', joueurId: 'j15', titulaire: false, statut: 'remplacant', minutesJouees: 25, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f6_13', matchId: 'm6', joueurId: 'j16', titulaire: false, statut: 'remplacant', minutesJouees: 20, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.0 },

  // Match 7 (Domicile, 4-1 contre US Thouaré - Match Amical)
  { id: 'f7_1', matchId: 'm7', joueurId: 'j1', titulaire: true, minutesJouees: 45, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f7_2', matchId: 'm7', joueurId: 'j2', titulaire: true, minutesJouees: 60, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f7_3', matchId: 'm7', joueurId: 'j3', titulaire: true, minutesJouees: 90, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f7_4', matchId: 'm7', joueurId: 'j4', titulaire: true, minutesJouees: 60, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f7_5', matchId: 'm7', joueurId: 'j5', titulaire: true, minutesJouees: 45, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f7_6', matchId: 'm7', joueurId: 'j6', titulaire: true, minutesJouees: 60, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f7_7', matchId: 'm7', joueurId: 'j7', titulaire: true, minutesJouees: 45, buts: 1, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f7_8', matchId: 'm7', joueurId: 'j8', titulaire: true, minutesJouees: 45, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.5 },
  { id: 'f7_9', matchId: 'm7', joueurId: 'j9', titulaire: true, minutesJouees: 60, buts: 1, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 8.0 },
  { id: 'f7_10', matchId: 'm7', joueurId: 'j10', titulaire: true, minutesJouees: 60, buts: 1, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 8.5 },
  { id: 'f7_11', matchId: 'm7', joueurId: 'j11', titulaire: true, minutesJouees: 45, buts: 0, passesDecisives: 1, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f7_12', matchId: 'm7', joueurId: 'j13', titulaire: false, statut: 'remplacant', minutesJouees: 45, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 7.0 },
  { id: 'f7_13', matchId: 'm7', joueurId: 'j14', titulaire: false, statut: 'remplacant', minutesJouees: 45, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f7_14', matchId: 'm7', joueurId: 'j15', titulaire: false, statut: 'remplacant', minutesJouees: 30, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
  { id: 'f7_15', matchId: 'm7', joueurId: 'j16', titulaire: false, statut: 'remplacant', minutesJouees: 30, buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0, note: 6.5 },
];

export const INITIAL_COMPOSITIONS: Record<string, CompositionMatch> = {
  m1: {
    matchId: 'm1',
    systeme: '4-3-3',
    positions: [
      { joueurId: 'j1', roleLabel: 'G', x: 50, y: 88 },
      { joueurId: 'j5', roleLabel: 'DG', x: 18, y: 72 },
      { joueurId: 'j3', roleLabel: 'DCG', x: 38, y: 75 },
      { joueurId: 'j4', roleLabel: 'DCD', x: 62, y: 75 },
      { joueurId: 'j2', roleLabel: 'DD', x: 82, y: 72 },
      { joueurId: 'j6', roleLabel: 'MDC', x: 50, y: 56 },
      { joueurId: 'j7', roleLabel: 'MCG', x: 34, y: 44 },
      { joueurId: 'j8', roleLabel: 'MCD', x: 66, y: 44 },
      { joueurId: 'j11', roleLabel: 'AG', x: 20, y: 22 },
      { joueurId: 'j10', roleLabel: 'BU', x: 50, y: 16 },
      { joueurId: 'j9', roleLabel: 'AD', x: 80, y: 22 },
    ],
  },
  m2: {
    matchId: 'm2',
    systeme: '4-2-3-1',
    positions: [
      { joueurId: 'j1', roleLabel: 'G', x: 50, y: 88 },
      { joueurId: 'j5', roleLabel: 'DG', x: 18, y: 72 },
      { joueurId: 'j3', roleLabel: 'DCG', x: 38, y: 75 },
      { joueurId: 'j4', roleLabel: 'DCD', x: 62, y: 75 },
      { joueurId: 'j2', roleLabel: 'DD', x: 82, y: 72 },
      { joueurId: 'j6', roleLabel: 'MDC1', x: 38, y: 58 },
      { joueurId: 'j7', roleLabel: 'MDC2', x: 62, y: 58 },
      { joueurId: 'j11', roleLabel: 'MOG', x: 22, y: 35 },
      { joueurId: 'j8', roleLabel: 'MOC', x: 50, y: 35 },
      { joueurId: 'j9', roleLabel: 'MOD', x: 78, y: 35 },
      { joueurId: 'j10', roleLabel: 'BU', x: 50, y: 16 },
    ],
  },
  m3: {
    matchId: 'm3',
    systeme: '4-3-3',
    positions: [
      { joueurId: 'j1', roleLabel: 'G', x: 50, y: 88 },
      { joueurId: 'j5', roleLabel: 'DG', x: 18, y: 72 },
      { joueurId: 'j3', roleLabel: 'DCG', x: 38, y: 75 },
      { joueurId: 'j4', roleLabel: 'DCD', x: 62, y: 75 },
      { joueurId: 'j2', roleLabel: 'DD', x: 82, y: 72 },
      { joueurId: 'j6', roleLabel: 'MDC', x: 50, y: 56 },
      { joueurId: 'j7', roleLabel: 'MCG', x: 34, y: 44 },
      { joueurId: 'j8', roleLabel: 'MCD', x: 66, y: 44 },
      { joueurId: 'j11', roleLabel: 'AG', x: 20, y: 22 },
      { joueurId: 'j10', roleLabel: 'BU', x: 50, y: 16 },
      { joueurId: 'j9', roleLabel: 'AD', x: 80, y: 22 },
    ],
  },
  m4: {
    matchId: 'm4',
    systeme: '3-5-2',
    positions: [
      { joueurId: 'j1', roleLabel: 'G', x: 50, y: 88 },
      { joueurId: 'j3', roleLabel: 'DCG', x: 28, y: 75 },
      { joueurId: 'j13', roleLabel: 'DCC', x: 50, y: 77 },
      { joueurId: 'j5', roleLabel: 'DCD', x: 72, y: 75 },
      { joueurId: 'j11', roleLabel: 'Piston G', x: 14, y: 50 },
      { joueurId: 'j6', roleLabel: 'MDC', x: 50, y: 58 },
      { joueurId: 'j7', roleLabel: 'MCG', x: 35, y: 42 },
      { joueurId: 'j8', roleLabel: 'MCD', x: 65, y: 42 },
      { joueurId: 'j2', roleLabel: 'Piston D', x: 86, y: 50 },
      { joueurId: 'j10', roleLabel: 'BUG', x: 38, y: 18 },
      { joueurId: 'j16', roleLabel: 'BUD', x: 62, y: 18 },
    ],
  },
  m5: {
    matchId: 'm5',
    systeme: '4-3-3',
    positions: [
      { joueurId: 'j1', roleLabel: 'G', x: 50, y: 88 },
      { joueurId: 'j5', roleLabel: 'DG', x: 18, y: 72 },
      { joueurId: 'j3', roleLabel: 'DCG', x: 38, y: 75 },
      { joueurId: 'j4', roleLabel: 'DCD', x: 62, y: 75 },
      { joueurId: 'j2', roleLabel: 'DD', x: 82, y: 72 },
      { joueurId: 'j6', roleLabel: 'MDC', x: 50, y: 56 },
      { joueurId: 'j7', roleLabel: 'MCG', x: 34, y: 44 },
      { joueurId: 'j8', roleLabel: 'MCD', x: 66, y: 44 },
      { joueurId: 'j11', roleLabel: 'AG', x: 20, y: 22 },
      { joueurId: 'j10', roleLabel: 'BU', x: 50, y: 16 },
      { joueurId: 'j9', roleLabel: 'AD', x: 80, y: 22 },
    ],
  },
};

export interface NoteColorConfig {
  bg: string;
  text: string;
  border: string;
  hex: string;
  textHex: string;
  label: string;
}

export const NOTE_PRESETS: { note: number; label: string; colorKey: string }[] = [
  { note: 0, label: '0 - Très insuffisant', colorKey: 'noire' },
  { note: 1, label: '1 - Insuffisant (rouge foncé)', colorKey: 'rouge-1' },
  { note: 2, label: '2 - Très difficile (rouge vif)', colorKey: 'rouge-2' },
  { note: 3, label: '3 - En dessous (orange foncé)', colorKey: 'orange-3' },
  { note: 4, label: '4 - Moyen bas (orange vif)', colorKey: 'orange-4' },
  { note: 5, label: '5 - Moyen (jaune ambré)', colorKey: 'jaune-5' },
  { note: 6, label: '6 - Correct (jaune doré)', colorKey: 'jaune-6' },
  { note: 7, label: '7 - Bon match (vert clair)', colorKey: 'vert-7' },
  { note: 8, label: '8 - Très bon match (vert foncé)', colorKey: 'vert-8' },
  { note: 9, label: '9 - Excellent (bleu royal)', colorKey: 'bleu-9' },
  { note: 10, label: '10 - Match parfait (bleu électrique)', colorKey: 'bleu-10' },
];

export function getNoteColor(note: number | null | undefined): NoteColorConfig {
  if (note === null || note === undefined) {
    return {
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
      hex: '#334155',
      textHex: '#94a3b8',
      label: '-',
    };
  }

  // 0 : Noire pour la plus basse 0
  if (note < 0.5) {
    return {
      bg: 'bg-black',
      text: 'text-white font-extrabold',
      border: 'border-zinc-800',
      hex: '#09090b',
      textHex: '#ffffff',
      label: note.toFixed(1),
    };
  }

  // 1 et 2 : Rouge avec nuance
  // 1 : Rouge très foncé (bordeaux sombre)
  if (note < 1.5) {
    return {
      bg: 'bg-red-950',
      text: 'text-red-200 font-extrabold',
      border: 'border-red-800',
      hex: '#7f1d1d',
      textHex: '#fee2e2',
      label: note.toFixed(1),
    };
  }
  // 2 : Rouge vif
  if (note < 2.5) {
    return {
      bg: 'bg-red-600',
      text: 'text-white font-extrabold',
      border: 'border-red-500',
      hex: '#dc2626',
      textHex: '#ffffff',
      label: note.toFixed(1),
    };
  }

  // 3 et 4 : Orange nuancé
  // 3 : Orange foncé / brique
  if (note < 3.5) {
    return {
      bg: 'bg-orange-800',
      text: 'text-orange-100 font-extrabold',
      border: 'border-orange-700',
      hex: '#c2410c',
      textHex: '#ffedd5',
      label: note.toFixed(1),
    };
  }
  // 4 : Orange vif
  if (note < 4.5) {
    return {
      bg: 'bg-orange-500',
      text: 'text-white font-extrabold',
      border: 'border-orange-400',
      hex: '#f97316',
      textHex: '#ffffff',
      label: note.toFixed(1),
    };
  }

  // 5 et 6 : Jaune nuancé
  // 5 : Jaune ambré / moutarde
  if (note < 5.5) {
    return {
      bg: 'bg-amber-500',
      text: 'text-amber-950 font-extrabold',
      border: 'border-amber-400',
      hex: '#d97706',
      textHex: '#451a03',
      label: note.toFixed(1),
    };
  }
  // 6 : Jaune doré éclatant
  if (note < 6.5) {
    return {
      bg: 'bg-yellow-400',
      text: 'text-yellow-950 font-extrabold',
      border: 'border-yellow-300',
      hex: '#facc15',
      textHex: '#422006',
      label: note.toFixed(1),
    };
  }

  // 7 et 8 : Vert nuancé
  // 7 : Vert clair (lime / pomme clair éclatant)
  if (note < 7.5) {
    return {
      bg: 'bg-lime-400',
      text: 'text-slate-950 font-black',
      border: 'border-lime-300',
      hex: '#a3e635',
      textHex: '#14532d',
      label: note.toFixed(1),
    };
  }
  // 8 : Vert soutenu / vert classique
  if (note < 8.5) {
    return {
      bg: 'bg-green-600',
      text: 'text-white font-extrabold',
      border: 'border-green-500',
      hex: '#16a34a',
      textHex: '#ffffff',
      label: note.toFixed(1),
    };
  }

  // 9 et 10 : Bleu nuancé
  // 9 : Bleu royal
  if (note < 9.75) {
    return {
      bg: 'bg-blue-600',
      text: 'text-white font-extrabold',
      border: 'border-blue-500',
      hex: '#2563eb',
      textHex: '#ffffff',
      label: note.toFixed(1),
    };
  }
  // 10 : Bleu électrique / azur
  return {
    bg: 'bg-cyan-500',
    text: 'text-slate-950 font-extrabold',
    border: 'border-cyan-300',
    hex: '#0284c7',
    textHex: '#082f49',
    label: note.toFixed(1),
  };
}
