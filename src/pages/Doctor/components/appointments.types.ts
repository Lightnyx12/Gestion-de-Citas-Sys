// ─── Tipos compartidos entre los componentes de AppointmentsCenter ───────────

export interface Appointment {
  id: string;
  paciente_id: string;
  doctor_id: string;
  fecha_hora: string;
  motivo: string | null;        // nullable — columna añadida posteriormente
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  notas: string | null;         // nullable — columna añadida posteriormente
  reprogramada_de: string | null;
  fecha_hora_original: string | null;
  pacientes: {
    id: string;
    foto_url: string;
    usuarios: {
      full_name: string;
      email: string;
    };
  };
}

export interface HistorialMedico {
  id: string;
  paciente_id: string;
  tipo: "consulta" | "receta" | "analisis"; // lowercase — coincide con el CHECK constraint de la BD
  titulo: string;
  descripcion: string;
  created_at: string;
}

export type TabType = "today" | "upcoming" | "completed";
export type ModalType = "success" | "error" | "warning";

// ─── Utilidades de fecha/hora ─────────────────────────────────────────────────

export const getLocalDateStr = (fechaHoraStr: string): string => {
  if (!fechaHoraStr) return "";
  try {
    const date = new Date(fechaHoraStr.replace(" ", "T"));
    if (isNaN(date.getTime())) {
      return fechaHoraStr.includes("T")
        ? fechaHoraStr.split("T")[0]
        : fechaHoraStr.split(" ")[0];
    }
    return date.toLocaleDateString("sv-SE");
  } catch {
    return fechaHoraStr.includes("T")
      ? fechaHoraStr.split("T")[0]
      : fechaHoraStr.split(" ")[0];
  }
};

export const formatApptDate = (fechaHoraStr: string): string => {
  if (!fechaHoraStr) return "";
  try {
    const date = new Date(fechaHoraStr.replace(" ", "T"));
    if (isNaN(date.getTime())) {
      return fechaHoraStr.split(" ")[0] || fechaHoraStr;
    }
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return fechaHoraStr.split(" ")[0] || fechaHoraStr;
  }
};

export const formatTime12h = (fechaHoraStr: string): string => {
  if (!fechaHoraStr) return "";
  try {
    const date = new Date(fechaHoraStr.replace(" ", "T"));
    if (isNaN(date.getTime())) {
      const timePart =
        fechaHoraStr.split(" ")[1] || fechaHoraStr.split("T")[1] || "";
      return timePart.substring(0, 5);
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};
