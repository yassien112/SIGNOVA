import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

function getChatLabel(chat, myId) {
  if (chat.isGlobal) return 'Global Community';
  if (chat.title) return chat.title;
  const other = chat.participants?.find((p) => p.id !== myId);
  return other?.name || 'Private Chat';
}

function getOtherParticipant(chat, myId) {
  return chat.participants?.find((p) => p.id !== myId) ?? null;
}

export default function ChatSidebar({ chats, activeChat, onSelect, onNewChat, loadingChats, myId }) {
  const { t } = useLanguage();
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [email,    setEmail]    = useState('');
  const [error,    setError]    = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = chats.filter((c) =>
    getChatLabel(c, myId).toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(''); setCreating(true);
    try { await onNewChat(email.trim()); setEmail(''); setShowForm(false); }
    catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <div className="chat-sidebar-top">
          <h3 className="chat-sidebar-title">{t('chats')}</h3>
          <button className="chat-add-btn"
            onClick={() => { setShowForm((v) => !v); setError(''); }}
            title={t('startPrivateChat')}>
            {showForm ? <X size={17} /> : <Plus size={17} />}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="chat-new-form">
            <input type="email" className="field" style={{fontSize:'.875rem'}}
              placeholder={t('enterEmail')} value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }} autoFocus />
            <button type="submit" disabled={creating} className="btn-primary"
              style={{fontSize:'.75rem',padding:'.375rem .75rem'}}>
              {creating ? t('loading') : t('start')}
            </button>
            {error && <p style={{color:'#f87171',fontSize:'.75rem'}}>{error}</p>}
          </form>
        )}

        <div className="chat-search">
          <Search size={14} style={{color:'#6b7280',flexShrink:0}} />
          <input type="text" placeholder={t('searchChats')} value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="chat-list">
        {loadingChats ? (
          <p style={{color:'#6b7280',fontSize:'.875rem',padding:'1rem'}}>{t('loading')}</p>
        ) : filtered.length === 0 ? (
          <p style={{color:'#6b7280',fontSize:'.875rem',padding:'1rem'}}>{t('noChats')}</p>
        ) : (
          filtered.map((chat) => {
            const label   = getChatLabel(chat, myId);
            const other   = getOtherParticipant(chat, myId);
            const isOnline = chat.isGlobal ? true : (other?.isOnline ?? false);
            const lastMsg = chat.messages?.[0];
            const isActive = activeChat?.id === chat.id;

            return (
              <button key={chat.id} onClick={() => onSelect(chat)}
                className={`chat-item${isActive ? ' active' : ''}`}>
                <div className="chat-item-avatar">
                  <div className="chat-avatar">{label.charAt(0).toUpperCase()}</div>
                  {/* online dot — only green when actually online */}
                  <span
                    className={`status-dot${isOnline ? ' online' : ' offline'}`}
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: '50%',
                      border: '2px solid var(--bg-card, #1e1e2e)',
                      background: isOnline ? '#22c55e' : '#6b7280'
                    }}
                  />
                </div>
                <div className="chat-item-info">
                  <p className="chat-item-name">{label}</p>
                  <p className="chat-item-last">
                    {lastMsg
                      ? (lastMsg.kind === 'sign' ? `[${t('signMessage')}]` : lastMsg.text)
                      : t('noMessages')}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
