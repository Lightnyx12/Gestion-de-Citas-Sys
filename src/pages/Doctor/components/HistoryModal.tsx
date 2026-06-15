import type { HistorialMedico } from "./appointments.types";
import { X } from "lucide-react";

interface HistoryModalProps {
  isOpen: boolean;
  loading: boolean;
  history: HistorialMedico[];
  onClose: () => void;
}

const HistoryModal = ({ isOpen, loading, history, onClose }: HistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-xl font-bold">Historial Clínico</h3>
            <p className="text-xs text-blue-100/80 mt-1">
              Revisa los diagnósticos y recetas anteriores del paciente.
            </p>
          </div>
          <button
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950" />
              <p className="text-gray-500 mt-2 text-xs">Cargando documentos...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic text-sm">
              El paciente no cuenta con registros médicos anteriores.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const date = new Date(item.created_at);
                const month = date
                  .toLocaleString("es-PE", { month: "short" })
                  .toUpperCase();
                const day = date.getDate();

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    {/* Fecha */}
                    <div className="w-[50px] h-[55px] rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[9px] font-bold text-gray-400">{month}</span>
                      <span className="text-lg font-black text-blue-900 leading-none mt-0.5">
                        {day}
                      </span>
                    </div>

                    {/* Detalle */}
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider mb-1.5 ${item.tipo === "Consulta"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-purple-50 text-purple-700 border-purple-100"
                          }`}
                      >
                        {item.tipo}
                      </span>
                      <h4 className="text-sm font-bold text-gray-800 truncate">
                        {item.titulo}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-line leading-relaxed">
                        {item.descripcion}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 bg-gray-50 border-t border-gray-100 shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
