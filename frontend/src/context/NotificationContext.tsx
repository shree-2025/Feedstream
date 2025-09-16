import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/api';

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message?: string;
  link?: string;
  roleScope?: string;
  createdAt: string;
  read?: 0 | 1;
};

export type NotificationContextType = {
  items: NotificationItem[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const pollRef = useRef<number | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/notifications/summary');
      setUnread(Number(res?.data?.unread || 0));
    } catch {}
  }, []);

  const fetchList = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setItems(res?.data?.items || []);
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSummary(), fetchList()]);
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, fetchList]);

  const markRead = useCallback(async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems(prev => prev.map(n => (n.id === id ? { ...n, read: 1 } : n)));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setItems(prev => prev.map(n => ({ ...n, read: 1 })));
      setUnread(0);
    } catch {}
  }, []);

  useEffect(() => {
    // initial load
    refresh();
    // polling every 45s for summary and list (lightweight)
    pollRef.current = window.setInterval(() => {
      fetchSummary();
    }, 45000) as unknown as number;
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [refresh, fetchSummary]);

  const value = useMemo(() => ({ items, unread, loading, refresh, markRead, markAllRead }), [items, unread, loading, refresh, markRead, markAllRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
