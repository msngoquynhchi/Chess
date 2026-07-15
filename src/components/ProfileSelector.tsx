import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { getAvatars, createProfile, deleteProfile, getMatchHistory } from '../utils/profileStorage';
import { motion } from 'motion/react';
import { Plus, User, Trash2, Award, Check, Gamepad2, ShieldAlert } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: PlayerProfile[];
  activeProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onProfileCreated: (profile: PlayerProfile) => void;
  onProfileDeleted: (id: string) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onProfileCreated,
  onProfileDeleted,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('lion');
  const [profileToDelete, setProfileToDelete] = useState<PlayerProfile | null>(null);
  
  const avatars = getAvatars();
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const profile = createProfile(newName, selectedAvatar);
    onProfileCreated(profile);
    setNewName('');
    setIsCreating(false);
  };

  const activeAvatarDetails = avatars.find(a => a.id === activeProfile?.avatar);

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E8E2D9] max-w-[650px] mx-auto">
      {/* Current player display */}
      {activeProfile ? (
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-[#FFFDFB] border border-[#E8E2D9]">
          <div className="flex items-center space-x-4">
            {/* Avatar block */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm border-2 border-white ${
              avatars.find(a => a.id === activeProfile.avatar)?.color || 'bg-amber-100'
            }`}>
              {avatars.find(a => a.id === activeProfile.avatar)?.emoji || '🧒'}
            </div>
            
            <div className="text-center md:text-left">
              <span className="text-[13px] font-bold text-zinc-400 block uppercase tracking-wider">Đang hoạt động</span>
              <h2 className="text-xl font-black text-[#5C5751] tracking-tight leading-tight">{activeProfile.name}</h2>
              <div className="flex items-center justify-center md:justify-start gap-1 mt-1 text-sm font-bold text-[#8BA888]">
                <Award className="w-4 h-4 text-[#EBD99F] fill-[#EBD99F]" />
                <span>Elo: {activeProfile.elo}</span>
                <span className="text-[#E8E2D9] mx-1">|</span>
                <span>Thắng: {activeProfile.gamesWon}/{activeProfile.gamesPlayed} ván</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 bg-[#8BA888] hover:bg-[#728F6F] active:scale-95 text-white font-bold text-[13px] px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo tài khoản mới</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 text-center p-6 rounded-2xl bg-[#F2EDE7] border-2 border-dashed border-[#8BA888]/30 text-[#5C5751]">
          <ShieldAlert className="w-10 h-10 mx-auto text-[#8BA888] mb-2" />
          <h2 className="text-lg font-black">Chưa Có Tài Khoản Người Chơi!</h2>
          <p className="text-[13px] max-w-sm mx-auto mt-1 leading-relaxed text-[#5C5751]/80">Hãy tạo một hồ sơ người chơi bên dưới để lưu trữ điểm số Elo, huy hiệu và nhận đề xuất trình độ cờ vua phù hợp nhé!</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-3.5 inline-flex items-center gap-1.5 bg-[#8BA888] hover:bg-[#728F6F] active:scale-95 text-white font-black text-[13px] px-6 py-3 rounded-full shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Tài Khoản Ngay</span>
          </button>
        </div>
      )}

      {/* Creation form modal-like overlay */}
      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#FFFDFB] border border-[#E8E2D9] rounded-3xl p-5 mb-6"
        >
          <h3 className="font-black text-[#5C5751] mb-4 flex items-center gap-1.5 text-base">
            <Plus className="w-5 h-5 text-[#8BA888]" />
            Tạo Người Chơi Mới
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-zinc-500 mb-1.5">Tên kỳ thủ nhí:</label>
              <input
                type="text"
                required
                maxLength={15}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nhập tên của bé (ví dụ: Bin Bin, Sushi...)"
                className="w-full text-[13px] border border-[#E8E2D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-zinc-500 mb-2">Chọn Linh Vật Avatar:</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {avatars.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      selectedAvatar === av.id
                        ? 'border-[#8BA888] bg-[#8BA888]/10 scale-105 shadow-sm'
                        : 'border-[#E8E2D9] bg-white hover:border-[#8BA888]'
                    }`}
                  >
                    <span className="text-3xl mb-1">{av.emoji}</span>
                    <span className="text-[13px] font-bold text-[#5C5751] block text-center truncate w-full">{av.name.split(' ')[0]}</span>
                    {selectedAvatar === av.id && (
                      <div className="absolute top-1 right-1 bg-[#8BA888] text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-[13px] font-bold text-zinc-500 hover:bg-[#F2EDE7] rounded-full transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#8BA888] hover:bg-[#728F6F] text-white text-[13px] font-bold rounded-full transition-all shadow cursor-pointer active:scale-95"
              >
                Hoàn tất ✨
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Profiles List */}
      <div>
        <h3 className="text-[13px] font-bold text-[#A19991] uppercase tracking-widest mb-3">Tất cả tài khoản ({profiles.length})</h3>
        {profiles.length === 0 ? (
          <div className="text-center p-8 text-zinc-400 text-[13px]">
            Chưa có tài khoản nào được tạo. Tạo tài khoản để bắt đầu chơi nhé! 😊
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {profiles.map((p) => {
              const av = avatars.find(a => a.id === p.avatar);
              const isActive = p.id === activeProfileId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'border-[#8BA888] bg-[#8BA888]/5 shadow-sm'
                      : 'border-[#E8E2D9] bg-white hover:border-[#8BA888]/40'
                  }`}
                >
                  <button
                    onClick={() => onSelectProfile(p.id)}
                    className="flex items-center space-x-3 text-left flex-1 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border ${av?.color || 'bg-amber-100'}`}>
                      {av?.emoji || '🧒'}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-[#5C5751] flex items-center gap-1">
                        {p.name}
                        {isActive && <span className="bg-[#8BA888] text-white text-[13px] font-bold px-1.5 py-0.5 rounded-full">Đang chọn</span>}
                      </h4>
                      <p className="text-[13px] text-zinc-500 font-semibold mt-0.5 flex items-center gap-1.5">
                        <span>Elo: <strong className="text-zinc-700">{p.elo}</strong></span>
                        <span>•</span>
                        <span>Thắng: <strong className="text-zinc-700">{p.gamesWon}</strong>/{p.gamesPlayed} ván</span>
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setProfileToDelete(p)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa tài khoản"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom delete confirmation modal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C5751]/40 backdrop-blur-sm">
          <div className="bg-[#FFFDFB] rounded-[32px] border-4 border-[#FFADAD] p-6 max-w-sm w-full shadow-2xl text-center relative">
            <div className="mx-auto w-16 h-16 bg-[#FFADAD]/20 text-red-600 flex items-center justify-center text-3xl rounded-3xl mb-4 border border-[#FFADAD]/35 rotate-[-3deg]">
              🦁
            </div>
            <h3 className="text-lg font-black text-[#5C5751] mb-2">
              Xóa tài khoản của bé?
            </h3>
            <p className="text-[13px] text-zinc-500 font-bold mb-6 leading-relaxed">
              Bé có chắc chắn muốn xóa tài khoản "{profileToDelete.name}" không? Toàn bộ thống kê và điểm số Elo sẽ biến mất mãi mãi đấy! 😢
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                className="flex-1 py-3 px-4 font-black text-[13px] rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#F2EDE7]/60 text-[#5C5751] transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onProfileDeleted(profileToDelete.id);
                  setProfileToDelete(null);
                }}
                className="flex-1 py-3 px-4 font-black text-[13px] rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
