import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { availabilityService } from '../../lib/availability-service'
import type { WeeklyAvailability, AgendaBlock } from '../../lib/availability-service'
import { Calendar, Trash2, Check, Loader2, AlertCircle } from 'lucide-react'

// Turnos predefinidos
const SHIFTS = {
  mañana: { label: 'Mañana', inicio: '06:00:00', fin: '14:00:00', hours: 8 },
  tarde: { label: 'Tarde', inicio: '14:00:00', fin: '22:00:00', hours: 8 },
  noche: { label: 'Noche', inicio: '22:00:00', fin: '06:00:00', hours: 8 }
}

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
  const [blocks, setBlocks] = useState<AgendaBlock[]>([])
  const [selectedShift, setSelectedShift] = useState<keyof typeof SHIFTS>('mañana')
  
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

  const openModal = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
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

  // Cargar datos del doctor al montar
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
        setWeekly(config.weekly)
        setBlocks(config.blocks)
        
        // Detectar turno actual si existe
        if (config.weekly.length > 0) {
          const firstRange = config.weekly[0]
          const inicio = firstRange.hora_inicio.substring(0, 5)
          if (inicio === '06:00') setSelectedShift('mañana')
          else if (inicio === '14:00') setSelectedShift('tarde')
          else if (inicio === '22:00') setSelectedShift('noche')
        }
      } catch (err: unknown) {
        console.error(err)
        setMessage({ text: 'Error al cargar la configuración.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Obtener días activos
  const getActiveDays = () => new Set(weekly.map(w => w.dia_semana))

  // Toggle día
  const handleToggleDay = (dayId: number) => {
    const activeDays = getActiveDays()
    const shift = SHIFTS[selectedShift]

    if (activeDays.has(dayId)) {
      setWeekly(prev => prev.filter(w => w.dia_semana !== dayId))
    } else {
      setWeekly(prev => [
        ...prev,
        {
          doctor_id: doctorId || '',
          dia_semana: dayId,
          hora_inicio: shift.inicio,
          hora_fin: shift.fin
        }
      ])
    }
  }

  // Cambiar turno (aplica a todos los días activos)
  const handleChangeShift = (newShift: keyof typeof SHIFTS) => {
    setSelectedShift(newShift)
    const shift = SHIFTS[newShift]
    
    // Actualizar horas de todos los días activos
    setWeekly(prev => prev.map(w => ({
      ...w,
      hora_inicio: shift.inicio,
      hora_fin: shift.fin
    })))
  }

  // Guardar configuración
  const handleSaveConfig = async () => {
    if (!doctorId) return
    setSaving(true)
    setMessage(null)

    try {
      const totalHours = calculateTotalWeeklyHours()
      if (totalHours > 48) {
        setMessage({ text: `Error: No puedes configurar más de 48 horas semanales. Actualmente tienes ${totalHours} horas.`, type: 'error' })
        setSaving(false)
        return
      }

      await availabilityService.saveConfig(doctorId, weekly, [])
      setMessage({ text: '¡Cambios guardados con éxito!', type: 'success' })
      setTimeout(() => setMessage(null), 4000)
    } catch (err: unknown) {
      console.error('Error completo:', err)
      let errorMsg = 'Error desconocido al guardar'
      
      if (err instanceof Error) {
        errorMsg = err.message
      } else if (typeof err === 'object' && err !== null) {
        const errObj = err as Record<string, unknown>
        if (errObj.message) {
          errorMsg = String(errObj.message)
        } else if (errObj.error_description) {
          errorMsg = String(errObj.error_description)
        } else {
          errorMsg = JSON.stringify(errObj)
        }
      } else if (typeof err === 'string') {
        errorMsg = err
      }
      
      setMessage({ text: `Error al guardar: ${errorMsg}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Agregar bloqueo
  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId) return
    if (!blockStart || !blockEnd) {
      openModal('warning', 'Fechas requeridas', 'Debes ingresar una fecha de inicio y una fecha de fin.')
      return
    }

    if (blockStart > blockEnd) {
      openModal('warning', 'Rango inválido', 'La fecha de inicio debe ser anterior o igual a la fecha de fin.')
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
    } catch (err: unknown) {
      console.error('Error completo:', err)
      let errorMsg = 'Error desconocido al añadir bloqueo'
      
      if (err instanceof Error) {
        errorMsg = err.message
      } else if (typeof err === 'object' && err !== null) {
        const errObj = err as Record<string, unknown>
        if (errObj.message) {
          errorMsg = String(errObj.message)
        } else if (errObj.error_description) {
          errorMsg = String(errObj.error_description)
        } else {
          errorMsg = JSON.stringify(errObj)
        }
      } else if (typeof err === 'string') {
        errorMsg = err
      }
      
      setMessage({ text: `Error al añadir bloqueo: ${errorMsg}`, type: 'error' })
    } finally {
      setBlockLoading(false)
    }
  }

  const confirmDeleteBlock = async () => {
    if (!blockToDelete) return

    try {
      await availabilityService.deleteBlock(blockToDelete)
      setBlocks(prev => prev.filter(b => b.id !== blockToDelete))
      openModal('success', 'Bloqueo eliminado', 'El bloqueo fue eliminado correctamente.')
    } catch (err: unknown) {
      console.error('Error completo:', err)
      let errorMsg = 'Error desconocido al eliminar'
      
      if (err instanceof Error) {
        errorMsg = err.message
      } else if (typeof err === 'object' && err !== null) {
        const errObj = err as Record<string, unknown>
        if (errObj.message) {
          errorMsg = String(errObj.message)
        } else if (errObj.error_description) {
          errorMsg = String(errObj.error_description)
        } else {
          errorMsg = JSON.stringify(errObj)
        }
      } else if (typeof err === 'string') {
        errorMsg = err
      }
      
      openModal('error', 'Error', `No se pudo eliminar el bloqueo: ${errorMsg}`)
    } finally {
      setDeleteModalOpen(false)
      setBlockToDelete(null)
    }
  }

  // Calcular horas semanales
  const calculateTotalWeeklyHours = () => {
    const activeDays = getActiveDays().size
    const shift = SHIFTS[selectedShift]
    return activeDays * shift.hours
  }

  const totalWeeklyHours = calculateTotalWeeklyHours()
  const activeDays = getActiveDays()

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
    <div className="max-w-4xl mx-auto pb-16 px-4">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Gestión de Disponibilidad</h1>
        <p className="text-slate-500 font-medium text-sm">Configura tu turno, días de trabajo y bloqueos de agenda.</p>
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

      <div className="space-y-6">
        {/* TURNO */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Selecciona tu Turno</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(SHIFTS).map(([key, shift]) => (
              <button
                key={key}
                onClick={() => handleChangeShift(key as keyof typeof SHIFTS)}
                className={`py-4 px-4 rounded-xl font-bold transition-all ${
                  selectedShift === key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                <div>{shift.label}</div>
                <div className="text-xs opacity-75 mt-1">{shift.inicio.substring(0, 5)} - {shift.fin.substring(0, 5)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* DÍAS */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Días de la Semana</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.id}
                onClick={() => handleToggleDay(day.id)}
                className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                  activeDays.has(day.id)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>
        </div>

        {/* RESUMEN */}
        <div className={`rounded-3xl p-6 text-white font-bold text-center ${
          totalWeeklyHours <= 48 
            ? 'bg-gradient-to-br from-green-600 to-green-700' 
            : 'bg-gradient-to-br from-red-600 to-red-700'
        }`}>
          <div className="text-4xl mb-2">{totalWeeklyHours} hrs</div>
          <div className="text-sm opacity-90">
            {totalWeeklyHours <= 48 
              ? `${activeDays.size} días × ${SHIFTS[selectedShift].hours} horas / día`
              : `Excediste el límite de 48 horas`}
          </div>
        </div>

        {/* BLOQUEOS */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Vacaciones y Bloqueos
          </h2>

          <form onSubmit={handleAddBlock} className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Inicio</label>
                <input
                  type="date"
                  required
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fin</label>
                <input
                  type="date"
                  required
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Motivo (Ej: Congreso, Descanso)"
              value={blockDesc}
              onChange={(e) => setBlockDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={blockLoading}
              className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm rounded-xl transition disabled:opacity-50"
            >
              {blockLoading ? 'Bloqueando...' : 'Bloquear Agenda'}
            </button>
          </form>

          {blocks.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-600 mb-3">Próximos Bloqueos</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {blocks.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700">{b.descripcion}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(b.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')} - {new Date(b.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBlockToDelete(b.id!)
                        setDeleteModalOpen(true)
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GUARDAR */}
        <button
          onClick={handleSaveConfig}
          disabled={saving || totalWeeklyHours > 48}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/20"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* MODALS */}
      {modalOpen && (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 ${modalClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
          <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 ${modalClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${
              modalType === 'success' ? 'bg-green-100 text-green-600' : modalType === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {modalType === 'success' ? '✓' : modalType === 'error' ? '✕' : '⚠'}
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-3">{modalTitle}</h3>
            <p className="text-sm text-center text-slate-500 mb-6">{modalMessage}</p>
            <button onClick={closeModal} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
              Entendido
            </button>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-3xl font-bold">!</div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-3">Eliminar bloqueo</h3>
            <p className="text-sm text-center text-slate-500 mb-6">¿Estás seguro de eliminar este bloqueo?</p>
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
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        .animate-fadeOut { animation: fadeOut 0.3s ease forwards; }
        .animate-scaleOut { animation: scaleIn 0.3s ease reverse forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  )
}