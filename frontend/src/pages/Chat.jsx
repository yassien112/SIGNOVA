import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Image as ImageIcon, Smile, MoreVertical, Search, CheckCheck, Plus, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { VoiceButton } from '../components/VoiceButton';
import { VoiceToSignButton } from '../components/VoiceToSignButton';
import { BACKEND_URL, SOCKET_URL } from '../lib/config';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

const VOICE_MODES = Object.freeze({ TEXT: 'text', SIGN: 'sign' });

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getChatLabel(chat, myId) {
  if (chat.isGlobal) return 'Global Community';
  if (chat.title) return chat.title;
  const other = chat.participants?.find((p) => p.id !== myId);
  return other?.name || 'Private Chat';
}

function getChatInitial(chat, myId) {
  return getChatLabel(chat, myId).charAt(0).toUpperCase();
}

const Chat = () => {
  const { user } = useAuthStore();

  const [chats, setChats]               = useState([]);
  const [activeChat, setActiveChat]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [inputText, setInputText]       = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('ar-EG');
  const [voiceMode, setVoiceMode]       = useState(VOICE_MODES.TEXT);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [showNewChat, setShowNewChat]   = useState(false);
  const [newChatError, setNewChatError] = useState('');
  const [searchQuery, setSearchQuery]   = useState('');

  const socketRef      = useRef(null);
  const inputRef       = useRef(null);
  const messagesEndRef = useRef(null);

  // ── Load chat list ────────────────────────────────────────────────
  const loadChats = useCallback(() => {
    setLoadingChats(true);
    api.get('/api/chat')
      .then((data) => {
        const list = data.chats ?? [];
        setChats(list);
        if (!activeChat && list.length > 0) {
          setActiveChat(list[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingChats(false));
  }, [activeChat]);

  useEffect(() => {
    if (user) loadChats();
  }, [user]);

  // ── Load messages when active chat changes ────────────────────────
  useEffect(() => {
    if (!activeChat) return;
    setLoadingMsgs(true);
    setMessages([]);
    api.get(`/api/chat/${activeChat.id}/messages`)
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeChat?.id]);

  // ── Socket.IO ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', user.id);
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => socket.disconnect();
  }, [user]);

  // ── Join socket room when active chat changes ─────────────────────
  useEffect(() => {
    if (!activeChat || !socketRef.current?.connected) return;
    socketRef.current.emit('join_chat', activeChat.id);
  }, [activeChat?.id, socketRef.current?.connected]);

  // ── Scroll to bottom on new messages ─────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send helpers ──────────────────────────────────────────────────
  const buildBase = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chatId: activeChat?.id,
    senderId: user?.id,
    senderName: user?.name || 'User',
    createdAt: new Date().toISOString()
  });

  const emitMessage = (msg) => {
    if (!socketRef.current?.connected || !activeChat) return false;
    socketRef.current.emit('send_message', msg);
    return true;
  };

  const sendText = (text) => {
    const t = text.trim();
    if (!t || !activeChat) return;
    const msg = { ...buildBase(), kind: 'text', text: t, status: 'sent' };
    emitMessage(msg);
    setInputText('');
  };

  const handleVoiceTranscript = (transcript) => {
    setInputText((prev) => prev.trim() ? `${prev.trimEnd()} ${transcript}` : transcript);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleVoiceSign = (payload) => {
    const sourceText = payload.sourceText?.trim() || payload.text?.trim() || '';
    if (!sourceText || !activeChat) return;
    emitMessage({
      ...buildBase(),
      kind: 'sign',
      text: payload.text?.trim() || sourceText,
      sourceText,
      signs: Array.isArray(payload.signs) ? payload.signs : [],
      segments: Array.isArray(payload.segments) ? payload.segments : [],
      matchedWords: Array.isArray(payload.matchedWords) ? payload.matchedWords : [],
      missingWords: Array.isArray(payload.missingWords) ? payload.missingWords : [],
      status: 'sent'
    });
  };

  // ── Create private chat ───────────────────────────────────────────
  const handleNewPrivateChat = async (e) => {
    e.preventDefault();
    setNewChatError('');
    const email = newChatEmail.trim();
    if (!email) return;

    try {
      // Find user by email via search (backend returns user id in auth context)
      // We POST /api/chat/private with participantId — need to resolve email first
      // Simplest approach: attempt create; backend will 404 if not found
      const data = await api.post('/api/chat/private', { participantEmail: email });
      const chat = data.chat;
      setChats((prev) => {
        if (prev.some((c) => c.id === chat.id)) return prev;
        return [chat, ...prev];
      });
      setActiveChat(chat);
      setNewChatEmail('');
      setShowNewChat(false);
    } catch (err) {
      setNewChatError(err.message);
    }
  };

  // ── Filtered chats ────────────────────────────────────────────────
  const filteredChats = chats.filter((c) =>
    getChatLabel(c, user?.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Message renderer ──────────────────────────────────────────────
  const renderBody = (msg, isMine) => {
    if (msg.kind !== 'sign') {
      return (
        <>
          {msg.text}
          <span className="msg-time">
            {formatTime(msg.createdAt)}
            {isMine && <CheckCheck size={13} className="read-status" />}
          </span>
        </>
      );
    }

    const signs        = Array.isArray(msg.signs)        ? msg.signs        : [];
    const segments     = Array.isArray(msg.segments)     ? msg.segments     : [];
    const matchedWords = Array.isArray(msg.matchedWords) ? msg.matchedWords : [];
    const missingWords = Array.isArray(msg.missingWords) ? msg.missingWords : [];

    return (
      <>
        <div className="sign-original-text">{msg.sourceText || msg.text}</div>
        {signs.length > 0 ? (
          <div className="sign-strip">
            {signs.map((src, i) => (
              <div key={i} className="sign-card" style={{ animationDelay: `${i * 90}ms` }}>
                <img src={src} alt={matchedWords[i] || `Sign ${i + 1}`} className="sign-asset" loading="lazy" />
                <span className="sign-caption">{segments[i]?.label || matchedWords[i] || `Sign ${i + 1}`}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="sign-empty-state">No signs found for this phrase yet.</div>
        )}
        {missingWords.length > 0 && (
          <div className="sign-fallback">Skipped: {missingWords.join(', ')}</div>
        )}
        <span className="msg-time">
          {formatTime(msg.createdAt)}
          {isMine && <CheckCheck size={13} className="read-status" />}
        </span>
      </>
    );
  };

  if (!user) {
    return <div className="unauthorized"><h2>Please login to use the Chat.</h2></div>;
  }

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-top">
            <h3>Chats</h3>
            <button className="icon-btn new-chat-btn" title="New private chat" onClick={() => setShowNewChat((v) => !v)}>
              {showNewChat ? <X size={18} /> : <Plus size={18} />}
            </button>
          </div>

          {showNewChat && (
            <form className="new-chat-form" onSubmit={handleNewPrivateChat}>
              <input
                type="email"
                placeholder="Enter user email"
                value={newChatEmail}
                onChange={(e) => { setNewChatEmail(e.target.value); setNewChatError(''); }}
                autoFocus
              />
              <button type="submit" className="btn-start">Start</button>
              {newChatError && <p className="new-chat-error">{newChatError}</p>}
            </form>
          )}

          <div className="search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list">
          {loadingChats ? (
            <p className="sidebar-muted">Loading...</p>
          ) : filteredChats.length === 0 ? (
            <p className="sidebar-muted">No chats yet.</p>
          ) : (
            filteredChats.map((chat) => {
              const lastMsg = chat.messages?.[0];
              const isActive = activeChat?.id === chat.id;
              return (
                <div
                  key={chat.id}
                  className={`chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveChat(chat)}
                >
                  <div className="avatar">
                    {getChatInitial(chat, user.id)}
                    <div className="status-dot" />
                  </div>
                  <div className="chat-info">
                    <h4>{getChatLabel(chat, user.id)}</h4>
                    <p>{lastMsg ? (lastMsg.kind === 'sign' ? '🤟 Sign message' : lastMsg.text) : 'No messages yet'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main ── */}
      <div className="chat-main">
        {!activeChat ? (
          <div className="no-chat-selected">
            <MessageSquarePlaceholder />
            <p>Select a chat to start messaging</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="user-info">
                <div className="avatar">{getChatInitial(activeChat, user.id)}</div>
                <div>
                  <h3>{getChatLabel(activeChat, user.id)}</h3>
                  <span className="status">{activeChat.isGlobal ? 'Global' : 'Private'}</span>
                </div>
              </div>
              <div className="chat-actions">
                <button className="icon-btn"><MoreVertical size={20} /></button>
              </div>
            </div>

            <div className="chat-messages">
              {loadingMsgs ? (
                <p className="muted-center">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="muted-center">No messages yet. Say hello! 👋</p>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${msg.kind === 'sign' ? 'sign-bubble' : ''}`}
                    >
                      {!isMine && <div className="msg-sender">{msg.senderName || msg.sender?.name || 'User'}</div>}
                      <div className={`msg-content ${msg.kind === 'sign' ? 'sign-message-content' : ''}`}>
                        {renderBody(msg, isMine)}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="voice-options-row">
                <div className="voice-tools-group">
                  <label className="voice-setting" htmlFor="voice-lang-select">
                    <span>Language</span>
                    <select id="voice-lang-select" value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)}>
                      <option value="ar-EG">Arabic (EG)</option>
                      <option value="en-US">English (US)</option>
                    </select>
                  </label>
                  <div className="voice-mode-toggle" role="tablist">
                    <button type="button" className={`voice-mode-btn ${voiceMode === VOICE_MODES.TEXT ? 'active' : ''}`} onClick={() => setVoiceMode(VOICE_MODES.TEXT)}>Voice → Text</button>
                    <button type="button" className={`voice-mode-btn ${voiceMode === VOICE_MODES.SIGN ? 'active' : ''}`} onClick={() => setVoiceMode(VOICE_MODES.SIGN)}>Voice → Sign</button>
                  </div>
                </div>
                {voiceMode === VOICE_MODES.TEXT
                  ? <VoiceButton language={voiceLanguage} onTranscript={handleVoiceTranscript} />
                  : <VoiceToSignButton language={voiceLanguage} onSignReady={handleVoiceSign} />}
              </div>

              <div className="composer-row">
                <button type="button" className="icon-btn"><ImageIcon size={22} /></button>
                <form onSubmit={(e) => { e.preventDefault(); sendText(inputText); }} className="message-form">
                  <button type="button" className="icon-btn smile-btn"><Smile size={22} /></button>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoComplete="off"
                  />
                  <button type="submit" className="send-btn" disabled={!inputText.trim()}>
                    <Send size={16} /><span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx="true">{`
        .chat-layout { display: flex; height: calc(100vh - 120px); background: var(--bg-secondary); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .chat-sidebar { width: 300px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; background: var(--bg-main); flex-shrink: 0; }
        .sidebar-header { padding: 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem; }
        .sidebar-top { display: flex; justify-content: space-between; align-items: center; }
        .sidebar-top h3 { font-size: 1.1rem; color: white; }
        .new-chat-btn { color: var(--text-secondary); }
        .new-chat-btn:hover { color: white; }
        .new-chat-form { display: flex; flex-direction: column; gap: 0.5rem; }
        .new-chat-form input { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: white; padding: 0.5rem 0.75rem; font-size: 0.85rem; }
        .btn-start { background: var(--primary); color: white; border-radius: 8px; padding: 0.45rem 0.9rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; }
        .new-chat-error { color: #FCA5A5; font-size: 0.8rem; }
        .search-box { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary); padding: 0.45rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); }
        .search-box input { background: transparent; border: none; color: white; width: 100%; font-size: 0.85rem; }
        .chat-list { flex: 1; overflow-y: auto; }
        .sidebar-muted { color: var(--text-secondary); font-size: 0.85rem; padding: 1rem 1.25rem; }
        .chat-item { display: flex; align-items: center; gap: 0.9rem; padding: 0.9rem 1.25rem; cursor: pointer; transition: 0.2s; border-bottom: 1px solid var(--border-color); }
        .chat-item:hover { background: rgba(255,255,255,0.02); }
        .chat-item.active { background: rgba(30,58,138,0.2); border-left: 3px solid var(--primary); }
        .avatar { width: 44px; height: 44px; background: linear-gradient(135deg, var(--primary), #60a5fa); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold; color: white; position: relative; flex-shrink: 0; }
        .status-dot { position: absolute; bottom: 0; right: 0; width: 11px; height: 11px; background: var(--success); border-radius: 50%; border: 2px solid var(--bg-main); }
        .chat-info h4 { color: white; font-size: 0.95rem; margin-bottom: 0.2rem; }
        .chat-info p { color: var(--text-secondary); font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
        .chat-main { flex: 1; display: flex; flex-direction: column; background: var(--bg-main); min-width: 0; }
        .no-chat-selected { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-secondary); }
        .chat-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); }
        .user-info { display: flex; align-items: center; gap: 1rem; }
        .user-info h3 { color: white; font-size: 1.05rem; }
        .status { font-size: 0.8rem; color: var(--success); }
        .chat-actions { display: flex; gap: 0.5rem; }
        .chat-messages { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.9rem; }
        .muted-center { text-align: center; color: var(--text-secondary); font-size: 0.9rem; margin: auto; }
        .message-bubble { max-width: 65%; display: flex; flex-direction: column; }
        .message-bubble.sign-bubble { max-width: min(84%, 620px); }
        .message-bubble.mine { align-self: flex-end; }
        .message-bubble.theirs { align-self: flex-start; }
        .msg-sender { font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.2rem; margin-left: 0.4rem; }
        .msg-content { padding: 0.7rem 0.95rem; border-radius: 12px; line-height: 1.5; display: flex; flex-direction: column; gap: 0.4rem; }
        .sign-message-content { gap: 0.65rem; }
        .theirs .msg-content { background: var(--bg-secondary); border: 1px solid var(--border-color); border-bottom-left-radius: 4px; }
        .mine .msg-content { background: var(--primary); color: white; border-bottom-right-radius: 4px; }
        .msg-time { font-size: 0.68rem; opacity: 0.7; align-self: flex-end; display: flex; align-items: center; gap: 3px; }
        .read-status { color: #93c5fd; }
        .sign-original-text { font-weight: 600; font-size: 0.9rem; }
        .sign-strip { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.35rem; }
        .sign-card { min-width: 160px; max-width: 160px; display: flex; flex-direction: column; gap: 0.5rem; border-radius: 12px; padding: 0.6rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); animation: signReveal 0.4s ease both; }
        .sign-asset { width: 100%; height: 120px; border-radius: 10px; object-fit: contain; background: rgba(15,23,42,0.3); }
        .sign-caption { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.05em; opacity: 0.9; }
        .sign-empty-state, .sign-fallback { font-size: 0.8rem; opacity: 0.85; }
        .chat-input-area { padding: 1rem 1.25rem; background: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem; }
        .voice-options-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .voice-tools-group { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .voice-setting { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--text-secondary); font-size: 0.82rem; }
        .voice-setting select { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 6px; color: white; padding: 0.3rem 0.55rem; font-size: 0.82rem; }
        .voice-mode-toggle { display: inline-flex; border-radius: 999px; padding: 0.15rem; border: 1px solid var(--border-color); background: rgba(15,23,42,0.5); }
        .voice-mode-btn { border-radius: 999px; padding: 0.3rem 0.7rem; color: var(--text-secondary); font-size: 0.78rem; font-weight: 600; transition: 0.2s; }
        .voice-mode-btn.active { background: rgba(59,130,246,0.22); color: white; }
        .composer-row { display: flex; align-items: center; gap: 0.75rem; }
        .message-form { flex: 1; display: flex; align-items: center; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 24px; padding: 0.4rem 0.5rem 0.4rem 0.6rem; gap: 0.4rem; }
        .message-form input { flex: 1; background: transparent; border: none; color: white; font-size: 0.95rem; min-width: 0; }
        .send-btn { background: var(--primary); color: white; min-height: 38px; padding: 0 0.8rem; border-radius: 999px; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 600; font-size: 0.85rem; transition: 0.2s; flex-shrink: 0; border: none; cursor: pointer; }
        .send-btn:hover:not(:disabled) { background: var(--primary-hover); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .icon-btn { color: var(--text-secondary); transition: 0.2s; padding: 0.4rem; background: none; border: none; cursor: pointer; }
        .icon-btn:hover { color: white; background: rgba(255,255,255,0.05); border-radius: 7px; }
        .unauthorized { color: white; padding: 2rem; }
        @keyframes signReveal { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
};

function MessageSquarePlaceholder() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default Chat;
