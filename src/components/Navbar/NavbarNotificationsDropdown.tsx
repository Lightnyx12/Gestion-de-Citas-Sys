// src/components/Navbar/NavbarNotificationsDropdown.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CalendarPlus,
  CalendarX,
  RefreshCw,
  CheckCheck,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import {
  formatRelativeTime,
  type Notification,
  type NotificationType,
} from '../../lib/notification-service';

// ─── Config visual por tipo (igual que NotificationsCenter) ──────────────────

interface TypeCfg {
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeText: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeCfg> = {
  nueva_cita: {
    Icon: CalendarPlus,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'Nueva cita',
  },
  reprogramacion: {
    Icon: RefreshCw,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'Reprogramación',
  },
  cancelacion: {
    Icon: CalendarX,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badge: 'bg-red-50 text-red-700 border-red-200',
    badgeText: 'Cancelación',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  unreadCount: number;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function NavbarNotificationsDropdown({
  unreadCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Cierra al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Solo muestra las últimas 6
  const preview = notifications.slice(0, 6);

  const handleViewAll = () => {
    onClose();
    navigate('/doctor/notifications');
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[999] overflow-hidden"
      style={{ animation: 'dropdownIn 0.15s ease' }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-gray-800">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            title="Marcar todas como leídas"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
          >
            <CheckCheck size={13} />
            Leer todas
          </button>
        )}
      </div>

      {/* ─── Lista ──────────────────────────────────────────────────────────── */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
        {preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
            <BellOff size={32} strokeWidth={1.5} />
            <p className="text-sm font-medium">Sin notificaciones</p>
          </div>
        ) : (
          preview.map(n => {
            const cfg = TYPE_CONFIG[n.tipo];
            const Icon = cfg.Icon;
            return (
              <div
                key={n.id}
                className={`group relative flex items-start gap-3 px-4 py-3 transition-colors
                  ${n.leida ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50'}`}
              >
                {/* Punto de no leída */}
                {!n.leida && (
                  <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-blue-500" />
                )}

                {/* Ícono */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.iconBg}`}>
                  <Icon className={cfg.iconColor} size={16} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                      {cfg.badgeText}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatRelativeTime(n.created_at)}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate leading-snug">{n.titulo}</p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-0.5">{n.mensaje}</p>
                </div>

                {/* Acciones hover */}
                <div className="absolute top-2 right-6 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.leida && (
                    <button
                      onClick={() => onMarkAsRead(n.id)}
                      title="Marcar como leída"
                      className="p-1 rounded-md text-blue-500 hover:bg-blue-100 transition cursor-pointer"
                    >
                      <CheckCheck size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(n.id)}
                    title="Eliminar"
                    className="p-1 rounded-md text-red-400 hover:bg-red-100 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
          >
            Ver todas las notificaciones
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Animación keyframe inline */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
