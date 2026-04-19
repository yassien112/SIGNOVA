import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Hand, MessageSquare, User, Home, Camera, LogOut } from 'lucide-react';
import { useAuthStore }  from '../store/authStore';
import NotificationBell from './NotificationBell';
import '../styles/Navbar.css';

const NAV_LINKS = [
  { to: '/',          icon: Home,          label: 'Home' },
  { to: '/chat',      icon: MessageSquare, label: 'Chat',       auth: true },
  { to: '/ai-camera', icon: Camera,        label: 'AI Camera',  auth: true },
  { to: '/dashboard', icon: Hand,          label: 'Dashboard',  auth: true },
  { to: '/profile',   icon: User,          label: 'Profile',    auth: true },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand">
        <Hand size={22} className="navbar-brand-icon" />
        <span>SIGNOVA</span>
      </Link>

      {/* Links */}
      <div className="navbar-links">
        {NAV_LINKS.filter((l) => !l.auth || isAuthenticated).map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`navbar-link${pathname === to ? ' active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="navbar-right">
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
            <Link to="/login"    className="btn-ghost navbar-auth-btn">Login</Link>
            <Link to="/register" className="btn-primary navbar-auth-btn">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
