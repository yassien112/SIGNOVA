import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChat } from '../hooks/useChat';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow  from '../components/chat/ChatWindow';

export default function Chat() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const {
    chats,
    activeChat, setActiveChat,
    messages,
    loadingChats, loadingMsgs,
    messagesEndRef,
    sendText, sendSign,
    createPrivateChat,
  } = useChat();

  /* ── consume pending sign from AICamera ── */
  useEffect(() => {
    if (!activeChat) return;
    const raw = sessionStorage.getItem('signova_pending_sign');
    if (!raw) return;
    sessionStorage.removeItem('signova_pending_sign');
    try {
      sendSign(JSON.parse(raw));
    } catch {}
  }, [activeChat?.id]);

  return (
    <div className="flex h-[calc(100vh-4rem)] rounded-2xl overflow-hidden
                    border border-gray-700 shadow-2xl">
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onSelect={setActiveChat}
        onNewChat={createPrivateChat}
        loadingChats={loadingChats}
        myId={user?.id}
      />
      <ChatWindow
        activeChat={activeChat}
        messages={messages}
        loadingMsgs={loadingMsgs}
        messagesEndRef={messagesEndRef}
        myId={user?.id}
        onSendText={sendText}
        onSendSign={sendSign}
      />
    </div>
  );
}
