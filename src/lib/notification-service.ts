import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'nueva_cita' | 'reprogramacion' | 'cancelacion'

export interface Notification {
  id: string
  doctor_id: string
  tipo: NotificationType
  titulo: string
  mensaje: string
  cita_id: string | null
  leida: boolean
  created_at: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const notificationService = {

  /** Obtiene el doctor_id a partir del usuario autenticado */
  async getDoctorId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('doctores')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (error) {
      console.error('Error al obtener doctor_id:', error)
      return null
    }
    return data?.id ?? null
  },

  /** Obtiene todas las notificaciones del doctor, ordenadas por fecha descendente */
  async getAll(doctorId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Notification[]
  },

  /** Número de notificaciones no leídas del doctor */
  async getUnreadCount(doctorId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('leida', false)

    if (error) {
      console.error('Error al obtener no leídas:', error)
      return 0
    }
    return count ?? 0
  },

  /** Marca una notificación individual como leída */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', notificationId)

    if (error) throw error
  },

  /** Marca todas las notificaciones del doctor como leídas */
  async markAllAsRead(doctorId: string): Promise<void> {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('doctor_id', doctorId)
      .eq('leida', false)

    if (error) throw error
  },

  /** Elimina una notificación */
  async delete(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  },
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

/**
 * Devuelve una cadena de tiempo relativo en español.
 * Ej: "hace 5 minutos", "hace 2 horas", "hace 3 días"
 */
export function formatRelativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then

  const mins  = Math.floor(diffMs / 60_000)
  const hours = Math.floor(diffMs / 3_600_000)
  const days  = Math.floor(diffMs / 86_400_000)

  if (mins < 1)   return 'ahora mismo'
  if (mins < 60)  return `hace ${mins} min`
  if (hours < 24) return `hace ${hours} h`
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}
