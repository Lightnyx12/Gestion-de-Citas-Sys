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

export {
  parseNaiveDateTime,
  getLocalDateStr,
  formatApptDate,
  formatTime12h
} from "../../../lib/date-utils";

