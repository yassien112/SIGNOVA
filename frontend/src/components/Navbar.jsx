import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Hand, MessageSquare, User, Home, Camera, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuthStore }  from '../store/authStore';
import NotificationBell from './NotificationBell';
import '../styles/Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';

  const navLinks = useMemo(() => ([
    { to: '/',          icon: Home,            label: 'Home' },
    { to: '/chat',      icon: MessageSquare,   label: 'Chat',      auth: true },
    { to: '/ai-camera', icon: Camera,          label: 'AI Camera', auth: true },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', auth: true, adminOnly: true },
    { to: '/profile',   icon: User,            label: 'Profile',   auth: true },
  ]).filter((l) => {
    if (l.auth && !isAuthenticated) return false;
    if (l.adminOnly && !isAdmin) return false;
    return true;
  }), [isAuthenticated, isAdmin]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={handleNavClick}>
        <Hand size={22} className="navbar-brand-icon" />
        <span>SIGNOVA</span>
      </Link>

      <button
        type="button"
        className="navbar-menu-toggle"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        {navLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={handleNavClick}
            className={`navbar-link${pathname === to ? ' active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className={`navbar-right${menuOpen ? ' open' : ''}`}>
        {isAuthenticated ? (
          <>
            <NotificationBell />
            <span className="navbar-username">{user?.name?.split(' ')[0]}</span>
            <button type="button" className="navbar-logout" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={handleNavClick} className="btn-ghost navbar-auth-btn">Login</Link>
            <Link to="/register" onClick={handleNavClick} className="btn-primary navbar-auth-btn">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
