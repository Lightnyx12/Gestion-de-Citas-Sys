import { supabase } from './supabase'

export interface CreateDoctorData {
  fullName: string       // Nombre completo del doctor
  especialidadId: string
  bio: string
  isAvailable: boolean
  dni?: string
  telefono?: string
}

export interface DoctorCredentials {
  email: string
  password: string
}

export const generateEmail = (fullName: string): string => {
  const parts = fullName
    .trim()
    .toLowerCase()
    // Eliminar acentos y caracteres especiales
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(p => p.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)

  const nombre   = parts[0]  || 'doctor'
  const apellido = parts[parts.length > 1 ? parts.length - 1 : 0] || 'aura'

  return `${nombre}.${apellido}@aurahealth.com`
}

export const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export const doctorService = {
  /**
   * Crea un doctor usando la Edge Function 'create-doctor'.
   *
   * POR QUÉ no usamos supabase.auth.signUp() directamente:
   * -------------------------------------------------------
   * Cuando el admin llama a signUp() desde el cliente, Supabase Auth
   * reemplaza automáticamente la sesión activa del admin con la sesión
   * del nuevo usuario recién creado. Esto provoca que los siguientes
   * INSERT (en 'usuarios' y 'doctores') se ejecuten con el JWT del doctor
   * (sin rol 'admin'), violando la RLS que exige get_user_role() = 'admin'.
   *
   * La Edge Function usa auth.admin.createUser() con el service role key,
   * lo que NO afecta la sesión del admin en el cliente.
   */
  async createDoctor(data: CreateDoctorData): Promise<{ credentials: DoctorCredentials }> {
    const fullName          = data.fullName.trim()
    const parts             = fullName.split(/\s+/)
    const nombre            = parts[0] || fullName
    const apellido          = parts.slice(1).join(' ') || ''
    const generatedEmail    = generateEmail(fullName)
    const generatedPassword = generatePassword()

    // Obtener el JWT del admin para enviarlo a la Edge Function
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token

    if (!accessToken) {
      throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.')
    }

    // Llamar a la Edge Function con el JWT del admin
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/create-doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email: generatedEmail,
        password: generatedPassword,
        fullName,
        nombre,
        apellido,
        especialidadId: data.especialidadId,
        dni: data.dni || null,
        telefono: data.telefono || null,
        bio: data.bio || null,
        isAvailable: data.isAvailable,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Error desconocido al crear el doctor')
    }

    return {
      credentials: {
        email: generatedEmail,
        password: generatedPassword,
      },
    }
  },

  async getDoctorEmail(usuarioId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('email')
      .eq('id', usuarioId)
      .single()

    if (error) {
      console.error('Error recuperando email:', error)
      return null
    }
    return data?.email || null
  }
}
