import { supabase } from './supabase'

export interface WeeklyAvailability {
  id?: string
  doctor_id: string
  dia_semana: number // 1: Lunes, 7: Domingo
  hora_inicio: string // 'HH:MM'
  hora_fin: string // 'HH:MM'
}

export interface RecurrentPause {
  id?: string
  doctor_id: string
  nombre: string
  hora_inicio: string
  hora_fin: string
}

export interface AgendaBlock {
  id?: string
  doctor_id: string
  fecha_inicio: string // YYYY-MM-DD
  fecha_fin: string // YYYY-MM-DD
  descripcion: string
}

export const availabilityService = {
  // Obtener ID de Doctor a partir del usuario_id
  async getDoctorId(usuarioId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('doctores')
      .select('id')
      .eq('usuario_id', usuarioId)
      .single()

    if (error) {
      console.error('Error al obtener doctor_id:', error)
      return null
    }
    return data?.id || null
  },

  // Obtener toda la configuración de disponibilidad de un doctor
  async getDoctorConfig(doctorId: string) {
    const [weeklyRes, pauseRes, blocksRes] = await Promise.all([
      supabase.from('disponibilidad_semanal').select('*').eq('doctor_id', doctorId).order('dia_semana').order('hora_inicio'),
      supabase.from('pausas_recurrentes').select('*').eq('doctor_id', doctorId),
      supabase.from('bloqueos_agenda').select('*').eq('doctor_id', doctorId).gte('fecha_fin', new Date().toISOString().split('T')[0]).order('fecha_inicio')
    ])

    if (weeklyRes.error) throw weeklyRes.error
    if (pauseRes.error) throw pauseRes.error
    if (blocksRes.error) throw blocksRes.error

    return {
      weekly: weeklyRes.data as WeeklyAvailability[],
      pauses: pauseRes.data as RecurrentPause[],
      blocks: blocksRes.data as AgendaBlock[]
    }
  },

  // Guardar configuración completa de disponibilidad (transaccional simulado)
  async saveConfig(
    doctorId: string,
    weekly: Omit<WeeklyAvailability, 'doctor_id'>[],
    pauses: Omit<RecurrentPause, 'doctor_id'>[]
  ) {
    // 1. Eliminar anteriores
    const { error: delWeeklyErr } = await supabase
      .from('disponibilidad_semanal')
      .delete()
      .eq('doctor_id', doctorId)

    if (delWeeklyErr) throw delWeeklyErr

    const { error: delPausesErr } = await supabase
      .from('pausas_recurrentes')
      .delete()
      .eq('doctor_id', doctorId)

    if (delPausesErr) throw delPausesErr

    // 2. Insertar nuevos semanales si existen
    if (weekly.length > 0) {
      const weeklyData = weekly.map(item => ({ ...item, doctor_id: doctorId }))
      const { error: insWeeklyErr } = await supabase
        .from('disponibilidad_semanal')
        .insert(weeklyData)

      if (insWeeklyErr) throw insWeeklyErr
    }

    // 3. Insertar nuevas pausas si existen
    if (pauses.length > 0) {
      const pausesData = pauses.map(item => ({ ...item, doctor_id: doctorId }))
      const { error: insPausesErr } = await supabase
        .from('pausas_recurrentes')
        .insert(pausesData)

      if (insPausesErr) throw insPausesErr
    }

    return true
  },

  // Añadir un bloqueo de agenda (vacaciones/evento)
  async addBlock(block: Omit<AgendaBlock, 'id'>) {
    const { data, error } = await supabase
      .from('bloqueos_agenda')
      .insert([block])
      .select()
      .single()

    if (error) throw error
    return data as AgendaBlock
  },

  // Eliminar un bloqueo
  async deleteBlock(blockId: string) {
    const { error } = await supabase
      .from('bloqueos_agenda')
      .delete()
      .eq('id', blockId)

    if (error) throw error
    return true
  },

  // Algoritmo dinámico para calcular slots disponibles en una fecha específica
  async getAvailableSlots(doctorId: string, dateStr: string): Promise<{ slots: string[]; blocked: boolean; blockReason?: string }> {
    // 1. Verificar bloqueos de agenda
    const { data: blocks, error: blocksErr } = await supabase
      .from('bloqueos_agenda')
      .select('*')
      .eq('doctor_id', doctorId)

    if (blocksErr) throw blocksErr

    const targetDate = new Date(dateStr + 'T00:00:00')
    const activeBlock = blocks?.find(b => {
      const start = new Date(b.fecha_inicio + 'T00:00:00')
      const end = new Date(b.fecha_fin + 'T00:00:00')
      return targetDate >= start && targetDate <= end
    })

    if (activeBlock) {
      return { slots: [], blocked: true, blockReason: activeBlock.descripcion }
    }

    // 2. Obtener día de la semana (Javascript: 0 para Domingo, 1 para Lunes. Queremos 1 para Lunes y 7 para Domingo)
    // El dateStr viene como YYYY-MM-DD
    const dayIndex = targetDate.getDay() // 0 (Dom) - 6 (Sab)
    const dbDayOfWeek = dayIndex === 0 ? 7 : dayIndex

    // 3. Obtener configuración semanal y pausas recurrentes
    const [weeklyRes, pausesRes, occupiedRes] = await Promise.all([
      supabase.from('disponibilidad_semanal').select('*').eq('doctor_id', doctorId).eq('dia_semana', dbDayOfWeek),
      supabase.from('pausas_recurrentes').select('*').eq('doctor_id', doctorId),
      supabase.from('citas')
        .select('fecha_hora')
        .eq('doctor_id', doctorId)
        .gte('fecha_hora', `${dateStr}T00:00:00`)
        .lte('fecha_hora', `${dateStr}T23:59:59`)
        .neq('estado', 'cancelada')
    ])

    if (weeklyRes.error) throw weeklyRes.error
    if (pausesRes.error) throw pausesRes.error
    if (occupiedRes.error) throw occupiedRes.error

    const weeklyRanges = weeklyRes.data as WeeklyAvailability[]
    const pauses = pausesRes.data as RecurrentPause[]
    const occupiedTimes = (occupiedRes.data || []).map(item => {
      // Extrae la hora de la fecha en formato HH:MM (asumiendo formato ISO o UTC)
      // Usaremos un formateo limpio
      const dateObj = new Date(item.fecha_hora)
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    })

    if (weeklyRanges.length === 0) {
      return { slots: [], blocked: false } // No atiende este día de la semana
    }

    // 4. Generar slots teóricos de 30 minutos
    const generatedSlots: string[] = []

    weeklyRanges.forEach(range => {
      let current = parseTimeToMinutes(range.hora_inicio)
      const end = parseTimeToMinutes(range.hora_fin)

      while (current + 30 <= end) {
        const slotTimeStr = formatMinutesToTime(current)
        generatedSlots.push(slotTimeStr)
        current += 30 // Citas cada 30 minutos
      }
    })

    // Helper para parsear TIME 'HH:MM:SS' o 'HH:MM' a minutos
    function parseTimeToMinutes(tStr: string): number {
      const parts = tStr.split(':')
      return Number(parts[0]) * 60 + Number(parts[1])
    }

    // Helper para formatear minutos a 'HH:MM'
    function formatMinutesToTime(mins: number): string {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    // 5. Filtrar slots por pausas y citas ocupadas
    const finalSlots = generatedSlots.filter(slot => {
      const slotMins = parseTimeToMinutes(slot)

      // A. ¿Se cruza con alguna pausa?
      const isPaused = pauses.some(pause => {
        const pStart = parseTimeToMinutes(pause.hora_inicio)
        const pEnd = parseTimeToMinutes(pause.hora_fin)
        return slotMins >= pStart && slotMins < pEnd
      })

      if (isPaused) return false

      // B. ¿Está ya ocupado?
      if (occupiedTimes.includes(slot)) return false

      // C. Si es hoy, ¿ya pasó la hora?
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      if (dateStr === todayStr) {
        const nowMins = now.getHours() * 60 + now.getMinutes()
        if (slotMins <= nowMins) return false
      }

      return true
    })

    return { slots: finalSlots, blocked: false }
  }
}
