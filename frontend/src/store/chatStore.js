import { create } from 'zustand';
import { api } from '../lib/api';

export const useChatStore = create((set, get) => ({
  chats:          [],
  activeChat:     null,
  messages:       {},   // { [chatId]: Message[] }
  hasMore:        {},   // { [chatId]: boolean }
  nextCursor:     {},   // { [chatId]: string | null }
  isLoading:      false,
  isSending:      false,
  error:          null,

  /* ── Load chat list ── */
  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/chat');
      set({ chats: data.chats || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /* ── Set active chat ── */
  setActiveChat: (chat) => set({ activeChat: chat }),

  /* ── Load messages for a chat ── */
  fetchMessages: async (chatId, { before } = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (before) params.set('before', before);
      const data = await api.get(`/chat/${chatId}/messages?${params}`);
      const existing = get().messages[chatId] || [];
      const merged = before
        ? [...(data.messages || []), ...existing]   // prepend older
        : (data.messages || []);
      set((state) => ({
        messages:   { ...state.messages,   [chatId]: merged },
        hasMore:    { ...state.hasMore,    [chatId]: data.hasMore },
        nextCursor: { ...state.nextCursor, [chatId]: data.nextCursor },
        isLoading: false,
      }));
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /* ── Append incoming socket message ── */
  appendMessage: (chatId, message) => {
    set((state) => {
      const existing = state.messages[chatId] || [];
      // avoid duplicates
      if (existing.find((m) => m.id === message.id)) return {};
      return {
        messages: { ...state.messages, [chatId]: [...existing, message] },
        chats: state.chats.map((c) =>
          c.id === chatId ? { ...c, messages: [message], updatedAt: message.createdAt } : c
        ),
      };
    });
  },

  /* ── Update message status ── */
  updateMessageStatus: (chatId, messageId, status) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, status } : m
        ),
      },
    }));
  },

  /* ── Update reactions ── */
  updateReactions: (chatId, messageId, reactions) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        ),
      },
    }));
  },

  /* ── Send message via REST ── */
  sendMessage: async (chatId, payload) => {
    set({ isSending: true });
    try {
      const data = await api.post(`/chat/${chatId}/messages`, payload);
      get().appendMessage(chatId, data.message);
      set({ isSending: false });
      return data.message;
    } catch (err) {
      set({ error: err.message, isSending: false });
      throw err;
    }
  },

  /* ── Start / get private chat ── */
  startPrivateChat: async (participantId) => {
    const data = await api.post('/chat/private', { participantId });
    if (!get().chats.find((c) => c.id === data.chat.id)) {
      set((state) => ({ chats: [data.chat, ...state.chats] }));
    }
    return data.chat;
  },

  /* ── Create group chat ── */
  createGroup: async (title, participantIds) => {
    const data = await api.post('/chat/group', { title, participantIds });
    set((state) => ({ chats: [data.chat, ...state.chats] }));
    return data.chat;
  },

  /* ── Mark chat as seen ── */
  markSeen: async (chatId) => {
    await api.patch(`/chat/${chatId}/seen`, {});
    set((state) => ({
      chats: state.chats.map((c) => c.id === chatId ? { ...c, unreadCount: 0 } : c),
    }));
  },

  /* ── Update unread count from socket ── */
  incrementUnread: (chatId) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));
