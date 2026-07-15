import { Chess } from 'chess.js';

// Standard piece values
const PIECE_VALUES: { [key: string]: number } = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-Square Tables to encourage natural developmental chess moves, especially for children to learn from!
// Positive values are good for White, negative values are good for Black (or we flip for Black).
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDDLE_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// Evaluate the board state from Black's perspective
// Since AI plays as Black, we return a score where a higher score is better for Black.
function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const type = piece.type;
        const color = piece.color;
        let val = PIECE_VALUES[type] || 0;

        // Apply PST bonuses
        let pstVal = 0;
        switch (type) {
          case 'p':
            pstVal = color === 'w' ? PAWN_PST[r][c] : PAWN_PST[7 - r][c];
            break;
          case 'n':
            pstVal = color === 'w' ? KNIGHT_PST[r][c] : KNIGHT_PST[7 - r][c];
            break;
          case 'b':
            pstVal = color === 'w' ? BISHOP_PST[r][c] : BISHOP_PST[7 - r][c];
            break;
          case 'r':
            pstVal = color === 'w' ? ROOK_PST[r][c] : ROOK_PST[7 - r][c];
            break;
          case 'q':
            pstVal = color === 'w' ? QUEEN_PST[r][c] : QUEEN_PST[7 - r][c];
            break;
          case 'k':
            pstVal = color === 'w' ? KING_MIDDLE_PST[r][c] : KING_MIDDLE_PST[7 - r][c];
            break;
        }

        const totalVal = val + pstVal;

        if (color === 'b') {
          score += totalVal; // Black (AI) points are positive
        } else {
          score -= totalVal; // White (Player) points are negative
        }
      }
    }
  }

  return score;
}

// Sort moves to optimize Alpha-Beta pruning by evaluating checks and high-value captures first
function getSortedMoves(chess: Chess): any[] {
  const moves = chess.moves({ verbose: true });
  return moves.sort((a, b) => {
    // 1. Checkmate moves
    if (a.san.includes('#')) return -1;
    if (b.san.includes('#')) return 1;
    // 2. Checking moves
    if (a.san.includes('+')) return -1;
    if (b.san.includes('+')) return 1;
    
    // 3. Capture moves (sort by value of captured piece)
    const valA = a.captured ? PIECE_VALUES[a.captured] || 10 : 0;
    const valB = b.captured ? PIECE_VALUES[b.captured] || 10 : 0;
    if (valA !== valB) {
      return valB - valA;
    }

    // 4. Promotions
    if (a.promotion) return -1;
    if (b.promotion) return 1;

    return 0;
  });
}

// Alpha-Beta Minimax
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const sortedMoves = getSortedMoves(chess);

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of sortedMoves) {
      chess.move(move.san);
      const score = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) {
        break; // beta cut-off
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of sortedMoves) {
      chess.move(move.san);
      const score = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) {
        break; // alpha cut-off
      }
    }
    return minEval;
  }
}

/**
 * AI Opponent Move Generator
 * @param fen The current board FEN
 * @param difficulty 'easy' | 'medium' | 'hard' | 'expert'
 * @returns The best move's SAN notation, or null if no moves are possible
 */
export function getAIMove(fen: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) return null;

  // Easy level (Dễ):
  // 40% of the time plays a random move.
  // 60% of the time plays a 1-ply direct evaluation move (simple local threat/capture).
  if (difficulty === 'easy') {
    if (Math.random() < 0.4) {
      const randomIndex = Math.floor(Math.random() * moves.length);
      return moves[randomIndex].san;
    } else {
      // Find the best move looking only 1 ply ahead (depth 0)
      const candidates: { san: string, score: number }[] = [];
      for (const move of moves) {
        chess.move(move.san);
        const score = evaluateBoard(chess);
        chess.undo();
        candidates.push({ san: move.san, score });
      }
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].san;
    }
  }

  // Medium level (Trung bình):
  // Looks 2 plies ahead (Minimax depth 1: AI move -> Player reply)
  // 15% of the time makes a sub-optimal choice (like the 2nd best move or a 1-ply direct eval) to make it beatable.
  // 85% of the time plays the optimal minimax move.
  if (difficulty === 'medium') {
    const scoredMoves: { san: string, score: number }[] = [];

    for (const move of moves) {
      chess.move(move.san);
      const score = minimax(chess, 1, -Infinity, Infinity, false); // depth 2 search
      chess.undo();
      scoredMoves.push({ san: move.san, score });
    }

    scoredMoves.sort((a, b) => b.score - a.score);

    // 15% chance to slip up
    if (scoredMoves.length > 2 && Math.random() < 0.15) {
      return scoredMoves[Math.floor(Math.random() * 2) + 1].san;
    }
    return scoredMoves[0].san;
  }

  // Hard level (Khó):
  // Looks 3 plies ahead (Minimax depth 2: AI move -> Player reply -> AI reply)
  // Plays perfectly without blunders.
  if (difficulty === 'hard') {
    const scoredMoves: { san: string, score: number }[] = [];

    for (const move of moves) {
      chess.move(move.san);
      const score = minimax(chess, 2, -Infinity, Infinity, false); // depth 3 search
      chess.undo();
      scoredMoves.push({ san: move.san, score });
    }

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].san;
  }

  // Expert level (Chuyên gia):
  // Looks 4 plies ahead (Minimax depth 3)
  // Strong positional play with rapid response due to optimized move ordering.
  if (difficulty === 'expert') {
    const scoredMoves: { san: string, score: number }[] = [];

    for (const move of moves) {
      chess.move(move.san);
      const score = minimax(chess, 3, -Infinity, Infinity, false); // depth 4 search
      chess.undo();
      scoredMoves.push({ san: move.san, score });
    }

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].san;
  }

  return moves[0].san;
}

/**
 * Hint Move Generator
 * Analyzes the board and returns the best 3 moves for White (the player)
 */
export function getWhiteBestMoves(fen: string): string[] {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  
  if (moves.length === 0) return [];

  const scoredMoves: { san: string, score: number }[] = [];

  for (const move of moves) {
    chess.move(move.san);
    // For white, we want to MINIMIZE the evaluation score (because White is negative, Black is positive)
    // Or we evaluate board from White's perspective (negative score means White is winning).
    const score = evaluateBoard(chess);
    chess.undo();
    scoredMoves.push({ san: move.san, score });
  }

  // Sort ascending because more negative means better for White
  scoredMoves.sort((a, b) => a.score - b.score);

  return scoredMoves.slice(0, 3).map(m => m.san);
}

/**
 * Evaluates the game stage (Opening, Middle, End)
 */
export function getGameStage(fen: string): 'khai_cuoc' | 'trung_cuoc' | 'tan_cuoc' {
  const chess = new Chess(fen);
  const board = chess.board();
  let majorPiecesCount = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'p' && piece.type !== 'k') {
        majorPiecesCount++;
      }
    }
  }

  const movesCount = chess.history().length;

  if (movesCount <= 12) {
    return 'khai_cuoc';
  } else if (majorPiecesCount <= 6) {
    return 'tan_cuoc';
  } else {
    return 'trung_cuoc';
  }
}
