import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn("Cảnh báo: GEMINI_API_KEY chưa được cấu hình. Các tính năng AI sẽ không hoạt động.");
}

// Robust helper to call Gemini API with model fallback and automatic backoff retries for 503/429 errors
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  if (!ai) {
    throw new Error("GoogleGenAI client is not initialized.");
  }

  // Include modern, supported models in prioritized order
  const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
  let lastError: any = null;
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const model of models) {
    const maxRetries = 3; // 3 attempts per model
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Đang gọi Gemini với model: ${model} (Lần thử ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        console.log(`Gọi thành công với model: ${model}`);
        return response;
      } catch (error: any) {
        console.warn(`Lỗi khi gọi model ${model} ở lần thử ${attempt}:`, error.message || error);
        lastError = error;

        // Robust parsing of error structure (handles nested error.error or stringified json)
        let errorText = "";
        let statusCode = 0;
        try {
          errorText = JSON.stringify(error).toLowerCase();
        } catch (e) {
          errorText = String(error).toLowerCase();
        }

        if (error && typeof error === 'object') {
          if (error.status) statusCode = error.status;
          if (error.code) statusCode = error.code;
          if (error.error && typeof error.error === 'object') {
            if (error.error.code) statusCode = error.error.code;
            if (error.error.status) errorText += " " + String(error.error.status).toLowerCase();
            if (error.error.message) errorText += " " + String(error.error.message).toLowerCase();
          }
        }

        const isTransient = errorText.includes("503") || 
                            errorText.includes("temporary") || 
                            errorText.includes("high demand") || 
                            errorText.includes("unavailable") ||
                            errorText.includes("429") || 
                            errorText.includes("quota") ||
                            errorText.includes("overloaded") ||
                            statusCode === 503 || 
                            statusCode === 429;

        if (isTransient && attempt < maxRetries) {
          const waitTime = attempt * 1200; // Wait 1200ms, then 2400ms for solid backoff
          console.log(`Gặp lỗi quá tải/tạm thời. Chờ ${waitTime}ms trước khi thử lại...`);
          await delay(waitTime);
        } else {
          // Break inner loop and try next model
          break;
        }
      }
    }
  }

  throw lastError || new Error("Tất cả các model Gemini đều không phản hồi.");
}

// Helper to generate a cute, context-rich fallback explanation locally if API is down
function getLocalExplanation(pieceName: string | undefined, color: string | undefined, playerMove: boolean, playerName: string | undefined, move: string): string {
  const name = playerName || "Bé";
  const piece = String(pieceName || "").toLowerCase();
  
  if (playerMove) {
    switch (piece) {
      case 'p':
        return `Oa! Chú lính Tốt dũng cảm của bé ${name} vừa tiến lên ô ${move} cực kỳ kiên định! Tốt nhỏ bé nhưng chí lớn, chỉ biết tiến không lùi bước, bảo vệ tiền tuyến rực rỡ luôn! 💪♟️`;
      case 'n':
        return `Tuyệt cú mèo! Kỵ sĩ Mã của bé ${name} nhảy chữ L bay vèo đến ô ${move} siêu ngầu! Chú ngựa tinh nghịch đã sẵn sàng phiêu lưu chiến đấu rồi đấy! 🐴✨`;
      case 'b':
        return `Chuẩn không cần chỉnh! Đại sư Tượng của bé ${name} vừa phóng đường chéo uy lực lên ô ${move} rồi! Ngắm bắn từ xa cực kì thông thái luôn nha! 📐🌟`;
      case 'r':
        return `Rầm rầm rầm! Chiến xa Xe khổng lồ của bé ${name} lao vút trên đường thẳng đến ô ${move}! Uy phong lẫm liệt, chiếm giữ cột dọc cực kì quyết đoán! 🏰🚀`;
      case 'q':
        return `Ôi trời đất ơi, bé ${name} vừa xuất trận Nữ Hoàng Hậu quyền lực đến ô ${move} rồi kìa! Sức mạnh vô địch vũ trụ, càn quét khắp chiến trường luôn nha! 👑🔥`;
      case 'k':
        return `Đức Vua tôn kính của bé ${name} vừa di chuyển nhẹ nhàng sang ô ${move} để nấp mình an toàn rồi. Vua là quan trọng nhất nên phải bảo vệ thật kỹ đấy nhé! 👑🛡️`;
      default:
        return `Nước đi quân cờ đến ô ${move} của bé ${name} trông cực kỳ thông minh và nhiều ẩn số thú vị nha! Hãy tiếp tục phát huy nào! 🌟✨`;
    }
  } else {
    // Computer move
    switch (piece) {
      case 'p':
        return `Tớ vừa nhích nhẹ chú Tốt Đen lên ô ${move} để giữ hàng phòng ngự nè! Đừng khinh thường quân Tốt nhỏ bé nha, tớ cũng dũng cảm lắm á! ♟️🖤`;
      case 'n':
        return `Hí hí hí! Chú ngựa Mã Đen của tớ vừa nhảy tót lên ô ${move} để dạo chơi và nhòm ngó lãnh thổ rồi nè! Hãy cẩn thận đấy nha! 🐴🖤`;
      case 'b':
        return `Ta da! Đại sư Tượng Đen của tớ vừa lướt đường chéo dài dằng dặc đến ô ${move} rồi! Tượng của tớ đang canh giữ cực kỳ nghiêm ngặt đấy nhé! 📐🖤`;
      case 'r':
        return `Xình xịch xịch! Chiến xe Xe Đen đồ sộ của tớ đã lăn bánh chiếm lĩnh vị trí ${move} rồi! Trông tớ ngầu chưa nào bé ${name}! 🏰🖤`;
      case 'q':
        return `Né đường cho Nữ Hoàng Hậu Đen kiêu kỳ xuất hành đến ô ${move} nào! Tớ sở hữu sức mạnh càn quét cực đỉnh, bé hãy dàn quân phòng thủ mau đi! 👑🖤`;
      case 'k':
        return `Hù, Đức Vua Đen Thận Trọng của tớ vừa bước sang ô ${move} để ẩn nấp an toàn rồi. Giờ thì bé đố mà chiếu tướng được tớ đấy, ahihi! 👑🖤`;
      default:
        return `Tớ vừa di chuyển một quân cờ Đen đến vị trí ${move} để bày binh bố trận rồi nè! Bé chuẩn bị tinh thần đi nhé! 🌟🖤`;
    }
  }
}

// REST API for move explanation and tactical coaching
app.post("/api/explain-move", async (req, res) => {
  try {
    const { 
      move, 
      pieceName, 
      color, 
      playerMove, // Boolean: true if player made the move, false if AI made it
      boardFen, 
      playerLevel, 
      playerName,
      capture, 
      isCheck, 
      isCheckmate,
      gameStage // "khai_cuoc" (opening), "trung_cuoc" (middlegame), "tan_cuoc" (endgame)
    } = req.body;

    // Determine humorous persona based on the piece that moved
    let characterName = "Quân cờ vui nhộn";
    let pieceRole = "Quân cờ";
    
    switch (pieceName?.toLowerCase()) {
      case 'p':
        characterName = color === 'w' ? "Tốt Trắng Tinh Nghịch" : "Tốt Đen Dũng Cảm";
        pieceRole = "chú lính Tốt nhỏ bé nhưng tràn đầy ý chí quyết tâm";
        break;
      case 'n':
        characterName = color === 'w' ? "Mã Trắng Tinh Nghịch" : "Mã Đen Bay Nhảy";
        pieceRole = "Kỵ sĩ Mã điệu nghệ biết nhảy chữ L siêu hạng";
        break;
      case 'b':
        characterName = color === 'w' ? "Tượng Trắng Thông Thái" : "Tượng Đen Uyên Bác";
        pieceRole = "Đại sư Tượng chuyên phi đường chéo cực ngầu";
        break;
      case 'r':
        characterName = color === 'w' ? "Xe Trắng Đồ Sộ" : "Xe Đen Uy Lực";
        pieceRole = "Chiến xa Xe dũng mãnh, thích lao thẳng cực kỳ quyết đoán";
        break;
      case 'q':
        characterName = color === 'w' ? "Hậu Trắng Quyền Lực" : "Hậu Đen Kiêu Kỳ";
        pieceRole = "Nữ hoàng Hậu đầy uy lực, bá chủ của bàn cờ";
        break;
      case 'k':
        characterName = color === 'w' ? "Vua Trắng Nhút Nhát" : "Vua Đen Thận Trọng";
        pieceRole = "Đức vua tôn kính, thích an toàn nhưng cực kỳ quan trọng";
        break;
    }

    if (!ai) {
      return res.json({
        success: true,
        text: getLocalExplanation(pieceName, color, playerMove, playerName, move),
        characterName
      });
    }

    const stageText = gameStage === 'khai_cuoc' ? "giai đoạn khai cuộc (bắt đầu trận đấu)" : 
                      gameStage === 'tan_cuoc' ? "giai đoạn tàn cuộc (quyết định thắng bại)" : "giai đoạn trung cuộc (đang chiến đấu gay cấn)";

    const prompt = `
      Hãy nhập vai vào nhân vật "${characterName}" (${pieceRole}) vừa thực hiện nước đi "${move}" trên bàn cờ vua.
      
      Thông tin bối cảnh:
      - Đây là nước đi của: ${playerMove ? "Người chơi (trẻ em)" : "Máy tính (đối thủ AI)"}.
      - Tên người chơi: ${playerName || "Bé"}.
      - Trình độ của người chơi: ${playerLevel || "Dễ"}.
      - Loại nước đi: ${capture ? "ăn quân đối phương" : "di chuyển bình thường"}.
      - Trạng thái đặc biệt: ${isCheckmate ? "CHIẾU HẾT TRẬN ĐẤU!" : isCheck ? "ĐANG CHIẾU VUA!" : "bình thường"}.
      - Giai đoạn ván cờ: ${stageText}.
      - Mã FEN hiện tại: ${boardFen}.

      Yêu cầu phản hồi:
      1. Viết bằng tiếng Việt, ngôn ngữ cực kỳ hài hước, dí dỏm, gần gũi với trẻ em (dùng từ ngữ teen, sinh động như "bùm chéo", "ahihi", "cứu viện", "bay vèo", "ăn hàng", "giao lưu", "né tránh").
      2. Giải thích lý do tại sao nước đi "${move}" lại mang lại lợi thế hoặc mục đích của nó là gì (ví dụ: Tốt tiến lên để chiếm trung tâm, Mã nhảy lên để tấn công, Tượng ngắm bắn từ xa, Xe kiểm soát cột mở, Hậu quét sạch chiến trường, Vua đi trốn cho an toàn). Giải thích cực kỳ đơn giản để một đứa trẻ 8 tuổi cũng hiểu được chiến thuật.
      3. Nếu nước đi là của Người chơi, hãy khen ngợi bé một cách hài hước hoặc nhắc nhở vui vẻ nếu đó là nước đi mạo hiểm.
      4. Nếu nước đi là của Máy tính, hãy giải thích đầy tự hào nhưng đáng yêu về nước đi của mình để bé biết đường phòng thủ.
      5. Giới hạn phản hồi cực kỳ ngắn gọn, từ 2 đến tối đa 4 câu ngắn để tiết kiệm dung lượng và giúp bé đọc nhanh không bị chán.

      Ví dụ phản hồi dí dỏm:
      - Mã Đen: "Hí hí hí! Tớ vừa phi thân chữ L lên đây để nhòm ngó chú Tốt của cậu đấy! Coi chừng tớ ngoạm mất nha, nguy hiểm cận kề rồi đó nha!"
      - Hậu Trắng: "Tránh đường cho Nữ Hoàng tỏa sáng nào! Tớ vừa lên vị trí này để bảo vệ các bạn Tốt và mở đường càn quét. Chuẩn bị tinh thần đi nhé!"
    `;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        temperature: 0.8,
        systemInstruction: "Bạn là một huấn luyện viên cờ vua hoạt hình siêu dễ thương, hài hước, chuyên giảng giải cờ vua cho trẻ em bằng ngôn ngữ vui nhộn, ngắn gọn, dễ thương.",
      }
    });

    const text = response.text || getLocalExplanation(pieceName, color, playerMove, playerName, move);
    
    return res.json({
      success: true,
      text: text.trim(),
      characterName
    });

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API, chuyển sang giải thích nội bộ:", error);
    // Graceful fallback with premium dynamic content
    const { move, pieceName, color, playerMove, playerName } = req.body;
    let characterName = "Quân cờ vui nhộn";
    switch (pieceName?.toLowerCase()) {
      case 'p': characterName = color === 'w' ? "Tốt Trắng Tinh Nghịch" : "Tốt Đen Dũng Cảm"; break;
      case 'n': characterName = color === 'w' ? "Mã Trắng Tinh Nghịch" : "Mã Đen Bay Nhảy"; break;
      case 'b': characterName = color === 'w' ? "Tượng Trắng Thông Thái" : "Tượng Đen Uyên Bác"; break;
      case 'r': characterName = color === 'w' ? "Xe Trắng Đồ Sộ" : "Xe Đen Uy Lực"; break;
      case 'q': characterName = color === 'w' ? "Hậu Trắng Quyền Lực" : "Hậu Đen Kiêu Kỳ"; break;
      case 'k': characterName = color === 'w' ? "Vua Trắng Nhút Nhát" : "Vua Đen Thận Trọng"; break;
    }
    res.json({
      success: true,
      text: getLocalExplanation(pieceName, color, playerMove, playerName, move),
      characterName
    });
  }
});

// API for Hint generator (combining Gemini with board state to give a smart, warm hint)
app.post("/api/get-hint", async (req, res) => {
  const { boardFen, bestMoves, playerLevel, playerName } = req.body;
  const name = playerName || "Bé";
  const recommendedMove = bestMoves && bestMoves.length > 0 ? bestMoves[0] : "";

  try {
    if (!ai) {
      const text = recommendedMove
        ? `Hửm, Thỏ Trắng thấy có một nước đi vô cùng thần sầu là **${recommendedMove}** đấy bé ${name} ơi! Bé thử di chuyển quân cờ lên ô đó xem nhé! 🐰✨`
        : `Tớ khuyên bé ${name} thử kiểm tra xem có bạn quân nào có thể tiến lên chiếm lĩnh trung tâm để ván cờ vững chắc hơn không nè! 🐰🌾`;
      return res.json({
        success: true,
        text,
        hintMove: recommendedMove || null
      });
    }

    const prompt = `
      Hãy đóng vai "Huấn luyện viên Cờ vua Thỏ Trắng" siêu dễ thương để đưa ra lời gợi ý ấm áp và dí dỏm cho người chơi nhí ${playerName || "Bé"} (đang chơi ở trình độ ${playerLevel || "Dễ"}).
      
      Trận đấu đang ở trạng thái FEN: ${boardFen}.
      Các nước đi tối ưu mà công cụ cờ vua gợi ý là: ${JSON.stringify(bestMoves)}.

      Hãy viết một lời khuyên cực kỳ ngắn gọn (2 câu) để khích lệ bé đi nước đi tốt nhất này mà không nói toạc ra ngay lập tức, mà gợi mở kiểu tò mò đáng yêu, sau đó chỉ rõ nước đi gợi ý là gì.
      Ngôn ngữ: Tiếng Việt, ấm áp, ngộ nhìn, dùng icon xinh xắn.
      
      Ví dụ: "Hửm, tớ thấy có một bạn Mã đang rất muốn nhảy lên để làm người hùng kìa! Cậu thử đi nước mã lên xem sao nhé 🐰✨"
    `;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        temperature: 0.7,
        systemInstruction: "Bạn là Thỏ Trắng Huấn luyện viên, giọng điệu ngọt ngào, khích lệ, dùng nhiều biểu tượng dễ thương để gợi ý nước đi cờ vua cho bé.",
      }
    });

    const text = response.text || `Tớ mách nhỏ nè bé ${name}: cậu nên thử đi nước cờ **${recommendedMove}** xem sao nhé! 🐰✨`;

    return res.json({
      success: true,
      text: text.trim(),
      hintMove: recommendedMove || null
    });

  } catch (error) {
    console.error("Lỗi khi gợi ý nước đi, chuyển sang nội bộ:", error);
    const text = recommendedMove
      ? `Hửm, Thỏ Trắng bật mí nè bé ${name} ơi! Có một nước đi vô cùng chiến thuật là **${recommendedMove}** đang chờ bé thực hiện đấy. Bé thử đi xem sao nha! 🐰✨`
      : `Bé ${name} thử kiểm tra xem có quân nào có thể tiến lên chiếm các ô trung tâm giúp ván cờ vững chãi hơn không nè! 🐰🥕`;
    res.json({
      success: true,
      text,
      hintMove: recommendedMove || null
    });
  }
});

// REST API for general chat coaching with Thỏ Trắng
app.post("/api/chat-coach", async (req, res) => {
  const { message, boardFen, playerLevel, playerName } = req.body;
  const name = playerName || "Bé";
  const lowerMessage = String(message || "").toLowerCase();
  
  // Local smart rule-based answers
  let fallbackText = "";
  if (lowerMessage.includes("chào") || lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    fallbackText = `Chào bé ${name} yêu quý nhé! 🐰 Thỏ Trắng rất vui được đồng hành cùng bé trong trận đấu này. Nào, chúng mình cùng tập trung đi tiếp nước cờ thật giỏi nhé! 🥕✨`;
  } else if (lowerMessage.includes("luật") || lowerMessage.includes("chơi như thế nào") || lowerMessage.includes("cách đi")) {
    fallbackText = `Luật chơi cờ vua siêu đơn giản luôn bé ${name}: Xe đi thẳng, Tượng đi chéo, Hậu đi khắp nơi, còn Tốt chỉ tiến thẳng và ăn chéo thôi. Bé cứ yên tâm chơi tiếp nhé! 🐰🛡️`;
  } else if (lowerMessage.includes("nhập thành") || lowerMessage.includes("castle")) {
    fallbackText = `Nhập thành là cách tuyệt hảo để bảo vệ Đức Vua đấy bé ${name}! Vua sẽ di chuyển sang ngang 2 ô về phía Xe, và Xe nhảy qua đứng cạnh Vua để che chở nha! 👑🏰`;
  } else if (lowerMessage.includes("phong cấp") || lowerMessage.includes("promote")) {
    fallbackText = `Khi bé dẫn chú lính Tốt dũng cảm đi hết bàn cờ sang hàng đối phương, bạn Tốt sẽ hóa thân thành quân Hậu, Xe, Tượng hoặc Mã cực kỳ mạnh mẽ luôn! ♟️⚡`;
  } else {
    const fallbacks = [
      `Bé ${name} chơi cờ dũng cảm và thông minh lắm nha! Thỏ Trắng luôn dõi theo cổ vũ bé hết mình đây! Cố lên bé ơi! 🐰✨`,
      `Oa, ván cờ đang cực kỳ gay cấn luôn bé ${name} ơi! Bé hãy quan sát thật kỹ, bảo vệ Đức Vua và tìm đường tấn công nhé! 🥕🛡️`,
      `Thỏ Trắng chúc bé yêu chơi cờ thật vui nha! Đừng ngại thử những nước đi mới, đó là cách tuyệt nhất để chúng mình giỏi hơn mỗi ngày đấy! 🐰🌟`
    ];
    fallbackText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  try {
    if (!ai) {
      return res.json({
        success: true,
        text: fallbackText,
        characterName: "Huấn luyện viên Thỏ"
      });
    }

    const prompt = `
      Hãy nhập vai vào "Huấn luyện viên Cờ vua Thỏ Trắng" siêu ngộ nghĩnh, thông thái, ấm áp và cực kỳ yêu trẻ con.
      
      Thông tin người chơi:
      - Tên bé: ${name}.
      - Trình độ: ${playerLevel || "Dễ"}.
      - Trạng thái bàn cờ FEN hiện tại: ${boardFen || "bắt đầu ván cờ"}.

      Bé vừa hỏi bạn câu này trong phòng chat: "${message}"

      Yêu cầu phản hồi:
      1. Viết bằng tiếng Việt ngọt ngào, siêu dễ thương, có tính khích lệ cao, dùng nhiều icon/emoji nhí nhảnh (🐰, 🥕, ✨, 🌟, 👑).
      2. Nếu bé hỏi về luật chơi cờ vua (như phong cấp, nhập thành, bắt chốt qua đường, cách đi của các quân) hoặc chiến thuật, hãy giải thích cực kỳ đơn giản và dễ thương cho trẻ em hiểu.
      3. Nếu bé chào hỏi hoặc nói chuyện vui, hãy trêu đùa ngọt ngào và rủ bé tập trung chơi tiếp để chiến thắng.
      4. Tuyệt đối giữ phản hồi ngắn gọn dưới 3 câu để bé dễ đọc và tiết kiệm token tối đa.

      Ví dụ phản hồi:
      - "Chào cậu nhé! Tớ là Thỏ Trắng đây 🐰 Hôm nay cậu chơi cờ rất có phong thái của đại sư đấy. Nào, ta cùng tiếp tục đi nước cờ tiếp theo nha! ✨"
    `;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        temperature: 0.7,
        systemInstruction: "Bạn là Thỏ Trắng Huấn luyện viên, giọng điệu ngọt ngào, dùng icon, dạy cờ vua cho bé siêu dễ hiểu.",
      }
    });

    return res.json({
      success: true,
      text: response.text?.trim() || fallbackText,
      characterName: "Huấn luyện viên Thỏ"
    });

  } catch (error) {
    console.error("Lỗi khi chat với Thỏ Trắng, dùng câu trả lời nội bộ:", error);
    res.json({
      success: true,
      text: fallbackText,
      characterName: "Huấn luyện viên Thỏ"
    });
  }
});

// Serve static files in production / Vite middleware in dev
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
