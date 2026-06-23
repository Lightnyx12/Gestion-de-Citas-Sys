import { Bell, User, BriefcaseMedical, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notification-service';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const navigate   = useNavigate();
  const { logout, user } = useAuth();
  const isDoctor   = user?.role === 'doctor';

  // ── Badge de notificaciones: solo para doctores ──────────────────────────
  useEffect(() => {
    if (!isDoctor) return;

    let doctorId: string | null = null;

    const setup = async () => {
      doctorId = await notificationService.getDoctorId();
      if (!doctorId) return;

      // Carga inicial del contador
      const count = await notificationService.getUnreadCount(doctorId);
      setUnreadCount(count);

      // Realtime: incrementa el badge en cada nueva notificación
      channelRef.current = supabase
        .channel(`navbar-notif:${doctorId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones',
            filter: `doctor_id=eq.${doctorId}`,
          },
          () => setUnreadCount(prev => prev + 1)
        )
        .subscribe();
    };

    setup();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [isDoctor]);

  // Cuando el doctor navega a /doctor/notifications, resetea el badge
  const handleBellClick = () => {
    setUnreadCount(0);
    navigate('/doctor/notifications');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40">
      <div className="h-16 px-6 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BriefcaseMedical size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AuraHealth</h1>
            <p className="text-xs text-gray-500">Medical Portal</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* Campana — solo para doctores */}
          {isDoctor && (
            <button
              onClick={handleBellClick}
              title="Ver notificaciones"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <User size={20} className="text-gray-600" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
