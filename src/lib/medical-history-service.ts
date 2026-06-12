import { supabase } from "./supabase";

/* =========================================
   GET MEDICAL HISTORY
========================================= */
export const getMedicalHistory = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // GET PATIENT
  const { data: patientData, error: patientError } = await supabase
    .from("pacientes")
    .select("id")
    .eq("usuario_id", user.id)
    .single();

  if (patientError || !patientData) {
    throw new Error("Paciente no encontrado");
  }

  const { data, error } = await supabase
    .from("historial_medico")
    .select("*")
    .eq("paciente_id", patientData.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data;
};
