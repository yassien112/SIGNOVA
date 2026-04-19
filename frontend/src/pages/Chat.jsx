import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChat } from '../hooks/useChat';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';

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
