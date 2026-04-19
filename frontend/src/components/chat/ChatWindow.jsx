import React, { useRef, useCallback } from 'react';
import { MoreVertical, Loader2 } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

function getChatLabel(chat, myId) {
  if (chat.isGlobal) return 'Global Community';
  if (chat.title) return chat.title;
  const other = chat.participants?.find((p) => p.id !== myId);
  return other?.name || 'Private Chat';
}
function getOnlineStatus(chat, myId) {
  if (chat.isGlobal) return null;
  return chat.participants?.find((p) => p.id !== myId)?.isOnline;
}
function EmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
         style={{ opacity: .3 }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function ChatWindow({
  activeChat, messages, loadingMsgs, loadingMore, hasMore,
  messagesEndRef, myId, onSendText, onSendSign,
  typingLabel, onTyping, onStopTyping, onToggleReaction, onLoadMore,
}) {
  const { t } = useLanguage();
  const containerRef = useRef(null);

  // Infinite scroll — trigger when user scrolls near the top
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasMore || loadingMore) return;
    if (containerRef.current.scrollTop < 80) {
      onLoadMore?.();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  if (!activeChat) {
    return (
      <div className="chat-window-empty">
        <EmptyIcon />
        <p style={{ fontSize: '.875rem' }}>{t('noChats')}</p>
      </div>
    );
  }

  const label    = getChatLabel(activeChat, myId);
  const isOnline = getOnlineStatus(activeChat, myId);
  const typing   = typingLabel?.(activeChat.id) ?? '';

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-window-header-info">
          <div className="chat-avatar-sm" style={{ position: 'relative' }}>
            {label.charAt(0).toUpperCase()}
            {isOnline != null && <span className={`chat-online-dot ${isOnline ? 'online' : 'offline'}`} />}
          </div>
          <div>
            <p className="chat-window-name">{label}</p>
            <p className="chat-window-sub">
              {typing
                ? <span className="chat-typing-sub">{typing}</span>
                : isOnline != null
                  ? (isOnline ? t('online') : t('offline'))
                  : (activeChat.isGlobal ? t('global') : t('private'))}
            </p>
          </div>
        </div>
        <button className="btn-ghost" style={{ padding: '.5rem', borderRadius: '12px' }}>
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={containerRef} onScroll={handleScroll}>

        {/* Load-more spinner at the very top */}
        {loadingMore && (
          <div className="chat-load-more-spinner">
            <Loader2 size={16} className="spin" />
            <span>Loading older messages…</span>
          </div>
        )}

        {/* Load-more button fallback (shows if hasMore and not currently loading) */}
        {hasMore && !loadingMore && (
          <button className="chat-load-more-btn" onClick={onLoadMore}>
            Load older messages
          </button>
        )}

        {loadingMsgs ? (
          <div className="chat-msgs-loading">
            <Loader2 size={20} className="spin" />
          </div>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '.875rem', margin: 'auto' }}>
            {t('noMessages')}
          </p>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id || idx}
              msg={msg}
              isMine={msg.senderId === myId}
              onToggleReaction={onToggleReaction}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {typing && <TypingIndicator label={typing} />}

      <ChatInput
        onSendText={onSendText} onSendSign={onSendSign}
        disabled={!activeChat} onTyping={onTyping} onStopTyping={onStopTyping}
      />
    </div>
  );
}
