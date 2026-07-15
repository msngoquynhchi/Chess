import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { ChessPiece } from './ChessPiece';

interface CoachChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onExplainMove: (msgId: string) => void;
  onGetHint: () => void;
  isAiThinking: boolean;
  canGetHint: boolean;
  playerName: string;
}

export const CoachChat: React.FC<CoachChatProps> = ({
  messages,
  onSendMessage,
  onExplainMove,
  onGetHint,
  isAiThinking,
  canGetHint,
  playerName,
}) => {
  const [inputText, setInputText] = React.useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[500px] w-full rounded-3xl border-4 border-[#E8E2D9] bg-[#FFFDFB] shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="bg-[#8BA888] text-white p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-xl shadow-inner animate-bounce">
            🐰
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white">Sư Phụ Thỏ 🐰</h3>
            <span className="text-[13px] bg-white/20 text-[#F2EDE7] px-1.5 py-0.5 rounded-full font-mono">
              ● Cùng bé học cờ
            </span>
          </div>
        </div>
        
        {/* Hint Trigger in Header */}
        <button
          onClick={onGetHint}
          disabled={!canGetHint || isAiThinking}
          className={`flex items-center space-x-1 text-[13px] py-1.5 px-3 rounded-full font-bold transition-all shadow-sm ${
            canGetHint && !isAiThinking
              ? 'bg-[#EBD99F] hover:bg-[#EADBB3] text-[#5C5751] cursor-pointer active:scale-95'
              : 'bg-[#F2EDE7]/50 text-zinc-400 cursor-not-allowed'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Gợi ý</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isPlayer = msg.sender === 'player';
            const isSystem = msg.sender === 'system';
            
            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center text-center my-1.5"
                >
                  <span className="text-[13px] bg-[#F2EDE7] text-[#5C5751] px-3 py-1 rounded-full border border-[#E8E2D9] font-medium">
                    {msg.text}
                  </span>
                </motion.div>
              );
            }

            // Determine piece icon for move-based comments
            const pieceName = msg.moveData?.pieceName;
            const pieceColor = msg.moveData?.color;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isPlayer ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-2.5 ${isPlayer ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isPlayer 
                    ? 'bg-[#EBD99F] border-2 border-white text-lg' 
                    : 'bg-[#F2EDE7] border-2 border-white overflow-hidden p-0.5'
                }`}>
                  {isPlayer ? (
                    msg.avatar || '🧒'
                  ) : pieceName && pieceColor ? (
                    <ChessPiece type={pieceName} color={pieceColor} className="w-full h-full scale-110" />
                  ) : (
                    msg.avatar || '🐰'
                  )}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[88%] ${isPlayer ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name */}
                  <span className="text-[13px] font-bold text-zinc-400 mb-0.5 px-1">
                    {isPlayer ? playerName : msg.characterName || 'Sư phụ Thỏ'}
                  </span>

                  {/* Bubble body */}
                  <div className={`rounded-2xl p-3 text-[13px] leading-relaxed shadow-sm ${
                    isPlayer 
                      ? 'bg-[#5C5751] text-white rounded-tr-none font-medium' 
                      : 'bg-[#F2EDE7] text-[#4A4540] border border-[#E8E2D9] rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    
                    {/* Unique tactical explain triggers inside the move comments */}
                    {!isPlayer && msg.isExplainable && msg.moveData && (
                      <div className="mt-2.5 pt-2 border-t border-[#E8E2D9] flex items-center justify-between gap-1">
                        <span className="text-[13px] text-[#8BA888] font-bold">
                          Bấm nút để nghe mẹo chiến thuật 👇
                        </span>
                        <button
                          onClick={() => onExplainMove(msg.id)}
                          className="flex items-center space-x-1 bg-[#8BA888] hover:bg-[#728F6F] active:scale-95 text-white py-1 px-2.5 rounded-full font-bold text-[13px] shadow transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-[#EBD99F] animate-pulse" />
                          <span>Giải thích</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* AI Typing loader */}
        {isAiThinking && (
          <div className="flex items-start gap-2.5 flex-row">
            <div className="w-8 h-8 rounded-full bg-[#F2EDE7] border-2 border-white flex items-center justify-center flex-shrink-0 animate-pulse text-lg">
              🥕
            </div>
            <div className="flex flex-col items-start max-w-[88%]">
              <span className="text-[13px] font-bold text-zinc-400 mb-0.5 px-1">
                Thỏ Trắng đang phân tích...
              </span>
              <div className="rounded-2xl p-3 bg-[#F2EDE7] border border-[#E8E2D9] rounded-tl-none flex items-center space-x-1.5 h-9">
                <div className="w-2 h-2 bg-[#8BA888] rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-[#8BA888] rounded-full animate-bounce delay-150" />
                <div className="w-2 h-2 bg-[#8BA888] rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-[#E8E2D9] flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Hỏi Sư Phụ Thỏ"
          disabled={isAiThinking}
          className="flex-1 text-[13px] border border-[#E8E2D9] rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 bg-white disabled:opacity-60 transition-colors text-[#4A4540]"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isAiThinking}
          className={`p-2 rounded-xl transition-all text-white ${
            inputText.trim() && !isAiThinking
              ? 'bg-[#8BA888] hover:bg-[#728F6F] cursor-pointer active:scale-90'
              : 'bg-[#F2EDE7] text-zinc-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
