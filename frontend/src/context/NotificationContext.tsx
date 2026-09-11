import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  refreshNotifications: () => void;
  markAsRead: (id: string) => void;
  lowStockAlertProduct: Product | null;
  setLowStockAlertProduct: (prod: Product | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lowStockAlertProduct, setLowStockAlertProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  const showToast = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshNotifications = useCallback(() => {
    if (!user) return;
    api.getNotifications()
      .then(res => {
        if (res.success) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      })
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      if (id === 'all') {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      } else {
        setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, is_read: 1 }) : n));
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      toasts,
      showToast,
      removeToast,
      refreshNotifications,
      markAsRead,
      lowStockAlertProduct,
      setLowStockAlertProduct
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
