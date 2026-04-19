import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Activity, BarChart2, RefreshCw, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import '../styles/Dashboard.css';

const STAT_CONFIGS = [
  { key: 'totalChats',    tk: 'totalChats',    icon: MessageSquare, color: 'blue'   },
  { key: 'totalMessages', tk: 'totalMessages', icon: Activity,      color: 'green'  },
  { key: 'onlineUsers',   tk: 'onlineUsers',   icon: Users,         color: 'amber'  },
  { key: 'myMessages',    tk: 'myMessages',    icon: BarChart2,     color: 'purple' },
];

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
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
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">{t('welcomeBack')}, {user.name}!</h1>
          <p className="page-subtitle">Here is what&apos;s happening in your account today.</p>
        </div>
        <div className="dashboard-header-actions">
          <button onClick={loadStats} disabled={loading} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {t('refresh')}
          </button>
          <span className="badge-blue"><Settings size={13} /> {user.role}</span>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="stats-grid">
        {STAT_CONFIGS.map((cfg) => (
          <div key={cfg.key} className="stat-card">
            <div className={`stat-icon ${cfg.color}`}>
              <cfg.icon size={22} />
            </div>
            <div>
              <p className="stat-label">{t(cfg.tk)}</p>
              <p className="stat-value">{loading ? '—' : (totals[cfg.key] ?? 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={`content-grid${isAdmin ? ' admin' : ''}`}>
        <div className="card">
          <div className="panel-header"><h3 className="panel-title">{t('recentMessages')}</h3></div>
          {loading ? <p style={{color:'#6b7280',fontSize:'.875rem'}}>{t('loading')}</p>
          : stats?.latestMessages?.length
            ? <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                {stats.latestMessages.map((msg) => (
                  <div key={msg.id} style={{display:'flex',alignItems:'flex-start',gap:'.75rem'}}>
                    <span className="msg-dot" />
                    <div>
                      <p style={{color:'#e5e7eb',fontSize:'.875rem'}}>
                        <strong>{msg.sender?.name || 'User'}</strong>{' '}
                        {msg.kind === 'sign' ? 'sent a sign message' : `"${msg.text?.slice(0,60)}"`}
                      </p>
                      <span style={{color:'#6b7280',fontSize:'.75rem'}}>{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            : <p style={{color:'#6b7280',fontSize:'.875rem'}}>{t('noMessagesYet')}</p>}
        </div>

        {isAdmin && (
          <div className="card" style={{overflowX:'auto'}}>
            <div className="panel-header"><h3 className="panel-title">{t('recentChats')}</h3></div>
            {loading ? <p style={{color:'#6b7280',fontSize:'.875rem'}}>{t('loading')}</p>
            : stats?.latestChats?.length
              ? <table className="dashboard-table">
                  <thead><tr>
                    <th>Chat</th><th>Type</th><th>Participants</th><th>Updated</th>
                  </tr></thead>
                  <tbody>
                    {stats.latestChats.map((chat) => (
                      <tr key={chat.id}>
                        <td>{chat.title || (chat.isGlobal ? 'Global Chat' : 'Private Chat')}</td>
                        <td><span className={chat.isGlobal ? 'badge-purple' : 'badge-blue'}>
                          {chat.isGlobal ? t('global') : chat.isGroup ? t('group') : t('private')}
                        </span></td>
                        <td style={{color:'#9ca3af'}}>{chat.participants?.length ?? 0}</td>
                        <td style={{color:'#6b7280',fontSize:'.75rem'}}>{formatTime(chat.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              : <p style={{color:'#6b7280',fontSize:'.875rem'}}>{t('noChatsYet')}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
