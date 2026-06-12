// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Navbar, Sidebar } from './components'
import Login from './pages/Login'
import Register from './pages/Register'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pacientes
import PatientSchedule from './pages/Patient/Schedule'
import PatientAppointment from './pages/Patient/Appointment'
import PatientHistory from './pages/Patient/MedicHistory'
import PatientConfig from './pages/Patient/Config'
import PatientSupport from './pages/Patient/Suport'

// Doctores
import DoctorAvailability from './pages/Doctor/DoctorAvailability'
import DoctorAppointments from './pages/Doctor/AppointmentsCenter'
import DoctorProfileEdit from './pages/Doctor/DoctorProfileEdit'
import DoctorNotifications from './pages/Doctor/NotificationsCenter'

// Admin
import AdminDashboard from './pages/Administrator/Dashboard'
import AdminDoctores from './pages/Administrator/AdminDoctors'
import AdminDoctorManager from './pages/Administrator/AdminDoctorManager'


//sidebars
import SidebarDoctor from './components/SidebarDoctor'
import SidebarAdmin from './components/SidebarAdmin'


function App() {
  const {
    isAuthenticated,
    user,
    loading
  } = useAuth()

    if (loading) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      )
    }
  // ✅ Rutas públicas: sin Navbar ni Sidebar
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Cualquier ruta desconocida redirige al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // ✅ Rutas protegidas: con layout completo
  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />

      {user?.role === 'patient' && <Sidebar />}
      {user?.role === 'doctor' && <SidebarDoctor />}
      {user?.role === 'admin' && <SidebarAdmin />}

      <main className="flex-1 ml-64 mt-16 p-8">
        <Routes>

          {/* RUTAS PACIENTES */}
          <Route
            path="/patient/schedule"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/history"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/config"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientConfig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/support"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientSupport />
              </ProtectedRoute>
            }
          />

          {/* RUTAS DOCTORES */}
          <Route
            path="/doctor/availability"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorAvailability />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/editprofile"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/notifications"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorNotifications />
              </ProtectedRoute>
            }
          />

          {/* RUTAS ADMIN */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/AdminDoctors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDoctores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/AdminDocManager"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDoctorManager />
              </ProtectedRoute>
            }
          />

          {/* ✅ Redirige "/" al home según el rol del usuario */}
          <Route
            path="/"
            element={
              user?.role === 'patient' ? <Navigate to="/patient/schedule" replace /> :
              user?.role === 'doctor'  ? <Navigate to="/doctor/availability" replace /> :
              user?.role === 'admin'   ? <Navigate to="/admin/dashboard" replace /> :
              <Navigate to="/login" replace />
            }
          />

          {/* ✅ Cualquier ruta desconocida redirige según rol */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </main>
    </div>
  )
}

export default App