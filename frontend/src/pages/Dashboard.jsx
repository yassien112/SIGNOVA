import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Activity, Settings, BarChart2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';

const STAT_CONFIGS = [
  { key: 'totalChats',    title: 'Total Chats',       icon: MessageSquare, color: '#60A5FA', bg: 'rgba(96,165,250,0.2)' },
  { key: 'totalMessages', title: 'Total Messages',    icon: Activity,      color: '#10B981', bg: 'rgba(16,185,129,0.2)' },
  { key: 'onlineUsers',   title: 'Online Users',      icon: Users,         color: '#F59E0B', bg: 'rgba(245,158,11,0.2)' },
  { key: 'myMessages',    title: 'My Messages',       icon: BarChart2,     color: '#8B5CF6', bg: 'rgba(139,92,246,0.2)' },
];

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const loadStats = () => {
    setLoading(true);
    setError('');
    api.get('/api/dashboard/stats')
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.role === 'Admin';
  const totals  = stats?.totals ?? {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {user.name}!</h2>
          <p>Here is what&apos;s happening in your account today.</p>
        </div>
        <div className="header-right">
          <button className="btn-refresh" onClick={loadStats} disabled={loading} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <div className="user-role-badge">
            <Settings size={16} /> {user.role} Dashboard
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        {STAT_CONFIGS.map((cfg) => (
          <div className="stat-card" key={cfg.key}>
            <div className="stat-icon" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
              <cfg.icon size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-title">{cfg.title}</p>
              <h3 className="stat-value">
                {loading ? '—' : (totals[cfg.key] ?? 0).toLocaleString()}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className={`dashboard-content ${isAdmin ? 'two-col' : 'one-col'}`}>
        <div className="activity-feed">
          <div className="panel-header">
            <h3>Recent Messages</h3>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : stats?.latestMessages?.length ? (
            <div className="activity-list">
              {stats.latestMessages.map((msg) => (
                <div className="activity-item" key={msg.id}>
                  <div className="activity-dot blue" />
                  <div className="activity-text">
                    <p>
                      <strong>{msg.sender?.name || 'User'}</strong>{' '}
                      {msg.kind === 'sign' ? '🤟 sent a sign message' : `said: "${msg.text.slice(0, 60)}${msg.text.length > 60 ? '…' : ''}"`}
                    </p>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No messages yet.</p>
          )}
        </div>

        {isAdmin && (
          <div className="admin-panel">
            <div className="panel-header">
              <h3>Recent Chats</h3>
            </div>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : stats?.latestChats?.length ? (
              <div className="table-responsive">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Chat</th>
                      <th>Type</th>
                      <th>Participants</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.latestChats.map((chat) => (
                      <tr key={chat.id}>
                        <td>{chat.title || (chat.isGlobal ? 'Global Chat' : 'Private Chat')}</td>
                        <td>
                          <span className={`badge ${chat.isGlobal ? 'admin' : 'user'}`}>
                            {chat.isGlobal ? 'Global' : chat.isGroup ? 'Group' : 'Private'}
                          </span>
                        </td>
                        <td>{chat.participants?.length ?? 0}</td>
                        <td>{formatTime(chat.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No chats yet.</p>
            )}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .dashboard-container { display: flex; flex-direction: column; gap: 2rem; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .dashboard-header h2 { font-size: 2rem; color: white; margin-bottom: 0.5rem; }
        .dashboard-header p { color: var(--text-secondary); }
        .header-right { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .user-role-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; background: rgba(30,58,138,0.2); color: #60A5FA; border: 1px solid rgba(30,58,138,0.5); font-weight: 500; font-size: 0.9rem; }
        .btn-refresh { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; transition: 0.2s; }
        .btn-refresh:hover:not(:disabled) { color: white; border-color: rgba(255,255,255,0.3); }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #FCA5A5; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
        .stat-card { background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 16px; display: flex; align-items: center; gap: 1.5rem; transition: 0.3s; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-title { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; margin-bottom: 0.25rem; }
        .stat-value { font-size: 1.5rem; color: white; font-weight: 700; }
        .dashboard-content { display: grid; gap: 1.5rem; }
        .dashboard-content.two-col { grid-template-columns: 1fr 2fr; }
        .dashboard-content.one-col { grid-template-columns: 1fr; }
        .activity-feed, .admin-panel { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
        .panel-header h3 { color: white; font-size: 1.1rem; }
        .activity-list { display: flex; flex-direction: column; gap: 1rem; }
        .activity-item { display: flex; gap: 1rem; align-items: flex-start; }
        .activity-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .activity-dot.blue { background: #3B82F6; }
        .activity-text p { color: var(--text-primary); font-size: 0.9rem; line-height: 1.4; margin-bottom: 0.2rem; }
        .activity-text span { color: var(--text-secondary); font-size: 0.78rem; }
        .muted { color: var(--text-secondary); font-size: 0.9rem; }
        .table-responsive { overflow-x: auto; }
        .user-table { width: 100%; border-collapse: collapse; }
        .user-table th, .user-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
        .user-table th { color: var(--text-secondary); font-weight: 500; font-size: 0.85rem; }
        .user-table td { color: var(--text-primary); font-size: 0.9rem; }
        .badge { padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.78rem; font-weight: 500; }
        .badge.admin { background: rgba(139,92,246,0.2); color: #C4B5FD; border: 1px solid rgba(139,92,246,0.4); }
        .badge.user { background: rgba(59,130,246,0.2); color: #93C5FD; border: 1px solid rgba(59,130,246,0.4); }
        @media(max-width: 900px) { .dashboard-content.two-col { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
