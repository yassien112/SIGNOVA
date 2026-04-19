import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getChatSocketUrl } from '../lib/config';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { tokenStorage } from '../lib/api';

let socket = null;

export function useChat(chatId) {
  const { user }                = useAuthStore();
  const {
    fetchMessages, appendMessage,
    updateMessageStatus, updateReactions,
    incrementUnread, activeChat,
  }                             = useChatStore();
  const joinedRef               = useRef(null);

  /* ── Connect socket once ── */
  useEffect(() => {
    if (socket?.connected) return;

    socket = io(getChatSocketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: tokenStorage.getAccess() },
    });

    socket.on('connect', () => {
      if (user?.id) socket.emit('register', user.id);
    });

    socket.on('receive_message', (msg) => {
      appendMessage(msg.chatId, msg);
      if (msg.chatId !== chatId) incrementUnread(msg.chatId);
    });

    socket.on('message_status', ({ messageId, status }) => {
      if (chatId) updateMessageStatus(chatId, messageId, status);
    });

    socket.on('message_reactions', ({ messageId, reactions }) => {
      if (chatId) updateReactions(chatId, messageId, reactions);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);

  /* ── Join room when chatId changes ── */
  useEffect(() => {
    if (!chatId || !socket?.connected) return;
    if (joinedRef.current === chatId) return;
    socket.emit('join_chat', chatId);
    joinedRef.current = chatId;
    fetchMessages(chatId);
  }, [chatId]);

  /* ── Send message via socket ── */
  const sendMessage = useCallback((text, extra = {}) => {
    if (!socket?.connected || !chatId || !user) return;
    socket.emit('send_message', {
      chatId,
      text,
      senderId:     user.id,
      senderName:   user.name,
      senderAvatar: user.avatar,
      ...extra,
    });
  }, [chatId, user]);

  /* ── Send sticker via socket ── */
  const sendSticker = useCallback((sign) => {
    if (!socket?.connected || !chatId || !user) return;
    socket.emit('send_message', {
      chatId,
      text:         sign.word || sign.label,
      kind:         'sticker',
      senderId:     user.id,
      senderName:   user.name,
      senderAvatar: user.avatar,
      signs:        [{ id: sign.id, word: sign.word, imageUrl: sign.imageUrl, thumbUrl: sign.thumbUrl }],
    });
  }, [chatId, user]);

  /* ── Send sign message via socket ── */
  const sendSignMessage = useCallback((text, signs, extra = {}) => {
    if (!socket?.connected || !chatId || !user) return;
    socket.emit('send_message', {
      chatId,
      text,
      kind:         'sign',
      senderId:     user.id,
      senderName:   user.name,
      senderAvatar: user.avatar,
      signs,
      ...extra,
    });
  }, [chatId, user]);

  const emitTyping     = useCallback(() => {
    socket?.emit('typing', { chatId, userId: user?.id, userName: user?.name });
  }, [chatId, user]);

  const emitStopTyping = useCallback(() => {
    socket?.emit('stop_typing', { chatId, userId: user?.id });
  }, [chatId, user]);

  const emitSeen       = useCallback((messageId) => {
    socket?.emit('message_seen', { messageId, chatId });
  }, [chatId]);

  const toggleReaction = useCallback((messageId, emoji) => {
    socket?.emit('toggle_reaction', { chatId, messageId, emoji });
  }, [chatId]);

  const loadMore       = useCallback(() => {
    const cursor = useChatStore.getState().nextCursor[chatId];
    if (cursor) fetchMessages(chatId, { before: cursor });
  }, [chatId]);

  return {
    socket,
    sendMessage,
    sendSticker,
    sendSignMessage,
    emitTyping,
    emitStopTyping,
    emitSeen,
    toggleReaction,
    loadMore,
  };
}
