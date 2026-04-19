import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { CHAT_SOCKET_URL } from '../lib/config';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const TYPING_CLEAR_MS = 3000;
const PAGE_SIZE       = 30;

export function useChat() {
  const { user, token } = useAuthStore();

  const [chats,           setChats]          = useState([]);
  const [activeChat,      setActiveChat]     = useState(null);
  const [messages,        setMessages]       = useState([]);
  const [loadingChats,    setLoadingChats]   = useState(true);
  const [loadingMsgs,     setLoadingMsgs]    = useState(false);
  const [loadingMore,     setLoadingMore]    = useState(false);
  const [hasMore,         setHasMore]        = useState(false);
  const [nextCursor,      setNextCursor]     = useState(null);
  const [socketConnected, setSocketConnected]= useState(false);
  const [typingUsers,     setTypingUsers]    = useState({});
  const [unreadCounts,    setUnreadCounts]   = useState({});

  const socketRef      = useRef(null);
  const activeChatRef  = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimer    = useRef(null);
  const clearTimers    = useRef({});

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  /* ── load chat list ── */
  const loadChats = useCallback(() => {
    setLoadingChats(true);
    api.get('/api/chat')
      .then((data) => {
        const list = data.chats ?? [];
        setChats(list);
        setActiveChat((prev) => prev ?? list[0] ?? null);
        const counts = {};
        list.forEach((c) => { if (c.unreadCount) counts[c.id] = c.unreadCount; });
        setUnreadCounts(counts);
      })
      .catch(() => {})
      .finally(() => setLoadingChats(false));
  }, []);

  useEffect(() => { if (user) loadChats(); }, [user]);

  /* ── load initial messages on chat change ── */
  useEffect(() => {
    if (!activeChat) return;
    setLoadingMsgs(true);
    setMessages([]);
    setHasMore(false);
    setNextCursor(null);
    setUnreadCounts((prev) => ({ ...prev, [activeChat.id]: 0 }));

    api.get(`/api/chat/${activeChat.id}/messages?limit=${PAGE_SIZE}`)
      .then((d) => {
        setMessages(d.messages ?? []);
        setHasMore(d.hasMore ?? false);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));

    api.patch(`/api/chat/${activeChat.id}/seen`, {}).catch(() => {});
  }, [activeChat?.id]);

  /* ── load more (older) messages ── */
  const loadMoreMessages = useCallback(async () => {
    if (!activeChat || !hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const d = await api.get(
        `/api/chat/${activeChat.id}/messages?limit=${PAGE_SIZE}&before=${encodeURIComponent(nextCursor)}`
      );
      const older = d.messages ?? [];
      setMessages((prev) => [...older, ...prev]);  // prepend older messages
      setHasMore(d.hasMore ?? false);
      setNextCursor(d.nextCursor ?? null);
    } catch {}
    finally { setLoadingMore(false); }
  }, [activeChat, hasMore, nextCursor, loadingMore]);

  /* ── socket ── */
  useEffect(() => {
    if (!user || !token) return;

    const socket = io(CHAT_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('register', user.id);
      if (activeChatRef.current?.id) socket.emit('join_chat', activeChatRef.current.id);
    });
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('receive_message', (msg) => {
      const isCurrent = msg.chatId === activeChatRef.current?.id;
      if (isCurrent) {
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        socket.emit('message_seen', { messageId: msg.id, chatId: msg.chatId });
      } else {
        setUnreadCounts((prev) => ({ ...prev, [msg.chatId]: (prev[msg.chatId] ?? 0) + 1 }));
        setChats((prev) => {
          const idx = prev.findIndex((c) => c.id === msg.chatId);
          if (idx < 0) return prev;
          const updated = { ...prev[idx], lastMessage: msg, updatedAt: msg.createdAt };
          return [updated, ...prev.filter((c) => c.id !== msg.chatId)];
        });
      }
    });

    socket.on('message_status', ({ messageId, status }) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, status } : m));
    });

    socket.on('message_reactions', ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions } : m));
    });

    socket.on('user_typing', ({ chatId, userId, userName }) => {
      if (userId === user.id) return;
      setTypingUsers((prev) => ({ ...prev, [chatId]: { ...(prev[chatId] ?? {}), [userId]: userName } }));
      clearTimeout(clearTimers.current[userId]);
      clearTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => {
          const chat = { ...(prev[chatId] ?? {}) }; delete chat[userId];
          return { ...prev, [chatId]: chat };
        });
      }, TYPING_CLEAR_MS);
    });

    socket.on('user_stop_typing', ({ chatId, userId }) => {
      clearTimeout(clearTimers.current[userId]);
      setTypingUsers((prev) => {
        const chat = { ...(prev[chatId] ?? {}) }; delete chat[userId];
        return { ...prev, [chatId]: chat };
      });
    });

    socket.on('user_status', ({ userId, isOnline }) => {
      setChats((prev) => prev.map((c) => ({
        ...c,
        participants: c.participants?.map((p) => p.id === userId ? { ...p, isOnline } : p),
      })));
    });

    return () => { Object.values(clearTimers.current).forEach(clearTimeout); socket.disconnect(); };
  }, [user, token]);

  useEffect(() => {
    if (activeChat && socketRef.current?.connected) socketRef.current.emit('join_chat', activeChat.id);
  }, [activeChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length === 0 ? null : messages[messages.length - 1]?.id]);

  /* ── typing helpers ── */
  const emitTyping = useCallback(() => {
    if (!socketRef.current?.connected || !activeChatRef.current) return;
    clearTimeout(typingTimer.current);
    socketRef.current.emit('typing', { chatId: activeChatRef.current.id, userId: user.id, userName: user.name });
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { chatId: activeChatRef.current?.id, userId: user.id });
    }, TYPING_CLEAR_MS);
  }, [user]);

  const emitStopTyping = useCallback(() => {
    clearTimeout(typingTimer.current);
    if (!socketRef.current?.connected || !activeChatRef.current) return;
    socketRef.current.emit('stop_typing', { chatId: activeChatRef.current.id, userId: user.id });
  }, [user]);

  /* ── reactions ── */
  const toggleReaction = useCallback((messageId, emoji) => {
    if (!socketRef.current?.connected || !activeChatRef.current || !messageId || !emoji) return;
    socketRef.current.emit('toggle_reaction', { chatId: activeChatRef.current.id, messageId, emoji });
  }, []);

  /* ── message builders ── */
  const buildBase = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chatId: activeChat?.id, senderId: user?.id,
    senderName: user?.name || 'User',
    createdAt: new Date().toISOString(), status: 'sent',
  });

  const emitMessage = (msg) => {
    if (!socketRef.current?.connected || !activeChat) return false;
    socketRef.current.emit('send_message', msg);
    emitStopTyping();
    return true;
  };

  const sendText = (text) => {
    const t = text.trim();
    if (!t || !activeChat) return;
    emitMessage({ ...buildBase(), kind: 'text', text: t });
  };

  const sendSign = (payload) => {
    const sourceText = payload.sourceText?.trim() || payload.text?.trim() || '';
    if (!sourceText || !activeChat) return;
    emitMessage({
      ...buildBase(), kind: 'sign',
      text: payload.text?.trim() || sourceText, sourceText,
      signs: Array.isArray(payload.signs) ? payload.signs : [],
      segments: Array.isArray(payload.segments) ? payload.segments : [],
      matchedWords: Array.isArray(payload.matchedWords) ? payload.matchedWords : [],
      missingWords: Array.isArray(payload.missingWords) ? payload.missingWords : [],
    });
  };

  const createPrivateChat = async (participantEmail) => {
    const data = await api.post('/api/chat/private', { participantEmail });
    const chat = data.chat;
    setChats((prev) => prev.some((c) => c.id === chat.id) ? prev : [chat, ...prev]);
    setActiveChat(chat);
    return chat;
  };

  const typingLabel = useCallback((chatId) => {
    const users = Object.values(typingUsers[chatId] ?? {});
    if (!users.length) return '';
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return 'Several people are typing...';
  }, [typingUsers]);

  return {
    chats, setChats, activeChat, setActiveChat,
    messages, loadingChats, loadingMsgs, loadingMore, hasMore,
    messagesEndRef, sendText, sendSign, createPrivateChat,
    socketConnected, typingLabel, unreadCounts,
    emitTyping, emitStopTyping, toggleReaction, loadMoreMessages,
  };
}
