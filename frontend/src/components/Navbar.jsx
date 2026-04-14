import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Camera, LayoutDashboard, User, Globe, LogOut } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [lang, setLang] = useState('en');

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    document.body.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/ai-camera', label: 'AI Camera', icon: Camera },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand">
          <div className="logo-icon">S</div>
          <span>Signova</span>
        </Link>
        
        <div className="nav-links">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="nav-actions">
          <button className="lang-btn" onClick={toggleLanguage} title="Switch Language">
            <Globe size={20} />
            <span>{lang.toUpperCase()}</span>
          </button>
          
          <button className="logout-btn" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .navbar {
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 70px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
        }

        .nav-links {
          display: flex;
          gap: 1rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: var(--text-secondary);
          transition: all 0.2s;
          font-weight: 500;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .nav-item.active {
          color: var(--primary);
          background-color: rgba(30, 58, 138, 0.15);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .lang-btn, .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .lang-btn:hover, .logout-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255,255,255,0.05);
        }
        
        .lang-btn span {
          font-weight: 600;
          font-size: 0.9rem;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
