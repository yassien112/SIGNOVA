import React, { useEffect, useRef } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import MessageBubble   from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput       from './ChatInput';
import { useChatStore } from '../../store/chatStore';

export default function ChatWindow({
  activeChat, messages, hasMore, myId,
  onSendText, onSendSign, onSendSticker,
  onTyping, onStopTyping, onSeen,
  onToggleReaction, onLoadMore,
}) {
  const endRef    = useRef(null);
  const topRef    = useRef(null);
  const isSending = useChatStore((s) => s.isSending);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark last message seen
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.senderId !== myId) onSeen?.(last.id);
  }, [messages.length]);

  if (!activeChat) {
    return (
      <div className="chat-window-empty">
        <MessageSquare size={48} className="chat-empty-icon" />
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  const title = activeChat.title ||
    activeChat.participants?.find((p) => p.id !== myId)?.name ||
    'Chat';

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-window-info">
          <span className="chat-window-title">{title}</span>
          {activeChat.isGroup && (
            <span className="chat-window-subtitle">
              {activeChat.participants?.length} members
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-area">
        {hasMore && (
          <div className="chat-load-more">
            <button type="button" className="btn-ghost" onClick={onLoadMore}>
              Load older messages
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="chat-no-messages">
            <p>No messages yet — say hello! 👋</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={msg.senderId === myId}
            onToggleReaction={onToggleReaction}
          />
        ))}

        <TypingIndicator />
        <div ref={endRef} />
      </div>

      {/* Input */}
      <ChatInput
        chatId={activeChat.id}
        onSendText={onSendText}
        onSendSign={onSendSign}
        onSendSticker={onSendSticker}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
        disabled={isSending}
      />
    </div>
  );
}
