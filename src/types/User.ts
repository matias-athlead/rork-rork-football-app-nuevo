export type UserRole = 'player' | 'coach' | 'club';

export type Position = 'GK' | 'RB' | 'LB' | 'CB' | 'DM' | 'CM' | 'AM' | 'RW' | 'LW' | 'ST';

export type Federation = 'RFEF' | 'Andaluza' | 'Catalana' | 'Madrileña' | 'Vasca' | 'Valenciana' | 'Aragonesa' | 'Gallega' | 'Castellana' | 'Murciana';

export type CoachCategory = 'Prebenjamín' | 'Benjamín' | 'Alevín' | 'Infantil' | 'Cadete' | 'Juvenil' | 'Senior';

export interface BaseUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  profilePhoto: string;
  coverPhoto: string;
  bio: string;
  followers: number;
  following: number;
  isPrivate: boolean;
  isPremium: boolean;
  isFollowing?: boolean;
  isFollowRequested?: boolean;
  createdAt: string;
  birthdate: string;
  city?: string;
  federation: Federation;
}

export interface PlayerProfile extends BaseUser {
  role: 'player';
  age: number;
  currentClub?: string;
  positions: Position[];
  stats: PlayerStats;
  radarStats: PlayerRadarStats;
}

export interface CoachProfile extends BaseUser {
  role: 'coach';
  club?: string;
  categories: CoachCategory[];
  radarStats: CoachRadarStats;
}

export interface ClubProfile extends BaseUser {
  role: 'club';
  clubName: string;
  badge: string;
  responsiblePerson?: string;
  coaches: string[];
  radarStats: ClubRadarStats;
}

export type User = PlayerProfile | CoachProfile | ClubProfile;

export interface PlayerStats {
  speed: number;
  power: number;
  sprints: number;
  offBallRuns: number;
  dribbles: number;
  passAccuracy: number;
  goals: number;
  assists: number;
  minutes: number;
  matchesPlayed: number;
  shotsOnTarget: number;
}

export interface PlayerRadarStats {
  speed: number;
  passPercentage: number;
  goalPercentage: number;
  matchCompletionPercentage: number;
  dribbles: number;
}

export interface CoachRadarStats {
  winPercentage: number;
  playerDevelopment: number;
  trainingAttendance: number;
  tacticsScore: number;
  motivation: number;
}

export interface ClubRadarStats {
  winPercentage: number;
  goalsPerGame: number;
  cleanSheets: number;
  youthDevelopment: number;
  budgetManagement: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
