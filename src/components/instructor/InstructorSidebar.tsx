import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart2,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export type InstructorTab =
  | 'dashboard'
  | 'courses'
  | 'ai-creator'
  | 'analytics'
  | 'settings'
  | 'safetyculture';

interface InstructorSidebarProps {
  activeTab: InstructorTab;
  onSelectTab: (tab: InstructorTab) => void;
  instructorName: string;
  department?: string;
  avatarUrl?: string;
  onLogout: () => void;
}

export const InstructorSidebar: React.FC<InstructorSidebarProps> = ({
  activeTab,
  onSelectTab,
  instructorName,
  department = 'Industrial Safety Division',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  onLogout,
}) => {
  const navItems: { id: InstructorTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Instructor Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'courses',
      label: 'My Course Library',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'ai-creator',
      label: 'AI Course Generator',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      badge: 'PRO',
    },
    {
      id: 'safetyculture',
      label: 'SafetyCulture Catalog',
      icon: <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" />,
      badge: 'SYNC',
    },
    {
      id: 'analytics',
      label: 'Student Analytics',
      icon: <BarChart2 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Portal Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-full md:w-80 bg-[#E2E8F0] text-[#0F172A] border-r border-[#CBD5E1] flex flex-col justify-between flex-shrink-0">
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-2xl flex items-center space-x-3 shadow-sm">
          <img
            src={avatarUrl}
            alt={instructorName}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#0EA5E9]/40"
          />
          <div className="overflow-hidden">
            <h3 className="text-xs font-extrabold text-[#0F172A] truncate">{instructorName}</h3>
            <p className="text-[10px] text-[#0EA5E9] font-bold flex items-center truncate">
              <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
              {department}
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
            Instructor Management
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0EA5E9] text-white shadow-md shadow-[#0EA5E9]/20'
                    : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-cyan-50 text-[#0EA5E9] border border-cyan-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-[#CBD5E1]">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition cursor-pointer shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Instructor Session</span>
        </button>
      </div>
    </aside>
  );
};
