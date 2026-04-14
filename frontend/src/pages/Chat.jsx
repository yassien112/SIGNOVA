import React, { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon, Smile, MoreVertical, Search, CheckCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import { VoiceButton } from '../components/VoiceButton';
import { VoiceToSignButton } from '../components/VoiceToSignButton';
import { BACKEND_URL } from '../lib/config';
import { useAuthStore } from '../store/authStore';

const ACTIVE_CHAT = Object.freeze({ id: 'chat-1', name: 'Global Chat', online: true });
const VOICE_MODES = Object.freeze({
  TEXT: 'text',
  SIGN: 'sign'
});

const Chat = () => {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('ar-EG');
  const [voiceMode, setVoiceMode] = useState(VOICE_MODES.TEXT);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const createBaseMessage = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chatId: ACTIVE_CHAT.id,
    senderId: user?.id || 'anonymous',
    senderName: user?.name || 'User',
    createdAt: new Date().toISOString()
  });

  const appendAndEmitMessage = (message) => {
    if (!socket) {
      return false;
    }

    setMessages((previousMessages) => [...previousMessages, message]);
    socket.emit('send_message', message);
    return true;
  };

  const sendMessageText = (text) => {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return false;
    }

    const sent = appendAndEmitMessage({
      ...createBaseMessage(),
      kind: 'text',
      text: normalizedText,
      status: 'sent'
    });

    if (sent) {
      setInputText('');
    }

    return sent;
  };

  const handleVoiceTranscript = (transcribedText) => {
    setInputText((previousText) =>
      previousText.trim()
        ? `${previousText.trimEnd()} ${transcribedText}`
        : transcribedText
    );

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleVoiceSignReady = (payload) => {
    const sourceText = payload.sourceText?.trim() || payload.text?.trim() || '';

    if (!sourceText) {
      return;
    }

    appendAndEmitMessage({
      ...createBaseMessage(),
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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const newSocket = io(BACKEND_URL || window.location.origin);

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('register', user.id);
      newSocket.emit('join_chat', ACTIVE_CHAT.id);
    });

    newSocket.on('receive_message', (message) => {
      setMessages((previousMessages) => [...previousMessages, message]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    sendMessageText(inputText);
  };

  const renderMessageTime = (message, isMine) => (
    <span className="msg-time">
      {new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })}
      {isMine && <CheckCheck size={14} className="read-status" />}
    </span>
  );

  const renderMessageBody = (message, isMine) => {
    if (message.kind !== 'sign') {
      return (
        <>
          {message.text}
          {renderMessageTime(message, isMine)}
        </>
      );
    }

    const signAssets = Array.isArray(message.signs) ? message.signs : [];
    const segments = Array.isArray(message.segments) ? message.segments : [];
    const matchedWords = Array.isArray(message.matchedWords) ? message.matchedWords : [];
    const missingWords = Array.isArray(message.missingWords) ? message.missingWords : [];

    return (
      <>
        <div className="sign-original-text">{message.sourceText || message.text}</div>

        {signAssets.length > 0 ? (
          <div className="sign-strip">
            {signAssets.map((assetPath, index) => (
              <div
                key={`${message.id}-sign-${index}`}
                className="sign-card"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <img
                  src={assetPath}
                  alt={`${matchedWords[index] || `Sign ${index + 1}`} animation`}
                  className="sign-asset"
                  loading="lazy"
                />
                <span className="sign-caption">
                  {segments[index]?.label || matchedWords[index] || `Sign ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="sign-empty-state">No predefined signs were found for this phrase yet.</div>
        )}

        {missingWords.length > 0 && (
          <div className="sign-fallback">Skipped words: {missingWords.join(', ')}</div>
        )}

        {renderMessageTime(message, isMine)}
      </>
    );
  };

  if (!user) {
    return (
      <div className="unauthorized">
        <h2>Please Login to use the Chat</h2>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Recent Chats</h3>
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search users..." />
          </div>
        </div>
        <div className="chat-list">
          <div className="chat-item active">
            <div className="avatar">
              G<div className="status-dot"></div>
            </div>
            <div className="chat-info">
              <h4>Global Community</h4>
              <p>Welcome to Signova!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="user-info">
            <div className="avatar">{ACTIVE_CHAT.name.charAt(0)}</div>
            <div>
              <h3>{ACTIVE_CHAT.name}</h3>
              <span className="status">{ACTIVE_CHAT.online ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="chat-actions">
            <button className="icon-btn">
              <Search size={20} />
            </button>
            <button className="icon-btn">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        <div className="chat-messages">
          <div className="message-date-separator">
            <span>Today</span>
          </div>

          {messages.length === 0 ? (
            <div className="empty-state">No messages yet. Say hello!</div>
          ) : (
            messages.map((message, idx) => {
              const isMine = message.senderId === user.id;
              return (
                <div
                  key={message.id || idx}
                  className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${
                    message.kind === 'sign' ? 'sign-bubble' : ''
                  }`}
                >
                  {!isMine && <div className="msg-sender">{message.senderName || 'User'}</div>}
                  <div className={`msg-content ${message.kind === 'sign' ? 'sign-message-content' : ''}`}>
                    {renderMessageBody(message, isMine)}
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
                <span>Voice language</span>
                <select
                  id="voice-lang-select"
                  value={voiceLanguage}
                  onChange={(event) => setVoiceLanguage(event.target.value)}
                >
                  <option value="ar-EG">Arabic (Egypt)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </label>

              <div className="voice-mode-toggle" role="tablist" aria-label="Voice mode">
                <button
                  type="button"
                  className={`voice-mode-btn ${voiceMode === VOICE_MODES.TEXT ? 'active' : ''}`}
                  onClick={() => setVoiceMode(VOICE_MODES.TEXT)}
                >
                  Voice to Text
                </button>
                <button
                  type="button"
                  className={`voice-mode-btn ${voiceMode === VOICE_MODES.SIGN ? 'active' : ''}`}
                  onClick={() => setVoiceMode(VOICE_MODES.SIGN)}
                >
                  Voice to Sign
                </button>
              </div>
            </div>

            {voiceMode === VOICE_MODES.TEXT ? (
              <VoiceButton language={voiceLanguage} onTranscript={handleVoiceTranscript} />
            ) : (
              <VoiceToSignButton language={voiceLanguage} onSignReady={handleVoiceSignReady} />
            )}
          </div>

          <div className="composer-row">
            <button type="button" className="icon-btn" aria-label="Attach image">
              <ImageIcon size={24} />
            </button>
            <form onSubmit={handleSendMessage} className="message-form">
              <button type="button" className="icon-btn smile-btn" aria-label="Emoji">
                <Smile size={24} />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="send-btn" disabled={!inputText.trim()}>
                <Send size={18} />
                <span className="send-btn-label">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .chat-layout {
          display: flex;
          height: calc(100vh - 120px);
          background: var(--bg-secondary);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .chat-sidebar {
          width: 300px;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          background: var(--bg-main);
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: white;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-secondary);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .search-box input {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
        }

        .chat-list {
          flex: 1;
          overflow-y: auto;
        }

        .chat-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: 0.2s;
          border-bottom: 1px solid var(--border-color);
        }

        .chat-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .chat-item.active {
          background: rgba(30, 58, 138, 0.2);
          border-left: 3px solid var(--primary);
        }

        .avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--primary), #60a5fa);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: bold;
          color: white;
          position: relative;
          flex-shrink: 0;
        }

        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: var(--success);
          border-radius: 50%;
          border: 2px solid var(--bg-main);
        }

        .chat-info h4 {
          color: white;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .chat-info p {
          color: var(--text-secondary);
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }

        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-main);
        }

        .chat-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-secondary);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info h3 {
          color: white;
          font-size: 1.1rem;
        }

        .status {
          font-size: 0.85rem;
          color: var(--success);
        }

        .chat-actions {
          display: flex;
          gap: 1rem;
        }

        .chat-messages {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
        }

        .message-date-separator {
          text-align: center;
          margin: 1rem 0;
          position: relative;
          z-index: 1;
        }

        .message-date-separator span {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          padding: 0.25rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          border: 1px solid var(--border-color);
        }

        .message-bubble {
          max-width: 65%;
          display: flex;
          flex-direction: column;
        }

        .message-bubble.sign-bubble {
          max-width: min(84%, 620px);
        }

        .message-bubble.mine {
          align-self: flex-end;
        }

        .message-bubble.theirs {
          align-self: flex-start;
        }

        .msg-sender {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
          margin-left: 0.5rem;
        }

        .msg-content {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          position: relative;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sign-message-content {
          gap: 0.75rem;
        }

        .theirs .msg-content {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-bottom-left-radius: 4px;
        }

        .mine .msg-content {
          background: var(--primary);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .sign-original-text {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .sign-strip {
          display: flex;
          gap: 0.9rem;
          overflow-x: auto;
          padding: 0.1rem 0 0.45rem;
          scroll-snap-type: x proximity;
        }

        .sign-card {
          min-width: 176px;
          max-width: 176px;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          border-radius: 16px;
          padding: 0.7rem;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.22);
          scroll-snap-align: start;
          animation: signReveal 0.45s ease both;
        }

        .theirs .sign-card {
          background: rgba(59, 130, 246, 0.08);
        }

        .sign-asset {
          width: 100%;
          height: 138px;
          border-radius: 12px;
          object-fit: contain;
          padding: 0.35rem;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.45));
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sign-caption {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          opacity: 0.92;
        }

        .sign-empty-state,
        .sign-fallback {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.88);
        }

        .msg-time {
          font-size: 0.7rem;
          opacity: 0.7;
          align-self: flex-end;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .read-status {
          color: #93c5fd;
        }

        .chat-input-area {
          padding: 1.25rem 1.5rem;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .voice-options-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .voice-tools-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .voice-button-panel {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .voice-write-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.35);
          background: rgba(59, 130, 246, 0.15);
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
          white-space: nowrap;
          transition: 0.2s;
          flex-shrink: 0;
        }

        .voice-write-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.24);
        }

        .voice-write-btn.recording {
          border-color: rgba(248, 113, 113, 0.55);
          background: rgba(239, 68, 68, 0.18);
        }

        .voice-write-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .voice-mode-toggle {
          display: inline-flex;
          border-radius: 999px;
          padding: 0.2rem;
          border: 1px solid var(--border-color);
          background: rgba(15, 23, 42, 0.55);
        }

        .voice-mode-btn {
          border-radius: 999px;
          padding: 0.38rem 0.8rem;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          transition: 0.2s;
        }

        .voice-mode-btn.active {
          background: rgba(59, 130, 246, 0.24);
          color: white;
        }

        .composer-voice-cluster {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          min-width: 0;
        }

        .voice-inline-status {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-secondary);
          font-size: 0.78rem;
          min-width: 0;
        }

        .voice-setting {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .voice-setting select {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: white;
          padding: 0.35rem 0.65rem;
        }

        .recording-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 rgba(239, 68, 68, 0.6);
          animation: pulse 1.2s infinite;
          flex-shrink: 0;
        }

        .voice-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          color: #fca5a5;
          font-size: 0.85rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 8px;
          padding: 0.4rem 0.75rem;
          max-width: 360px;
        }

        .voice-error-dismiss {
          color: #fca5a5;
          font-size: 0.9rem;
          line-height: 1;
          padding: 0 0.15rem;
          flex-shrink: 0;
          transition: color 0.2s;
        }

        .voice-error-dismiss:hover {
          color: white;
        }

        .composer-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-btn {
          color: var(--text-secondary);
          transition: 0.2s;
          padding: 0.5rem;
        }

        .icon-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .message-form {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 0.45rem 0.5rem 0.45rem 0.65rem;
          gap: 0.45rem;
          min-width: 0;
        }

        .message-form input {
          flex: 1 1 140px;
          min-width: 0;
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
        }

        .send-btn {
          background: var(--primary);
          color: white;
          min-height: 40px;
          padding: 0 0.85rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-weight: 600;
          font-size: 0.9rem;
          transition: 0.2s;
          flex-shrink: 0;
        }

        .send-btn-label {
          line-height: 1;
        }

        .send-btn:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: scale(1.02);
        }

        .send-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }

        .unauthorized {
          color: white;
          padding: 2rem;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes signReveal {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
