import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Doctor {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string | null
  especialidad_id: string
  especialidad_nombre: string
  email: string
  bio: string | null
  is_available: boolean
  created_at: string
  usuario_id?: string
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning' | 'confirm'>('success')
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchDoctors()
  }, [])
  const openModal = (
  type: 'success' | 'error' | 'warning' | 'confirm',
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
    setDoctorToDelete(null)
  }, 300)
}

  const fetchDoctors = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error: fetchError } = await supabase
        .from('doctores')
        .select(`
          id,
          nombre,
          apellido,
          dni,
          telefono,
          especialidad_id,
          bio,
          is_available,
          created_at,
          usuario_id,
          especialidades (
            nombre
          ),
          usuarios (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        openModal('error', 'Error al cargar doctores', fetchError.message)
        console.error('Error:', fetchError)
        return
      }

      const formattedDoctors = (data || []).map((doc: any) => ({
        id: doc.id,
        nombre: doc.nombre,
        apellido: doc.apellido,
        dni: doc.dni,
        telefono: doc.telefono,
        especialidad_id: doc.especialidad_id,
        especialidad_nombre: doc.especialidades?.nombre || 'Sin especialidad',
        email: doc.usuarios?.email || 'Sin cuenta',
        bio: doc.bio,
        is_available: doc.is_available,
        created_at: doc.created_at,
        usuario_id: doc.usuario_id
      }))

      setDoctors(formattedDoctors)
    } catch (err) {
      openModal('error', 'Error', 'No se pudieron cargar los doctores.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.nombre} ${doctor.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    doctor.especialidad_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleAvailability = async (doctorId: string, currentStatus: boolean) => {
  try {
    const { error } = await supabase
      .from('doctores')
      .update({ is_available: !currentStatus })
      .eq('id', doctorId)

    if (error) {
      openModal('error', 'Error', `No se pudo actualizar la disponibilidad: ${error.message}`)
      return
    }

    setDoctors(doctors.map(d =>
      d.id === doctorId ? { ...d, is_available: !currentStatus } : d
    ))

    openModal(
      'success',
      'Disponibilidad actualizada',
      `El doctor ahora está ${!currentStatus ? 'disponible' : 'no disponible'}.`
    )
  } catch (err) {
    console.error(err)
    openModal('error', 'Error', 'No se pudo actualizar la disponibilidad.')
  }
}

  const requestDeleteDoctor = (doctorId: string) => {
  setDoctorToDelete(doctorId)
  openModal(
    'confirm',
    'Eliminar doctor',
    '¿Estás seguro de que quieres eliminar este doctor? Esta acción no se puede deshacer.'
  )
}

const confirmDeleteDoctor = async () => {
  if (!doctorToDelete) return

  try {
    const doctor = doctors.find(d => d.id === doctorToDelete)

    const { error } = await supabase
      .from('doctores')
      .delete()
      .eq('id', doctorToDelete)

    if (error) {
      openModal('error', 'Error al eliminar', error.message)
      return
    }

    if (doctor?.usuario_id) {
      await supabase.from('usuarios').delete().eq('id', doctor.usuario_id)
    }

    setDoctors(doctors.filter(d => d.id !== doctorToDelete))

    closeModal()

    setTimeout(() => {
      openModal('success', 'Doctor eliminado', 'El doctor fue eliminado correctamente.')
    }, 350)
  } catch (err) {
    console.error(err)
    openModal('error', 'Error', 'No se pudo eliminar el doctor.')
  }
}

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Doctores
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra el perfil y disponibilidad de los doctores registrados
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-200">{error}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando doctores...</p>
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6H6m0 0H0" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">No hay doctores registrados o no coinciden con la búsqueda</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Correo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Especialidad</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Teléfono</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">DNI</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Registro</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {doctor.nombre} {doctor.apellido}
                        </div>
                        {doctor.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{doctor.bio.substring(0, 50)}...</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{doctor.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">
                          {doctor.especialidad_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{doctor.telefono || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{doctor.dni || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleAvailability(doctor.id, doctor.is_available)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                            doctor.is_available
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/50'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {doctor.is_available ? 'Disponible' : 'No disponible'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(doctor.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => requestDeleteDoctor(doctor.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Stats */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
              Mostrando {filteredDoctors.length} de {doctors.length} doctores
            </div>
          </div>
        )}
      </div>
      {modalOpen && (
  <div
    className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 ${
      modalClosing ? "animate-scaleOut" : "animate-scaleIn"
    }`}
  >
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 ${
        modalClosing ? "animate-scaleOut" : "animate-scaleIn"
      }`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${
          modalType === 'success'
            ? 'bg-green-100 text-green-600'
            : modalType === 'error'
            ? 'bg-red-100 text-red-600'
            : modalType === 'warning'
            ? 'bg-amber-100 text-amber-600'
            : 'bg-red-100 text-red-600'
        }`}
      >
        {modalType === 'success'
          ? '✓'
          : modalType === 'confirm'
          ? '!'
          : modalType === 'error'
          ? '×'
          : '⚠'}
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
        {modalTitle}
      </h2>

      <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-6">
        {modalMessage}
      </p>

      {modalType === 'confirm' ? (
        <div className="flex gap-3">
          <button
            onClick={closeModal}
            className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
          >
            Cancelar
          </button>

          <button
            onClick={confirmDeleteDoctor}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <button
          onClick={closeModal}
          className={`w-full py-3 rounded-xl text-white font-bold transition ${
            modalType === 'success'
              ? 'bg-blue-600 hover:bg-blue-700'
              : modalType === 'error'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          Entendido
        </button>
      )}
    </div>
  </div>
)}

<style> {`
@keyframes fadeIn {@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modalIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-15px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modalOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(-10px);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.3s ease forwards;
}

.animate-modalIn {
  animation: modalIn 0.3s ease forwards;
}

.animate-modalOut {
  animation: modalOut 0.3s ease forwards;
  
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-15px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(-10px);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.25s ease forwards;
}

.animate-scaleIn,
.animate-modalIn {
  animation: scaleIn 0.3s ease forwards;
}

.animate-scaleOut,
.animate-modalOut {
  animation: scaleOut 0.25s ease forwards;
}  
}
  `}</style>
    </div>
  )
}