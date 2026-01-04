export interface TopScorer {
  userId: string;
  username: string;
  userPhoto: string;
  goals: number;
  club: string;
}

export interface BestPlay {
  postId: string;
  userId: string;
  username: string;
  userPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  votes: number;
}

export interface BestTeam {
  clubId: string;
  clubName: string;
  clubBadge: string;
  wins: number;
  points: number;
}

export interface Rankings {
  topScorers: TopScorer[];
  bestPlays: BestPlay[];
  bestTeams: BestTeam[];
  weekNumber: number;
  updatedAt: string;
}
