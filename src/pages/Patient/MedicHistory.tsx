import { useEffect, useState } from "react";
import { FileTextIcon, History, Pill } from "lucide-react";
import { getMedicalHistory } from "../../lib/medical-history-service";

const MedicalHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getMedicalHistory();
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case "consulta":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "receta":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "analisis":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight">
            Historia Clínica Digital
          </h1>
          <p className="text-gray-500 mt-2">
            Revisa tus recetas, diagnósticos y resultados de análisis médicos previos.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <p className="text-gray-500 mt-4 font-medium animate-pulse">Cargando historial clínico...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: HISTORY LIST */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-50 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-900" />
                Actividad Reciente
              </h2>

              {history.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center shadow-sm">
                  <FileTextIcon className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No hay documentos médicos disponibles en tu historial.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {history.map((item) => {
                    const date = new Date(item.created_at);
                    const month = date.toLocaleString("es-PE", { month: "short" });
                    const day = date.getDate();

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between gap-5 transition-all group"
                      >
                        {/* Date Box & Content */}
                        <div className="flex gap-4 items-start">
                          <div className="min-w-[65px] h-[65px] rounded-xl bg-white border border-gray-150 flex flex-col items-center justify-center shadow-sm shrink-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {month}
                            </span>
                            <span className="text-2xl font-extrabold text-blue-900 leading-none mt-1">
                              {day}
                            </span>
                          </div>

                          <div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider mb-2 ${getTypeStyle(item.tipo)}`}>
                              {item.tipo}
                            </span>
                            <h3 className="text-lg font-bold text-gray-800 leading-snug group-hover:text-blue-900 transition-colors">
                              {item.titulo}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                              {item.descripcion}
                            </p>
                          </div>
                        </div>

                        {/* PDF Link Button */}
                        {item.pdf_url && (
                          <a
                            href={item.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="self-end sm:self-center shrink-0"
                          >
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                              <FileTextIcon className="w-4 h-4" />
                              PDF
                            </button>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
