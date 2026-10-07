export type PosteJoueur =
  | 'G'    // Gardien
  | 'DC'   // Défenseur Central
  | 'DD'   // Latéral Droit
  | 'DG'   // Latéral Gauche
  | 'MDC'  // Milieu Défensif
  | 'MC'   // Milieu Central
  | 'MO'   // Milieu Offensif
  | 'AD'   // Ailier Droit
  | 'AG'   // Ailier Gauche
  | 'BU';  // Buteur / Avant-centre

export const POSTES_CONFIG: Record<PosteJoueur, { label: string; categorie: 'Gardien' | 'Défense' | 'Milieu' | 'Attaque'; color: string }> = {
  G: { label: 'Gardien', categorie: 'Gardien', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  DC: { label: 'Défenseur Central', categorie: 'Défense', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  DD: { label: 'Latéral Droit', categorie: 'Défense', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  DG: { label: 'Latéral Gauche', categorie: 'Défense', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  MDC: { label: 'Milieu Défensif', categorie: 'Milieu', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  MC: { label: 'Milieu Central', categorie: 'Milieu', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  MO: { label: 'Milieu Offensif', categorie: 'Milieu', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  AD: { label: 'Ailier Droit', categorie: 'Attaque', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  AG: { label: 'Ailier Gauche', categorie: 'Attaque', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  BU: { label: 'Buteur / Attaquant', categorie: 'Attaque', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

export type PiedFort = 'Droitier' | 'Gaucher' | 'Ambidextre';

export interface Joueur {
  id: string;
  nom: string;
  prenom: string;
  surnom?: string; // Surnom ou alias du joueur
  poste: PosteJoueur;
  numero: number;
  photo: string;
  age?: number; // Âge en années
  taille?: number; // Taille en cm (ex: 182)
  poids?: number; // Poids en kg (ex: 75)
  piedFort?: PiedFort; // Droitier, Gaucher ou Ambidextre
  vma?: number; // Vitesse Maximale Aérobie en km/h (ex: 16.5)
}

export type MeteoType = 'Ensoleillé' | 'Nuageux' | 'Pluvieux' | 'Venteux' | 'Froid' | 'Orageux';

export type SystemeTactique =
  | '4-3-3'
  | '4-2-3-1'
  | '3-5-2'
  | '4-4-2'
  | '4-4-2 Losange'
  | '3-4-3'
  | '5-3-2'
  | '4-1-4-1';

export type NiveauJoueurAdverse = 'fort+' | 'fort' | 'moyen' | 'faible' | 'faible +';

export interface JoueurAdverseTactique {
  id: string; // id unique dans le schéma adverse
  numero: number;
  nom: string;
  roleLabel: string;
  photo?: string;
  indication: NiveauJoueurAdverse; // fort+, fort, moyen, faible, faible +
  notes?: string; // Points forts/faibles à exploiter pour le match retour
  caracteristique?: string; // Annotation particulière principale ou résumé
  annotations?: string[]; // Liste de plusieurs annotations particulières sélectionnées parmi celles proposées
  x: number; // 0 à 100% de la largeur du terrain
  y: number; // 0 à 100% de la hauteur du terrain
}

export interface ScoutingAdverse {
  matchId: string;
  systeme: string;
  joueurs: JoueurAdverseTactique[];
  consignesRetour?: string; // Consignes générales pour anticiper le match retour
}

export type TypeMatch =
  | 'championnat'
  | 'coupe_de_france'
  | 'coupe_pays_de_loire'
  | 'amical';

export interface TypeMatchConfig {
  id: TypeMatch;
  label: string;
  shortLabel: string;
  badgeClass: string;
  borderClass: string;
  icon: string;
  defaultCompetition: string;
  headerColor: string;
}

export const TYPES_MATCH_CONFIG: Record<TypeMatch, TypeMatchConfig> = {
  championnat: {
    id: 'championnat',
    label: 'Match de Championnat',
    shortLabel: 'Championnat',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    borderClass: 'border-blue-500',
    icon: '🏆',
    defaultCompetition: 'Championnat R3',
    headerColor: 'text-blue-400',
  },
  coupe_de_france: {
    id: 'coupe_de_france',
    label: 'Match de Coupe de France',
    shortLabel: 'Coupe de France',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderClass: 'border-indigo-500',
    icon: '🇫🇷',
    defaultCompetition: 'Coupe de France',
    headerColor: 'text-indigo-400',
  },
  coupe_pays_de_loire: {
    id: 'coupe_pays_de_loire',
    label: 'Match de Coupe de Pays de la Loire',
    shortLabel: 'Coupe Pays de Loire',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-500',
    icon: '🏰',
    defaultCompetition: 'Coupe des Pays de la Loire',
    headerColor: 'text-emerald-400',
  },
  amical: {
    id: 'amical',
    label: 'Match Amical',
    shortLabel: 'Match Amical',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-500',
    icon: '🤝',
    defaultCompetition: 'Match Amical',
    headerColor: 'text-amber-400',
  },
};

export const TYPES_MATCH_LIST: TypeMatch[] = [
  'championnat',
  'coupe_de_france',
  'coupe_pays_de_loire',
  'amical',
];

export function detectTypeMatch(matchOrComp?: Partial<Match> | string): TypeMatch {
  if (!matchOrComp) return 'championnat';
  if (typeof matchOrComp === 'object' && matchOrComp.typeMatch) {
    return matchOrComp.typeMatch;
  }
  const text = (
    typeof matchOrComp === 'string' ? matchOrComp : matchOrComp.competition || ''
  ).toLowerCase();

  if (text.includes('france') || text.includes('cdf')) return 'coupe_de_france';
  if (
    text.includes('loire') ||
    text.includes('cpdl') ||
    text.includes('pays de la loire') ||
    text.includes('pays de loire')
  ) {
    return 'coupe_pays_de_loire';
  }
  if (
    text.includes('amical') ||
    text.includes('amicale') ||
    text.includes('prépa') ||
    text.includes('prepa')
  ) {
    return 'amical';
  }
  return 'championnat';
}

export interface Match {
  id: string;
  adversaire: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:MM
  lieu: string; // Stade ou ville
  meteo: MeteoType;
  domicileExterieur: 'domicile' | 'exterieur';
  scoreEquipe: number;
  scoreAdverse: number;
  systemeEquipe: SystemeTactique;
  systemeAdverse: string;
  typeMatch?: TypeMatch; // 'championnat' | 'coupe_de_france' | 'coupe_pays_de_loire' | 'amical'
  competition: string;
  statut: 'termine' | 'a_venir';
  valide?: boolean; // Indique si les informations du match ont été validées et compilées
  dateValidation?: string; // Horodatage ISO de la dernière validation
  photos?: string[]; // 1 ou 2 photos associées au match (souvenirs, causerie, équipe, action)
  scoutingAdverse?: ScoutingAdverse; // Schéma tactique et indications individuelles de l'adversaire
}

export interface FeuilleMatchLigne {
  id: string;
  matchId: string;
  joueurId: string;
  titulaire: boolean;
  statut?: StatutMatchJoueur; // Statut élargi : titulaire, remplaçant, blessé, absent, malade, non convoqué, suspendu, équipe B, équipe C
  minutesJouees: number;
  buts: number;
  passesDecisives: number;
  cartonsJaunes: number;
  cartonsRouges: number;
  note: number | null; // Note sur 10 (ex: 7.5) ou null si pas noté
}

export type StatutMatchJoueur =
  | 'titulaire'
  | 'remplacant'
  | 'blesse'
  | 'absent'
  | 'malade'
  | 'non_convoque'
  | 'suspendu'
  | 'equipe_b'
  | 'equipe_c';

export interface StatutMatchConfig {
  label: string;
  shortLabel: string;
  icon: string;
  badgeClass: string;
  selectClass: string;
  borderClass: string;
  isActif: boolean; // vrai si le joueur est en tenue pour la rencontre R3
}

export const STATUTS_MATCH_CONFIG: Record<StatutMatchJoueur, StatutMatchConfig> = {
  titulaire: {
    label: 'Titulaire',
    shortLabel: 'TIT',
    icon: '🟢',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    selectClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-500',
    isActif: true,
  },
  remplacant: {
    label: 'Remplaçant',
    shortLabel: 'REM',
    icon: '🔵',
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    selectClass: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
    borderClass: 'border-blue-500',
    isActif: true,
  },
  blesse: {
    label: 'Blessé',
    shortLabel: 'BLE',
    icon: '🩹',
    badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    selectClass: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
    borderClass: 'border-rose-500',
    isActif: false,
  },
  absent: {
    label: 'Absent',
    shortLabel: 'ABS',
    icon: '⚪',
    badgeClass: 'bg-slate-700/30 text-slate-300 border border-slate-600/40',
    selectClass: 'bg-slate-900 text-slate-300 border-slate-700',
    borderClass: 'border-slate-500',
    isActif: false,
  },
  malade: {
    label: 'Malade',
    shortLabel: 'MAL',
    icon: '🤒',
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    selectClass: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-500',
    isActif: false,
  },
  non_convoque: {
    label: 'Non convoqué',
    shortLabel: 'NC',
    icon: '📋',
    badgeClass: 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50',
    selectClass: 'bg-zinc-900 text-zinc-400 border-zinc-700',
    borderClass: 'border-zinc-600',
    isActif: false,
  },
  suspendu: {
    label: 'Suspendu',
    shortLabel: 'SUSP',
    icon: '🟥',
    badgeClass: 'bg-red-950/40 text-red-400 border border-red-800/40',
    selectClass: 'bg-red-950 text-red-300 border-red-700/50',
    borderClass: 'border-red-600',
    isActif: false,
  },
  equipe_b: {
    label: 'En équipe B',
    shortLabel: 'ÉQ. B',
    icon: '🅱️',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    selectClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
    borderClass: 'border-indigo-500',
    isActif: false,
  },
  equipe_c: {
    label: 'En équipe C',
    shortLabel: 'ÉQ. C',
    icon: '🅲',
    badgeClass: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    selectClass: 'bg-violet-950/80 text-violet-300 border-violet-500/40',
    borderClass: 'border-violet-500',
    isActif: false,
  },
};

export function getLigneStatut(ligne?: FeuilleMatchLigne): StatutMatchJoueur {
  if (!ligne) return 'non_convoque';
  if (ligne.statut) return ligne.statut;
  if (ligne.titulaire) return 'titulaire';
  if (ligne.minutesJouees > 0) return 'remplacant';
  return 'remplacant';
}

export interface PositionTactique {
  joueurId: string;
  roleLabel: string;
  x: number; // 0 à 100% de la largeur du terrain
  y: number; // 0 à 100% de la hauteur du terrain (88% = Gardien, 15% = Attaquant)
}

export interface CompositionMatch {
  matchId: string;
  systeme: SystemeTactique;
  positions: PositionTactique[];
}

export type FiltreLieu = 'tous' | 'domicile' | 'exterieur';

export interface StatsJoueurCumulees {
  joueur: Joueur;
  matchsJoues: number;
  titularisations: number;
  remplacements: number;
  blessesCount?: number;
  absentsCount?: number;
  maladesCount?: number;
  nonConvoquesCount?: number;
  suspendusCount?: number;
  equipeBCount?: number;
  equipeCCount?: number;
  minutesTotales: number;
  butsTotaux: number;
  passesTotales: number;
  cartonsJaunesTotaux: number;
  cartonsRougesTotaux: number;
  moyenneNotes: number | null;
  nombreNotes: number;
  matchsParType?: Record<TypeMatch, number>;
  butsParType?: Record<TypeMatch, number>;
  // Moyennes calculées automatiquement
  moyenneButs: number; // butsTotaux / (matchsJoues || 1)
  moyennePasses: number; // passesTotales / (matchsJoues || 1)
  moyenneCartons: number; // (cartonsJaunesTotaux + cartonsRougesTotaux) / (matchsJoues || 1)
  moyenneMinutes: number; // minutesTotales / (matchsJoues || 1)
  ratioButsMinutes?: number; // buts par 90 minutes jouées
}
