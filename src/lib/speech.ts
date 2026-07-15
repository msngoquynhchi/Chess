import { Chess } from 'chess.js';

let isSpeechEnabled = true;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize speech enabled from localStorage if available and pre-cache voices
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('chess_speech_enabled');
    if (saved !== null) {
      isSpeechEnabled = saved === 'true';
    }
  } catch (e) {
    console.error('Failed to load speech setting', e);
  }

  try {
    if (window.speechSynthesis) {
      cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          cachedVoices = window.speechSynthesis.getVoices();
          const vi = cachedVoices.filter(v => v.lang.toLowerCase().includes('vi'));
          console.log("[Speech API] Danh sách giọng tiếng Việt khả dụng trên thiết bị:", vi.map(v => v.name));
        } catch (err) {
          console.error('[Speech API] onvoiceschanged error', err);
        }
      };
    }
  } catch (e) {
    console.error('Failed to initialize speech synthesis', e);
  }
}

export function setSpeechEnabled(enabled: boolean) {
  isSpeechEnabled = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('chess_speech_enabled', String(enabled));
    } catch (e) {
      console.error(e);
    }
  }
  if (!enabled) {
    cancelSpeech();
  }
}

export function getSpeechEnabled(): boolean {
  return isSpeechEnabled;
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Map piece codes to kid-friendly Vietnamese names
export function getPieceNameVi(code: string): string {
  const map: Record<string, string> = {
    'p': 'Tốt',
    'n': 'Mã',
    'b': 'Tượng',
    'r': 'Xe',
    'q': 'Hậu',
    'k': 'Vua'
  };
  return map[code.toLowerCase()] || code;
}

/**
 * Robust Speech synthesis helper supporting distinct voice roles:
 * - 'rabbit_master': High-pitched, enthusiastic, supportive Sư phụ Thỏ Trắng voice
 * - 'opponent_ai': Slightly deeper, confident, direct Máy (Đối thủ) voice
 */
export function speakWithRole(text: string, role: 'rabbit_master' | 'opponent_ai'): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechEnabled) {
      resolve();
      return;
    }
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel current speech to prevent overlap & keep it responsive
    window.speechSynthesis.cancel();

    // Clean and strip prefixes like "[Sư phụ Thỏ]:", "[Đối thủ]:", "Sư phụ Thỏ:", "Đối thủ:", etc.
    let cleanText = text || '';
    
    // Replace bracketed role names or standard colon labels
    cleanText = cleanText
      .replace(/^\[[^\]]+\]:\s*/g, '')
      .replace(/^(Sư phụ Thỏ|Sư phụ Thỏ Trắng|Đối thủ|Máy|Huấn luyện viên Thỏ)\s*:\s*/gi, '');

    // Clean the remaining text to avoid spelling out symbols / emojis
    cleanText = cleanText
      .replace(/[*#_`~]/g, '') // remove markdown styles
      .replace(/[⚪⚫⚔️🤖💡🚀🏆👑🎉😭💪🌟💥🎒🐴📐🔔⚠️🚨💭😋⭐🧸🦁🦖🦕👾🦊🐰🐶🐯🦁🐻🐸🐼🐷🐹🐭🐱] ?/g, '') // remove visual emojis
      .replace(/\➔|\➔/g, ' sang ') // replace arrows
      .replace(/\➔/g, ' sang ');

    if (!cleanText.trim()) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';

    // Find all Vietnamese voices
    let voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      voices = cachedVoices;
    }
    const viVoices = voices.filter(v => v.lang.toLowerCase().includes('vi'));
    
    let selectedVoice: SpeechSynthesisVoice | null = null;
    
    if (viVoices.length > 0) {
      if (role === 'rabbit_master') {
        // Preference 1: Nữ (Female) names/voices (e.g. Linh, An, female, HoaiMy, Mai, etc.)
        selectedVoice = viVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('an') || name.includes('linh') || name.includes('female') || name.includes('hoaimy') || name.includes('nữ') || name.includes('nu') || name.includes('mai');
        });
        
        // Preference 2: Any voice NOT containing typical male indicators
        if (!selectedVoice) {
          selectedVoice = viVoices.find(v => {
            const name = v.name.toLowerCase();
            return !name.includes('nam') && !name.includes('male') && !name.includes('minh');
          });
        }
        
        // Fallback to the first available Vietnamese voice
        if (!selectedVoice) {
          selectedVoice = viVoices[0];
        }
      } else {
        // Preference 1: Nam (Male) names/voices (e.g. Nam, Minh, male, etc.)
        selectedVoice = viVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('nam') || name.includes('male') || name.includes('minh') || name.includes('namminh');
        });
        
        // Fallback to first available Vietnamese voice
        if (!selectedVoice) {
          selectedVoice = viVoices[0];
        }
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Apply distinct voice properties based on the character role to guarantee distinction
    if (role === 'rabbit_master') {
      utterance.pitch = 1.35; // Sweet, energetic, higher pitch female role
      utterance.rate = 1.05;  // Slightly faster and eager
    } else {
      utterance.pitch = 0.75; // Low-pitched, calm, firm male role
      utterance.rate = 0.90;  // Slightly slower and mysterious
    }

    // Safety timeout to avoid getting stuck if SpeechSynthesis fails
    const wordsCount = cleanText.split(/\s+/).length;
    const safetyMs = Math.max(2500, Math.min(10000, wordsCount * 550));
    let resolved = false;

    const handleResolve = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve();
      }
    };

    const timeoutId = setTimeout(handleResolve, safetyMs);

    utterance.onend = () => {
      handleResolve();
    };

    utterance.onerror = () => {
      handleResolve();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("[Speech API] Error speaking utterance:", e);
      handleResolve();
    }
  });
}

// --- VOICE DICTIONARY FOR SƯ PHỤ THỎ TRẮNG (Comments on player's moves) ---

const RABBIT_PLAYER_MOVE = [
  "Nước đi quân {piece} ổn định đó con. Cùng quan sát xem đối thủ đi thế nào nhé.",
  "Con vừa di chuyển quân {piece} để chuẩn bị thế trận. Hãy giữ vững sự tập trung nha!",
  "Một nước đi quân {piece} hợp lý. Hãy quan sát toàn bộ bàn cờ trước khi đi tiếp con nhé.",
  "Quân {piece} đã vào vị trí mới. Con đang điều quân rất điềm tĩnh đấy.",
  "Nước đi quân {piece} giúp mở rộng không gian kiểm soát. Hãy tiếp tục suy nghĩ kỹ nhé.",
  "Quân {piece} di chuyển an toàn rồi. Giờ hãy xem đối thủ sẽ phản ứng ra sao nhé.",
  "Con đưa quân {piece} lên để liên kết đội hình. Rất chỉn chu và cẩn thận!",
  "Quân {piece} đã di chuyển. Mỗi nước đi đều giúp con hiểu thêm về bàn cờ đấy.",
  "Một lựa chọn an toàn với quân {piece}. Con đang làm rất tốt việc kiểm soát nhịp độ trận đấu.",
  "Quân {piece} phát triển thế đứng khá tốt. Hãy tiếp tục duy trì cấu trúc phòng thủ nha."
];

const RABBIT_PLAYER_CAPTURE = [
  "Ăn quân tốt lắm con! Quân {piece} vừa mở ra một cơ hội mới cho đội của mình.",
  "Một nước bắt quân chuẩn xác từ quân {piece}. Cố gắng duy trì lợi thế này nhé!",
  "Quân {piece} đã thu phục được quân của đối thủ. Hãy luôn chú ý bảo vệ các quân cờ còn lại nha.",
  "Lợi thế nhỏ đã mở ra khi quân {piece} bắt được quân đối phương. Hãy điềm tĩnh tiến lên nào.",
  "Một pha xử lý gọn gàng của quân {piece}. Con hãy tiếp tục quan sát thật kỹ thế trận nhé.",
  "Quân {piece} đã giành được một mục tiêu. Con đang chơi rất tập trung và nhạy bén đấy!"
];

const RABBIT_PLAYER_CHECK = [
  "Một đòn chiếu tướng từ quân {piece}! Đối thủ bắt buộc phải tìm cách hóa giải rồi.",
  "Quân {piece} chiếu tướng. Hãy xem đối phương sẽ di chuyển vua hay dùng quân khác để che chắn nhé.",
  "Nước chiếu từ quân {piece} tạo ra một chút áp lực lên vua đối phương đấy con.",
  "Con vừa chiếu tướng bằng quân {piece}. Hãy chuẩn bị sẵn kế hoạch cho nước đi tiếp theo nha.",
  "Đòn chiếu tướng bằng quân {piece} khá chủ động. Con hãy giữ vững sự điềm tĩnh nhé."
];

// --- VOICE DICTIONARY FOR MÁY (DỐI THỦ QUÂN ĐEN) (Reacts when making its own moves) ---

const OPPONENT_STANDARD_PHRASES = [
  "Ta vừa di chuyển quân cờ rồi. Hãy xem đây!",
  "Đến lượt ta ra chiêu! Bé hãy cẩn thận đó nhé!",
  "Quân đen xuất kích! Để xem bé chặn nước này thế nào!",
  "Một nước đi bí mật của quân đen, hì hì!",
  "Ta vừa tiến quân lên phía trước rồi nhé!",
  "Đỡ chiêu này của ta nè kỳ thủ nhí!"
];

const OPPONENT_CAPTURE_PHRASES = [
  "Haha, ta vừa ăn mất quân của bé rồi nha!",
  "Măm măm! Quân đen của ta đã bắt được một quân rồi!",
  "Ta xin nhẹ quân cờ này nhé, đừng hòng chạy thoát!",
  "Ú òa! Ta ăn được quân rồi! Hãy tập trung hơn nào bé yêu!",
  "Một pha ăn quân bất ngờ chưa! Ta đang dẫn trước nhé!"
];

const OPPONENT_CAPTURE_PHRASES_EXT = [
  "Haha, ta vừa ăn mất quân của bé rồi nha!",
  "Măm măm! Quân đen của ta đã bắt được một quân rồi!",
  "Ta xin nhẹ quân cờ này nhé, đừng hòng chạy thoát!",
  "Ú òa! Ta ăn được quân rồi! Hãy tập trung hơn nào bé yêu!",
  "Một pha ăn quân bất ngờ chưa! Ta đang dẫn trước nhé!"
];

const OPPONENT_CHECK_PHRASES = [
  "Chiếu tướng! Ta đang ngắm thẳng vào đức vua của bé đấy, mau phòng thủ đi!",
  "Cảnh báo đỏ! Ta chiếu tướng nha, đức vua trắng phải chạy mau!",
  "Ha ha, chiếu tướng rồi! Bé có cứu được vua của mình không nào?"
];

// --- GENERAL ENDING MESSAGES ---

const PLAYER_WIN_PHRASES = [
  "Chúc mừng con đã giành chiến thắng! Con đã chơi rất tập trung và kiên trì đấy.",
  "Một ván cờ tuyệt vời! Sư phụ rất vui khi thấy con tiến bộ từng ngày qua từng nước đi.",
  "Con thắng rồi nhé! Thắng thua không quan trọng, điều quý giá là con đã học hỏi được rất nhiều."
];

const AI_WIN_PHRASES = [
  "Chiếu hết rồi! Ván này quân đen của ta giành thắng lợi nhé. Bé đã chơi rất cố gắng rồi, ván sau cố lên nha!",
  "Trận đấu kết thúc rồi! Ta may mắn thắng ván này nhé. Đừng nản chí, làm ván mới phục thù nào!"
];

const DRAW_PHRASES = [
  "Ván cờ hòa rồi! Cả hai ta đều là những kỳ thủ xuất sắc ngang tài ngang sức!",
  "Trận đấu hòa rồi nha! Quá kịch tính và thú vị luôn bé ơi!"
];

// --- HELPER GENERATORS FOR SPECIFIC MOVE PATHS ---

export function getRabbitPlayerSpeech(type: 'move' | 'capture' | 'check', pieceNameVi: string): string {
  let list: string[] = [];
  if (type === 'check') {
    list = RABBIT_PLAYER_CHECK;
  } else if (type === 'capture') {
    list = RABBIT_PLAYER_CAPTURE;
  } else {
    list = RABBIT_PLAYER_MOVE;
  }
  const randomPhrase = list[Math.floor(Math.random() * list.length)];
  const formattedPhrase = randomPhrase.replace(/{piece}/g, pieceNameVi);
  return `[Sư phụ Thỏ]: ${formattedPhrase}`;
}

export function getOpponentSpeech(
  type: 'move' | 'capture' | 'check',
  pieceNameVi: string,
  from: string,
  to: string,
  capturedPieceNameVi?: string
): string {
  let phrase = "";
  if (type === 'check') {
    const list = OPPONENT_CHECK_PHRASES;
    phrase = list[Math.floor(Math.random() * list.length)];
    return `[Đối thủ]: ${phrase} Ta vừa đi quân ${pieceNameVi} từ ${from} đến ${to}!`;
  } else if (type === 'capture') {
    const list = OPPONENT_CAPTURE_PHRASES;
    phrase = list[Math.floor(Math.random() * list.length)];
    const capText = capturedPieceNameVi ? `quân ${capturedPieceNameVi}` : "quân cờ";
    return `[Đối thủ]: ${phrase} Quân ${pieceNameVi} của ta vừa ăn ${capText} của bé tại ô ${to}!`;
  } else {
    const list = OPPONENT_STANDARD_PHRASES;
    phrase = list[Math.floor(Math.random() * list.length)];
    return `[Đối thủ]: ${phrase} Ta vừa di chuyển quân ${pieceNameVi} từ ô ${from} đến ô ${to}.`;
  }
}

export function getGameOverSpeech(type: 'player_win' | 'ai_win' | 'draw'): string {
  let list: string[] = [];
  if (type === 'player_win') list = PLAYER_WIN_PHRASES;
  else if (type === 'ai_win') list = AI_WIN_PHRASES;
  else list = DRAW_PHRASES;

  return list[Math.floor(Math.random() * list.length)];
}
