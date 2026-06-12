import { supabase } from "./supabase";

export const sendAnonymousFeedback =
  async (
    mensaje: string,
    calificacion: number
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("feedback_pacientes")
      .insert({
        usuario_id: user?.id || null,
        mensaje,
        calificacion,
      });

    if (error) {
      throw error;
    }

    return true;
  };

  