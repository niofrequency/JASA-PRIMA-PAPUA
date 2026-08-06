import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  UserCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Globe,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenLoginModal: (defaultRole?: UserRole) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeRole,
  onSelectRole,
  onOpenLoginModal,
  onLogout,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return t('nav.superAdmin', 'Super Admin');
      case 'instructor':
        return t('nav.seniorInstructor', 'Senior Instructor');
      case 'student':
        return t('nav.enrolledStudent', 'Enrolled Student');
      default:
        return 'Guest User';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#E2E8F0] border-b border-[#CBD5E1] text-[#0F172A] shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onSelectRole('guest')}
        >
          <img
            src="/img/jpp-logo.png"
            alt="PT. JASA PRIMA PAPUA Logo"
            className="w-11 h-11 object-cover rounded-full shadow-md group-hover:scale-105 transition-transform border border-slate-200"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0F172A] group-hover:text-[#0EA5E9] transition-colors">
                PT. JASA PRIMA PAPUA
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5E9] bg-cyan-50 border border-cyan-200 rounded-full">
                {t('nav.trainingCenter', 'Training Center')}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium hidden sm:block">
              {t('nav.subtitle', 'Lembaga Pelatihan Kerja & Enterprise Development')}
            </p>
          </div>
        </div>

        {/* Center/Right controls container */}
        <div className="flex items-center space-x-3">
          {/* Globe Language Switcher Button (Icon Only) */}
          <button
            id="language-switcher-btn"
            onClick={toggleLanguage}
            title={
              language === 'id'
                ? 'Bahasa Indonesia (ID) — Switch to English'
                : 'English (EN) — Beralih ke Bahasa Indonesia'
            }
            aria-label="Toggle Language"
            className="p-2.5 bg-white hover:bg-slate-50 border border-[#CBD5E1] hover:border-[#0EA5E9] rounded-xl shadow-sm transition-all cursor-pointer group flex items-center justify-center"
          >
            <Globe className="w-5 h-5 text-[#0EA5E9] group-hover:rotate-12 transition-transform" />
          </button>

          {/* Account Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 bg-white border border-[#CBD5E1] hover:border-slate-400 rounded-xl px-3.5 py-2 transition-all cursor-pointer shadow-sm"
                >
                  <img
                    src={
                      currentUser.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                    }
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#0EA5E9]/40"
                  />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-[#0F172A] leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#0EA5E9] capitalize mt-0.5 font-bold flex items-center gap-1">
                      {currentUser.role === 'admin' && (
                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                      )}
                      {getRoleLabel(currentUser.role)}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-[#E2E8F0]">
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-medium">
                        {currentUser.email}
                      </p>
                    </div>

                    {/* Portal Switching Links - Admin Only */}
                    <div className="py-1 space-y-0.5">
                      {currentUser.role === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onSelectRole('admin');
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center space-x-2 cursor-pointer ${
                              activeRole === 'admin'
                                ? 'bg-amber-50 text-amber-900 font-extrabold'
                                : 'text-slate-700 hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            <span>Admin Control Panel</span>
                          </button>

                          <button
                            id="dropdown-switch-portal-btn"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onSelectRole('instructor');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] flex items-center space-x-2 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" />
                            <span>Instructor Portal</span>
                          </button>

                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onSelectRole('student');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] flex items-center space-x-2 cursor-pointer"
                          >
                            <GraduationCap className="w-4 h-4 text-emerald-600" />
                            <span>Student Portal</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="border-t border-[#E2E8F0] pt-1">
                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.signOut', 'Sign Out Account')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => onOpenLoginModal()}
                className="px-4 py-2.5 text-xs font-extrabold text-white bg-[#0EA5E9] hover:bg-[#0284C7] rounded-xl shadow-md shadow-[#0EA5E9]/20 transition-all cursor-pointer flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.loginSignUp', 'Login / Sign Up')}</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-[#0F172A] rounded-xl bg-white border border-[#CBD5E1] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#E2E8F0] border-b border-[#CBD5E1] px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between bg-white border border-[#CBD5E1] p-3 rounded-xl">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0EA5E9]" />
              <span>Language ({language.toUpperCase()})</span>
            </span>
            <button
              id="mobile-language-toggle-btn"
              onClick={toggleLanguage}
              className="p-2 bg-[#0EA5E9] text-white rounded-lg shadow-sm hover:bg-[#0284C7] transition-colors cursor-pointer"
              title="Toggle Language"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {currentUser ? (
            <div className="pt-2 space-y-2">
              <button
                id="mobile-nav-landing-btn"
                onClick={() => {
                  onSelectRole('guest');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-[#CBD5E1]"
              >
                {t('nav.publicSite', 'Public Site')}
              </button>

              {/* Portal Switching Links - Admin Only */}
              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => {
                      onSelectRole('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 flex items-center space-x-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Admin Control Panel</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectRole('instructor');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-[#CBD5E1] flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" />
                    <span>Instructor Portal</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectRole('student');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-[#CBD5E1] flex items-center space-x-2"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Student Portal</span>
                  </button>
                </>
              )}

              <div className="pt-2 border-t border-[#CBD5E1] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-xs font-extrabold text-[#0F172A]">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-600 truncate font-medium">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  id="mobile-logout-btn"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <button
                id="mobile-login-btn"
                onClick={() => {
                  onOpenLoginModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-xs font-extrabold bg-[#0EA5E9] text-white rounded-xl shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.loginSignUp', 'Login / Sign Up')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
