import { supabase } from "../../lib/supabase";

export interface PatientProfile {
  id?: string;
  usuario_id?: string;

  dni?: string;
  fecha_nac?: string;
  direccion?: string;
  alergias?: string;
  foto_url?: string;

  email?: string;
  full_name?: string;
}

/* =========================================
   TIPOS DE PREFERENCIAS DE NOTIFICACIÓN
========================================= */
export type NotifFrecuencia = '24h' | '48h'

export interface NotificationPrefs {
  /** Enviar email de confirmación y recordatorios */
  notif_email: boolean
  /** Descargar archivo .ics al agendar cita */
  notif_calendario: boolean
  /** Cuándo enviar el recordatorio: '24h', '48h', o ambas */
  notif_frecuencia: NotifFrecuencia[]
}

/* =========================================
   OBTENER PERFIL
========================================= */
export const getPatientProfile = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuario no autenticado");
  }

  const { data, error } = await supabase
    .from("pacientes")
    .select(`
      *,
      usuarios (
        email,
        full_name
      )
    `)
    .eq("usuario_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    email: data.usuarios?.email,
    full_name: data.usuarios?.full_name,
  };
};

/* =========================================
   ACTUALIZAR PERFIL
========================================= */
export const updatePatientProfile = async (
  profile: PatientProfile
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }


  
  /* =========================
      ACTUALIZAR PACIENTES
  ========================= */
  const { error: patientError } =
    await supabase
      .from("pacientes")
      .update({
        dni: profile.dni,
        fecha_nac: profile.fecha_nac,
        direccion: profile.direccion,
        alergias: profile.alergias,
        foto_url: profile.foto_url,
      })
      .eq("usuario_id", user.id);

  if (patientError) {
    throw patientError;
  }

  /* =========================
      ACTUALIZAR USUARIOS
  ========================= */
  const { error: userError } =
    await supabase
      .from("usuarios")
      .update({
        full_name: profile.full_name,
      })
      .eq("id", user.id);

  if (userError) {
    throw userError;
  }

  return true;
};

/* =========================================
   SUBIR FOTO
========================================= */
export const uploadPatientAvatar = async (
  file: File
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const fileExt = file.name.split(".").pop();

  const fileName = `${user.id}.${fileExt}`;

  const filePath = `patients/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("pacientes_fotos")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("pacientes_fotos")
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/* =========================================
   CAMBIAR CONTRASEÑA
========================================= */
export const updatePatientPassword = async (
  email: string,
  currentPassword: string,
  newPassword: string
) => {
  if (!email) {
    throw new Error("No se encontró el correo del usuario.");
  }

  if (!currentPassword.trim()) {
    throw new Error("Ingresa tu contraseña actual.");
  }

  if (newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

  if (loginError) {
    throw new Error("La contraseña actual no es correcta.");
  }

  const { error } =
    await supabase.auth.updateUser({
      password: newPassword,
    });

  if (error) {
    throw error;
  }

  return true;
};

/* =========================================
   OBTENER PREFERENCIAS DE NOTIFICACIÓN
========================================= */
export const getNotificationPrefs = async (): Promise<NotificationPrefs> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('pacientes')
    .select('notif_email, notif_calendario, notif_frecuencia')
    .eq('usuario_id', user.id)
    .single();

  if (error) throw error;

  return {
    notif_email:      data.notif_email      ?? true,
    notif_calendario: data.notif_calendario ?? true,
    notif_frecuencia: (data.notif_frecuencia ?? ['24h']) as NotifFrecuencia[],
  };
};

/* =========================================
   GUARDAR PREFERENCIAS DE NOTIFICACIÓN
========================================= */
export const saveNotificationPrefs = async (
  prefs: NotificationPrefs
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Usuario no autenticado');

  const { error } = await supabase
    .from('pacientes')
    .update({
      notif_email:      prefs.notif_email,
      notif_calendario: prefs.notif_calendario,
      notif_frecuencia: prefs.notif_frecuencia,
    })
    .eq('usuario_id', user.id);

  if (error) throw error;
};

/* =========================================
   OBTENER notif_calendario DE UN PACIENTE
   (para usar desde appointment-service)
========================================= */
export const getCalendarPref = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from('pacientes')
    .select('notif_calendario')
    .eq('usuario_id', user.id)
    .single();

  return data?.notif_calendario ?? false;
};