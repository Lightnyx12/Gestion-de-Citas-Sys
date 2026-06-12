import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { availabilityService } from '../../lib/availability-service'
import type { WeeklyAvailability, RecurrentPause, AgendaBlock } from '../../lib/availability-service'
import { Calendar, Clock, Trash2, Plus, Check, Globe, Coffee, Loader2, AlertCircle } from 'lucide-react'

// Nombres de días de la semana
const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 7, name: 'Domingo' }
]

export default function DoctorAvailability() {
  const { user } = useAuth()
  const [doctorId, setDoctorId] = useState<string | null>(null)
  
  // Estados de datos
  const [weekly, setWeekly] = useState<WeeklyAvailability[]>([])
  const [_pauses, setPauses] = useState<RecurrentPause[]>([])
  const [blocks, setBlocks] = useState<AgendaBlock[]>([])
  
  // Estado UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [blockLoading, setBlockLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning'>('success')

  const openModal = (
  type: 'success' | 'error' | 'warning',
  title: string,
  message: string
) => {
  setModalType(type)
  setModalTitle(title)
  setModalMessage(message)
  setModalOpen(true)
}

const closeModal = () => {
  setModalClosing(true)

  setTimeout(() => {
    setModalClosing(false)
    setModalOpen(false)
  }, 300)
}

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null)

  // Formulario para bloqueos
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockDesc, setBlockDesc] = useState('')

  // Edición de Almuerzo/Pausas (soporta una pausa por defecto, ej: Almuerzo)
  const [lunchStart, setLunchStart] = useState('13:00')
  const [lunchEnd, setLunchEnd] = useState('14:00')
  const [isEditingLunch, setIsEditingLunch] = useState(false)

  // 1. Cargar datos del doctor al montar
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      try {
        const docId = await availabilityService.getDoctorId(user.id)
        if (!docId) {
          setMessage({ text: 'No se encontró tu perfil de médico.', type: 'error' })
          setLoading(false)
          return
        }
        setDoctorId(docId)

        const config = await availabilityService.getDoctorConfig(docId)
        
        // Si no tiene disponibilidad semanal configurada, creamos una por defecto vacía
        setWeekly(config.weekly)
        setBlocks(config.blocks)
        
        // Si tiene pausas, cargamos la primera (Almuerzo) o ponemos por defecto
        if (config.pauses.length > 0) {
          setPauses(config.pauses)
          const lunch = config.pauses.find(p => p.nombre.toLowerCase().includes('almuerzo'))
          if (lunch) {
            setLunchStart(lunch.hora_inicio.substring(0, 5))
            setLunchEnd(lunch.hora_fin.substring(0, 5))
          }
        } else {
          // Pausa por defecto
          setPauses([{
            doctor_id: docId,
            nombre: 'Almuerzo Diario',
            hora_inicio: '13:00:00',
            hora_fin: '14:00:00'
          }])
        }
      } catch (err: any) {
        console.error(err)
        setMessage({ text: 'Error al cargar la configuración.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Helpers para convertir hora militar 24h a formato 12h para la vista
  const formatTime12h = (time24: string) => {
    if (!time24) return ''
    const [hoursStr, minutesStr] = time24.split(':')
    const hours = parseInt(hoursStr)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${String(hours12).padStart(2, '0')}:${minutesStr} ${ampm}`
  }

  // Activar/desactivar un día
  const handleToggleDay = (dayId: number) => {
    const isDayActive = weekly.some(w => w.dia_semana === dayId)

    if (isDayActive) {
      // Si está activo, lo removemos (desactivar)
      setWeekly(prev => prev.filter(w => w.dia_semana !== dayId))
    } else {
      // Si está desactivado, añadimos un rango por defecto (09:00 a 17:00)
      setWeekly(prev => [
        ...prev,
        {
          doctor_id: doctorId || '',
          dia_semana: dayId,
          hora_inicio: '09:00:00',
          hora_fin: '17:00:00'
        }
      ])
    }
  }

  // Añadir un rango a un día activo
  const handleAddRange = (dayId: number) => {
    // Buscamos el último rango de ese día para proponer una hora lógica
    const dayRanges = weekly.filter(w => w.dia_semana === dayId)
    let newStart = '09:00:00'
    let newEnd = '17:00:00'

    if (dayRanges.length > 0) {
      const lastRange = dayRanges[dayRanges.length - 1]
      const lastEndHour = parseInt(lastRange.hora_fin.split(':')[0])
      
      if (lastEndHour < 22) {
        newStart = `${String(lastEndHour + 1).padStart(2, '0')}:00:00`
        newEnd = `${String(lastEndHour + 3).padStart(2, '0')}:00:00`
      }
    }

    setWeekly(prev => [
      ...prev,
      {
        doctor_id: doctorId || '',
        dia_semana: dayId,
        hora_inicio: newStart,
        hora_fin: newEnd
      }
    ])
  }

  // Quitar un rango específico
  const handleRemoveRange = (index: number) => {
    setWeekly(prev => prev.filter((_, i) => i !== index))
  }

  // Modificar las horas de un rango
  const handleUpdateRangeTime = (index: number, field: 'hora_inicio' | 'hora_fin', val: string) => {
    const formattedVal = val.length === 5 ? `${val}:00` : val
    setWeekly(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: formattedVal }
      }
      return item
    }))
  }

  // Guardar configuración general (Disponibilidad semanal y Almuerzo)
  const handleSaveConfig = async () => {
    if (!doctorId) return
    setSaving(true)
    setMessage(null)

    try {
      // Validar que todos los rangos sean lógicos (inicio < fin)
      const hasInvalidRange = weekly.some(w => w.hora_inicio >= w.hora_fin)
      if (hasInvalidRange) {
        setMessage({ text: 'Error: La hora de inicio debe ser menor que la de fin en todos los rangos.', type: 'error' })
        setSaving(false)
        return
      }

      // Preparar la pausa (Almuerzo)
      const lunchPause = {
        nombre: 'Almuerzo Diario',
        hora_inicio: `${lunchStart}:00`,
        hora_fin: `${lunchEnd}:00`
      }

      await availabilityService.saveConfig(doctorId, weekly, [lunchPause])
      
      setMessage({ text: '¡Cambios guardados con éxito!', type: 'success' })
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      console.error(err)
      setMessage({ text: `Error al guardar: ${err.message || err}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Agregar bloqueo (Vacaciones / Evento)
  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId) return
    if (!blockStart || !blockEnd) {
      openModal(
        'warning',
        'Fechas requeridas',
        'Debes ingresar una fecha de inicio y una fecha de fin.'
      )
      return
    }

    if (blockStart > blockEnd) {
      openModal(
        'warning',
        'Rango inválido',
        'La fecha de inicio debe ser anterior o igual a la fecha de fin.'
      )
      return
    }

    setBlockLoading(true)
    setMessage(null)

    try {
      const newBlock = await availabilityService.addBlock({
        doctor_id: doctorId,
        fecha_inicio: blockStart,
        fecha_fin: blockEnd,
        descripcion: blockDesc || 'Bloqueo temporal'
      })

      setBlocks(prev => [newBlock, ...prev].sort((a,b) => a.fecha_inicio.localeCompare(b.fecha_inicio)))
      setBlockStart('')
      setBlockEnd('')
      setBlockDesc('')
      setMessage({ text: 'Bloqueo de agenda añadido con éxito.', type: 'success' })
    } catch (err: any) {
      console.error(err)
      setMessage({ text: `Error al añadir bloqueo: ${err.message || err}`, type: 'error' })
    } finally {
      setBlockLoading(false)
    }
  }

const confirmDeleteBlock = async () => {
  if (!blockToDelete) return

  try {
    await availabilityService.deleteBlock(blockToDelete)

    setBlocks(prev =>
      prev.filter(b => b.id !== blockToDelete)
    )

    openModal(
      'success',
      'Bloqueo eliminado',
      'El bloqueo fue eliminado correctamente.'
    )

  } catch (err) {
    console.error(err)

    openModal(
      'error',
      'Error',
      'No se pudo eliminar el bloqueo.'
    )
  } finally {
    setDeleteModalOpen(false)
    setBlockToDelete(null)
  }
}

  // Eliminar bloqueo
  const handleDeleteBlock = async (id: string) => {
    setBlockToDelete(id)
    setDeleteModalOpen(true)
  return

  

    try {
      await availabilityService.deleteBlock(id)
      setBlocks(prev => prev.filter(b => b.id !== id))
      setMessage({ text: 'Bloqueo eliminado con éxito.', type: 'success' })
    } catch (err: any) {
      console.error(err)
      setMessage({ text: 'Error al eliminar el bloqueo.', type: 'error' })
    }
  }

  // Calcular horas semanales totales configuradas
  const calculateTotalWeeklyHours = () => {
    let totalMinutes = 0
    
    // Suma de rangos activos
    weekly.forEach(w => {
      const [sh, sm] = w.hora_inicio.split(':').map(Number)
      const [eh, em] = w.hora_fin.split(':').map(Number)
      const startMins = sh * 60 + sm
      const endMins = eh * 60 + em
      totalMinutes += Math.max(0, endMins - startMins)
    })

    // Descontar la pausa de almuerzo diaria por cada día de la semana que tenga al menos un rango activo
    const activeDaysCount = new Set(weekly.map(w => w.dia_semana)).size
    
    if (activeDaysCount > 0) {
      const [lsh, lsm] = lunchStart.split(':').map(Number)
      const [leh, lem] = lunchEnd.split(':').map(Number)
      const lunchMins = (leh * 60 + lem) - (lsh * 60 + lsm)
      
      if (lunchMins > 0) {
        totalMinutes -= (lunchMins * activeDaysCount)
      }
    }

    return Math.max(0, Math.round(totalMinutes / 60))
  }

  const totalWeeklyHours = calculateTotalWeeklyHours()
  const recommendedMaxHours = 48
  const capacityPercent = Math.min(100, Math.round((totalWeeklyHours / recommendedMaxHours) * 100))

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando disponibilidad y agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Gestión de Disponibilidad</h1>
          <p className="text-slate-500 font-medium text-sm">Define tus horarios de consulta y bloquea fechas específicas.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              openModal(
                'success',
                'Configuración Semanal',
                'Esta configuración se aplicará recurrentemente a todas las semanas de tu calendario de AuraHealth.'
              )
            }}
            className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 bg-white rounded-xl font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <Clock size={16} />
            Aplicar para todas las semanas
          </button>
          
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-blue-500/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* ALERT / MESSAGE */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border animate-fadeIn ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <Check className="mt-0.5" size={18} /> : <AlertCircle className="mt-0.5" size={18} />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Horario Semanal (Takes 2/3 size) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-800">Horario Semanal</h2>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-xs uppercase tracking-wider">
                <Globe size={12} />
                Uso Horario: GMT-5
              </span>
            </div>

            <div className="space-y-6">
              {DAYS_OF_WEEK.map(day => {
                const dayRanges = weekly.filter(w => w.dia_semana === day.id)
                const isDayActive = dayRanges.length > 0

                return (
                  <div key={day.id} className="group relative border-b border-slate-50 last:border-0 pb-6 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      
                      {/* TOGGLE & DAY NAME */}
                      <div className="flex items-center gap-4 min-w-[150px]">
                        <button
                          type="button"
                          onClick={() => handleToggleDay(day.id)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isDayActive ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isDayActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`font-bold text-lg transition-colors ${isDayActive ? 'text-slate-800' : 'text-slate-400'}`}>
                          {day.name}
                        </span>
                      </div>

                      {/* RANGES LIST OR STATUS */}
                      <div className="flex-1 space-y-3">
                        {isDayActive ? (
                          <div className="space-y-3">
                            {weekly.map((range, index) => {
                              if (range.dia_semana !== day.id) return null
                              return (
                                <div key={index} className="flex items-center gap-3 animate-slideDown">
                                  <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl px-4 py-2 transition-all">
                                    <input
                                      type="time"
                                      value={range.hora_inicio.substring(0, 5)}
                                      onChange={(e) => handleUpdateRangeTime(index, 'hora_inicio', e.target.value)}
                                      className="bg-transparent border-0 outline-none text-slate-700 font-bold text-sm p-0 w-16 focus:ring-0"
                                    />
                                    <span className="text-slate-400 font-medium text-xs uppercase px-1">a</span>
                                    <input
                                      type="time"
                                      value={range.hora_fin.substring(0, 5)}
                                      onChange={(e) => handleUpdateRangeTime(index, 'hora_fin', e.target.value)}
                                      className="bg-transparent border-0 outline-none text-slate-700 font-bold text-sm p-0 w-16 focus:ring-0"
                                    />
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRange(index)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Eliminar rango"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm font-medium italic">No disponible</span>
                        )}
                      </div>

                      {/* ACTION BUTTON */}
                      {isDayActive && (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleAddRange(day.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg font-bold text-xs transition"
                          >
                            <Plus size={14} />
                            Añadir Rango
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Blocks, breaks & summary */}
        <div className="space-y-6">
          
          {/* VACACIONES Y BLOQUEOS */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar size={18} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Vacaciones y Bloqueos</h3>
            </div>

            <p className="text-xs text-slate-400 font-medium mb-4 leading-relaxed">
              Selecciona un rango de fechas para bloquear tu agenda por completo y evitar nuevas citas en ese periodo.
            </p>

            <form onSubmit={handleAddBlock} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inicio</label>
                  <input
                    type="date"
                    required
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fin</label>
                  <input
                    type="date"
                    required
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Congreso Médico, Descanso"
                  value={blockDesc}
                  onChange={(e) => setBlockDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={blockLoading}
                className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {blockLoading ? 'Bloqueando...' : 'Bloquear Agenda'}
              </button>
            </form>

            {/* LIST OF CURRENT BLOCKS */}
            {blocks.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Próximos Bloqueos</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {blocks.map(b => (
                    <div key={b.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{b.descripcion}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date(b.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(b.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBlockToDelete(b.id!)
                          setDeleteModalOpen(true)
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PAUSAS Y ALMUERZO */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Coffee size={18} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Pausas y Almuerzo</h3>
            </div>

            <p className="text-xs text-slate-400 font-medium mb-4 leading-relaxed">
              Define periodos recurrentes de descanso diarios (no se asignarán citas en estas horas).
            </p>

            {isEditingLunch ? (
              <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 animate-scaleIn">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inicio</label>
                    <input
                      type="time"
                      value={lunchStart}
                      onChange={(e) => setLunchStart(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fin</label>
                    <input
                      type="time"
                      value={lunchEnd}
                      onChange={(e) => setLunchEnd(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingLunch(false)}
                    className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
                  >
                    Listo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🍴</div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Almuerzo Diario</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Recurrente de Lunes a Domingo</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100/50">
                    {formatTime12h(`${lunchStart}:00`)} - {formatTime12h(`${lunchEnd}:00`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingLunch(true)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RESUMEN DE CARGA */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-3xl p-6 shadow-lg shadow-blue-900/10">
            <h4 className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2">Resumen de Carga</h4>
            
            <p className="text-3xl font-black mb-4">
              {totalWeeklyHours} Horas <span className="text-sm font-normal text-blue-100">/ Semana</span>
            </p>

            <div className="w-full bg-blue-950/40 rounded-full h-2.5 mb-3.5">
              <div
                style={{ width: `${capacityPercent}%` }}
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
              />
            </div>

            <p className="text-xs text-blue-100 font-medium leading-relaxed">
              {capacityPercent > 90
                ? '¡Atención! Estás muy cerca de tu límite de horas recomendadas.'
                : `Estás al ${capacityPercent}% de tu capacidad máxima semanal recomendada (${recommendedMaxHours} hrs).`}
            </p>
          </div>

        </div>

      </div>

{modalOpen && (
  <div
    className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 ${
      modalClosing ? 'animate-fadeOut' : 'animate-fadeIn'
    }`}
  >
    <div
      className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 ${
        modalClosing ? 'animate-scaleOut' : 'animate-scaleIn'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${
          modalType === 'success'
            ? 'bg-green-100 text-green-600'
            : modalType === 'error'
            ? 'bg-red-100 text-red-600'
            : 'bg-amber-100 text-amber-600'
        }`}
      >
        {modalType === 'success'
          ? '✓'
          : modalType === 'error'
          ? '✕'
          : '⚠'}
      </div>

      <h3 className="text-xl font-bold text-center text-slate-800 mb-3">
        {modalTitle}
      </h3>

      <p className="text-sm text-center text-slate-500 mb-6">
        {modalMessage}
      </p>

      <button
        onClick={closeModal}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
      >
        Entendido
      </button>
    </div>
  </div>
)}

{deleteModalOpen && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
      <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
        !
      </div>

      <h3 className="text-xl font-bold text-center text-slate-800 mb-3">
        Eliminar bloqueo
      </h3>

      <p className="text-sm text-center text-slate-500 mb-6">
        ¿Estás seguro de eliminar este bloqueo? Tu agenda volverá a estar disponible durante esas fechas.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setDeleteModalOpen(false)
            setBlockToDelete(null)
          }}
          className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold"
        >
          Cancelar
        </button>

        <button
          onClick={confirmDeleteBlock}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
)}

      <style>{`
      @keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.animate-fadeOut {
  animation: fadeOut 0.3s ease forwards;
}

.animate-scaleOut {
  animation: scaleIn 0.3s ease reverse forwards;
}
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>

    </div>
  )
}