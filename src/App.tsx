import { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  Award, 
  Sparkles, 
  BrainCircuit, 
  Play, 
  HelpCircle, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Flag
} from 'lucide-react';

import { Difficulty, PlayerProfile, ChatMessage } from './types';
import { ChessboardView } from './components/ChessboardView';
import { CoachChat } from './components/CoachChat';
import { ProfileSelector } from './components/ProfileSelector';
import { DifficultyRecommender } from './components/DifficultyRecommender';
import { getProfiles, getActiveProfileId, addMatchRecord, setActiveProfileId } from './utils/profileStorage';
import { getAIMove, getWhiteBestMoves, getGameStage } from './utils/chessAI';
import { speakWithRole, getRabbitPlayerSpeech, getOpponentSpeech, getGameOverSpeech, getSpeechEnabled, setSpeechEnabled } from './lib/speech';

export default function App() {
  // Chess Core States
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [kingInCheckSquare, setKingInCheckSquare] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | 'active'>('active');

  // Player & Profile States
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isBoardExpanded, setIsBoardExpanded] = useState<boolean>(false);
  const [gameCompletedTrigger, setGameCompletedTrigger] = useState<number>(0);
  
  // Chat & AI Coaching States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [autoComment, setAutoComment] = useState(false); // Default false to save tokens as requested!
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabledState] = useState(getSpeechEnabled());
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{ from: Square; to: Square } | null>(null);

  const handleToggleSpeech = (val: boolean) => {
    setSpeechEnabledState(val);
    setSpeechEnabled(val);
  };

  // Load profiles on mount
  useEffect(() => {
    const loadedProfiles = getProfiles();
    setProfiles(loadedProfiles);
    
    const activeId = getActiveProfileId();
    if (activeId && loadedProfiles.some(p => p.id === activeId)) {
      setActiveProfileIdState(activeId);
    } else if (loadedProfiles.length > 0) {
      setActiveProfileIdState(loadedProfiles[0].id);
      setActiveProfileId(loadedProfiles[0].id);
    }
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Initialize a new game
  const handleNewGame = (resetChat = true) => {
    chessRef.current = new Chess();
    setFen(chessRef.current.fen());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setKingInCheckSquare(null);
    setGameResult('active');
    setIsAiThinking(false);

    if (resetChat) {
      const pName = activeProfile ? activeProfile.name : "Kỳ thủ nhí";
      setMessages([
        {
          id: 'welcome',
          sender: 'ai_coach',
          text: `Chào mừng ${pName} đến với Học viện Cờ vua Nhí! ✨\nTa là Thỏ Trắng, sư phụ của con đây! Ta đang rất hào hứng xem con chơi cờ.\n\nHãy chọn một quân cờ Trắng và di chuyển nhé! Nếu gặp khó khăn, cứ bấm nút **Gợi ý** ở góc phải!`,
          timestamp: new Date().toISOString(),
          characterName: "Sư phụ Thỏ",
          avatar: "🐰"
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: 'system_new_game_' + Date.now(),
          sender: 'system',
          text: "--- Bắt đầu ván cờ mới ---",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  // Re-initialize game when active profile changes
  useEffect(() => {
    handleNewGame(true);
  }, [activeProfileId]);

  // Audio simulation trigger
  const playSound = (type: 'move' | 'capture' | 'check' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'move') {
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'capture') {
        osc.frequency.setValueAtTime(250, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'check') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'gameover') {
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio context might be blocked by browser policy
    }
  };

  const getPieceNameVietnamese = (type: string) => {
    switch (type.toLowerCase()) {
      case 'p': return 'Tốt';
      case 'n': return 'Mã';
      case 'b': return 'Tượng';
      case 'r': return 'Xe';
      case 'q': return 'Hậu';
      case 'k': return 'Vua';
      default: return 'Quân cờ';
    }
  };

  // Check and update checkmate/draw statuses
  const checkGameStatus = () => {
    const chess = chessRef.current;
    
    // Find King position for check indicator
    let checkSquare: string | null = null;
    if (chess.inCheck()) {
      const board = chess.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === 'k' && piece.color === chess.turn()) {
            checkSquare = piece.square;
            break;
          }
        }
      }
      playSound('check');
    }
    setKingInCheckSquare(checkSquare);

    if (chess.isGameOver()) {
      playSound('gameover');
      let resultText = '';
      let resultType: 'win' | 'loss' | 'draw' = 'draw';

      if (chess.isCheckmate()) {
        const winnerColor = chess.turn() === 'w' ? 'b' : 'w'; // If active turn is White, Black won.
        if (winnerColor === 'w') {
          resultText = `🎉 Chúc mừng con đã CHIẾU HẾT và giành CHIẾN THẮNG ngoạn mục! Ván này con chơi tốt đó! 🏆`;
          resultType = 'win';
          setGameResult('win');
          speakWithRole(getGameOverSpeech('player_win'), 'rabbit_master');
        } else {
          resultText = `😭 Ôi không! Quân Đen đã chiếu hết mất rồi. Thất bại là mẹ thành công, đừng buồn con ạ. Hãy chơi lại ván mới! 💪`;
          resultType = 'loss';
          setGameResult('loss');
          speakWithRole(getGameOverSpeech('ai_win'), 'opponent_ai');
        }
      } else if (chess.isDraw()) {
        resultText = `🤝 Ván đấu kết thúc với tỷ số HÒA! Cả hai bên đều thi đấu vô cùng xuất sắc, ngang tài ngang sức!`;
        resultType = 'draw';
        setGameResult('draw');
        speakWithRole(getGameOverSpeech('draw'), 'rabbit_master');
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'game_over_msg_' + Date.now(),
          sender: 'system',
          text: `CỜ TÀN! ${resultText}`,
          timestamp: new Date().toISOString()
        }
      ]);

      // Record match to profile statistics
      if (activeProfileId) {
        addMatchRecord(activeProfileId, difficulty, resultType, chess.history().length);
        // Refresh profiles from local storage to update view stats
        setProfiles(getProfiles());
        setGameCompletedTrigger(prev => prev + 1);
      }
      return true;
    }
    return false;
  };

  // Helper to execute white player move
  const executePlayerMove = (from: Square, to: Square, promotionPiece?: 'q' | 'r' | 'b' | 'n') => {
    const chess = chessRef.current;
    const pieceMoved = chess.get(from);
    
    const movePayload: any = {
      from,
      to,
    };
    if (promotionPiece) {
      movePayload.promotion = promotionPiece;
    }

    try {
      const moveDetails = chess.move(movePayload);
      if (!moveDetails) return;

      const captureMade = moveDetails.captured !== undefined;

      // Update visual board
      setFen(chess.fen());
      setLastMove({ from, to });
      setSelectedSquare(null);
      setPossibleMoves([]);
      playSound(captureMade ? 'capture' : 'move');

      // Check game over
      const isOver = checkGameStatus();

      if (!isOver) {
        // AI Opponent's turn!
        setIsAiThinking(true);

        // Voice reaction and explanation from Sư phụ Thỏ
        let speechText = "";
        let coachExplanation = "";

        // Check for special moves
        const isCastling = moveDetails.flags.includes('k') || moveDetails.flags.includes('q');
        const isEnPassant = moveDetails.flags.includes('e');
        const isPromotion = moveDetails.flags.includes('p');

        if (isCastling) {
          speechText = "[Sư phụ Thỏ]: Nhập thành thành công rồi con ơi! Đây là một nước đi đặc biệt giúp con bảo vệ Vua an toàn bằng cách đưa Vua vào góc và đưa Xe ra ngoài để phòng thủ đấy!";
          coachExplanation = "Sư phụ Thỏ: Nhập thành (Castling) là nước cờ cực kỳ quan trọng giúp bảo vệ Vua và kích hoạt Xe tham chiến. Con vừa đưa đức Vua vào góc an toàn và chuẩn bị cho một đợt phản công mạnh mẽ! 🏰👑";
        } else if (isEnPassant) {
          speechText = "[Sư phụ Thỏ]: Wow! Một nước bắt tốt qua đường thật ngoạn mục! Khi Tốt đối thủ tiến hai ô vượt qua ô Tốt của con đứng, con có thể đi chéo để bắt nó ngay lập tức!";
          coachExplanation = "Sư phụ Thỏ: Bắt tốt qua đường (En Passant) là một điều luật cờ vua cổ điển và thú vị. Khi Tốt đối phương tiến 2 ô để né tránh Tốt của con, con vẫn có quyền 'bắt' nó ngay lập tức như thể nó chỉ tiến 1 ô! ♟️✨";
        } else if (isPromotion) {
          const pieceName = promotionPiece === 'q' ? 'Hậu' : promotionPiece === 'r' ? 'Xe' : promotionPiece === 'b' ? 'Tượng' : 'Mã';
          speechText = `[Sư phụ Thỏ]: Chúc mừng con! Tốt dũng cảm đã tiến xuống hàng cuối cùng và phong cấp thành quân ${pieceName} vô cùng mạnh mẽ rồi!`;
          coachExplanation = `Sư phụ Thỏ: Tốt phong cấp! Bằng sự dũng cảm và kiên trì, quân Tốt nhỏ bé của con đã đi hết chiều dọc bàn cờ và được thăng chức thành quân ${pieceName}. Đây là khoảnh khắc thay đổi cục diện trận đấu! 👑🌟`;
        } else {
          const pieceType = pieceMoved?.type || 'p';
          const pieceNameVi = getPieceNameVietnamese(pieceType);
          const reactionType = chess.inCheck() ? 'check' : (captureMade ? 'capture' : 'move');
          speechText = getRabbitPlayerSpeech(reactionType, pieceNameVi);
        }

        // Add explanation message to the chat
        const speechContent = speechText.replace("[Sư phụ Thỏ]: ", "");
        const coachMessageId = 'coach_move_reaction_' + Date.now();
        setMessages(prev => [
          ...prev,
          {
            id: coachMessageId,
            sender: 'ai_coach',
            text: coachExplanation || speechContent,
            timestamp: new Date().toISOString(),
            characterName: "Sư phụ Thỏ",
            avatar: "🐰"
          }
        ]);

        // Optionally auto comment player's move to explain it with deep AI
        if (autoComment && !isCastling && !isEnPassant && !isPromotion) {
          triggerAiExplanation({
            move: moveDetails.san,
            pieceName: pieceMoved?.type || 'p',
            color: 'w',
            playerMove: true,
            boardFen: chess.fen(),
            capture: captureMade,
            isCheck: chess.inCheck(),
            isCheckmate: chess.isGameOver() && chess.isCheckmate(),
            gameStage: getGameStage(chess.fen())
          }, coachMessageId);
        }

        // Wait for Sư phụ Thỏ to finish speaking, then wait an additional 1.5 seconds before AI moves
        speakWithRole(speechText, 'rabbit_master').then(() => {
          setTimeout(() => {
            handleAIMove();
          }, 1500);
        });
      }
    } catch (err) {
      console.error("Lỗi di chuyển:", err);
    }
  };

  // Human player makes a move
  const handleSquareClick = (square: Square) => {
    if (chessRef.current.isGameOver() || isAiThinking || !activeProfileId) return;

    const chess = chessRef.current;
    const piece = chess.get(square);

    // 1. If we clicked our own white piece, select it and show legal moves
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setPossibleMoves(moves.map(m => m.to));
      playSound('move');
      return;
    }

    // 2. If we clicked a square which is in our legal target list, perform the move
    if (selectedSquare && possibleMoves.includes(square)) {
      // Check for pawn promotion
      const isPromotion = chess.get(selectedSquare)?.type === 'p' && (square[1] === '8' || square[1] === '1');
      
      if (isPromotion) {
        setPendingPromotionMove({ from: selectedSquare, to: square });
        return;
      }

      executePlayerMove(selectedSquare, square);
      return;
    }

    // 3. Clicked somewhere else: clear selection
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const handlePromotionSelect = (promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotionMove) return;
    const { from, to } = pendingPromotionMove;
    setPendingPromotionMove(null);
    executePlayerMove(from, to, promotionPiece);
  };

  // AI computer move calculation and execution
  const handleAIMove = async () => {
    const chess = chessRef.current;
    if (chess.isGameOver()) {
      setIsAiThinking(false);
      return;
    }

    // Call programmatic Minimax engine based on level
    const bestMove = getAIMove(chess.fen(), difficulty);

    if (bestMove) {
      const tempChess = new Chess(chess.fen());
      const moveDetails = tempChess.move(bestMove);
      const pieceType = moveDetails.piece;
      const captureMade = moveDetails.captured !== undefined;

      // Apply the move on real engine
      chess.move(bestMove);
      setFen(chess.fen());
      setLastMove({ from: moveDetails.from, to: moveDetails.to });
      playSound(captureMade ? 'capture' : 'move');

      // Check game over
      const isOver = checkGameStatus();

      // Check for opponent's special moves
      const isCastling = moveDetails.flags.includes('k') || moveDetails.flags.includes('q');
      const isEnPassant = moveDetails.flags.includes('e');
      const isPromotion = moveDetails.flags.includes('p');

      // Add AI's generic move text to the chat
      const moveMsgId = 'ai_move_' + Date.now();
      const pName = getPieceNameVietnamese(pieceType);
      
      // Determine what the opponent will speak (Opponent Voice role)
      const capturedPieceNameVi = moveDetails.captured ? getPieceNameVietnamese(moveDetails.captured) : undefined;
      const opponentReactionType = chess.inCheck() ? 'check' : (captureMade ? 'capture' : 'move');
      let speech = "";

      if (isCastling) {
        speech = `[Đối thủ]: Ta vừa di chuyển đức Vua và Xe để Nhập thành rồi nhé!`;
      } else if (isEnPassant) {
        speech = `[Đối thủ]: Ha ha! Ta vừa thực hiện nước Bắt tốt qua đường để bắt quân Tốt của bé nhé!`;
      } else if (isPromotion) {
        const promoPieceName = getPieceNameVietnamese(moveDetails.promotion || 'q');
        speech = `[Đối thủ]: Quân Tốt của ta đã đi đến hàng cuối và phong cấp thành quân ${promoPieceName} rồi nhé!`;
      } else {
        speech = getOpponentSpeech(opponentReactionType, pName, moveDetails.from, moveDetails.to, capturedPieceNameVi);
      }

      // Speak with Opponent AI voice role
      speakWithRole(speech, 'opponent_ai');

      const aiMoveData = {
        move: moveDetails.san,
        pieceName: pieceType,
        color: 'b',
        playerMove: false,
        boardFen: chess.fen(),
        capture: captureMade,
        isCheck: chess.inCheck(),
        isCheckmate: chess.isGameOver() && chess.isCheckmate(),
        gameStage: getGameStage(chess.fen())
      };

      setMessages(prev => [
        ...prev,
        {
          id: moveMsgId,
          sender: 'ai_coach',
          text: speech,
          timestamp: new Date().toISOString(),
          characterName: pName === 'Tốt' ? 'Tốt Đen Dũng Cảm' : pName + ' Đen',
          avatar: undefined, // Will be rendered as custom chess SVG
          isExplainable: !isCastling && !isEnPassant && !isPromotion,
          moveData: aiMoveData
        }
      ]);

      // If opponent made a special move, Sư phụ Thỏ steps in to explain it!
      if (isCastling || isEnPassant || isPromotion) {
        let coachText = "";
        let coachSpeech = "";

        if (isCastling) {
          coachText = "Sư phụ Thỏ: Ồ, đối thủ vừa thực hiện nước **Nhập thành** (Castling) kìa con! Họ đã bảo vệ đức Vua Đen vào góc an toàn và đưa Xe ra ngoài để chuẩn bị tấn công rồi. Con hãy tìm cách đột phá trung lộ nhé! 🏰👑";
          coachSpeech = "[Sư phụ Thỏ]: Đối thủ vừa thực hiện nước Nhập thành để bảo vệ Vua Đen kìa con! Hãy cùng tập trung suy nghĩ cách tấn công trung lộ nhé!";
        } else if (isEnPassant) {
          coachText = "Sư phụ Thỏ: Ôi! Đối thủ vừa dùng luật **Bắt tốt qua đường** (En Passant) rất khéo léo để bắt quân Tốt của con đấy. Đây là một điều luật đặc biệt khi Tốt của con đứng ở hàng 5 và Tốt đối phương tiến hai ô vượt qua nó. Đừng nản lòng nhé! ♟️✨";
          coachSpeech = "[Sư phụ Thỏ]: Đối thủ vừa bắt tốt qua đường của con rồi! Đừng lo lắng con nhé, hãy tập trung điều các quân cờ khác tiến lên!";
        } else {
          const promoPieceName = getPieceNameVietnamese(moveDetails.promotion || 'q');
          coachText = `Sư phụ Thỏ: Hãy cẩn thận con nhé! Quân Tốt Đen của đối phương vừa hoàn thành hành trình và **Phong cấp** thành quân ${promoPieceName} vô cùng nguy hiểm rồi đấy. Hãy tăng cường phòng thủ đức Vua nha! 👑🌟`;
          coachSpeech = `[Sư phụ Thỏ]: Cẩn thận nha con ơi! Quân Tốt Đen vừa phong cấp thành quân ${promoPieceName} rồi đấy! Hãy cùng Sư phụ tập trung phòng thủ nhé!`;
        }

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: 'ai_special_explanation_' + Date.now(),
              sender: 'ai_coach',
              text: coachText,
              timestamp: new Date().toISOString(),
              characterName: "Sư phụ Thỏ",
              avatar: "🐰"
            }
          ]);
          speakWithRole(coachSpeech, 'rabbit_master');
        }, 2200);
      } else if (autoComment && !isOver) {
        // If autoComment is true, automatically replace or expand with deep coaching explanation
        await triggerAiExplanation(aiMoveData, moveMsgId);
      }
    }

    setIsAiThinking(false);
  };

  // Call Express API to get full AI tactical coaching explanation
  const triggerAiExplanation = async (moveData: any, targetMsgId?: string) => {
    try {
      const response = await fetch("/api/explain-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...moveData,
          playerName: activeProfile?.name,
          playerLevel: difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Trung bình' : difficulty === 'hard' ? 'Khó' : 'Chuyên gia'
        })
      });
      const data = await response.json();
      
      if (data.success && data.text) {
        if (targetMsgId) {
          // Replace or update existing chat message with the premium Gemini response
          setMessages(prev => prev.map(m => {
            if (m.id === targetMsgId) {
              return {
                ...m,
                text: data.text,
                characterName: data.characterName,
                isExplainable: false // already explained
              };
            }
            return m;
          }));
        } else {
          // Push a new coaching message
          setMessages(prev => [
            ...prev,
            {
              id: 'explain_' + Date.now(),
              sender: 'ai_coach',
              text: data.text,
              timestamp: new Date().toISOString(),
              characterName: data.characterName,
              avatar: undefined,
              isExplainable: false,
              moveData
            }
          ]);
        }
      }
    } catch (e) {
      console.error("Lỗi giải thích nước đi:", e);
    }
  };

  // Triggered when clicking "Giải thích" button inside a chat message manually
  const handleExplainMoveManually = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg && msg.moveData) {
      // Set loader or update text to "đang suy nghĩ..."
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, text: "Chờ một xíu, ta đang chuẩn bị binh pháp để giải thích cho con đây... ", isExplainable: false };
        }
        return m;
      }));
      
      await triggerAiExplanation(msg.moveData, msgId);
    }
  };

  // Send a custom chat message written by the child
  const handleSendCustomMessage = async (text: string) => {
    // 1. Append player's question to the chat list
    const playerMsgId = 'player_' + Date.now();
    setMessages(prev => [
      ...prev,
      {
        id: playerMsgId,
        sender: 'player',
        text: text,
        timestamp: new Date().toISOString(),
        avatar: activeProfile ? activeProfile.avatar : undefined
      }
    ]);

    setIsAiThinking(true);

    try {
      const response = await fetch("/api/chat-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          boardFen: chessRef.current.fen(),
          playerName: activeProfile?.name,
          playerLevel: difficulty
        })
      });
      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: 'coach_reply_' + Date.now(),
          sender: 'ai_coach',
          text: data.success ? data.text : "Ta nghe rõ rồi! Con đi nước tiếp theo đi. Ta đang quan sát rất kỹ đấy!",
          timestamp: new Date().toISOString(),
          characterName: "Sư phụ Thỏ",
          avatar: "🐰"
        }
      ]);
    } catch (e) {
      console.error("Lỗi gửi tin nhắn:", e);
      setMessages(prev => [
        ...prev,
        {
          id: 'coach_reply_error_' + Date.now(),
          sender: 'ai_coach',
          text: "Hic, sóng điện thoại ở rừng cà rốt hơi yếu một tí! Nhưng không sao, con cứ tập trung vào ván cờ này nhé!",
          timestamp: new Date().toISOString(),
          characterName: "Sư phụ Thỏ",
          avatar: "🐰"
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Hint button triggered: provides the optimal legal moves computed by programmatic AI, framed nicely by Gemini
  const handleGetHint = async () => {
    if (chessRef.current.isGameOver() || isAiThinking) return;

    setIsAiThinking(true);
    const bestMoves = getWhiteBestMoves(chessRef.current.fen());

    try {
      const response = await fetch("/api/get-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardFen: chessRef.current.fen(),
          bestMoves,
          playerLevel: difficulty,
          playerName: activeProfile?.name
        })
      });
      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: 'hint_' + Date.now(),
          sender: 'ai_coach',
          text: data.success ? data.text : `Ta nói nhỏ nè: con nên thử đi nước cờ **${bestMoves[0]}** xem sao nhé!`,
          timestamp: new Date().toISOString(),
          characterName: "Sư phụ Thỏ",
          avatar: "🐰"
        }
      ]);

      // Highlight the recommended square briefly
      if (bestMoves.length > 0) {
        // E.g., if move is "e4", we can highlight "e" file etc, but standardizing SAN target is simpler.
        // Let's analyze the move to extract coordinates if it matches standard format
        const bestMoveStr = bestMoves[0];
        // Regex to extract square coordinate from SAN (e.g. Nf3 -> f3, e4 -> e4, Bxe4 -> e4)
        const match = bestMoveStr.match(/[a-h][1-8]/);
        if (match) {
          const targetSq = match[0] as Square;
          setSelectedSquare(null);
          setPossibleMoves([targetSq]);
        }
      }
    } catch (e) {
      console.error("Lỗi khi xin gợi ý:", e);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Profile Created Callback
  const handleProfileCreated = (newProfile: PlayerProfile) => {
    setProfiles(getProfiles());
    setActiveIdAndInitialize(newProfile.id);
  };

  // Profile Selection callback
  const setActiveIdAndInitialize = (id: string) => {
    setActiveProfileIdState(id);
    setActiveProfileId(id);
  };

  // Profile Deleted Callback
  const handleProfileDeleted = (id: string) => {
    setProfiles(getProfiles());
    const activeId = getActiveProfileId();
    setActiveProfileIdState(activeId);
  };

  const handleResign = () => {
    if (chessRef.current.isGameOver()) return;
    setShowResignConfirm(true);
  };

  const confirmResign = () => {
    setShowResignConfirm(false);
    playSound('gameover');
    if (activeProfileId) {
      addMatchRecord(activeProfileId, difficulty, 'resigned', chessRef.current.history().length);
      setProfiles(getProfiles());
      setGameCompletedTrigger(prev => prev + 1);
    }
    handleNewGame(false);
    setMessages(prev => [
      ...prev,
      {
        id: 'resign_' + Date.now(),
        sender: 'ai_coach',
        text: "Không sao đâu con ơi! Thừa nhận thế cờ yếu và bắt đầu lại là đức tính của một nhà vô địch đấy. Nào, chúng ta cùng làm lại ván mới nhé! 🐰👑",
        timestamp: new Date().toISOString(),
        characterName: "Sư phụ Thỏ",
        avatar: "🐰"
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#4A4540] font-sans pb-12">
      {/* Top Header App Brand */}
      <header className="bg-white/50 backdrop-blur-md border-b border-[#E8E2D9] shadow-sm py-4 px-6 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-[#8BA888] text-white flex items-center justify-center text-3xl rounded-2xl shadow-sm rotate-[-3deg] animate-pulse">
              ♟️
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#5C5751]">
                Cờ Vua Cho Bé
              </h1>
              <p className="text-[13px] text-zinc-500 font-bold">Học cờ cùng Sư phụ Thỏ!</p>
            </div>
          </div>

          {/* Sound, Auto-coaching toggles */}
          <div className="flex items-center gap-3 bg-[#FFFDFB]/80 border border-[#E8E2D9] px-4 py-2 rounded-2xl">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full transition-all cursor-pointer ${soundEnabled ? 'text-[#8BA888] bg-[#F2EDE7] hover:bg-[#E8E2D9]' : 'text-zinc-400 bg-zinc-100 hover:bg-zinc-200'}`}
              title={soundEnabled ? "Tắt âm thanh hiệu ứng" : "Bật âm thanh hiệu ứng"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Voice TTS Speech Toggle */}
            <button
              onClick={() => handleToggleSpeech(!speechEnabled)}
              className={`p-2 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${speechEnabled ? 'text-[#8BA888] bg-[#F2EDE7] hover:bg-[#E8E2D9]' : 'text-zinc-400 bg-zinc-100 hover:bg-zinc-200'}`}
              title={speechEnabled ? "Tắt giọng nói thuyết minh" : "Bật giọng nói thuyết minh"}
            >
              <span className="text-[13px] font-black flex items-center gap-1">
                {speechEnabled ? "🔊 Giọng nói" : "🔇 Giọng nói"}
              </span>
            </button>

            <span className="text-[#E8E2D9]">|</span>

            {/* Auto coach toggle (with token reminder) */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoComment}
                onChange={(e) => setAutoComment(e.target.checked)}
                className="w-4 h-4 text-[#8BA888] rounded border-zinc-300 focus:ring-[#8BA888]"
              />
              <span className="text-[13px] font-black text-[#5C5751]">
                Tự động bình luận
              </span>
            </label>
          </div>
        </div>
      </header>

      {/* Main Grid Content Dashboard */}
      <main className="max-w-6xl mx-auto px-4">
        {/* If no profile is selected, force selection first to create premium UX */}
        {!activeProfileId ? (
          <div className="max-w-xl mx-auto py-10">
            <ProfileSelector
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSelectProfile={setActiveIdAndInitialize}
              onProfileCreated={handleProfileCreated}
              onProfileDeleted={handleProfileDeleted}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT & CENTER PANEL COMBINED (cols 8) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Player Stats, Level */}
                <div className={`space-y-4 sm:col-span-5 ${isBoardExpanded ? 'hidden' : 'block'}`}>
              {/* Profile card minified */}
              <div className="bg-white rounded-[32px] p-5 shadow-sm border border-[#E8E2D9]">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F2EDE7] flex items-center justify-center text-3xl border border-[#E8E2D9] shadow-inner">
                    {profiles.find(p => p.id === activeProfileId)?.avatar === 'lion' ? '🦁' :
                     profiles.find(p => p.id === activeProfileId)?.avatar === 'panda' ? '🐼' :
                     profiles.find(p => p.id === activeProfileId)?.avatar === 'fox' ? '🦊' :
                     profiles.find(p => p.id === activeProfileId)?.avatar === 'koala' ? '🐨' :
                     profiles.find(p => p.id === activeProfileId)?.avatar === 'bunny' ? '🐰' : '🐵'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#5C5751]">{activeProfile?.name}</h3>
                    <p className="text-[13px] text-zinc-400 font-bold uppercase tracking-wider">Kỳ thủ tích cực</p>
                  </div>
                </div>

                {/* Score specs */}
                <div className="grid grid-cols-2 gap-2 bg-[#F2EDE7]/60 p-3 rounded-2xl border border-[#E8E2D9] text-center">
                  <div>
                    <span className="text-[13px] text-zinc-500 font-bold block">Elo của bé</span>
                    <strong className="text-sm font-black text-[#8BA888]">{activeProfile?.elo}</strong>
                  </div>
                  <div>
                    <span className="text-[13px] text-zinc-500 font-bold block">Đã đấu</span>
                    <strong className="text-sm font-black text-[#5C5751]">{activeProfile?.gamesPlayed} ván</strong>
                  </div>
                </div>

                {/* Switch profile button */}
                <button
                  onClick={() => setActiveIdAndInitialize("")}
                  className="w-full mt-3 py-2 text-center bg-white hover:bg-[#F2EDE7] text-[13px] font-bold text-[#8BA888] border border-dashed border-[#8BA888]/40 rounded-xl transition-all cursor-pointer"
                >
                  Thay đổi người chơi
                </button>
              </div>

              {/* Difficulty selectors */}
              <div className="bg-white rounded-[32px] p-5 shadow-sm border border-[#E8E2D9]">
                <h3 className="text-[13px] font-black text-[#5C5751] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#8BA888]" />
                  Chọn cấp độ đấu
                </h3>
                
                <div className="space-y-1.5">
                  {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((level) => {
                    const isSelected = difficulty === level;
                    const levelNames = { easy: 'Dễ (Pawn ♟️)', medium: 'Trung bình (Knight ♞)', hard: 'Khó (Rook ♜)', expert: 'Chuyên gia (Queen ♛)' };
                    const levelColors = {
                      easy: 'bg-[#F2EDE7]/50 text-[#5C5751] border-[#E8E2D9] hover:bg-[#F2EDE7]',
                      medium: 'bg-[#F2EDE7]/50 text-[#5C5751] border-[#E8E2D9] hover:bg-[#F2EDE7]',
                      hard: 'bg-[#F2EDE7]/50 text-[#5C5751] border-[#E8E2D9] hover:bg-[#F2EDE7]',
                      expert: 'bg-[#F2EDE7]/50 text-[#5C5751] border-[#E8E2D9] hover:bg-[#F2EDE7]'
                    };
                    const selectedColors = {
                      easy: 'bg-[#8BA888] text-white border-[#8BA888] shadow-sm',
                      medium: 'bg-[#8BA888] text-white border-[#8BA888] shadow-sm',
                      hard: 'bg-[#5C5751] text-white border-[#5C5751] shadow-sm',
                      expert: 'bg-[#5C5751] text-white border-[#5C5751] shadow-sm'
                    };

                    return (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`w-full text-left py-2.5 px-3.5 rounded-xl border text-[13px] font-extrabold transition-all cursor-pointer ${
                          isSelected ? selectedColors[level] : levelColors[level]
                        }`}
                      >
                        {levelNames[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Interactive Cartoon Chessboard */}
            <div className={`flex flex-col items-center space-y-4 ${isBoardExpanded ? 'sm:col-span-12' : 'sm:col-span-7'}`}>
              
              {/* Game level stats indicator */}
              <div className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E8E2D9] shadow-sm">
                <span className="text-[13px] font-bold text-zinc-500 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#8BA888] rounded-full animate-ping" />
                  Bé: <strong className="text-[#5C5751] uppercase">Quân Trắng ⚪</strong>
                </span>
                
                <span className="text-[13px] font-bold text-zinc-500">
                  Đối thủ AI: <strong className="text-[#5C5751] uppercase">Quân Đen ⚫</strong>
                </span>
              </div>

              {/* Board view render */}
              <ChessboardView
                fen={fen}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                lastMove={lastMove}
                isInteractive={!isAiThinking && gameResult === 'active'}
                onSquareClick={handleSquareClick}
                kingInCheckSquare={kingInCheckSquare}
                isExpanded={isBoardExpanded}
              />

              {/* Play Actions Controls */}
              <div className="w-full grid grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={() => handleNewGame(true)}
                  className="flex items-center justify-center space-x-1.5 py-3 px-2 bg-white hover:bg-[#F2EDE7]/60 active:scale-95 text-[#5C5751] font-extrabold text-[12px] sm:text-[13px] rounded-2xl border border-[#E8E2D9] transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 text-[#8BA888] shrink-0" />
                  <span>Ván mới</span>
                </button>

                <button
                  onClick={() => setIsBoardExpanded(!isBoardExpanded)}
                  className="flex items-center justify-center space-x-1.5 py-3 px-2 bg-white hover:bg-[#F2EDE7]/60 active:scale-95 text-[#5C5751] font-extrabold text-[12px] sm:text-[13px] rounded-2xl border border-[#E8E2D9] transition-all cursor-pointer shadow-sm"
                >
                  {isBoardExpanded ? (
                    <>
                      <Minimize2 className="w-4 h-4 text-[#8BA888] shrink-0" />
                      <span>Thu nhỏ</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-[#8BA888] shrink-0" />
                      <span>Phóng to</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResign}
                  disabled={gameResult !== 'active'}
                  className={`flex items-center justify-center space-x-1.5 py-3 px-2 font-extrabold text-[12px] sm:text-[13px] rounded-2xl border transition-all shadow-sm ${
                    gameResult === 'active'
                      ? 'bg-white hover:bg-[#F2EDE7]/60 border-[#E8E2D9] text-[#5C5751] cursor-pointer active:scale-95'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Flag className={`w-4 h-4 shrink-0 ${gameResult === 'active' ? 'text-[#8BA888]' : 'text-zinc-400'}`} />
                  <span>Xin thua</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Friendly Chess Coach AI Chat Box (cols 4) */}
        <div className="lg:col-span-4">
          <CoachChat
            messages={messages}
            onSendMessage={handleSendCustomMessage}
            onExplainMove={handleExplainMoveManually}
            onGetHint={handleGetHint}
            isAiThinking={isAiThinking}
            canGetHint={!isAiThinking && gameResult === 'active'}
            playerName={activeProfile?.name || "Bé"}
          />
        </div>

        {/* ROW 2: DifficultyRecommender and Mẹo Nhỏ aligned perfectly at top and bottom */}
        <div className="lg:col-span-8 lg:self-stretch">
          <DifficultyRecommender
            profileId={activeProfileId}
            currentDifficulty={difficulty}
            onSetDifficulty={setDifficulty}
            gameCompletedTrigger={gameCompletedTrigger}
          />
        </div>

        <div className="lg:col-span-4 lg:self-stretch flex">
          {/* Quick Game Rules Card for kids */}
          <div className="p-5 bg-white rounded-3xl border border-[#E8E2D9] shadow-sm w-full flex flex-col justify-start h-full">
            <h4 className="font-extrabold text-[#5C5751] text-[13px] flex items-center gap-1.5 mb-2">
              <Info className="w-4.5 h-4.5 text-[#8BA888]" />
              Mẹo Nhỏ Cho Kỳ Thủ Nhí 🌟
            </h4>
            <p className="text-[12px] text-zinc-500 leading-relaxed font-semibold space-y-1">
              <span>- 🐴 **Quân Mã** đi theo chữ L độc đáo, có thể nhảy vượt qua đầu các quân khác!</span><br />
              <span>- 📐 **Quân Tượng** chỉ di chuyển trên các đường chéo cùng màu với ô đứng ban đầu.</span><br />
              <span>- 💡 Đừng ngần ngại bấm nút **Gợi ý** khi chưa biết đi quân nào nghen bé!</span>
            </p>
          </div>
        </div>

          </div>
        )}
      </main>

      <AnimatePresence>
        {showResignConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C5751]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#FFFDFB] rounded-[32px] border border-[#E8E2D9] p-6 max-w-sm w-full shadow-xl relative overflow-hidden text-center"
            >
              {/* Playful icon header */}
              <div className="mx-auto w-16 h-16 bg-[#F2EDE7] text-white flex items-center justify-center text-3xl rounded-3xl mb-4 border border-[#E8E2D9] shadow-inner rotate-[-3deg]">
                🐰
              </div>

              <h3 className="text-lg font-black text-[#5C5751] mb-2">
                Con muốn nhận thua sao?
              </h3>
              <p className="text-[13px] text-zinc-500 font-bold mb-6 leading-relaxed">
                Nhận thua ván này để cùng Sư phụ Thỏ làm lại ván mới nhé? Kiên trì rèn luyện chính là bí quyết của mọi nhà vô địch đấy! 💪✨
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowResignConfirm(false)}
                  className="flex-1 py-3 px-4 font-black text-[13px] rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#F2EDE7]/60 text-[#5C5751] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Nghĩ lại đã
                </button>
                <button
                  onClick={confirmResign}
                  className="flex-1 py-3 px-4 font-black text-[13px] rounded-2xl bg-[#FFADAD]/30 hover:bg-[#FFADAD]/50 border border-[#FFADAD]/60 text-red-700 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Đồng ý thua
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingPromotionMove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C5751]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#FFFDFB] rounded-[32px] border border-[#E8E2D9] p-6 max-w-sm w-full shadow-xl relative overflow-hidden text-center"
            >
              {/* Playful icon header */}
              <div className="mx-auto w-16 h-16 bg-[#8BA888] text-white flex items-center justify-center text-3xl rounded-3xl mb-4 border border-[#E8E2D9] shadow-inner rotate-[-3deg]">
                ✨
              </div>

              <h3 className="text-lg font-black text-[#5C5751] mb-2">
                Chúc mừng con! Phong cấp cho Tốt!
              </h3>
              <p className="text-[13px] text-zinc-500 font-bold mb-6 leading-relaxed">
                Tốt dũng cảm đã đi đến hàng cuối cùng rồi! Con muốn phong cấp cho Tốt thành quân cờ siêu cấp nào đây? 👑
              </p>

              <div className="grid grid-cols-2 gap-3 justify-center">
                <button
                  onClick={() => handlePromotionSelect('q')}
                  className="py-3 px-4 flex flex-col items-center justify-center font-black rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#F2EDE7]/60 text-[#5C5751] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="text-3xl mb-1">👑</span>
                  <span className="text-[13px]">Quân Hậu (Q)</span>
                </button>
                <button
                  onClick={() => handlePromotionSelect('r')}
                  className="py-3 px-4 flex flex-col items-center justify-center font-black rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#F2EDE7]/60 text-[#5C5751] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="text-3xl mb-1">🏰</span>
                  <span className="text-[13px]">Quân Xe (R)</span>
                </button>
                <button
                  onClick={() => handlePromotionSelect('b')}
                  className="py-3 px-4 flex flex-col items-center justify-center font-black rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#F2EDE7]/60 text-[#5C5751] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="text-3xl mb-1">🐘</span>
                  <span className="text-[13px]">Quân Tượng (B)</span>
                </button>
                <button
                  onClick={() => handlePromotionSelect('n')}
                  className="py-3 px-4 flex flex-col items-center justify-center font-black rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#F2EDE7]/60 text-[#5C5751] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="text-3xl mb-1">🐴</span>
                  <span className="text-[13px]">Quân Mã (N)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
