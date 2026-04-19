import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Camera, LayoutDashboard,
  User, Globe, LogOut, Menu, X, LogIn, UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguage } from '../lib/LanguageContext';

export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };
  const toggleLang   = () => setLang(lang === 'en' ? 'ar' : 'en');

  const authLinks = isAuthenticated
    ? [
        { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { path: '/chat',      label: t('chat'),      icon: MessageSquare },
        { path: '/ai-camera', label: t('aiCamera'),  icon: Camera },
        { path: '/profile',   label: t('profile'),   icon: User },
      ]
    : [
        { path: '/login',    label: t('login'),    icon: LogIn },
        { path: '/register', label: t('register'), icon: UserPlus },
      ];

  const isActive = (path) => location.pathname === path;

  /* shared link classes */
  const linkCls = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'text-[#1E3A8A] bg-[rgba(30,58,138,0.15)]'
        : 'text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
    }`;

  return (
    /* sticky navbar */
    <nav className="sticky top-0 z-50 bg-[#1F2937] border-b border-[#374151]">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between
                      px-4 sm:px-8 h-[70px]">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 text-white font-bold text-2xl no-underline">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-xl font-bold
                          bg-gradient-to-br from-[#1E3A8A] to-[#1e40af]
                          shadow-[0_4px_12px_rgba(30,58,138,0.4)]">
            S
          </div>
          <span>Signova</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {authLinks.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={linkCls(path)}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Lang toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
                       text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]
                       transition-all duration-200"
          >
            <Globe size={20} />
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* User + logout */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)]">
                <div className="w-6 h-6 rounded-full flex items-center justify-center
                                text-white text-xs font-bold
                                bg-gradient-to-br from-[#1E3A8A] to-[#1e40af]">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-[#9CA3AF] text-sm font-medium max-w-[120px] truncate">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                           text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]
                           border border-transparent hover:border-[rgba(239,68,68,0.3)]
                           transition-all duration-200"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">{t('logout')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#9CA3AF] hover:text-white
                     hover:bg-[rgba(255,255,255,0.05)] transition-all"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#374151] bg-[#1F2937] animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1">
            {authLinks.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                                transition-all duration-200 ${
                                  isActive(path)
                                    ? 'bg-[rgba(30,58,138,0.15)] text-[#1E3A8A]'
                                    : 'text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                                }`}>
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#374151]">
              <button
                onClick={() => { toggleLang(); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                           text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
              >
                <Globe size={18} />
                <span>{lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}</span>
              </button>
              {isAuthenticated && (
                <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                                   text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-all">
                  <LogOut size={18} />
                  <span>{t('logout')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
