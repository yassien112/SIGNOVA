import React, { useEffect, useState } from 'react';
import {
  Users, MessageSquare, Activity, BarChart2,
  RefreshCw, Camera, ArrowRight, Hand, Zap, Clock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Navigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import '../styles/Dashboard.css';

const STAT_CONFIGS = [
  { key: 'totalChats',    tk: 'totalChats',    icon: MessageSquare, color: 'blue',   trend: '+12%' },
  { key: 'totalMessages', tk: 'totalMessages', icon: Activity,      color: 'green',  trend: '+8%'  },
  { key: 'onlineUsers',   tk: 'onlineUsers',   icon: Users,         color: 'amber',  trend: 'live' },
  { key: 'myMessages',    tk: 'myMessages',    icon: BarChart2,     color: 'purple', trend: 'you'  },
];

const QUICK_ACTIONS = [
  { label: 'Open Chat',        sub: 'Send a message',         icon: MessageSquare, to: '/chat',      color: '#1d4ed8' },
  { label: 'AI Camera',        sub: 'Translate sign language', icon: Camera,        to: '/ai-camera', color: '#7c3aed' },
  { label: 'Sign Translator',  sub: 'Text to sign language',  icon: Hand,          to: '/chat',      color: '#059669' },
];

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000)  return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useLanguage();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const loadStats = () => {
    setLoading(true); setError('');
    api.get('/api/dashboard/stats')
      .then(setStats).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { loadStats(); }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.role === 'Admin';
  const totals  = stats?.totals ?? {};

  return (
    <div className="dashboard-wrapper">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <p className="dash-greeting">Good {getTimeOfDay()} 👋</p>
          <h1 className="dash-title">{user.name}</h1>
          <p className="dash-sub">Here&apos;s what&apos;s happening in your account today.</p>
        </div>
        <div className="dashboard-header-actions">
          <button onClick={loadStats} disabled={loading} className="btn-secondary">
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            {t('refresh')}
          </button>
          {isAdmin && (
            <span className="dash-admin-badge">
              <Zap size={12} /> Admin
            </span>
          )}
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CONFIGS.map((cfg) => (
          <div key={cfg.key} className="stat-card">
            <div className={`stat-icon ${cfg.color}`}>
              <cfg.icon size={20} />
            </div>
            <div className="stat-body">
              <p className="stat-label">{t(cfg.tk)}</p>
              {loading
                ? <div className="stat-skeleton" />
                : <p className="stat-value">{(totals[cfg.key] ?? 0).toLocaleString()}</p>}
            </div>
            <span className="stat-trend">{cfg.trend}</span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="dash-section">
        <h2 className="dash-section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map((qa) => (
            <Link key={qa.label} to={qa.to} className="quick-action-card">
              <div className="quick-action-icon" style={{ background: qa.color + '22', color: qa.color }}>
                <qa.icon size={22} />
              </div>
              <div>
                <p className="quick-action-label">{qa.label}</p>
                <p className="quick-action-sub">{qa.sub}</p>
              </div>
              <ArrowRight size={16} style={{ color: '#374151', marginLeft: 'auto', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Activity + table */}
      <div className={`content-grid${isAdmin ? ' admin' : ''}`}>

        {/* Recent Messages */}
        <div className="dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Clock size={15} style={{ color: '#6b7280' }} />
              {t('recentMessages')}
            </h3>
          </div>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                {[1,2,3].map((i) => <div key={i} className="activity-skeleton" />)}
              </div>
            : stats?.latestMessages?.length
              ? <div className="activity-feed">
                  {stats.latestMessages.map((msg) => (
                    <div key={msg.id} className="activity-item">
                      <div className="activity-avatar">
                        {(msg.sender?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="activity-body">
                        <p className="activity-text">
                          <strong>{msg.sender?.name || 'User'}</strong>{' '}
                          {msg.kind === 'sign' ? <span className="activity-sign-badge">🤟 sign</span> : `“${msg.text?.slice(0,50)}”`}
                        </p>
                        <span className="activity-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              : <p style={{ color: '#4b5563', fontSize: '.875rem' }}>{t('noMessagesYet')}</p>}
        </div>

        {/* Admin table */}
        {isAdmin && (
          <div className="dash-panel" style={{ overflowX: 'auto' }}>
            <div className="panel-header">
              <h3 className="panel-title">
                <MessageSquare size={15} style={{ color: '#6b7280' }} />
                {t('recentChats')}
              </h3>
            </div>
            {loading
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                  {[1,2].map((i) => <div key={i} className="activity-skeleton" />)}
                </div>
              : stats?.latestChats?.length
                ? <table className="dashboard-table">
                    <thead><tr>
                      <th>Chat</th><th>Type</th><th>Users</th><th>Updated</th>
                    </tr></thead>
                    <tbody>
                      {stats.latestChats.map((chat) => (
                        <tr key={chat.id}>
                          <td>{chat.title || (chat.isGlobal ? 'Global Chat' : 'Private Chat')}</td>
                          <td><span className={chat.isGlobal ? 'badge-purple' : 'badge-blue'}>
                            {chat.isGlobal ? t('global') : chat.isGroup ? t('group') : t('private')}
                          </span></td>
                          <td style={{ color: '#9ca3af' }}>{chat.participants?.length ?? 0}</td>
                          <td style={{ color: '#6b7280', fontSize: '.75rem' }}>{formatTime(chat.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                : <p style={{ color: '#4b5563', fontSize: '.875rem' }}>{t('noChatsYet')}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
