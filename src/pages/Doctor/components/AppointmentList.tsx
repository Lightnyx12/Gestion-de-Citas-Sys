import { getLocalDateStr, formatApptDate, formatTime12h } from "./appointments.types";
import type { Appointment, TabType } from "./appointments.types";
import { Clock, User, ChevronRight, Calendar } from "lucide-react";

interface AppointmentListProps {
  appointments: Appointment[];
  selectedApptId: string | null;
  onSelect: (id: string) => void;
  activeTab: TabType;
  todayStr: string;
  tomorrowCount: number;
}

const AppointmentList = ({
  appointments,
  selectedApptId,
  onSelect,
  activeTab,
  todayStr,
  tomorrowCount,
}: AppointmentListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">
        {activeTab === "today"
          ? "Citas de Hoy"
          : activeTab === "upcoming"
            ? "Próximas Citas"
            : "Historial de Citas Atendidas"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer flex items-center justify-between group hover:-translate-y-0.5 transition-all duration-200 ${selectedApptId === appt.id
                ? "border-blue-900 ring-2 ring-blue-900/10"
                : "border-gray-100 hover:border-gray-200"
              }`}
            onClick={() => onSelect(appt.id)}
          >
            <div className="flex items-center gap-4">
              {/* Avatar circular */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                {appt.pacientes?.foto_url ? (
                  <img
                    src={appt.pacientes.foto_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-800 leading-snug group-hover:text-blue-900 transition-colors">
                  {appt.pacientes?.usuarios?.full_name}
                </h4>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 mt-1">
                  <Clock className="w-3.5 h-3.5 text-blue-900/50" />
                  <span>
                    {getLocalDateStr(appt.fecha_hora) !== todayStr
                      ? `${formatApptDate(appt.fecha_hora)} a las `
                      : ""}
                    {formatTime12h(appt.fecha_hora)}
                  </span>
                  {appt.estado === "completada" ? (
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold ml-2">
                      Atendido
                    </span>
                  ) : appt.reprogramada_de ? (
                    <span className="text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded font-bold ml-2">
                      Reprog.
                    </span>
                  ) : (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold ml-2">
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-900 transition-colors" />
          </div>
        ))}

        {/* Empty state para tabs distintos a hoy */}
        {appointments.length === 0 && activeTab !== "today" && (
          <div className="col-span-full py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium">
              {activeTab === "upcoming"
                ? "No tienes más citas programadas."
                : "No has atendido citas aún."}
            </p>
          </div>
        )}

        {/* Card "Nada más por hoy" siempre visible en tab hoy */}
        {activeTab === "today" && (
          <div className="bg-gray-50/50 rounded-2xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <Calendar className="w-8 h-8 text-gray-300 mb-2" />
            <h4 className="text-xs font-bold text-gray-700">Nada más por hoy</h4>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {tomorrowCount > 0
                ? `Mañana hay ${tomorrowCount} citas más.`
                : "No hay citas para mañana."}
            </p>
            <span className="text-[10px] font-bold text-blue-900 tracking-wider uppercase mt-3">
              Horario Completo
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;
