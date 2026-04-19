import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Activity, BarChart2, RefreshCw, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

const STAT_CONFIGS = [
  { key: 'totalChats',    tk: 'totalChats',    icon: MessageSquare, color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  { key: 'totalMessages', tk: 'totalMessages', icon: Activity,      color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { key: 'onlineUsers',   tk: 'onlineUsers',   icon: Users,         color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  { key: 'myMessages',    tk: 'myMessages',    icon: BarChart2,     color: 'text-purple-400',  bg: 'bg-purple-400/10' },
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
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.role === 'Admin';
  const totals  = stats?.totals ?? {};

  return (
    <div className="page-wrapper flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('welcomeBack')}, {user.name}!</h1>
          <p className="page-subtitle">Here is what&apos;s happening in your account today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="btn-secondary gap-2"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
          <span className="badge-blue gap-1.5">
            <Settings size={13} /> {user.role}
          </span>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CONFIGS.map((cfg) => (
          <div key={cfg.key}
               className="card flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
              <cfg.icon size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">{t(cfg.tk)}</p>
              <p className="text-white text-2xl font-bold">
                {loading ? '—' : (totals[cfg.key] ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className={`grid gap-4 ${isAdmin ? 'lg:grid-cols-[1fr_2fr]' : 'grid-cols-1'}`}>
        {/* Recent messages */}
        <div className="card">
          <div className="panel-header">
            <h3 className="panel-title">{t('recentMessages')}</h3>
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm">{t('loading')}</p>
          ) : stats?.latestMessages?.length ? (
            <div className="flex flex-col gap-3">
              {stats.latestMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-200 text-sm">
                      <span className="font-semibold">{msg.sender?.name || 'User'}</span>{' '}
                      {msg.kind === 'sign' ? 'sent a sign message' : `“${msg.text?.slice(0, 60)}”`}
                    </p>
                    <span className="text-gray-500 text-xs">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{t('noMessagesYet')}</p>
          )}
        </div>

        {/* Admin: Recent chats table */}
        {isAdmin && (
          <div className="card overflow-auto">
            <div className="panel-header">
              <h3 className="panel-title">{t('recentChats')}</h3>
            </div>
            {loading ? (
              <p className="text-gray-500 text-sm">{t('loading')}</p>
            ) : stats?.latestChats?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-700">
                    <th className="text-start pb-2 font-medium">Chat</th>
                    <th className="text-start pb-2 font-medium">Type</th>
                    <th className="text-start pb-2 font-medium">Participants</th>
                    <th className="text-start pb-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.latestChats.map((chat) => (
                    <tr key={chat.id} className="border-b border-gray-700/50 hover:bg-white/[0.02]">
                      <td className="py-2.5 text-gray-200">
                        {chat.title || (chat.isGlobal ? 'Global Chat' : 'Private Chat')}
                      </td>
                      <td className="py-2.5">
                        <span className={chat.isGlobal ? 'badge-purple' : 'badge-blue'}>
                          {chat.isGlobal ? t('global') : chat.isGroup ? t('group') : t('private')}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-400">{chat.participants?.length ?? 0}</td>
                      <td className="py-2.5 text-gray-500 text-xs">{formatTime(chat.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-sm">{t('noChatsYet')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
