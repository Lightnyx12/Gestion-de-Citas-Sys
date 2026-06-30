import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { notificationService, type Notification } from '../notification-service';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useNotificationBell(isDoctor: boolean) {
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [doctorId,      setDoctorId]      = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ─── Carga inicial ───────────────────────────────────────────────────────────
  const reload = useCallback(async (docId: string) => {
    const [all, count] = await Promise.all([
      notificationService.getAll(docId),
      notificationService.getUnreadCount(docId),
    ]);
    setNotifications(all);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    if (!isDoctor) return;

    let docId: string | null = null;

    const setup = async () => {
      docId = await notificationService.getDoctorId();
      if (!docId) return;

      setDoctorId(docId);
      await reload(docId);

      // Realtime: escucha nuevas notificaciones
      channelRef.current = supabase
        .channel(`navbar-notif:${docId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones',
            filter: `doctor_id=eq.${docId}`,
          },
          async () => {
            await reload(docId!);
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [isDoctor, reload]);

  // ─── Acciones ────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (notifId: string) => {
    await notificationService.markAsRead(notifId);
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, leida: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!doctorId) return;
    await notificationService.markAllAsRead(doctorId);
    setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
    setUnreadCount(0);
  }, [doctorId]);

  const deleteNotif = useCallback(async (notifId: string) => {
    const n = notifications.find(x => x.id === notifId);
    await notificationService.delete(notifId);
    setNotifications(prev => prev.filter(x => x.id !== notifId));
    if (n && !n.leida) setUnreadCount(prev => Math.max(0, prev - 1));
  }, [notifications]);

  return {
    unreadCount,
    notifications,
    doctorId,
    markAsRead,
    markAllAsRead,
    deleteNotif,
  };
}
