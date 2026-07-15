export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string; // e.g., 'lion', 'panda', 'fox', 'koala', 'bunny'
  createdAt: string;
  elo: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  completedDifficulties: { [key in Difficulty]?: number }; // difficulty -> completed matches count
}

export interface MatchRecord {
  id: string;
  playerProfileId: string;
  playerName: string;
  difficulty: Difficulty;
  result: 'win' | 'loss' | 'draw' | 'resigned';
  movesCount: number;
  date: string;
}

export interface ChatMessage {
  id: string;
  sender: 'player' | 'ai_coach' | 'system';
  text: string;
  timestamp: string;
  characterName?: string;
  avatar?: string;
  isExplainable?: boolean;
  moveData?: {
    move: string;
    pieceName: string;
    color: string;
    playerMove: boolean;
    boardFen: string;
    capture: boolean;
    isCheck: boolean;
    isCheckmate: boolean;
    gameStage: 'khai_cuoc' | 'trung_cuoc' | 'tan_cuoc';
  };
}
