import React, { useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

function getChatLabel(chat, myId) {
  if (chat.isGlobal) return 'Global Community';
  if (chat.title) return chat.title;
  const other = chat.participants?.find((p) => p.id !== myId);
  return other?.name || 'Private Chat';
}

export default function ChatWindow({ activeChat, messages, loadingMsgs, messagesEndRef, myId, onSendText, onSendSign }) {
  const { t } = useLanguage();

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 gap-3 text-gray-500">
        <MessageSquareIcon />
        <p className="text-sm">{t('noChats')}</p>
      </div>
    );
  }

  const label = getChatLabel(activeChat, myId);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5
                      bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-700 to-blue-500
                          flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {label.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{label}</p>
            <p className="text-emerald-400 text-xs">
              {activeChat.isGlobal ? t('global') : t('private')}
            </p>
          </div>
        </div>
        <button className="btn-ghost p-2 rounded-xl">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {loadingMsgs ? (
          <p className="text-center text-gray-500 text-sm m-auto">{t('loading')}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm m-auto">{t('noMessages')}</p>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id || idx}
              msg={msg}
              isMine={msg.senderId === myId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendText={onSendText}
        onSendSign={onSendSign}
        disabled={!activeChat}
      />
    </div>
  );
}

function MessageSquareIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
         opacity="0.3">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
