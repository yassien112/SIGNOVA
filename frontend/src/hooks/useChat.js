import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { CHAT_SOCKET_URL } from '../lib/config';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const TYPING_EMIT_MS  = 300;   // debounce before emitting typing event
const TYPING_CLEAR_MS = 3000;  // clear typing indicator if no update

export function useChat() {
  const { user, token } = useAuthStore();

  const [chats,           setChats]           = useState([]);
  const [activeChat,      setActiveChat]       = useState(null);
  const [messages,        setMessages]         = useState([]);
  const [loadingChats,    setLoadingChats]     = useState(true);
  const [loadingMsgs,     setLoadingMsgs]      = useState(false);
  const [socketConnected, setSocketConnected]  = useState(false);
  const [typingUsers,     setTypingUsers]      = useState({});  // { chatId: { userId: name } }
  const [unreadCounts,    setUnreadCounts]     = useState({});  // { chatId: number }

  const socketRef     = useRef(null);
  const activeChatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimer   = useRef(null);   // debounce for outgoing typing
  const clearTimers   = useRef({});     // per-user clear timers

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  /* ─── load chats ─── */
  const loadChats = useCallback(() => {
    setLoadingChats(true);
    api.get('/api/chat')
      .then((data) => {
        const list = data.chats ?? [];
        setChats(list);
        setActiveChat((prev) => prev ?? list[0] ?? null);
        // seed unread counts from API response if available
        const counts = {};
        list.forEach((c) => { if (c.unreadCount) counts[c.id] = c.unreadCount; });
        setUnreadCounts(counts);
      })
      .catch(() => {})
      .finally(() => setLoadingChats(false));
  }, []);

  useEffect(() => { if (user) loadChats(); }, [user]);

  /* ─── load messages on chat change ─── */
  useEffect(() => {
    if (!activeChat) return;
    setLoadingMsgs(true);
    setMessages([]);
    // Clear unread when opening a chat
    setUnreadCounts((prev) => ({ ...prev, [activeChat.id]: 0 }));
    api.get(`/api/chat/${activeChat.id}/messages`)
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeChat?.id]);

  /* ─── socket ─── */
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
      if (activeChatRef.current?.id)
        socket.emit('join_chat', activeChatRef.current.id);
    });

    socket.on('disconnect', () => setSocketConnected(false));

    /* incoming message */
    socket.on('receive_message', (msg) => {
      const isCurrent = msg.chatId === activeChatRef.current?.id;

      if (isCurrent) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        // Emit seen for the new message
        socket.emit('message_seen', { messageId: msg.id, chatId: msg.chatId });
      } else {
        // Increment unread badge for other chats
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.chatId]: (prev[msg.chatId] ?? 0) + 1,
        }));
        // Refresh chat list to bump it to the top
        setChats((prev) => {
          const idx = prev.findIndex((c) => c.id === msg.chatId);
          if (idx < 0) return prev;
          const updated = { ...prev[idx], lastMessage: msg, updatedAt: msg.createdAt };
          return [updated, ...prev.filter((c) => c.id !== msg.chatId)];
        });
      }
    });

    /* message status updates */
    socket.on('message_status', ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, status } : m)
      );
    });

    /* typing events */
    socket.on('user_typing', ({ chatId, userId, userName }) => {
      if (userId === user.id) return;
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: { ...(prev[chatId] ?? {}), [userId]: userName },
      }));
      // auto-clear this user's typing indicator after TYPING_CLEAR_MS
      clearTimeout(clearTimers.current[userId]);
      clearTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => {
          const chat = { ...(prev[chatId] ?? {}) };
          delete chat[userId];
          return { ...prev, [chatId]: chat };
        });
      }, TYPING_CLEAR_MS);
    });

    socket.on('user_stop_typing', ({ chatId, userId }) => {
      clearTimeout(clearTimers.current[userId]);
      setTypingUsers((prev) => {
        const chat = { ...(prev[chatId] ?? {}) };
        delete chat[userId];
        return { ...prev, [chatId]: chat };
      });
    });

    /* online status */
    socket.on('user_status', ({ userId, isOnline }) => {
      setChats((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants?.map((p) =>
            p.id === userId ? { ...p, isOnline } : p
          ),
        }))
      );
    });

    return () => {
      Object.values(clearTimers.current).forEach(clearTimeout);
      socket.disconnect();
    };
  }, [user, token]);

  /* join room on chat change */
  useEffect(() => {
    if (activeChat && socketRef.current?.connected)
      socketRef.current.emit('join_chat', activeChat.id);
  }, [activeChat?.id]);

  /* scroll on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ─── outgoing typing helpers ─── */
  const emitTyping = useCallback(() => {
    if (!socketRef.current?.connected || !activeChatRef.current) return;
    clearTimeout(typingTimer.current);
    socketRef.current.emit('typing', {
      chatId: activeChatRef.current.id,
      userId: user.id,
      userName: user.name,
    });
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', {
        chatId: activeChatRef.current?.id,
        userId: user.id,
      });
    }, TYPING_CLEAR_MS);
  }, [user]);

  const emitStopTyping = useCallback(() => {
    clearTimeout(typingTimer.current);
    if (!socketRef.current?.connected || !activeChatRef.current) return;
    socketRef.current.emit('stop_typing', {
      chatId: activeChatRef.current.id,
      userId: user.id,
    });
  }, [user]);

  /* ─── message builders ─── */
  const buildBase = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chatId: activeChat?.id,
    senderId: user?.id,
    senderName: user?.name || 'User',
    createdAt: new Date().toISOString(),
    status: 'sent',
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
      ...buildBase(),
      kind: 'sign',
      text: payload.text?.trim() || sourceText,
      sourceText,
      signs:        Array.isArray(payload.signs)        ? payload.signs        : [],
      segments:     Array.isArray(payload.segments)     ? payload.segments     : [],
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

  /* typing label for current chat */
  const typingLabel = useCallback((chatId) => {
    const users = Object.values(typingUsers[chatId] ?? {});
    if (!users.length) return '';
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return 'Several people are typing...';
  }, [typingUsers]);

  return {
    chats, setChats,
    activeChat, setActiveChat,
    messages,
    loadingChats, loadingMsgs,
    messagesEndRef,
    sendText, sendSign,
    createPrivateChat,
    socketConnected,
    typingLabel,
    unreadCounts,
    emitTyping,
    emitStopTyping,
  };
}
