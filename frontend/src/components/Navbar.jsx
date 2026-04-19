import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Camera, LayoutDashboard, User,
  Globe, LogOut, Menu, X, LogIn, UserPlus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguage } from '../lib/LanguageContext';

export default function Navbar() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { lang, setLang, t, isRTL } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');

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

  return (
    <nav className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-800 to-blue-600
                            flex items-center justify-center text-white font-bold text-lg
                            shadow-lg shadow-blue-900/40">
              S
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Signova</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {authLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                            transition-all duration-200
                            ${
                              isActive(path)
                                ? 'bg-blue-900/30 text-blue-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                         text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              title={lang === 'en' ? 'Switch to Arabic' : 'التبديل للإنجليزية'}
            >
              <Globe size={18} />
              <span>{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>

            {/* User info + logout */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-400
                                  flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-300 text-sm font-medium max-w-[120px] truncate">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                             text-gray-400 hover:text-red-400 hover:bg-red-900/20
                             border border-transparent hover:border-red-700/40
                             transition-all duration-200"
                  title={t('logout')}
                >
                  <LogOut size={18} />
                  <span className="hidden lg:inline">{t('logout')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5
                       transition-all duration-200"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-700 bg-gray-800 animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1">
            {authLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                            transition-all duration-200
                            ${
                              isActive(path)
                                ? 'bg-blue-900/30 text-blue-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
              <button
                onClick={() => { toggleLang(); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400
                           hover:text-white hover:bg-white/5 transition-all"
              >
                <Globe size={18} />
                <span>{lang === 'en' ? 'Switch to Arabic' : 'التبديل للإنجليزية'}</span>
              </button>

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                             text-red-400 hover:bg-red-900/20 transition-all"
                >
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
