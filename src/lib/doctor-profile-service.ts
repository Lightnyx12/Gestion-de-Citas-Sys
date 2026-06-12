import { supabase } from "./supabase";

export interface DoctorProfile {
  id?: string;
  usuario_id?: string;

  nombre?: string;
  apellido?: string;
  fullName?: string;

  especialidad_id?: string;
  especialidad_nombre?: string;

  bio?: string;
  telefono?: string;
  direccion?: string;
  foto_url?: string;

  email?: string;
}

/* =========================================
   OBTENER PERFIL DEL DOCTOR
========================================= */
export const getDoctorProfile = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuario no autenticado");
  }

  const { data, error } = await supabase
    .from("doctores")
    .select(`
      *,
      especialidades (
        id,
        nombre
      ),
      usuarios (
        email,
        full_name
      )
    `)
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "No existe un perfil de doctor vinculado a este usuario."
    );
  }

  const nombre = data.nombre || "";
  const apellido = data.apellido || "";

  return {
    ...data,
    nombre,
    apellido,
    fullName: `${nombre} ${apellido}`.trim(),
    email: data.usuarios?.email || user.email || "",
    especialidad_nombre:
      data.especialidades?.nombre || "Sin especialidad",
  };
};

/* =========================================
   ACTUALIZAR PERFIL DEL DOCTOR
========================================= */
export const updateDoctorProfile = async (
  profile: DoctorProfile
) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuario no autenticado");
  }

  if (!profile.id) {
    throw new Error(
      "No se encontró el ID del doctor."
    );
  }

  const fullName =
    profile.fullName?.trim() || "";

  const parts = fullName.split(/\s+/);

  const nombre =
    profile.nombre ||
    parts[0] ||
    "";

  const apellido =
    profile.apellido ||
    parts.slice(1).join(" ") ||
    "";

  const { data, error } = await supabase
  .from("doctores")
  .update({
    nombre,
    apellido,
    bio: profile.bio || null,
    telefono: profile.telefono || null,
    direccion: profile.direccion || null,
    especialidad_id: profile.especialidad_id,
    foto_url: profile.foto_url || null,
  })
  .eq("id", profile.id)
  .select(`
    *,
    especialidades (
      id,
      nombre
    )
  `)
  .maybeSingle();
  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "No se pudo actualizar el perfil. Verifica que el doctor esté vinculado al usuario."
    );
  }

  const { error: userError } = await supabase
    .from("usuarios")
    .update({
      full_name: fullName,
    })
    .eq("id", user.id);

  if (userError) {
    throw userError;
  }

  return {
    ...data,
    fullName,
    email: profile.email,
    especialidad_nombre:
      data.especialidades?.nombre || "Sin especialidad",
  };
};

/* =========================================
   SUBIR FOTO DEL DOCTOR
========================================= */
export const uploadDoctorAvatar = async (
  doctorId: string,
  file: File
) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuario no autenticado");
  }

  if (!doctorId) {
    throw new Error("No se encontró el ID del doctor.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Solo puedes subir imágenes.");
  }

  const fileExt = file.name.split(".").pop();

  const fileName =
    `${doctorId}-${Date.now()}.${fileExt}`;

  const filePath =
    `doctors/${fileName}`;

  const { error: uploadError } =
    await supabase.storage
      .from("doctores-fotos")
      .upload(filePath, file, {
        upsert: true,
      });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("doctores-fotos")
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  const {
    data: updatedDoctor,
    error: updateError,
  } = await supabase
    .from("doctores")
    .update({
      foto_url: publicUrl,
    })
    .eq("id", doctorId)
    .select("id, foto_url")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedDoctor) {
    throw new Error(
      "No se pudo actualizar la foto del doctor."
    );
  }

  return publicUrl;
};

/* =========================================
   CAMBIAR CONTRASEÑA DEL DOCTOR
========================================= */
export const updateDoctorPassword = async (
  newPassword: string
) => {
  if (newPassword.length < 6) {
    throw new Error(
      "La contraseña debe tener al menos 6 caracteres."
    );
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
   OBTENER ESPECIALIDADES
========================================= */
export const getActiveSpecialties =
  async () => {
    const { data, error } =
      await supabase
        .from("especialidades")
        .select("id, nombre")
        .eq("is_active", true)
        .order("nombre");

    if (error) {
      throw error;
    }

    return data || [];
  };