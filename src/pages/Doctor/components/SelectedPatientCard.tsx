import type { Appointment } from "./appointments.types";
import { getLocalDateStr, formatApptDate, formatTime12h } from "./appointments.types";
import { Clock, User, Check, ClipboardCheck } from "lucide-react";

interface SelectedPatientCardProps {
  appt: Appointment;
  todayStr: string;
  onOpenHistory: (patientId: string) => void;
  onAttend: (apptId: string) => void;
  onOpenDiagnosis: () => void;
}

const SelectedPatientCard = ({
  appt,
  todayStr,
  onOpenHistory,
  onAttend,
  onOpenDiagnosis,
}: SelectedPatientCardProps) => {
  const isPending = appt.estado === "pendiente" || appt.estado === "confirmada";
  const isCompleted = appt.estado === "completada";

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative group transition-all duration-300">
      {/* Badge de estado */}
      {isPending && (
        <span className="absolute top-6 right-6 inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest">
          Próximo Paciente
        </span>
      )}
      {isCompleted && (
        <span className="absolute top-6 right-6 inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest">
          Atendido
        </span>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar grande */}
        <div className="w-28 h-28 rounded-2xl bg-blue-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {appt.pacientes?.foto_url ? (
            <img
              src={appt.pacientes.foto_url}
              alt={appt.pacientes.usuarios?.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-blue-900/60" />
          )}
        </div>

        {/* Detalle y botones de acción */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {appt.pacientes?.usuarios?.full_name || "Paciente"}
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mt-2 font-semibold text-sm">
              <Clock className="w-4 h-4 text-blue-900/60" />
              <span>
                {getLocalDateStr(appt.fecha_hora) !== todayStr
                  ? `${formatApptDate(appt.fecha_hora)} a las `
                  : ""}
                {formatTime12h(appt.fecha_hora)}
              </span>
              {appt.reprogramada_de && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold ml-2">
                  Reprogramada
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              type="button"
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
              onClick={() => onOpenHistory(appt.paciente_id)}
            >
              Ver historial
            </button>

            {isPending && (
              <button
                type="button"
                className="px-5 py-2.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl font-bold text-sm transition-all cursor-pointer"
                onClick={() => onAttend(appt.id)}
              >
                Atender Paciente
              </button>
            )}

            {isCompleted && !appt.notas && (
              <button
                type="button"
                className="px-5 py-2.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-xl font-bold text-sm transition-all cursor-pointer"
                onClick={onOpenDiagnosis}
              >
                Registrar Diagnóstico y Receta
              </button>
            )}

            {isCompleted && appt.notas && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200/50">
                <Check className="w-4 h-4" />
                <span>Diagnóstico y Receta Registrados</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vista previa del diagnóstico registrado */}
      {appt.notas && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm space-y-2">
          <p className="font-bold text-gray-700 flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-blue-900" />
            Resumen de la Consulta:
          </p>
          <p className="text-gray-500 whitespace-pre-line text-xs font-medium leading-relaxed">
            {appt.notas}
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectedPatientCard;
