import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Camera, LayoutDashboard,
  User, Globe, LogOut, Menu, X, LogIn, UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguage } from '../lib/LanguageContext';
import '../styles/Navbar.css';

export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };
  const toggleLang   = () => setLang(lang === 'en' ? 'ar' : 'en');
  const isActive     = (path) => location.pathname === path;

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

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-brand">
          <div className="nav-brand-icon">S</div>
          <span>Signova</span>
        </Link>

        <div className="nav-links">
          {authLinks.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`nav-link${isActive(path) ? ' active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <button className="nav-lang-btn" onClick={toggleLang}>
            <Globe size={18} /><span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
          {isAuthenticated && (
            <>
              <div className="nav-user">
                <div className="nav-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <span className="nav-username">{user?.name}</span>
              </div>
              <button className="nav-logout-btn" onClick={handleLogout}>
                <LogOut size={16} /><span>{t('logout')}</span>
              </button>
            </>
          )}
        </div>

        <button className="nav-hamburger" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`nav-mobile${menuOpen ? ' open' : ''}`}>
        {authLinks.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} onClick={() => setMenuOpen(false)}
                className={`nav-mobile-link${isActive(path) ? ' active' : ''}`}>
            <Icon size={18} /><span>{label}</span>
          </Link>
        ))}
        <div className="nav-mobile-bottom">
          <button className="nav-lang-btn" onClick={() => { toggleLang(); setMenuOpen(false); }}>
            <Globe size={16} />
            <span>{lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}</span>
          </button>
          {isAuthenticated && (
            <button className="nav-logout-btn" onClick={handleLogout}>
              <LogOut size={16} /><span>{t('logout')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
