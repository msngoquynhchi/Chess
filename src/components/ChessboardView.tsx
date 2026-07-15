import React from 'react';
import { Chess, Square } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { ChessPiece } from './ChessPiece';

interface ChessboardViewProps {
  fen: string;
  selectedSquare: Square | null;
  possibleMoves: string[];
  lastMove: { from: string; to: string } | null;
  isInteractive: boolean;
  onSquareClick: (square: Square) => void;
  kingInCheckSquare: string | null; // e.g. "e1" if king is in check
  isExpanded?: boolean;
}

export const ChessboardView: React.FC<ChessboardViewProps> = ({
  fen,
  selectedSquare,
  possibleMoves,
  lastMove,
  isInteractive,
  onSquareClick,
  kingInCheckSquare,
  isExpanded = false,
}) => {
  const chess = new Chess(fen);
  const board = chess.board();

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className={`relative w-full aspect-square mx-auto rounded-3xl overflow-hidden shadow-xl bg-white border-8 border-[#D6CDC2] transition-all duration-300 ${
      isExpanded ? 'max-w-[660px]' : 'max-w-[560px]'
    }`}>
      {/* Files indicators (a-h) along the bottom */}
      <div className="absolute bottom-1 left-0 right-0 h-4 flex justify-around text-[13px] font-mono font-bold text-[#5C5751]/60 pointer-events-none z-10 select-none">
        {files.map((file, idx) => (
          <span key={file} className="w-full text-center">{file.toUpperCase()}</span>
        ))}
      </div>

      {/* Ranks indicators (1-8) along the left side */}
      <div className="absolute top-0 bottom-0 left-1 w-4 flex flex-col justify-around text-[13px] font-mono font-bold text-[#5C5751]/60 pointer-events-none z-10 select-none">
        {ranks.map((rank) => (
          <span key={rank} className="h-full flex items-center pl-1">{rank}</span>
        ))}
      </div>

      <div className="grid grid-cols-8 grid-rows-8 w-full h-full p-2.5 bg-[#D6CDC2]">
        {ranks.map((rank, rIdx) => {
          return (
            <div key={rank} className="contents">
              {files.map((file, fIdx) => {
                const squareName = `${file}${rank}` as Square;
                const piece = board[rIdx][fIdx];
                const isDark = (rIdx + fIdx) % 2 !== 0;
                
                // Styling classes
                const isSelected = selectedSquare === squareName;
                const isPossibleTarget = possibleMoves.includes(squareName);
                const isLastMoveSrc = lastMove?.from === squareName;
                const isLastMoveDst = lastMove?.to === squareName;
                const isCheck = kingInCheckSquare === squareName;

                let squareBg = isDark ? 'bg-[#C4CDC1]' : 'bg-[#F2EDE7]'; // pastel sage & soft cream
                
                if (isLastMoveSrc || isLastMoveDst) {
                  squareBg = isDark ? 'bg-[#B0BBAE]' : 'bg-[#EAE4DC]'; // highlighted path in Natural Tones
                }
                
                return (
                  <button
                    key={squareName}
                    id={`square-${squareName}`}
                    disabled={!isInteractive}
                    onClick={() => onSquareClick(squareName)}
                    className={`relative w-full h-full flex items-center justify-center transition-all duration-300 select-none focus:outline-none ${squareBg} ${
                      isSelected ? 'ring-4 ring-[#EBD99F] ring-inset bg-[#EBD99F]/30' : ''
                    } ${isCheck ? 'ring-4 ring-[#FFADAD] ring-inset animate-pulse bg-[#FFADAD]/30' : ''}`}
                  >
                    {/* Background highlighted trail for last move */}
                    {(isLastMoveSrc || isLastMoveDst) && (
                      <div className="absolute inset-0 bg-[#EBD99F]/10 pointer-events-none" />
                    )}

                    {/* Chess Piece with animation */}
                    <AnimatePresence mode="popLayout">
                      {piece && (
                        <motion.div
                          key={`${piece.color}${piece.type}-${squareName}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="w-[90%] h-[90%] flex items-center justify-center cursor-pointer z-10 select-none hover:scale-105 transition-transform"
                        >
                          <ChessPiece type={piece.type} color={piece.color} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hint / Possible Move dot indicator */}
                    {isPossibleTarget && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        {piece ? (
                          // Target captures have an outer gold circle
                          <div className="w-[80%] h-[80%] rounded-full border-4 border-amber-400 bg-amber-400/25 animate-ping duration-1000" />
                        ) : (
                          // Regular movement dots
                          <div className="w-4 h-4 rounded-full bg-amber-400/80 shadow-md border-2 border-white" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
