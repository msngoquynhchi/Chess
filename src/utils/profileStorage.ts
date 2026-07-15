import { PlayerProfile, MatchRecord, Difficulty } from '../types';

const PROFILES_KEY = 'chess_kids_profiles';
const MATCH_RECORDS_KEY = 'chess_kids_matches';
const ACTIVE_PROFILE_KEY = 'chess_kids_active_id';

const DEFAULT_AVATARS = [
  { id: 'lion', emoji: '🦁', name: 'Sư Tử Dũng Mãnh', color: 'bg-amber-100 border-amber-300 text-amber-600' },
  { id: 'panda', emoji: '🐼', name: 'Gấu Trúc Đáng Yêu', color: 'bg-slate-100 border-slate-300 text-slate-800' },
  { id: 'fox', emoji: '🦊', name: 'Cáo Con Thông Minh', color: 'bg-orange-100 border-orange-300 text-orange-600' },
  { id: 'koala', emoji: '🐨', name: 'Koala Chậm Rãi', color: 'bg-zinc-100 border-zinc-300 text-zinc-600' },
  { id: 'bunny', emoji: '🐰', name: 'Thỏ Trắng Nhanh Nhảu', color: 'bg-pink-100 border-pink-300 text-pink-500' },
  { id: 'monkey', emoji: '🐵', name: 'Khỉ Nhỏ Tinh Nghịch', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
];

export function getAvatars() {
  return DEFAULT_AVATARS;
}

export function getProfiles(): PlayerProfile[] {
  const data = localStorage.getItem(PROFILES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string | null) {
  if (id) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

export function saveProfiles(profiles: PlayerProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function createProfile(name: string, avatar: string): PlayerProfile {
  const profiles = getProfiles();
  const newProfile: PlayerProfile = {
    id: 'p_' + Math.random().toString(36).substr(2, 9),
    name: name.trim() || 'Kỳ thủ nhí',
    avatar,
    createdAt: new Date().toISOString(),
    elo: 1000,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesDrawn: 0,
    completedDifficulties: {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0
    }
  };
  
  profiles.push(newProfile);
  saveProfiles(profiles);
  setActiveProfileId(newProfile.id);
  return newProfile;
}

export function deleteProfile(id: string) {
  let profiles = getProfiles();
  profiles = profiles.filter(p => p.id !== id);
  saveProfiles(profiles);
  
  const activeId = getActiveProfileId();
  if (activeId === id) {
    if (profiles.length > 0) {
      setActiveProfileId(profiles[0].id);
    } else {
      setActiveProfileId(null);
    }
  }
}

export function getMatchHistory(profileId: string): MatchRecord[] {
  const data = localStorage.getItem(MATCH_RECORDS_KEY);
  if (!data) return [];
  try {
    const allMatches: MatchRecord[] = JSON.parse(data);
    return allMatches.filter(m => m.playerProfileId === profileId);
  } catch (e) {
    return [];
  }
}

export function addMatchRecord(profileId: string, difficulty: Difficulty, result: 'win' | 'loss' | 'draw' | 'resigned', movesCount: number) {
  const data = localStorage.getItem(MATCH_RECORDS_KEY);
  let allMatches: MatchRecord[] = [];
  if (data) {
    try {
      allMatches = JSON.parse(data);
    } catch (e) {
      allMatches = [];
    }
  }

  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  const newRecord: MatchRecord = {
    id: 'm_' + Math.random().toString(36).substr(2, 9),
    playerProfileId: profileId,
    playerName: profile.name,
    difficulty,
    result,
    movesCount,
    date: new Date().toISOString()
  };

  allMatches.push(newRecord);
  localStorage.setItem(MATCH_RECORDS_KEY, JSON.stringify(allMatches));

  // Update profile statistics
  profile.gamesPlayed += 1;
  if (result === 'win') {
    profile.gamesWon += 1;
    profile.elo += difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : difficulty === 'hard' ? 20 : 30;
    
    const count = profile.completedDifficulties[difficulty] || 0;
    profile.completedDifficulties[difficulty] = count + 1;
  } else if (result === 'loss') {
    profile.gamesLost += 1;
    profile.elo = Math.max(100, profile.elo - (difficulty === 'easy' ? 8 : difficulty === 'medium' ? 10 : difficulty === 'hard' ? 12 : 15));
  } else if (result === 'draw') {
    profile.gamesDrawn += 1;
    profile.elo += 2;
  }

  saveProfiles(profiles);
}

/**
 * Recommendations based on play performance
 * Evaluates the last 3 matches of the active profile.
 * - If won all 3 on the current level, recommend upgrading.
 * - If lost all 3 on the current level, recommend downgrading (unless easy).
 * - General recommendation based on win rate on the current difficulty.
 */
export function getDifficultyRecommendation(profileId: string, currentDifficulty: Difficulty): {
  recommendedDifficulty: Difficulty;
  reason: string;
  shouldChange: boolean;
} {
  const matches = getMatchHistory(profileId);
  const currentLevelMatches = matches.filter(m => m.difficulty === currentDifficulty);
  
  if (currentLevelMatches.length < 3) {
    return {
      recommendedDifficulty: currentDifficulty,
      reason: `Cần chơi thêm ${3 - currentLevelMatches.length} ván ở cấp độ này để hệ thống đánh giá chính xác hơn nhé! 🌟`,
      shouldChange: false
    };
  }

  // Look at the last 3 games played on this difficulty
  const last3 = currentLevelMatches.slice(-3);
  const wins = last3.filter(m => m.result === 'win').length;
  const losses = last3.filter(m => m.result === 'loss' || m.result === 'resigned').length;

  if (wins === 3) {
    // Recommend leveling up
    if (currentDifficulty === 'easy') {
      return {
        recommendedDifficulty: 'medium',
        reason: 'Ồ! Cậu đã thắng 3 ván liên tục ở cấp độ "Dễ" rồi. Cậu siêu quá đi mất! Thử nâng lên cấp độ "Trung bình" để chinh phục thử thách mới nhé! 🚀',
        shouldChange: true
      };
    } else if (currentDifficulty === 'medium') {
      return {
        recommendedDifficulty: 'hard',
        reason: 'Thắng tuyệt đối 3 trận ở cấp độ "Trung bình"! Đầu óc cậu đúng là của một nhà chiến thuật tài ba. Cùng nhảy lên cấp độ "Khó" nhé! 🧠✨',
        shouldChange: true
      };
    } else if (currentDifficulty === 'hard') {
      return {
        recommendedDifficulty: 'expert',
        reason: 'Quá xuất sắc! Cậu đã chế ngự cấp độ "Khó". Trình độ của cậu giờ đã tiệm cận các siêu đại sư rồi. Thử thách tối thượng "Chuyên gia" đang chờ cậu! 👑🏆',
        shouldChange: true
      };
    }
  }

  if (losses === 3) {
    // Recommend leveling down to keep it fun and build confidence
    if (currentDifficulty === 'expert') {
      return {
        recommendedDifficulty: 'hard',
        reason: 'Cấp độ "Chuyên gia" có vẻ hơi hóc búa một tí. Đừng buồn nhé, lùi lại cấp độ "Khó" để rèn luyện thêm binh pháp rồi quay lại báo thù sau nha! 💪🛡️',
        shouldChange: true
      };
    } else if (currentDifficulty === 'hard') {
      return {
        recommendedDifficulty: 'medium',
        reason: 'Những trận đấu ở cấp độ "Khó" thật cam go đúng không? Hãy hạ xuống cấp độ "Trung bình" để chơi thư giãn hơn và tích lũy kinh nghiệm nhé! 🍯🎈',
        shouldChange: true
      };
    } else if (currentDifficulty === 'medium') {
      return {
        recommendedDifficulty: 'easy',
        reason: 'Đừng nản chí nhé người bạn nhỏ! Hãy quay lại cấp độ "Dễ" để cùng tớ luyện tập các thế cờ cơ bản và lấy lại sự tự tin nào! 🦁❤️',
        shouldChange: true
      };
    }
  }

  // If win rate is comfortable, stay here
  const winRate = (currentLevelMatches.filter(m => m.result === 'win').length / currentLevelMatches.length) * 100;
  
  if (winRate >= 66) {
    let next: Difficulty = currentDifficulty;
    if (currentDifficulty === 'easy') next = 'medium';
    else if (currentDifficulty === 'medium') next = 'hard';
    else if (currentDifficulty === 'hard') next = 'expert';

    if (next !== currentDifficulty) {
      return {
        recommendedDifficulty: next,
        reason: `Tỷ lệ thắng của cậu là ${Math.round(winRate)}% - siêu xuất sắc! Đã đến lúc nâng cấp độ lên "${next === 'medium' ? 'Trung bình' : next === 'hard' ? 'Khó' : 'Chuyên gia'}" rồi đó! 🎉`,
        shouldChange: true
      };
    }
  }

  return {
    recommendedDifficulty: currentDifficulty,
    reason: `Trình độ hiện tại rất phù hợp với cậu! Tỷ lệ thắng là ${Math.round(winRate)}%, những ván đấu đang diễn ra rất cân tài cân sức. Chúc cậu chơi vui vẻ! 🥰`,
    shouldChange: false
  };
}
