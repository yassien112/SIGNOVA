import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

function getChatLabel(chat, myId) {
  if (chat.isGlobal) return 'Global Community';
  if (chat.title) return chat.title;
  const other = chat.participants?.find((p) => p.id !== myId);
  return other?.name || 'Private Chat';
}

export default function ChatSidebar({ chats, activeChat, onSelect, onNewChat, loadingChats, myId }) {
  const { t } = useLanguage();
  const [search, setSearch]           = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [email, setEmail]             = useState('');
  const [error, setError]             = useState('');
  const [creating, setCreating]       = useState(false);

  const filtered = chats.filter((c) =>
    getChatLabel(c, myId).toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setCreating(true);
    try {
      await onNewChat(email.trim());
      setEmail('');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col bg-gray-900 border-e border-gray-700">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-base">{t('chats')}</h3>
          <button
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            onClick={() => { setShowForm((v) => !v); setError(''); }}
            title={t('startPrivateChat')}
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              className="field text-sm"
              placeholder={t('enterEmail')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoFocus
            />
            <button type="submit" disabled={creating} className="btn-primary text-xs py-1.5">
              {creating ? t('loading') : t('start')}
            </button>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </form>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            className="bg-transparent text-white text-sm w-full placeholder-gray-500 outline-none"
            placeholder={t('searchChats')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loadingChats ? (
          <p className="text-gray-500 text-sm px-4 py-4">{t('loading')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm px-4 py-4">{t('noChats')}</p>
        ) : (
          filtered.map((chat) => {
            const label   = getChatLabel(chat, myId);
            const lastMsg = chat.messages?.[0];
            const isActive = activeChat?.id === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => onSelect(chat)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-start
                            border-b border-gray-800 transition-all duration-150
                            ${ isActive
                                ? 'bg-blue-900/25 border-s-2 border-s-blue-500'
                                : 'hover:bg-white/[0.03]'
                            }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-500
                                  flex items-center justify-center text-white font-bold text-sm">
                    {label.charAt(0).toUpperCase()}
                  </div>
                  <span className="status-online absolute bottom-0 end-0" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{label}</p>
                  <p className="text-gray-500 text-xs truncate">
                    {lastMsg
                      ? (lastMsg.kind === 'sign' ? `[${t('signMessage')}]` : lastMsg.text)
                      : t('noMessages')}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
