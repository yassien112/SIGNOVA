import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_ICON = {
  message:   '💬',
  sign_sent: '🤟',
  mention:   '@',
  welcome:   '👋',
  system:    '🔔',
};

export default function NotificationBell() {
  const { isAuthenticated }                                             = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount,
          markRead, markAllRead, deleteNotification, clearRead, isLoading } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  // Fetch unread count on mount / auth change
  useEffect(() => {
    if (isAuthenticated) fetchUnreadCount();
  }, [isAuthenticated]);

  // Load list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            <div className="notif-dropdown-actions">
              {unreadCount > 0 && (
                <button type="button" className="notif-action-btn" onClick={markAllRead} title="Mark all read">
                  <CheckCheck size={14} />
                </button>
              )}
              <button type="button" className="notif-action-btn" onClick={clearRead} title="Clear read">
                <Trash2 size={14} />
              </button>
              <button type="button" className="notif-action-btn" onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="notif-list">
            {isLoading && notifications.length === 0 && (
              <div className="notif-empty">Loading…</div>
            )}
            {!isLoading && notifications.length === 0 && (
              <div className="notif-empty">No notifications yet 🎉</div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item${n.readStatus ? '' : ' unread'}`}
                onClick={() => { if (!n.readStatus) markRead(n.id); if (n.link) window.location.href = n.link; }}
              >
                <span className="notif-type-icon">{TYPE_ICON[n.type] || '🔔'}</span>
                <div className="notif-item-body">
                  {n.title && <span className="notif-item-title">{n.title}</span>}
                  <span className="notif-item-msg">{n.message}</span>
                  <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                </div>
                <div className="notif-item-actions">
                  {!n.readStatus && (
                    <button type="button" className="notif-action-btn"
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      title="Mark read">
                      <Check size={12} />
                    </button>
                  )}
                  <button type="button" className="notif-action-btn"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    title="Delete">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
