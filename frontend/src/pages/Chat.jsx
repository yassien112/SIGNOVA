import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChat } from '../hooks/useChat';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow  from '../components/chat/ChatWindow';
import '../styles/Chat.css';

export default function Chat() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const {
    chats, activeChat, setActiveChat,
    messages, loadingChats, loadingMsgs,
    messagesEndRef, sendText, sendSign, createPrivateChat,
    typingLabel, unreadCounts, emitTyping, emitStopTyping,
    toggleReaction,
  } = useChat();

  useEffect(() => {
    if (!activeChat) return;
    const raw = sessionStorage.getItem('signova_pending_sign');
    if (!raw) return;
    sessionStorage.removeItem('signova_pending_sign');
    try { sendSign(JSON.parse(raw)); } catch {}
  }, [activeChat?.id]);

  return (
    <div className="chat-page">
      <ChatSidebar
        chats={chats} activeChat={activeChat}
        onSelect={setActiveChat} onNewChat={createPrivateChat}
        loadingChats={loadingChats} myId={user?.id}
        unreadCounts={unreadCounts}
      />
      <ChatWindow
        activeChat={activeChat} messages={messages}
        loadingMsgs={loadingMsgs} messagesEndRef={messagesEndRef}
        myId={user?.id} onSendText={sendText} onSendSign={sendSign}
        typingLabel={typingLabel}
        onTyping={emitTyping}
        onStopTyping={emitStopTyping}
        onToggleReaction={toggleReaction}
      />
    </div>
  );
}
