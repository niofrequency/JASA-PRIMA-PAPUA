import React from 'react';
import { LayoutDashboard, BookOpen, FileCheck, Award, User, LogOut, GraduationCap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type StudentTab = 'dashboard' | 'courses' | 'quizzes' | 'certificates' | 'profile';

interface StudentSidebarProps {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  studentName: string;
  studentId?: string;
  avatarUrl?: string;
  onLogout: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  onSelectTab,
  studentName,
  studentId,
  avatarUrl,
  onLogout,
}) => {
  const { t } = useLanguage();

  const navItems: { id: StudentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t('sidebar.dashboard', 'Dashboard'), icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'courses', label: t('sidebar.enrolledCourses', 'Enrolled Courses'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quizzes', label: t('sidebar.quizzesAssessments', 'Quizzes & Assessments'), icon: <FileCheck className="w-4 h-4" /> },
    { id: 'certificates', label: t('sidebar.certificates', 'Certificates'), icon: <Award className="w-4 h-4" /> },
    { id: 'profile', label: t('sidebar.myProfile', 'My Profile'), icon: <User className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full md:w-80 bg-[#E2E8F0] border-r border-[#CBD5E1] flex flex-col justify-between p-4 shrink-0 text-[#0F172A]">
      <div className="space-y-6">
        
        {/* Student Profile Card */}
        <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-xl flex items-center space-x-3 shadow-sm">
          <img
            src={avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
            alt={studentName}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#0EA5E9]/40 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-extrabold text-[#0F172A] truncate">{studentName}</span>
              <GraduationCap className="w-3.5 h-3.5 text-[#0EA5E9] shrink-0" />
            </div>
            <p className="text-[10px] text-[#0EA5E9] font-bold truncate">ID: {studentId || 'JPP-2026-088'}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block font-heading">
            {t('nav.studentPortal', 'Student Portal')}
          </p>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`student-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0EA5E9] text-white shadow-md shadow-[#0EA5E9]/20'
                    : 'text-slate-700 hover:text-[#0F172A] hover:bg-slate-200/80'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Exit Button */}
      <div className="pt-4 border-t border-[#CBD5E1]">
        <button
          id="student-logout-btn"
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/70 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.signOut', 'Exit Student Portal')}</span>
        </button>
      </div>
    </aside>
  );
};

