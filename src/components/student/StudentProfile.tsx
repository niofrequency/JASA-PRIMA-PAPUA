import React, { useState, useRef } from 'react';
import { User, Certificate } from '../../types';
import { Award, ShieldCheck, CheckCircle2, Upload, Sparkles, Camera, Check } from 'lucide-react';
import { compressImageToMaxKB, formatBytes } from '../../utils/imageCompressor';

interface StudentProfileProps {
  currentUser: User | null;
  certificates: Certificate[];
  onUpdateUser?: (updated: Partial<User>) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  currentUser,
  certificates,
  onUpdateUser,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ orig: string; comp: string; qual: number } | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const result = await compressImageToMaxKB(file, 500); // Auto compresses to under 500KB
      setAvatarUrl(result.dataUrl);
      setCompressionInfo({
        orig: formatBytes(result.originalSizeBytes),
        comp: formatBytes(result.compressedSizeBytes),
        qual: result.qualityUsed,
      });

      if (onUpdateUser) {
        onUpdateUser({ avatarUrl: result.dataUrl });
      }

      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      console.error('Failed to compress avatar image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Saved Toast Alert */}
      {savedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Student profile picture updated and compressed under 500KB!</span>
        </div>
      )}

      {/* Header Profile Card with Image Upload */}
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 shadow-sm">
        
        {/* Avatar Container with Upload Overlay */}
        <div className="relative group shrink-0">
          <img
            src={avatarUrl}
            alt="Student Avatar"
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#0EA5E9]/30 shadow-md transition-all"
          />
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="student-avatar-input"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            title="Upload new profile picture (auto-compressed < 500KB)"
            className="absolute -bottom-1 -right-1 p-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl shadow-lg border-2 border-white transition-transform hover:scale-110 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
            <h1 className="text-xl font-extrabold text-[#0F172A]">{currentUser?.name || 'Elias Pigome'}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#0EA5E9] border border-cyan-200 text-[10px] font-extrabold w-fit mx-auto sm:mx-0">
              ID: {currentUser?.studentId || 'JPP-2026-088'}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">{currentUser?.department || 'Mechanical Maintenance & Heavy Equipment Division'}</p>
          <p className="text-xs text-[#0EA5E9] font-bold">{currentUser?.email || 'elias.pigome@jasaprimapapua.co.id'}</p>

          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>{isCompressing ? 'Compressing...' : 'Upload Student Photo'}</span>
            </button>
            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
              Auto-compressed &lt; 500KB
            </span>
          </div>

          {compressionInfo && (
            <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 w-fit mx-auto sm:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Compressed: {compressionInfo.orig} &rarr; <strong>{compressionInfo.comp}</strong> ({compressionInfo.qual}% quality)</span>
            </div>
          )}
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-4 shadow-sm">
        <h2 className="text-base font-extrabold text-[#0F172A]">Earned Badges & Industry Certifications</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-center">
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-[#0EA5E9] flex items-center justify-center mx-auto">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs font-extrabold text-[#0F172A]">LOTO Electrical Specialist</p>
            <p className="text-[10px] text-slate-500 font-medium">Issued July 2026</p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-center">
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-[#0EA5E9] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs font-extrabold text-[#0F172A]">High-Risk Mine Safety</p>
            <p className="text-[10px] text-slate-500 font-medium">Active Competency</p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-extrabold text-[#0F172A]">100% Assessment Score</p>
            <p className="text-[10px] text-slate-500 font-medium">Perfect Module Score</p>
          </div>
        </div>
      </div>

    </div>
  );
};
