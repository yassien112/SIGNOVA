import React, { useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore }  from '../store/authStore';
import { useChatStore }  from '../store/chatStore';
import { useChat }       from '../hooks/useChat';
import ChatSidebar       from '../components/chat/ChatSidebar';
import ChatWindow        from '../components/chat/ChatWindow';
import '../styles/Chat.css';

export default function Chat() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const {
    chats, activeChat, messages, hasMore, nextCursor,
    fetchChats, setActiveChat, markSeen, incrementUnread,
  } = useChatStore();

  const chatId = activeChat?.id;

  const {
    sendMessage, sendSticker, sendSignMessage,
    emitTyping, emitStopTyping, emitSeen,
    toggleReaction, loadMore,
  } = useChat(chatId);

  // Load chat list once
  useEffect(() => { fetchChats(); }, []);

  // Mark seen when active chat changes
  useEffect(() => {
    if (chatId) markSeen(chatId);
  }, [chatId]);

  // Handle pending sign from AI camera page
  useEffect(() => {
    if (!chatId) return;
    const raw = sessionStorage.getItem('signova_pending_sign');
    if (!raw) return;
    sessionStorage.removeItem('signova_pending_sign');
    try { sendSignMessage('', JSON.parse(raw)); } catch {}
  }, [chatId]);

  const handleSendText = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleSendSign = useCallback((payload) => {
    const signs = Array.isArray(payload) ? payload : payload?.signs || [];
    const text  = payload?.text || '';
    sendSignMessage(text, signs);
  }, [sendSignMessage]);

  const handleSendSticker = useCallback((sign) => {
    sendSticker(sign);
  }, [sendSticker]);

  const chatMessages = chatId ? (messages[chatId] || []) : [];
  const canLoadMore  = chatId ? !!hasMore[chatId] : false;

  return (
    <div className="chat-page">
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onSelect={setActiveChat}
        onNewChat={(participantId) => useChatStore.getState().startPrivateChat(participantId)}
        myId={user?.id}
      />
      <ChatWindow
        activeChat={activeChat}
        messages={chatMessages}
        hasMore={canLoadMore}
        myId={user?.id}
        onSendText={handleSendText}
        onSendSign={handleSendSign}
        onSendSticker={handleSendSticker}
        onTyping={emitTyping}
        onStopTyping={emitStopTyping}
        onSeen={emitSeen}
        onToggleReaction={toggleReaction}
        onLoadMore={loadMore}
      />
    </div>
  );
}
