import React from 'react';
import { MoreVertical } from 'lucide-react';
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
  const other = chat.participants?.find((p) => p.id !== myId);
  return other?.isOnline;
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
  activeChat, messages, loadingMsgs, messagesEndRef,
  myId, onSendText, onSendSign, typingLabel,
  onTyping, onStopTyping, onToggleReaction,
}) {
  const { t } = useLanguage();

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

      <div className="chat-messages">
        {loadingMsgs ? (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '.875rem', margin: 'auto' }}>{t('loading')}</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '.875rem', margin: 'auto' }}>{t('noMessages')}</p>
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
        onSendText={onSendText}
        onSendSign={onSendSign}
        disabled={!activeChat}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
      />
    </div>
  );
}
