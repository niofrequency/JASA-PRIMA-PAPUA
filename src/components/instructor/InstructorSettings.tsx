import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { Save, Check, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { compressImageToMaxKB, formatBytes } from '../../utils/imageCompressor';

interface InstructorSettingsProps {
  currentUser: User | null;
  onUpdateUser: (updated: Partial<User>) => void;
}

export const InstructorSettings: React.FC<InstructorSettingsProps> = ({
  currentUser,
  onUpdateUser,
}) => {
  const [name, setName] = useState(currentUser?.name || 'Ir. Budi Santoso, M.T.');
  const [email, setEmail] = useState(currentUser?.email || 'budi.santoso@jasaprimapapua.co.id');
  const [department, setDepartment] = useState(currentUser?.department || 'Senior Industrial & Heavy Equipment Operations');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200');
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ orig: string; comp: string; qual: number } | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const result = await compressImageToMaxKB(file, 500); // Compress auto to <= 500KB
      setAvatarUrl(result.dataUrl);
      setCompressionInfo({
        orig: formatBytes(result.originalSizeBytes),
        comp: formatBytes(result.compressedSizeBytes),
        qual: result.qualityUsed,
      });
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name, email, department, avatarUrl });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <h1 className="text-xl font-extrabold text-[#0F172A]">Instructor Profile & Portal Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure your official instructor signature title and upload profile photo (auto-compressed under 500KB).</p>

        {savedMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Instructor profile settings updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          
          {/* Avatar Upload Box with Auto 500KB Compression */}
          <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl space-y-3">
            <label className="text-xs font-extrabold text-[#0F172A] flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-[#0EA5E9]" />
              <span>Instructor Profile Photo</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <img
                src={avatarUrl}
                alt="Instructor Avatar"
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#0EA5E9]/20 shrink-0 shadow-sm"
              />

              <div className="space-y-2 text-center sm:text-left flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="instructor-avatar-input"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="px-4 py-2 bg-white border border-[#CBD5E1] hover:border-[#0EA5E9] text-slate-700 hover:text-[#0EA5E9] font-bold text-xs rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>{isCompressing ? 'Compressing Image...' : 'Upload New Photo'}</span>
                  </button>
                  <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                    Auto-compressed &lt; 500KB
                  </span>
                </div>

                {compressionInfo && (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Compressed: {compressionInfo.orig} &rarr; <strong>{compressionInfo.comp}</strong> ({compressionInfo.qual}% quality)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#0F172A]">Instructor Name & Titles *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#0F172A]">Official Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#0F172A]">Department / Specialization</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-[#0EA5E9]/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </form>
      </div>
    </div>
  );
};
