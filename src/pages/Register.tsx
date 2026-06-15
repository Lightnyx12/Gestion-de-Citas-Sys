import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'


const determineUserRole = (email: string) => {
  if (email.endsWith('@adminaura.com')) return 'admin'
  if (email.endsWith('@aurahealth.com')) return 'doctor'
  return 'patient'
}

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [closingTermsModal, setClosingTermsModal] = useState(false);
  const closeTermsModal = () => {
  setClosingTermsModal(true);

  setTimeout(() => {
    setShowTermsModal(false);
    setClosingTermsModal(false);
  }, 300);
};

  const navigate = useNavigate()

  const userRole = determineUserRole(email)
  
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      doctor: 'Doctor',
      patient: 'Paciente'
    }
    return labels[role] || role
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('El nombre completo es requerido')
      return
    }

    if (!dni.trim()) {
      setError('El DNI es requerido')
      return
    }

    if (!/^\d{8}$/.test(dni.trim())) {
      setError('El DNI debe contener exactamente 8 dígitos numéricos')
      return
    }

    if (!email.trim()) {
      setError('El correo electrónico es requerido')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    setLoading(true)

    try {
      // 1. Crear usuario en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_role: userRole
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email ya está registrado. Por favor, inicia sesión.')
        } else {
          setError(signUpError.message || 'Error al registrarse')
        }
        return
      }

      if (!data.user?.id) {
        setError('Error: No se obtuvo el ID del usuario')
        return
      }

      // 2. El trigger handle_new_user() crea automáticamente el registro en
      //    public.usuarios y public.pacientes. Solo hacemos upsert como
      //    respaldo para garantizar consistencia.
      const { error: usuariosError } = await supabase
        .from('usuarios')
        .upsert([
          {
            id: data.user.id,
            email: email,
            full_name: fullName,
            dni: dni.trim(),
            user_role: userRole
          }
        ], { onConflict: 'id' })

      if (usuariosError) {
        console.warn('Aviso al hacer upsert en usuarios (puede ser normal si el trigger ya lo creó):', usuariosError.message)
      }

      console.log('Cuenta creada exitosamente:', data.user)
      setError('') // Limpiar errores
      setFullName('')
      setDni('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setTermsAccepted(false)
      
      // Mostrar mensaje de éxito (opcional: redirigir al login)
      setShowSuccessModal(true)
    } catch (err) {
      setError('Error al crear la cuenta. Por favor intenta nuevamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/login" className="flex items-center justify-center mb-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              AuraHealth
            </span>
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Crear cuenta
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Únete a nosotros como paciente
            </p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-200">{error}</span>
              </div>
            )}

            {email && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Rol detectado: <span className="font-semibold">{getRoleLabel(userRole)}</span>
                </p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="John Doe Luthor"
                  required
                />
              </div>

              <div>
                <label htmlFor="dni" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  name="dni"
                  id="dni"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="12345678"
                  maxLength={8}
                  inputMode="numeric"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="ejemplo@dominio.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-start pt-2">
                <div className="flex items-center h-6">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 accent-blue-600 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    required
                  />
                </div>
                <label htmlFor="terms" className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  Acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                  >
                   Términos y condiciones
                  </button>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta de paciente'}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
                ¿Ya tienes una cuenta?{' '}
                <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition">
                  Inicia sesión
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
      {showTermsModal && (
  <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
  closingTermsModal
    ? "animate-fadeOut"
    : "animate-fadeIn"
}`}>
    <div className={`bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden ${
        closingTermsModal
          ? "animate-modalOut"
          : "animate-modalIn"
      }`}>

      <div className="p-6 border-b dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Términos y Condiciones
        </h2>
      </div>

      <div className="p-6 overflow-y-auto max-h-[50vh] text-gray-700 dark:text-gray-300 space-y-4">

        <p>
          Bienvenido a AuraHealth. Al registrarse en nuestra plataforma,
          usted acepta utilizar el sistema de manera responsable y conforme
          a las leyes aplicables.
        </p>

        <p>
          AuraHealth recopila y almacena información personal y médica con
          el único propósito de gestionar citas médicas y servicios
          relacionados con la atención de salud.
        </p>

        <p>
          La información proporcionada será tratada de forma confidencial
          y protegida mediante medidas de seguridad adecuadas.
        </p>

        <p>
          El usuario es responsable de mantener la confidencialidad de sus
          credenciales de acceso.
        </p>

        <p>
          AuraHealth podrá actualizar estos términos cuando sea necesario
          para mejorar el servicio o cumplir requisitos legales.
        </p>

        <p>
          Al aceptar estos términos, usted confirma que comprende y acepta
          las condiciones descritas anteriormente.
        </p>

      </div>

      <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">

        <button
          type="button"
          onClick={closeTermsModal}
          className="px-4 py-2 rounded-lg border"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => {
            setTermsAccepted(true)
            setShowTermsModal(false)
          }}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Aceptar
        </button>

      </div>

    </div>
  </div>
)}

{showSuccessModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-8 text-center animate-modalIn">

      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-10 h-10 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Cuenta creada correctamente
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Tu cuenta ha sido registrada exitosamente.
        Ahora puedes iniciar sesión en AuraHealth.
      </p>

      <button
        type="button"
        onClick={() => navigate('/login')}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
      >
        Ir al inicio de sesión
      </button>

    </div>
  </div>
)}

<style>{`
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes modalIn {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(-30px);
  }

  60% {
    transform: scale(1.02);
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
    transform: scale(0.92) translateY(-15px);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.3s ease forwards;
}

.animate-modalIn {
  animation: modalIn 0.35s ease forwards;
}

.animate-modalOut {
  animation: modalOut 0.3s ease forwards;
}
`}

</style>
    </section>
  );
}