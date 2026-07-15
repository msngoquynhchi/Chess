import React from 'react';

interface ChessPieceProps {
  type: string; // 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  color: string; // 'w' | 'b'
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = "w-full h-full" }) => {
  const isWhite = color === 'w';
  const mainColor = isWhite ? '#FFFFFF' : '#3E4A56';
  const strokeColor = isWhite ? '#3E4A56' : '#1A232E';
  const eyeColor = isWhite ? '#1A232E' : '#FFFFFF';
  const cheekColor = isWhite ? '#FFC0CB' : '#FF9999';
  const crownColor = '#FFD700'; // Gold accent for Kings & Queens

  switch (type.toLowerCase()) {
    case 'p': // Pawn (Lính Tốt) - Cute little soldier with a round head and big happy eyes!
      return (
        <svg viewBox="0 0 100 100" className={className} referrerPolicy="no-referrer">
          <defs>
            <radialGradient id={`pawn-grad-${color}`} cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor={isWhite ? '#FDFDFD' : '#5A6978'} />
              <stop offset="100%" stopColor={isWhite ? '#D8E2DC' : '#2A3540'} />
            </radialGradient>
          </defs>
          {/* Base */}
          <path d="M25 85 C25 75, 75 75, 75 85 Z" fill={`url(#pawn-grad-${color})`} stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="50" cy="78" rx="20" ry="6" fill={`url(#pawn-grad-${color})`} stroke={strokeColor} strokeWidth="3" />
          {/* Body */}
          <path d="M35 75 C35 55, 42 45, 50 45 C58 45, 65 55, 65 75 Z" fill={`url(#pawn-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          {/* Head */}
          <circle cx="50" cy="38" r="18" fill={`url(#pawn-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          {/* Collar/Bead */}
          <circle cx="50" cy="52" r="6" fill={strokeColor} />
          {/* Face */}
          {/* Eyes */}
          <circle cx="43" cy="35" r="3" fill={eyeColor} />
          <circle cx="57" cy="35" r="3" fill={eyeColor} />
          {/* Rosy Cheeks */}
          <circle cx="39" cy="40" r="2.5" fill={cheekColor} opacity="0.8" />
          <circle cx="61" cy="40" r="2.5" fill={cheekColor} opacity="0.8" />
          {/* Smiley Mouth */}
          <path d="M46 43 Q50 47 54 43" fill="none" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'n': // Knight (Kỵ sĩ Mã) - A beautiful, clear, cute horse head profile facing left!
      return (
        <svg viewBox="0 0 100 100" className={className} referrerPolicy="no-referrer">
          <defs>
            <linearGradient id={`knight-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#FDFDFD' : '#6A7B8C'} />
              <stop offset="100%" stopColor={isWhite ? '#C5D3C8' : '#2F3C47'} />
            </linearGradient>
          </defs>
          {/* Base */}
          <path d="M22 85 C22 75, 78 75, 78 85 Z" fill={`url(#knight-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          <ellipse cx="50" cy="78" rx="22" ry="5" fill={`url(#knight-grad-${color})`} stroke={strokeColor} strokeWidth="3" />
          
          {/* Horse Neck, Chest & Head Profile (Facing Left) */}
          <path d="M 64 76 
                   C 64 54, 62 38, 58 32 
                   L 58 14 
                   C 56 12, 52 14, 52 22 
                   L 50 28 
                   C 42 28, 25 34, 25 45 
                   C 25 50, 28 54, 34 52 
                   C 42 50, 46 44, 48 44
                   C 48 54, 42 64, 36 76 Z" 
                fill={`url(#knight-grad-${color})`} stroke={strokeColor} strokeWidth="4" strokeLinejoin="round" />
          
          {/* Back Ear (drawn slightly behind) */}
          <path d="M 62 28 L 65 11 C 67 9, 70 11, 68 19 L 64 26" fill={strokeColor} stroke={strokeColor} strokeWidth="1" />
          
          {/* Cute Mane on the back of the neck */}
          <path d="M 64 36 Q 74 40 64 46 Q 74 50 64 56 Q 72 60 64 66" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          
          {/* Face details */}
          {/* Cute big eye */}
          <circle cx="42" cy="38" r="3.5" fill={eyeColor} />
          <circle cx="43" cy="37" r="1" fill={isWhite ? '#FFFFFF' : '#000000'} /> {/* Sparkle */}
          
          {/* Nose/Nostril */}
          <circle cx="29" cy="44" r="1.5" fill={eyeColor} />
          
          {/* Happy smile */}
          <path d="M 31 48 Q 34 51 37 47" fill="none" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Rosy Cheek */}
          <circle cx="45" cy="44" r="3.5" fill={cheekColor} opacity="0.8" />
        </svg>
      );

    case 'b': // Bishop (Đại sư Tượng) - Cute Elephant (Tượng) wearing a Bishop's Mitre Hat! Highly recognizable for kids!
      return (
        <svg viewBox="0 0 100 100" className={className} referrerPolicy="no-referrer">
          <defs>
            <radialGradient id={`bishop-grad-${color}`} cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#5E6D7C'} />
              <stop offset="100%" stopColor={isWhite ? '#D3DDD6' : '#2A343E'} />
            </radialGradient>
          </defs>
          {/* Base */}
          <path d="M25 85 C25 76, 75 76, 75 85 Z" fill={`url(#bishop-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          <ellipse cx="50" cy="78" rx="20" ry="5" fill={`url(#bishop-grad-${color})`} stroke={strokeColor} strokeWidth="3" />
          
          {/* Body */}
          <path d="M34 75 C34 58, 40 50, 50 50 C60 50, 66 58, 66 75 Z" fill={`url(#bishop-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          
          {/* Big, cute, floppy elephant ears on the sides (drawn slightly behind the face) */}
          <ellipse cx="32" cy="46" rx="10" ry="12" fill={`url(#bishop-grad-${color})`} stroke={strokeColor} strokeWidth="3.5" />
          <ellipse cx="68" cy="46" rx="10" ry="12" fill={`url(#bishop-grad-${color})`} stroke={strokeColor} strokeWidth="3.5" />
          
          {/* Inner ears for extra cuteness */}
          <ellipse cx="32" cy="46" rx="6" ry="8" fill={cheekColor} opacity="0.4" />
          <ellipse cx="68" cy="46" rx="6" ry="8" fill={cheekColor} opacity="0.4" />

          {/* Round Elephant Head */}
          <circle cx="50" cy="46" r="16" fill={`url(#bishop-grad-${color})`} stroke={strokeColor} strokeWidth="4" />

          {/* Elephant Trunk (Curving up for good luck!) */}
          <path d="M 50 52 C 50 64, 42 66, 42 60 C 42 56, 46 56, 46 58" fill="none" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />

          {/* Bishop's Mitre Hat on top of head */}
          <path d="M36 34 C36 18, 50 8, 50 8 C50 8, 64 18, 64 34 Z" fill={`url(#bishop-grad-${color})`} stroke={strokeColor} strokeWidth="3.5" strokeLinejoin="round" />
          
          {/* Hat Cut/Cross Symbol */}
          <line x1="50" y1="16" x2="50" y2="28" stroke={!isWhite ? '#FFFFFF' : strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="44" y1="22" x2="56" y2="22" stroke={!isWhite ? '#FFFFFF' : strokeColor} strokeWidth="3" strokeLinecap="round" />
          
          {/* Hat Pom-pom or white cross on top */}
          {!isWhite ? (
            <path d="M50 8 L50 1 M46 4 L54 4" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          ) : (
            <circle cx="50" cy="7" r="3.5" fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
          )}

          {/* Big happy eyes */}
          <circle cx="44" cy="42" r="2.5" fill={eyeColor} />
          <circle cx="56" cy="42" r="2.5" fill={eyeColor} />
          
          {/* Rosy Cheeks */}
          <circle cx="39" cy="47" r="2" fill={cheekColor} opacity="0.8" />
          <circle cx="61" cy="47" r="2" fill={cheekColor} opacity="0.8" />
        </svg>
      );

    case 'r': // Rook (Chiến xa Xe) - A sleepy, protective fortress wall with battlements on head!
      return (
        <svg viewBox="0 0 100 100" className={className} referrerPolicy="no-referrer">
          <defs>
            <linearGradient id={`rook-grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#637382'} />
              <stop offset="100%" stopColor={isWhite ? '#CCD5CE' : '#2D3843'} />
            </linearGradient>
          </defs>
          {/* Base */}
          <path d="M22 85 C22 76, 78 76, 78 85 Z" fill={`url(#rook-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          {/* Castle Body */}
          <path d="M28 80 L32 40 L68 40 L72 80 Z" fill={`url(#rook-grad-${color})`} stroke={strokeColor} strokeWidth="4" strokeLinejoin="round" />
          {/* Battlements / Turrets */}
          <path d="M28 40 L28 26 L38 26 L38 32 L46 32 L46 26 L54 26 L54 32 L62 32 L62 26 L72 26 L72 40 Z" 
                fill={`url(#rook-grad-${color})`} stroke={strokeColor} strokeWidth="4" strokeLinejoin="round" />
          {/* Brick lines for castle feel */}
          <line x1="36" y1="52" x2="44" y2="52" stroke={strokeColor} strokeWidth="2" opacity="0.4" />
          <line x1="56" y1="52" x2="64" y2="52" stroke={strokeColor} strokeWidth="2" opacity="0.4" />
          <line x1="46" y1="65" x2="54" y2="65" stroke={strokeColor} strokeWidth="2" opacity="0.4" />
          {/* Cute Face */}
          {/* Calm/Sleepy Eyes */}
          <path d="M37 46 Q41 44 44 47" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          <path d="M56 47 Q59 44 63 46" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          {/* Little open mouth (looks curious/sleepy) */}
          <circle cx="50" cy="54" r="3.5" fill={eyeColor} />
          {/* Cheeks */}
          <circle cx="34" cy="51" r="2.5" fill={cheekColor} opacity="0.8" />
          <circle cx="66" cy="51" r="2.5" fill={cheekColor} opacity="0.8" />
        </svg>
      );

    case 'q': // Queen (Nữ hoàng Hậu) - Royal crown, twinkling eyelashes, sparkly and elegant!
      return (
        <svg viewBox="0 0 100 100" className={className} referrerPolicy="no-referrer">
          <defs>
            <radialGradient id={`queen-grad-${color}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#6A7887'} />
              <stop offset="100%" stopColor={isWhite ? '#E1E9E4' : '#2C3641'} />
            </radialGradient>
          </defs>
          {/* Base */}
          <path d="M22 85 C22 76, 78 76, 78 85 Z" fill={`url(#queen-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          <ellipse cx="50" cy="78" rx="22" ry="5.5" fill={`url(#queen-grad-${color})`} stroke={strokeColor} strokeWidth="3" />
          {/* Body */}
          <path d="M32 75 C32 55, 38 48, 50 48 C62 48, 68 55, 68 75 Z" fill={`url(#queen-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          {/* Elegant Head */}
          <circle cx="50" cy="40" r="18" fill={`url(#queen-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          {/* Crown with Gold spires */}
          <path d="M31 31 L35 15 L44 24 L50 11 L56 24 L65 15 L69 31 Z" fill={crownColor} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
          {/* Crown jewels */}
          <circle cx="35" cy="14" r="2.5" fill="#FF4B4B" stroke={strokeColor} strokeWidth="1" />
          <circle cx="50" cy="10" r="2.5" fill="#4B93FF" stroke={strokeColor} strokeWidth="1" />
          <circle cx="65" cy="14" r="2.5" fill="#4BFF52" stroke={strokeColor} strokeWidth="1" />
          {/* Face */}
          {/* Eyelashes / Sparkling eyes */}
          <path d="M38 40 Q41 37 44 41" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="37" y1="38" x2="35" y2="41" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="38" x2="46" y2="41" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />

          <path d="M56 41 Q59 37 62 40" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="38" x2="54" y2="41" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="63" y1="38" x2="65" y2="41" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Blush */}
          <circle cx="36" cy="46" r="3.5" fill={cheekColor} opacity="0.9" />
          <circle cx="64" cy="46" r="3.5" fill={cheekColor} opacity="0.9" />
          {/* Big happy smile */}
          <path d="M46 47 Q50 52 54 47" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'k': // King (Vua) - Majestic crown, cute fluffy mustache, wise yet slightly worried!
      return (
        <svg viewBox="0 0 100 100" className={className} referrerPolicy="no-referrer">
          <defs>
            <radialGradient id={`king-grad-${color}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#6E7D8C'} />
              <stop offset="100%" stopColor={isWhite ? '#DBE3DC' : '#2D3742'} />
            </radialGradient>
          </defs>
          {/* Base */}
          <path d="M20 85 C20 75, 80 75, 80 85 Z" fill={`url(#king-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          <ellipse cx="50" cy="78" rx="24" ry="6" fill={`url(#king-grad-${color})`} stroke={strokeColor} strokeWidth="3" />
          {/* Body */}
          <path d="M30 75 C30 54, 36 47, 50 47 C64 47, 70 54, 70 75 Z" fill={`url(#king-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          {/* Head */}
          <circle cx="50" cy="41" r="19" fill={`url(#king-grad-${color})`} stroke={strokeColor} strokeWidth="4" />
          {/* Majestic King Crown */}
          <rect x="35" y="18" width="30" height="9" fill={crownColor} stroke={strokeColor} strokeWidth="3" rx="2" />
          <path d="M35 18 L32 8 L44 14 L50 4 L56 14 L68 8 L65 18 Z" fill={crownColor} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
          {/* Royal Cross on Crown */}
          <path d="M50 4 L50 -2 M47 1 L53 1" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          {/* Face */}
          {/* Kind Wise Eyes */}
          <circle cx="41" cy="38" r="3" fill={eyeColor} />
          <circle cx="59" cy="38" r="3" fill={eyeColor} />
          <path d="M37 32 Q41 30 44 32" fill="none" stroke={strokeColor} strokeWidth="2.5" /> {/* Eyebrow */}
          <path d="M56 32 Q59 30 63 32" fill="none" stroke={strokeColor} strokeWidth="2.5" /> {/* Eyebrow */}
          {/* Cute Blush */}
          <circle cx="36" cy="44" r="3" fill={cheekColor} opacity="0.8" />
          <circle cx="64" cy="44" r="3" fill={cheekColor} opacity="0.8" />
          {/* Fun Mustache */}
          <path d="M40 45 Q45 42 50 46 Q55 42 60 45 Q50 51 40 45" fill={strokeColor} stroke={strokeColor} strokeWidth="1" />
          {/* Smiley mouth peaking underneath mustache */}
          <path d="M48 50 Q50 52 52 50" fill="none" stroke={isWhite ? '#1A232E' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
};
