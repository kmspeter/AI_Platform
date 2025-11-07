import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const NotificationContext = createContext();

const MAX_NOTIFICATIONS = 50;
const STORAGE_KEY = 'notifications';

const normalizeNotification = (notification) => {
  const { title, message, type = 'info', level = 'info', metadata = {}, read = false } = notification;
  const id = notification.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const createdAt = notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString();

  return {
    id,
    title: title || '',
    message: message || '',
    type,
    level,
    metadata,
    read,
    createdAt,
  };
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNotifications(parsed.map(normalizeNotification));
        }
      }
    } catch (error) {
      console.error('Failed to restore notifications:', error);
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to persist notifications:', error);
    }
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => {
      const next = [normalizeNotification(notification), ...prev];
      if (next.length > MAX_NOTIFICATIONS) {
        return next.slice(0, MAX_NOTIFICATIONS);
      }
      return next;
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => (
      notification.read ? notification : { ...notification, read: true }
    )));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clearNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
