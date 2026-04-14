import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import AICapability from './AICapability';
import { getApiUrl } from '../lib/config';

const ChatWindow = ({ chatId, socket, currentUserId, onBack, chatDetails }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(getApiUrl(`/api/chats/${chatId}/messages`))
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        scrollToBottom();
      })
      .catch(err => console.error("Error fetching messages:", err));
  }, [chatId]);

  useEffect(() => {
    if (!socket) return;
    
    // Using a dedicated listener for this window
    const handleReceive = (msg) => {
      // If the message is for the currently open chat, append it
      if (msg.chat_id === chatId) {
        setMessages(prev => {
           // Prevent duplicate messages if already exists
           if(prev.find(m => m.id === msg.id)) return prev;
           return [...prev, msg];
        });
        scrollToBottom();
      }
    };

    socket.on('receive_message', handleReceive);

    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [socket, chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;

    const msgId = 'msg-' + Math.random().toString(36).substr(2, 9);
    const newMsg = {
      id: msgId,
      chatId,
      senderId: currentUserId,
      text: inputValue.trim(),
      createdAt: new Date().toISOString()
    };

    socket.emit('send_message', newMsg);
    setInputValue('');
  };

  const handleAIInject = (aiText) => {
    setInputValue(prev => prev + (prev ? ' ' : '') + aiText);
  };

  return (
    <div className="main-chat">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="avatar-container">
           <img src={chatDetails?.otherUser?.avatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="avatar" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{chatDetails?.otherUser?.name || 'Chat'}</h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {chatDetails?.otherUser?.is_online ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(msg => {
          const isSentByMe = msg.sender_id === currentUserId;
          const timeLabel = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          
          return (
            <div key={msg.id} className={`message-bubble-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
              <div className="message-bubble">
                {msg.message_text}
              </div>
              <div className="message-meta">
                {timeLabel} {isSentByMe && <span>✓</span>}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <AICapability onInjectText={handleAIInject} />

      <form className="chat-input-area" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          className="chat-input" 
          placeholder="Type a message..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="send-button" disabled={!inputValue.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
