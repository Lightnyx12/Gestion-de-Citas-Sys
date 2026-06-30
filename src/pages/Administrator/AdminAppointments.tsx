import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { parseNaiveDateTime } from '../../lib/date-utils'
import {
  Calendar,
  Loader2,
  Search,
  Stethoscope,
  SlidersHorizontal,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Appointment {
  id: string
  fecha_hora: string
  estado: string
  pacientes: {
    usuarios: { full_name: string } | null
  } | null
  doctores: {
    id: string
    nombre: string
    apellido: string
    especialidades: { nombre: string } | null
  } | null
}

interface Doctor {
  id: string
  nombre: string
  apellido: string
}

interface Specialty {
  id: string
  nombre: string
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  completada: 'Completada',
  reprogramada: 'Reprogramada',
  no_asistio: 'No asistió',
}

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  completada: 'bg-sky-50 text-sky-700 border-sky-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  no_asistio: 'bg-orange-50 text-orange-700 border-orange-200',
}

const PAGE_SIZE = 10

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function AdminAppointments() {
  /* data */
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* filters */
  const [searchPatient, setSearchPatient] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  /* pagination */
  const [page, setPage] = useState(1)

  /* ── Fetch ── */
  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [aptsRes, docsRes, specsRes] = await Promise.all([
        supabase
          .from('citas')
          .select(`
            id,
            fecha_hora,
            estado,
            pacientes (
              usuarios ( full_name )
            ),
            doctores (
              id,
              nombre,
              apellido,
              especialidades ( nombre )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(500),

        supabase
          .from('doctores')
          .select('id, nombre, apellido')
          .order('nombre'),

        supabase
          .from('especialidades')
          .select('id, nombre')
          .order('nombre'),
      ])

      if (aptsRes.error) throw aptsRes.error
      if (docsRes.error) throw docsRes.error
      if (specsRes.error) throw specsRes.error

      setAppointments((aptsRes.data as any[]) || [])
      setDoctors((docsRes.data as Doctor[]) || [])
      setSpecialties((specsRes.data as Specialty[]) || [])
    } catch (err: any) {
      console.error(err)
      setError('Error al cargar las citas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const specialtyName = filterSpecialty
      ? specialties.find((s) => s.id === filterSpecialty)?.nombre?.toLowerCase() ?? ''
      : ''

    return appointments.filter((apt) => {
      const patientName = apt.pacientes?.usuarios?.full_name?.toLowerCase() ?? ''
      const doctorId = apt.doctores?.id ?? ''
      const aptSpecialty = apt.doctores?.especialidades?.nombre?.toLowerCase() ?? ''
      const estado = apt.estado?.toLowerCase() ?? ''

      if (searchPatient && !patientName.includes(searchPatient.toLowerCase())) return false
      if (filterDoctor && doctorId !== filterDoctor) return false
      if (filterSpecialty && aptSpecialty !== specialtyName) return false
      if (filterStatus && estado !== filterStatus) return false

      return true
    })
  }, [appointments, searchPatient, filterDoctor, filterSpecialty, filterStatus, specialties])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /* reset page when filters change */
  useEffect(() => setPage(1), [searchPatient, filterDoctor, filterSpecialty, filterStatus])

  const clearFilters = () => {
    setSearchPatient('')
    setFilterDoctor('')
    setFilterSpecialty('')
    setFilterStatus('')
  }

  const hasFilters = searchPatient || filterDoctor || filterSpecialty || filterStatus

  /* ── Render ── */
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Historial de Citas
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Todas las citas del sistema &middot; {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Filtros
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold transition"
            >
              <X size={12} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search patient */}
          <div className="relative">
            <label htmlFor="searchPatient" className="sr-only">
              Buscar paciente
            </label>
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none"
            />
            <input
              id="searchPatient"
              name="searchPatient"
              type="text"
              placeholder="Buscar paciente..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
            />
          </div>

          {/* Filter by doctor */}
          <div className="relative">
            <label htmlFor="filterDoctor" className="sr-only">
              Filtrar por doctor
            </label>
            <Stethoscope
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none"
            />
            <select
              id="filterDoctor"
              name="filterDoctor"
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition appearance-none cursor-pointer"
            >
              <option value="">Todos los doctores</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.nombre} {d.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by specialty */}
          <div className="relative">
            <label htmlFor="filterSpecialty" className="sr-only">
              Filtrar por especialidad
            </label>
            <Calendar
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none"
            />
            <select
              id="filterSpecialty"
              name="filterSpecialty"
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition appearance-none cursor-pointer"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by status */}
          <label htmlFor="filterStatus" className="sr-only">
            Filtrar por estado de cita
          </label>
          <select
            id="filterStatus"
            name="filterStatus"   
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin h-9 w-9 text-blue-500" />
            <p className="text-slate-400 text-sm font-medium">Cargando citas...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Calendar size={40} strokeWidth={1.5} />
            <p className="font-medium text-sm">No se encontraron citas con los filtros aplicados.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">Paciente</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">Médico</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">Especialidad</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">Fecha y Hora</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition text-sm">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {apt.pacientes?.usuarios?.full_name || (
                          <span className="text-slate-400 font-normal italic">Paciente anónimo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {apt.doctores
                          ? `Dr. ${apt.doctores.nombre} ${apt.doctores.apellido}`
                          : <span className="text-slate-400 font-normal italic">—</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {apt.doctores?.especialidades?.nombre || (
                          <span className="italic text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium tabular-nums">
                        {parseNaiveDateTime(apt.fecha_hora).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex px-3 py-1 border rounded-full text-xs font-bold ${STATUS_COLORS[apt.estado?.toLowerCase()] ??
                            'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                        >
                          {STATUS_LABELS[apt.estado?.toLowerCase()] ?? apt.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400 font-medium">
                  Página {page} de {totalPages} &middot; {filtered.length} citas
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1)
                        acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="text-slate-300 text-xs px-1">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${page === item
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'border border-slate-200 text-slate-500 hover:bg-white'
                            }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
