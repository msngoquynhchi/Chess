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

interface ChessArrow {
  from: Square;
  to: Square;
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

  const [rightClickedSquares, setRightClickedSquares] = React.useState<Square[]>([]);
  const [arrows, setArrows] = React.useState<ChessArrow[]>([]);
  const [rightDragStart, setRightDragStart] = React.useState<Square | null>(null);
  const [rightDragCurrent, setRightDragCurrent] = React.useState<Square | null>(null);

  // Clear right-clicks and arrows when FEN changes (a move was made)
  React.useEffect(() => {
    setRightClickedSquares([]);
    setArrows([]);
  }, [fen]);

  // Global mouseup event to reset the drag states if released outside the board
  React.useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 2) { // Right click release
        setRightDragStart(null);
        setRightDragCurrent(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getSquareCoords = (square: Square) => {
    const file = square[0];
    const rank = square[1];
    const col = files.indexOf(file);
    const row = ranks.indexOf(rank);
    return {
      x: (col + 0.5) * 12.5,
      y: (row + 0.5) * 12.5,
    };
  };

  const handleLeftClick = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setArrows([]);
      setRightClickedSquares([]);
    }
  };

  const handleSquareMouseDown = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) { // Right click down
      setRightDragStart(square);
      setRightDragCurrent(square);
    }
  };

  const handleSquareMouseEnter = (square: Square) => {
    if (rightDragStart) {
      setRightDragCurrent(square);
    }
  };

  const handleSquareMouseUp = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) { // Right click up
      if (rightDragStart) {
        if (rightDragStart === square) {
          // Simple right click - toggle square highlight
          setRightClickedSquares(prev => {
            if (prev.includes(square)) {
              return prev.filter(s => s !== square);
            } else {
              return [...prev, square];
            }
          });
        } else {
          // Right drag - toggle or add arrow
          const newArrow = { from: rightDragStart, to: square };
          setArrows(prev => {
            const exists = prev.some(a => a.from === newArrow.from && a.to === newArrow.to);
            if (exists) {
              return prev.filter(a => !(a.from === newArrow.from && a.to === newArrow.to));
            } else {
              return [...prev, newArrow];
            }
          });
        }
      }
      setRightDragStart(null);
      setRightDragCurrent(null);
    }
  };

  // Combine completed arrows with active drag arrow preview
  const activeArrows = [...arrows];
  if (rightDragStart && rightDragCurrent && rightDragStart !== rightDragCurrent) {
    if (!activeArrows.some(a => a.from === rightDragStart && a.to === rightDragCurrent)) {
      activeArrows.push({ from: rightDragStart, to: rightDragCurrent });
    }
  }

  return (
    <div 
      onMouseDown={handleLeftClick}
      className={`relative w-full aspect-square mx-auto rounded-3xl overflow-hidden shadow-xl bg-white border-8 border-[#D6CDC2] transition-all duration-300 ${
        isExpanded ? 'max-w-[660px]' : 'max-w-[560px]'
      }`}
    >
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

      <div className="relative grid grid-cols-8 grid-rows-8 w-full h-full p-2.5 bg-[#D6CDC2]">
        {/* SVG Overlay for arrows */}
        <svg 
          className="absolute inset-2.5 w-[calc(100%-20px)] h-[calc(100%-20px)] pointer-events-none z-30" 
          viewBox="0 0 100 100"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <polygon points="1 1, 4.5 2.5, 1 4" fill="#E59A6D" />
            </marker>
          </defs>
          {activeArrows.map((arrow, idx) => {
            const start = getSquareCoords(arrow.from);
            const end = getSquareCoords(arrow.to);
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            // Shorten the line end slightly so the arrowhead sits beautifully
            const shortenAmount = len > 0 ? 3.6 : 0;
            const endX = end.x - (dx / len) * shortenAmount;
            const endY = end.y - (dy / len) * shortenAmount;

            return (
              <line
                key={idx}
                x1={start.x}
                y1={start.y}
                x2={endX}
                y2={endY}
                stroke="#E59A6D"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.85"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

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
                const isRightClicked = rightClickedSquares.includes(squareName);

                let squareBg = isDark ? 'bg-[#C4CDC1]' : 'bg-[#F2EDE7]'; // pastel sage & soft cream
                
                if (isLastMoveSrc || isLastMoveDst) {
                  squareBg = isDark ? 'bg-[#B0BBAE]' : 'bg-[#EAE4DC]'; // highlighted path in Natural Tones
                }

                if (isRightClicked) {
                  squareBg = isDark ? 'bg-[#E59A6D]' : 'bg-[#F5BA96]'; // gentle carrot-peach shades
                }
                
                return (
                  <button
                    key={squareName}
                    id={`square-${squareName}`}
                    onClick={() => {
                      setRightClickedSquares([]);
                      if (isInteractive) {
                        onSquareClick(squareName);
                      }
                    }}
                    onMouseDown={(e) => handleSquareMouseDown(e, squareName)}
                    onMouseEnter={() => handleSquareMouseEnter(squareName)}
                    onMouseUp={(e) => handleSquareMouseUp(e, squareName)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                    }}
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
