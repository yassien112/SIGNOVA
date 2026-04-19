import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { CHAT_SOCKET_URL } from '../lib/config';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function useChat() {
  const { user, token } = useAuthStore();

  const [chats, setChats]               = useState([]);
  const [activeChat, setActiveChat]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef      = useRef(null);
  const activeChatRef  = useRef(null);
  const messagesEndRef = useRef(null);

  // Keep ref in sync so socket handlers always see latest activeChat
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  /* ── load chats ── */
  const loadChats = useCallback(() => {
    setLoadingChats(true);
    api.get('/api/chat')
      .then((data) => {
        const list = data.chats ?? [];
        setChats(list);
        setActiveChat((prev) => prev ?? list[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingChats(false));
  }, []);

  useEffect(() => { if (user) loadChats(); }, [user]);

  /* ── load messages on chat change ── */
  useEffect(() => {
    if (!activeChat) return;
    setLoadingMsgs(true);
    setMessages([]);
    api.get(`/api/chat/${activeChat.id}/messages`)
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeChat?.id]);

  /* ── socket ── */
  useEffect(() => {
    if (!user || !token) return;

    const socket = io(CHAT_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      // Send JWT so backend can auth the socket
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Register userId (graceful fallback if middleware didn't set it)
      socket.emit('register', user.id);
      // Re-join active chat room on reconnect
      if (activeChatRef.current?.id) {
        socket.emit('join_chat', activeChatRef.current.id);
      }
    });

    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('receive_message', (msg) => {
      // Only show message if it belongs to the currently open chat
      if (msg.chatId !== activeChatRef.current?.id) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    socket.on('user_status', ({ userId, isOnline }) => {
      setChats((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants?.map((p) =>
            p.id === userId ? { ...p, isOnline } : p
          )
        }))
      );
    });

    return () => socket.disconnect();
  }, [user, token]);

  /* ── join room on chat change ── */
  useEffect(() => {
    if (activeChat && socketRef.current?.connected) {
      socketRef.current.emit('join_chat', activeChat.id);
    }
  }, [activeChat?.id]);

  /* ── scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── helpers ── */
  const buildBase = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chatId: activeChat?.id,
    senderId: user?.id,
    senderName: user?.name || 'User',
    createdAt: new Date().toISOString(),
  });

  const emitMessage = (msg) => {
    if (!socketRef.current?.connected || !activeChat) return false;
    socketRef.current.emit('send_message', msg);
    return true;
  };

  const sendText = (text) => {
    const t = text.trim();
    if (!t || !activeChat) return;
    emitMessage({ ...buildBase(), kind: 'text', text: t, status: 'sent' });
  };

  const sendSign = (payload) => {
    const sourceText = payload.sourceText?.trim() || payload.text?.trim() || '';
    if (!sourceText || !activeChat) return;
    emitMessage({
      ...buildBase(),
      kind: 'sign',
      text: payload.text?.trim() || sourceText,
      sourceText,
      signs: Array.isArray(payload.signs) ? payload.signs : [],
      segments: Array.isArray(payload.segments) ? payload.segments : [],
      matchedWords: Array.isArray(payload.matchedWords) ? payload.matchedWords : [],
      missingWords: Array.isArray(payload.missingWords) ? payload.missingWords : [],
      status: 'sent',
    });
  };

  const createPrivateChat = async (participantEmail) => {
    const data = await api.post('/api/chat/private', { participantEmail });
    const chat = data.chat;
    setChats((prev) => prev.some((c) => c.id === chat.id) ? prev : [chat, ...prev]);
    setActiveChat(chat);
    return chat;
  };

  return {
    chats, setChats,
    activeChat, setActiveChat,
    messages,
    loadingChats, loadingMsgs,
    messagesEndRef,
    sendText, sendSign,
    createPrivateChat,
    socketConnected,
  };
}
