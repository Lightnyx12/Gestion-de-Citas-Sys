// src/App.tsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Navbar, Sidebar } from './components'
import { ProtectedRoute } from './components/ProtectedRoute'

// ─── Páginas públicas (pequeñas, siempre necesarias) ────────────────────────
import Login from './pages/Login'
import Register from './pages/Register'

// ─── Sidebars (layout, siempre visibles tras login) ─────────────────────────
import SidebarDoctor from './components/SidebarDoctor'
import SidebarAdmin from './components/SidebarAdmin'

// ─── Páginas lazy (code-splitting por ruta) ──────────────────────────────────
// Pacientes
const PatientSchedule     = lazy(() => import('./pages/Patient/Schedule'))
const PatientAppointment  = lazy(() => import('./pages/Patient/Appointment'))
const PatientHistory      = lazy(() => import('./pages/Patient/MedicHistory'))
const PatientConfig       = lazy(() => import('./pages/Patient/Config'))
const PatientSupport      = lazy(() => import('./pages/Patient/Suport'))

// Doctores
const DoctorAvailability  = lazy(() => import('./pages/Doctor/DoctorAvailability'))
const DoctorAppointments  = lazy(() => import('./pages/Doctor/AppointmentsCenter'))
const DoctorProfileEdit   = lazy(() => import('./pages/Doctor/DoctorProfileEdit'))
const DoctorNotifications = lazy(() => import('./pages/Doctor/NotificationsCenter'))

// Admin
const AdminDashboard      = lazy(() => import('./pages/Administrator/Dashboard'))
const AdminDoctores       = lazy(() => import('./pages/Administrator/AdminDoctors'))
const AdminDoctorManager  = lazy(() => import('./pages/Administrator/AdminDoctorManager'))
const AdminAppointments   = lazy(() => import('./pages/Administrator/AdminAppointments'))

// ─── Fallback de carga ────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900" />
  </div>
)

function App() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900" />
      </div>
    )
  }

  // ✅ Rutas públicas: sin Navbar ni Sidebar
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // ✅ Rutas protegidas: con layout completo
  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />

      {user?.role === 'patient' && <Sidebar />}
      {user?.role === 'doctor'  && <SidebarDoctor />}
      {user?.role === 'admin'   && <SidebarAdmin />}

      <main className="flex-1 ml-64 mt-16 p-8">
        <Suspense fallback={<PageLoader />}>
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
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAppointments />
                </ProtectedRoute>
              }
            />

            {/* ✅ Redirige "/" al home según el rol del usuario */}
            <Route
              path="/"
              element={
                user?.role === 'patient' ? <Navigate to="/patient/schedule"   replace /> :
                user?.role === 'doctor'  ? <Navigate to="/doctor/availability" replace /> :
                user?.role === 'admin'   ? <Navigate to="/admin/dashboard"    replace /> :
                <Navigate to="/login" replace />
              }
            />

            {/* ✅ Cualquier ruta desconocida redirige según rol */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default App