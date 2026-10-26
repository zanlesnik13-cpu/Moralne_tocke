export interface User {
  name: string;
  createdAt: string;
  avatarColor: string;
}

export interface Rule {
  id: string;
  label: string;
  points: number;
  isDirectChallenge?: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  recordedBy: string;
  targetUser: string;
  points: number;
  reason: string;
  isDirectChallenge?: boolean;
}

export interface UserScore {
  total: number;
  count: number;
  directChallenges: number;
}

export interface AppState {
  users: User[];
  rules: Rule[];
  history: HistoryEntry[];
  scores: Record<string, UserScore>;
}
