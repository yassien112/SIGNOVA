import React from 'react';
import { MessageSquare } from 'lucide-react';

const ChatList = ({ chats, activeChatId, onSelectChat, currentUser, onlineUsers }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile-mini">
          <div className="avatar-container">
            <img src={currentUser.avatar} alt="Profile" className="avatar" />
            <div className={`user-status online`}></div>
          </div>
          <div>
            <h2>Chats</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {chats.length} active conversations
            </div>
          </div>
        </div>
      </div>
      
      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            <MessageSquare size={32} opacity={0.5} style={{marginBottom: '10px'}}/>
            <p>No chats available</p>
          </div>
        ) : (
          chats.map(chat => {
            const isOnline = chat.otherUser ? onlineUsers[chat.otherUser.id] : false;
            const latestMsg = chat.lastMessage?.message_text || 'No messages yet';
            const time = chat.lastMessage ? new Date(chat.lastMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            
            return (
              <div 
                key={chat.id} 
                className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="avatar-container">
                  <img src={chat.otherUser?.avatar || 'https://i.pravatar.cc/150'} alt="Contact Avatar" className="avatar" />
                  <div className={`user-status ${isOnline ? 'online' : ''}`}></div>
                </div>
                
                <div className="chat-info">
                  <div className="chat-header-row">
                    <span className="chat-name">{chat.otherUser?.name || 'Unknown User'}</span>
                    <span className="chat-time">{time}</span>
                  </div>
                  <div className="chat-preview">{latestMsg}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
