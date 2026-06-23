// src/pages/Doctor/NotificationsCenter.tsx
import { useEffect, useState, useCallback } from 'react'
import {
  Bell,
  BellOff,
  CalendarPlus,
  CalendarX,
  RefreshCw,
  CheckCheck,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  notificationService,
  formatRelativeTime,
  type Notification,
  type NotificationType,
} from '../../lib/notification-service'

// ─── Tipos de filtro ──────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | NotificationType

interface TabDef {
  id: FilterTab
  label: string
}

const TABS: TabDef[] = [
  { id: 'all',           label: 'Todas'          },
  { id: 'unread',        label: 'No leídas'      },
  { id: 'nueva_cita',    label: 'Nuevas'         },
  { id: 'reprogramacion',label: 'Reprogramadas'  },
  { id: 'cancelacion',   label: 'Canceladas'     },
]

// ─── Configuración visual por tipo ───────────────────────────────────────────

interface TypeConfig {
  Icon: React.ComponentType<{ className?: string; size?: number }>
  iconBg: string
  iconColor: string
  badge: string
  badgeText: string
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  nueva_cita: {
    Icon: CalendarPlus,
    iconBg:    'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badge:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'Nueva cita',
  },
  reprogramacion: {
    Icon: RefreshCw,
    iconBg:    'bg-blue-100',
    iconColor: 'text-blue-600',
    badge:     'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'Reprogramación',
  },
  cancelacion: {
    Icon: CalendarX,
    iconBg:    'bg-red-100',
    iconColor: 'text-red-600',
    badge:     'bg-red-50 text-red-700 border-red-200',
    badgeText: 'Cancelación',
  },
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse flex gap-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  )
}

// ─── Tarjeta de notificación ──────────────────────────────────────────────────

interface NotificationCardProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  markingId: string | null
  deletingId: string | null
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  markingId,
  deletingId,
}: NotificationCardProps) {
  const cfg = TYPE_CONFIG[notification.tipo]
  const Icon = cfg.Icon
  const isMarkingThis  = markingId  === notification.id
  const isDeletingThis = deletingId === notification.id

  return (
    <div
      className={`group relative bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 flex gap-4 items-start
        ${notification.leida
          ? 'border-gray-100 opacity-75 hover:opacity-100'
          : 'border-blue-100 ring-1 ring-blue-50 hover:ring-blue-100'
        }`}
    >
      {/* Punto de no leída */}
      {!notification.leida && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
      )}

      {/* Ícono */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
        <Icon className={cfg.iconColor} size={22} />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.badgeText}
          </span>
          <span className="text-xs text-gray-400">{formatRelativeTime(notification.created_at)}</span>
        </div>

        <p className="text-sm font-semibold text-gray-800 leading-snug mb-0.5">
          {notification.titulo}
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          {notification.mensaje}
        </p>
      </div>

      {/* Acciones — visibles en hover */}
      <div className="absolute top-3 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {!notification.leida && (
          <button
            onClick={() => onMarkRead(notification.id)}
            disabled={isMarkingThis}
            title="Marcar como leída"
            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition disabled:opacity-50"
          >
            {isMarkingThis
              ? <Loader2 size={15} className="animate-spin" />
              : <CheckCheck size={15} />
            }
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          disabled={isDeletingThis}
          title="Eliminar"
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition disabled:opacity-50"
        >
          {isDeletingThis
            ? <Loader2 size={15} className="animate-spin" />
            : <Trash2 size={15} />
          }
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function NotificationsCenter() {
  const [doctorId,       setDoctorId]       = useState<string | null>(null)
  const [notifications,  setNotifications]  = useState<Notification[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeTab,      setActiveTab]      = useState<FilterTab>('all')
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [markingId,      setMarkingId]      = useState<string | null>(null)
  const [deletingId,     setDeletingId]     = useState<string | null>(null)

  // ─── Inicialización ─────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async (docId: string) => {
    try {
      setLoading(true)
      const data = await notificationService.getAll(docId)
      setNotifications(data)
    } catch (err) {
      console.error('Error al cargar notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let subscription: ReturnType<typeof import('../../lib/supabase').supabase.channel> | null = null

    const init = async () => {
      const docId = await notificationService.getDoctorId()
      if (!docId) return

      setDoctorId(docId)
      await loadNotifications(docId)

      // ─── Realtime: escuchar INSERTs en la tabla notificaciones ─────────────
      const { supabase } = await import('../../lib/supabase')

      subscription = supabase
        .channel(`notifications:${docId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones',
            filter: `doctor_id=eq.${docId}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev])
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [loadNotifications])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleMarkRead = async (id: string) => {
    setMarkingId(id)
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      )
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await notificationService.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    if (!doctorId) return
    setMarkingAllRead(true)
    try {
      await notificationService.markAllAsRead(doctorId)
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingAllRead(false)
    }
  }

  // ─── Derivados ───────────────────────────────────────────────────────────────

  const filtered = notifications.filter(n => {
    if (activeTab === 'all')    return true
    if (activeTab === 'unread') return !n.leida
    return n.tipo === activeTab
  })

  const unreadCount = notifications.filter(n => !n.leida).length

  const tabCount = (tab: FilterTab): number => {
    if (tab === 'all')    return notifications.length
    if (tab === 'unread') return unreadCount
    return notifications.filter(n => n.tipo === tab).length
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-3xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
              <Bell className="w-8 h-8" />
              Notificaciones
            </h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0
                ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
                : 'Estás al día con todas tus notificaciones'
              }
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer shrink-0"
            >
              {markingAllRead
                ? <Loader2 size={16} className="animate-spin" />
                : <CheckCheck size={16} />
              }
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TABS.map(tab => {
            const count = tabCount(tab.id)
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer
                  ${isActive
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:text-blue-900'
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          // Estado vacío
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BellOff className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              {activeTab === 'unread' ? 'Sin notificaciones pendientes' : 'Sin notificaciones'}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
              {activeTab === 'unread'
                ? 'Estás al día. Cuando un paciente agende o modifique una cita, aparecerá aquí.'
                : 'Aún no hay actividad registrada para esta categoría.'
              }
            </p>
          </div>
        ) : (
          // Lista de notificaciones
          <div className="space-y-3">
            {filtered.map(n => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                markingId={markingId}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}