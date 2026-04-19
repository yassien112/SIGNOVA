/**
 * useNotifications
 * Connects Socket.IO notification:new events to the notificationStore.
 * Use once at the app root level (e.g. inside App.jsx after login).
 */
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../lib/config';
import { useNotificationStore } from '../store/notificationStore';
import { tokenStorage } from '../lib/api';

let notifSocket = null;

export function useNotifications(isAuthenticated) {
  const pushNotification  = useNotificationStore((s) => s.pushNotification);
  const fetchUnreadCount  = useNotificationStore((s) => s.fetchUnreadCount);

  useEffect(() => {
    if (!isAuthenticated) {
      notifSocket?.disconnect();
      notifSocket = null;
      return;
    }

    if (notifSocket?.connected) return;

    notifSocket = io(getSocketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: tokenStorage.getAccess() },
      namespace: '/chat',
    });

    notifSocket.on('connect', () => {
      fetchUnreadCount();
    });

    notifSocket.on('notification:new', (notification) => {
      pushNotification(notification);
    });

    return () => {
      notifSocket?.disconnect();
      notifSocket = null;
    };
  }, [isAuthenticated]);
}
