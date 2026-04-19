import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, User, Check } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { api } from '../../lib/api';

function getChatLabel(chat, myId) {
  if (chat.isGlobal) return 'Global Community';
  if (chat.title) return chat.title;
  const other = chat.participants?.find((p) => p.id !== myId);
  return other?.name || 'Private Chat';
}

function getOtherParticipant(chat, myId) {
  return chat.participants?.find((p) => p.id !== myId) ?? null;
}

function UserAvatar({ name, size = 40 }) {
  const colors = ['#1d4ed8','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];
  const color = colors[name?.charCodeAt(0) % colors.length] ?? colors[0];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}cc, ${color})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.35,
      flexShrink: 0
    }}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function ChatSidebar({ chats, activeChat, onSelect, onNewChat, loadingChats, myId }) {
  const { t } = useLanguage();
  const [search,      setSearch]      = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [userQuery,   setUserQuery]   = useState('');
  const [userList,    setUserList]    = useState([]);
  const [loadingUsers,setLoadingUsers]= useState(false);
  const [creating,    setCreating]    = useState(false);
  const [createErr,   setCreateErr]   = useState('');
  const [selectedUser,setSelectedUser]= useState(null);
  const panelRef = useRef(null);
  const searchTimer = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    if (!showNew) return;
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNew(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showNew]);

  // Search users with debounce
  useEffect(() => {
    if (!showNew) return;
    clearTimeout(searchTimer.current);
    setLoadingUsers(true);
    searchTimer.current = setTimeout(() => {
      api.get(`/api/users${userQuery ? `?q=${encodeURIComponent(userQuery)}` : ''}`)
        .then((d) => setUserList(d.users ?? []))
        .catch(() => setUserList([]))
        .finally(() => setLoadingUsers(false));
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [userQuery, showNew]);

  const handleOpenNew = () => {
    setShowNew((v) => !v);
    setSelectedUser(null);
    setUserQuery('');
    setCreateErr('');
  };

  const handleSelectUser = (u) => setSelectedUser(u);

  const handleStartChat = async () => {
    if (!selectedUser) return;
    setCreating(true); setCreateErr('');
    try {
      await onNewChat(selectedUser.email);
      setShowNew(false);
      setSelectedUser(null);
      setUserQuery('');
    } catch (err) {
      setCreateErr(err.message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = chats.filter((c) =>
    getChatLabel(c, myId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="chat-sidebar">
      {/* Header */}
      <div className="chat-sidebar-header">
        <div className="chat-sidebar-top">
          <h3 className="chat-sidebar-title">{t('chats')}</h3>
          <button
            className={`chat-add-btn${showNew ? ' active' : ''}`}
            onClick={handleOpenNew}
            title={t('startPrivateChat')}
          >
            {showNew ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {/* New Chat Panel */}
        {showNew && (
          <div className="new-chat-panel" ref={panelRef}>
            <p className="new-chat-panel-title">Start a new conversation</p>

            {/* Search input */}
            <div className="new-chat-search">
              <Search size={13} style={{ color: '#6b7280', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userQuery}
                onChange={(e) => { setUserQuery(e.target.value); setSelectedUser(null); }}
                autoFocus
              />
              {userQuery && (
                <button onClick={() => { setUserQuery(''); setSelectedUser(null); }}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Selected user chip */}
            {selectedUser && (
              <div className="new-chat-selected">
                <UserAvatar name={selectedUser.name} size={22} />
                <span>{selectedUser.name}</span>
                <button onClick={() => setSelectedUser(null)}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginLeft: 'auto', display: 'flex' }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* User list */}
            <div className="new-chat-user-list">
              {loadingUsers ? (
                <p className="new-chat-hint">Searching...</p>
              ) : userList.length === 0 ? (
                <p className="new-chat-hint">No users found</p>
              ) : (
                userList.map((u) => (
                  <button
                    key={u.id}
                    className={`new-chat-user-item${selectedUser?.id === u.id ? ' selected' : ''}`}
                    onClick={() => handleSelectUser(u)}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <UserAvatar name={u.name} size={32} />
                      <span style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 9, height: 9, borderRadius: '50%',
                        border: '2px solid #1a2233',
                        background: u.isOnline ? '#22c55e' : '#4b5563'
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <p style={{ color: 'white', fontSize: '.8rem', fontWeight: 600,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: '.7rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.email}
                      </p>
                    </div>
                    {selectedUser?.id === u.id && (
                      <Check size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                    )}
                  </button>
                ))
              )}
            </div>

            {createErr && <p className="new-chat-err">{createErr}</p>}

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '.8rem', padding: '.5rem' }}
              disabled={!selectedUser || creating}
              onClick={handleStartChat}
            >
              {creating ? 'Starting...' : selectedUser ? `Chat with ${selectedUser.name}` : 'Select a user'}
            </button>
          </div>
        )}

        {/* Search chats */}
        <div className="chat-search">
          <Search size={13} style={{ color: '#6b7280', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={t('searchChats')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="chat-list">
        {loadingChats ? (
          <div className="chat-list-loading">
            {[1,2,3].map((i) => <div key={i} className="chat-skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="chat-list-empty">
            <User size={28} style={{ opacity: .3 }} />
            <p>{search ? 'No results' : t('noChats')}</p>
          </div>
        ) : (
          filtered.map((chat) => {
            const label   = getChatLabel(chat, myId);
            const other   = getOtherParticipant(chat, myId);
            const isOnline = chat.isGlobal ? true : (other?.isOnline ?? false);
            const lastMsg  = chat.messages?.[0];
            const isActive = activeChat?.id === chat.id;
            const unread   = 0; // placeholder for future unread count

            return (
              <button
                key={chat.id}
                onClick={() => onSelect(chat)}
                className={`chat-item${isActive ? ' active' : ''}`}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar name={label} size={40} />
                  <span style={{
                    position: 'absolute', bottom: 1, right: 1,
                    width: 10, height: 10, borderRadius: '50%',
                    border: '2px solid #111827',
                    background: isOnline ? '#22c55e' : '#4b5563'
                  }} />
                </div>
                <div className="chat-item-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="chat-item-name">{label}</p>
                    {lastMsg && (
                      <span style={{ fontSize: '.65rem', color: '#4b5563', flexShrink: 0 }}>
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="chat-item-last">
                    {lastMsg
                      ? (lastMsg.kind === 'sign' ? '🤟 Sign message' : lastMsg.text)
                      : <span style={{ fontStyle: 'italic' }}>No messages yet</span>}
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
