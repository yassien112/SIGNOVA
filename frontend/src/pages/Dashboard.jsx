import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, MessageSquare, Activity, RefreshCw, Camera, ArrowRight,
  ShieldCheck, Zap, Clock, UserCheck, Globe, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Navigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import '../styles/Dashboard.css';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = () => {
    setLoading(true);
    setError('');
    api.get('/api/dashboard/stats')
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'Admin') return <Navigate to="/" replace />;

  const totals = stats?.totals ?? {};
  const latestMessages = stats?.latestMessages ?? [];
  const latestChats = stats?.latestChats ?? [];

  const adminStats = useMemo(() => ([
    { key: 'totalUsers', label: 'Total Users', value: totals.totalUsers ?? totals.users ?? 0, icon: Users, color: 'blue', trend: 'users' },
    { key: 'onlineUsers', label: 'Online Users', value: totals.onlineUsers ?? 0, icon: UserCheck, color: 'green', trend: 'live' },
    { key: 'totalChats', label: 'Total Chats', value: totals.totalChats ?? 0, icon: MessageSquare, color: 'purple', trend: '+active' },
    { key: 'totalMessages', label: 'Total Messages', value: totals.totalMessages ?? 0, icon: Activity, color: 'amber', trend: 'traffic' },
  ]), [totals]);

  const insights = [
    {
      title: 'Community health',
      value: `${latestChats.length} recent chats`,
      sub: 'Latest conversation activity across the platform',
      icon: Globe,
      tone: 'blue',
    },
    {
      title: 'Realtime engagement',
      value: `${latestMessages.length} fresh messages`,
      sub: 'Recent messages streamed from active rooms',
      icon: Sparkles,
      tone: 'purple',
    },
    {
      title: 'System role',
      value: 'Admin access enabled',
      sub: 'You can review users, activity, and platform status',
      icon: ShieldCheck,
      tone: 'green',
    },
  ];

  return (
    <div className="dashboard-wrapper admin-dashboard">
      <div className="dashboard-header">
        <div>
          <p className="dash-greeting">Good {getTimeOfDay()} 👋</p>
          <h1 className="dash-title">Admin Control Center</h1>
          <p className="dash-sub">Welcome back, {user?.name}. Here is your platform overview and latest activity.</p>
        </div>
        <div className="dashboard-header-actions">
          <button onClick={loadStats} disabled={loading} className="btn-secondary">
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            {t('refresh')}
          </button>
          <span className="dash-admin-badge">
            <Zap size={12} /> Admin Only
          </span>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="stats-grid">
        {adminStats.map((cfg) => (
          <div key={cfg.key} className="stat-card">
            <div className={`stat-icon ${cfg.color}`}>
              <cfg.icon size={20} />
            </div>
            <div className="stat-body">
              <p className="stat-label">{cfg.label}</p>
              {loading ? <div className="stat-skeleton" /> : <p className="stat-value">{Number(cfg.value ?? 0).toLocaleString()}</p>}
            </div>
            <span className="stat-trend">{cfg.trend}</span>
          </div>
        ))}
      </div>

      <div className="dash-section">
        <h2 className="dash-section-title">Admin Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/chat" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#1d4ed822', color: '#60a5fa' }}><MessageSquare size={22} /></div>
            <div>
              <p className="quick-action-label">Review conversations</p>
              <p className="quick-action-sub">Open the live chat experience and inspect activity</p>
            </div>
            <ArrowRight size={16} className="quick-arrow" />
          </Link>

          <Link to="/ai-camera" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#7c3aed22', color: '#a78bfa' }}><Camera size={22} /></div>
            <div>
              <p className="quick-action-label">AI camera tools</p>
              <p className="quick-action-sub">Test sign translation and camera workflows</p>
            </div>
            <ArrowRight size={16} className="quick-arrow" />
          </Link>

          <Link to="/profile" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#05966922', color: '#34d399' }}><ShieldCheck size={22} /></div>
            <div>
              <p className="quick-action-label">Manage admin profile</p>
              <p className="quick-action-sub">Review your own account settings and identity details</p>
            </div>
            <ArrowRight size={16} className="quick-arrow" />
          </Link>
        </div>
      </div>

      <div className="insights-grid">
        {insights.map((item) => (
          <div key={item.title} className={`insight-card ${item.tone}`}>
            <div className="insight-icon"><item.icon size={18} /></div>
            <div>
              <p className="insight-title">{item.title}</p>
              <p className="insight-value">{item.value}</p>
              <p className="insight-sub">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid admin">
        <div className="dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Clock size={15} style={{ color: '#6b7280' }} />
              {t('recentMessages')}
            </h3>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="activity-skeleton" />)}
            </div>
          ) : latestMessages.length ? (
            <div className="activity-feed">
              {latestMessages.map((msg) => (
                <div key={msg.id} className="activity-item">
                  <div className="activity-avatar">{(msg.sender?.name || 'U').charAt(0).toUpperCase()}</div>
                  <div className="activity-body">
                    <p className="activity-text">
                      <strong>{msg.sender?.name || 'User'}</strong>{' '}
                      {msg.kind === 'sign'
                        ? <span className="activity-sign-badge">🤟 sign</span>
                        : `“${msg.text?.slice(0, 70) || 'Message'}”`}
                    </p>
                    <span className="activity-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">{t('noMessagesYet')}</p>
          )}
        </div>

        <div className="dash-panel panel-scroll">
          <div className="panel-header">
            <h3 className="panel-title">
              <MessageSquare size={15} style={{ color: '#6b7280' }} />
              {t('recentChats')}
            </h3>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
              {[1, 2, 3].map((i) => <div key={i} className="activity-skeleton" />)}
            </div>
          ) : latestChats.length ? (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Chat</th>
                  <th>Type</th>
                  <th>Users</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {latestChats.map((chat) => (
                  <tr key={chat.id}>
                    <td>{chat.title || (chat.isGlobal ? 'Global Chat' : chat.isGroup ? 'Group Chat' : 'Private Chat')}</td>
                    <td>
                      <span className={chat.isGlobal ? 'badge-purple' : chat.isGroup ? 'badge-green' : 'badge-blue'}>
                        {chat.isGlobal ? t('global') : chat.isGroup ? t('group') : t('private')}
                      </span>
                    </td>
                    <td>{chat.participants?.length ?? 0}</td>
                    <td>{formatTime(chat.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-note">{t('noChatsYet')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
