import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Calendar, Users, Stethoscope, MessageSquare, Loader2, Clock } from 'lucide-react'

interface RecentAppointment {
  id: string
  fecha_hora: string
  estado: string
  pacientes: {
    usuarios: {
      full_name: string
    }
  } | null
  doctores: {
    nombre: string
    apellido: string
  } | null
}

export default function AdministratorDashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointmentsToday: 0,
    feedback: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const today = new Date().toISOString().split('T')[0]
      const startOfDay = `${today}T00:00:00.000Z`
      const endOfDay = `${today}T23:59:59.999Z`

      // Ejecutar promesas en paralelo para mayor rapidez
      const [
        docCount,
        patientCount,
        aptCount,
        feedbackCount,
        recentApts
      ] = await Promise.all([
        supabase.from('doctores').select('*', { count: 'exact', head: true }),
        supabase.from('pacientes').select('*', { count: 'exact', head: true }),
        supabase.from('citas')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora', startOfDay)
          .lte('fecha_hora', endOfDay)
          .neq('estado', 'cancelada'),
        supabase.from('feedback_pacientes').select('*', { count: 'exact', head: true }),
        supabase.from('citas')
          .select(`
            id,
            fecha_hora,
            estado,
            pacientes (
              usuarios (
                full_name
              )
            ),
            doctores (
              nombre,
              apellido
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      setStats({
        doctors: docCount.count || 0,
        patients: patientCount.count || 0,
        appointmentsToday: aptCount.count || 0,
        feedback: feedbackCount.count || 0
      })

      setRecentAppointments((recentApts.data as any[]) || [])
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
      setError('Ocurrió un error al cargar las estadísticas en tiempo real.')
    } finally {
      setLoading(false)
    }
  }

  const formatState = (status: string) => {
    const statuses: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada'
    }
    return statuses[status.toLowerCase()] || status
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmada':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30'
      case 'pendiente':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-100 dark:border-amber-900/30'
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-100 dark:border-rose-900/30'
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando panel de control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Dashboard Administrativo</h1>
        <p className="text-slate-500 font-medium text-sm">Resumen en tiempo real del sistema AuraHealth.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* DOCTORS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5 transition hover:-translate-y-1">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Stethoscope size={24} />
          </div>
          <div>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Total Doctores</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.doctors}</p>
          </div>
        </div>

        {/* PATIENTS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5 transition hover:-translate-y-1">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Pacientes</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.patients}</p>
          </div>
        </div>

        {/* APPOINTMENTS TODAY */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5 transition hover:-translate-y-1">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Citas Hoy</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.appointmentsToday}</p>
          </div>
        </div>

        {/* FEEDBACK */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5 transition hover:-translate-y-1">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Reportes/Feedback</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.feedback}</p>
          </div>
        </div>

      </div>

      {/* Content Section: Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 md:p-8">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 rounded-xl">
              <Clock size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Últimas Citas Agendadas</h2>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider"
          >
            Actualizar
          </button>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
            No se han registrado citas recientemente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 dark:border-slate-700 pb-3">
                  <th className="pb-3">Paciente</th>
                  <th className="pb-3">Médico</th>
                  <th className="pb-3">Fecha y Hora</th>
                  <th className="pb-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {recentAppointments.map((apt) => (
                  <tr key={apt.id} className="text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                    <td className="py-4 font-bold text-slate-800 dark:text-white">
                      {apt.pacientes?.usuarios?.full_name || 'Paciente Anonimo'}
                    </td>
                    <td className="py-4 font-semibold">
                      {apt.doctores ? `Dr. ${apt.doctores.nombre} ${apt.doctores.apellido}` : 'Médico General'}
                    </td>
                    <td className="py-4 font-medium text-slate-500 dark:text-slate-400">
                      {new Date(apt.fecha_hora).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex px-3 py-1 border rounded-full text-xs font-bold ${getStatusColor(apt.estado)}`}>
                        {formatState(apt.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  )
}