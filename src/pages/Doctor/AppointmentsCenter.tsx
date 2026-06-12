import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { availabilityService } from "../../lib/availability-service";
import {
  Calendar,
  Clock,
  User,
  Check,
  ChevronRight,
  X,
  ClipboardCheck,
} from "lucide-react";

interface Appointment {
  id: string;
  paciente_id: string;
  doctor_id: string;
  fecha_hora: string;
  motivo: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  notas: string;
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

const AppointmentsCenter = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal de Historial
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal de Diagnóstico
  const [openDiagnosisModal, setOpenDiagnosisModal] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "warning">("success");

  useEffect(() => {
    loadAppointments();
  }, []);

  const openModal = (
  type: "success" | "error" | "warning",
  title: string,
  message: string
) => {
  setModalType(type);
  setModalTitle(title);
  setModalMessage(message);
  setModalOpen(true);
};

const closeModal = () => {
  setModalClosing(true);

  setTimeout(() => {
    setModalClosing(false);
    setModalOpen(false);
  }, 300);
};

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener el ID del doctor
      const docId = await availabilityService.getDoctorId(user.id);
      if (!docId) return;

      // Cargar todas las citas no canceladas
      const { data, error } = await supabase
        .from("citas")
        .select(`
          *,
          pacientes (
            id,
            foto_url,
            usuarios (
              full_name,
              email
            )
          )
        `)
        .eq("doctor_id", docId)
        .neq("estado", "cancelada")
        .order("fecha_hora", { ascending: true });

      if (error) throw error;

      const appts = (data || []) as unknown as Appointment[];
      setAppointments(appts);

      // Seleccionar por defecto la primera cita pendiente/confirmada
      const nextPending = appts.find(
        (a) => a.estado === "pendiente" || a.estado === "confirmada"
      );
      setSelectedAppt(nextPending || appts[0] || null);
    } catch (error) {
      console.error("Error al cargar citas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendPatient = async (apptId: string) => {
    try {
      // 1. Cambiar estado en base de datos
      const { error } = await supabase
        .from("citas")
        .update({ estado: "completada" })
        .eq("id", apptId);

      if (error) throw error;

      openModal(
        "success",
        "Paciente atendido",
        "Ahora puedes registrar su diagnóstico y receta."
      );
      
      // Actualizar localmente
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, estado: "completada" } : a))
      );
      
      setSelectedAppt((prev) =>
        prev && prev.id === apptId ? { ...prev, estado: "completada" } : prev
      );
    } catch (error) {
      console.error(error);
      openModal(
        "error",
        "Error",
        "No se pudo marcar al paciente como atendido."
      );
    }
  };

  const handleOpenHistory = async (patientId: string) => {
    try {
      setOpenHistoryModal(true);
      setLoadingHistory(true);
      
      const { data, error } = await supabase
        .from("historial_medico")
        .select("*")
        .eq("paciente_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatientHistory(data || []);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    if (!diagnosis.trim()) {
      return openModal(
        "warning",
        "Diagnóstico requerido",
        "Debes ingresar un diagnóstico antes de guardar la ficha."
      );
    }

    try {
      setSavingDiagnosis(true);

      const patientId = selectedAppt.paciente_id;

      // 1. Insertar Diagnóstico en historial_medico
      const { error: diagError } = await supabase
        .from("historial_medico")
        .insert({
          paciente_id: patientId,
          tipo: "Consulta",
          titulo: "Consulta Médica - Diagnóstico",
          descripcion: diagnosis,
        });

      if (diagError) throw diagError;

      // 2. Insertar Receta en historial_medico (si existe)
      if (prescription.trim()) {
        const { error: presError } = await supabase
          .from("historial_medico")
          .insert({
            paciente_id: patientId,
            tipo: "Receta",
            titulo: "Receta Médica",
            descripcion: prescription,
          });

        if (presError) throw presError;
      }

      // 3. Guardar en notas de la cita
      const combinedNotes = `Diagnóstico: ${diagnosis}${
        prescription.trim() ? `\nReceta: ${prescription}` : ""
      }`;
      const { error: apptError } = await supabase
        .from("citas")
        .update({ notas: combinedNotes })
        .eq("id", selectedAppt.id);

      if (apptError) throw apptError;

      openModal(
        "success",
        "Ficha guardada",
        "El diagnóstico y la receta fueron guardados correctamente."
      );
      
      // Actualizar localmente
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === selectedAppt.id ? { ...a, notas: combinedNotes } : a
        )
      );
      setSelectedAppt((prev) =>
        prev ? { ...prev, notas: combinedNotes } : null
      );

      // Limpiar y cerrar modal
      setDiagnosis("");
      setPrescription("");
      setOpenDiagnosisModal(false);
    } catch (error) {
      console.error(error);
      openModal(
        "error",
        "Error",
        "No se pudo registrar el diagnóstico."
      );
    } finally {
      setSavingDiagnosis(false);
    }
  };

  // Helper para hora 12h
  const formatTime12h = (fechaHoraStr: string) => {
    if (!fechaHoraStr) return "";
    try {
      const date = new Date(fechaHoraStr.replace(" ", "T"));
      if (isNaN(date.getTime())) {
        const timePart = fechaHoraStr.split(" ")[1] || fechaHoraStr.split("T")[1] || "";
        return timePart.substring(0, 5);
      }
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Cargando agenda de citas...</p>
        </div>
      </div>
    );
  }

  // Filtrar citas de hoy
  const todayStr = new Date().toLocaleDateString("sv-SE");
  const todayAppointments = appointments.filter((a) => {
    const apptDate = a.fecha_hora.split(" ")[0] || a.fecha_hora.split("T")[0];
    return apptDate === todayStr;
  });

  // Citas de mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("sv-SE");
  const tomorrowCount = appointments.filter((a) => {
    const apptDate = a.fecha_hora.split(" ")[0] || a.fecha_hora.split("T")[0];
    return apptDate === tomorrowStr;
  }).length;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Próximas citas
          </h1>
          <p className="text-gray-550 mt-1">
            Gestiona la atención de tus pacientes programados para hoy.
          </p>
        </div>

        {/* SELECTED / NEXT PATIENT CARD */}
        {selectedAppt ? (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative group transition-all duration-300">
            {/* Tag Próximo Paciente */}
            {(selectedAppt.estado === "pendiente" || selectedAppt.estado === "confirmada") && (
              <span className="absolute top-6 right-6 inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest">
                Próximo Paciente
              </span>
            )}
            
            {/* Tag Completado */}
            {selectedAppt.estado === "completada" && (
              <span className="absolute top-6 right-6 inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest">
                Atendido
              </span>
            )}

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Patient Avatar (Square with Rounded corners) */}
              <div className="w-28 h-28 rounded-2xl bg-blue-50 border border-gray-150 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {selectedAppt.pacientes?.foto_url ? (
                  <img
                    src={selectedAppt.pacientes.foto_url}
                    alt={selectedAppt.pacientes.usuarios?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-blue-900/60" />
                )}
              </div>

              {/* Patient Details & Action buttons */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    {selectedAppt.pacientes?.usuarios?.full_name || "Paciente"}
                  </h2>
                  
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mt-2 font-semibold text-sm">
                    <Clock className="w-4 h-4 text-blue-900/60" />
                    <span>{formatTime12h(selectedAppt.fecha_hora)}</span>
                    {selectedAppt.reprogramada_de && (
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
                    onClick={() => handleOpenHistory(selectedAppt.paciente_id)}
                  >
                    Ver historial
                  </button>

                  {/* Atender Paciente */}
                  {(selectedAppt.estado === "pendiente" || selectedAppt.estado === "confirmada") && (
                    <button
                      type="button"
                      className="px-5 py-2.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl font-bold text-sm transition-all cursor-pointer"
                      onClick={() => handleAttendPatient(selectedAppt.id)}
                    >
                      Atender Paciente
                    </button>
                  )}

                  {/* Registrar Diagnóstico */}
                  {selectedAppt.estado === "completada" && !selectedAppt.notas && (
                    <button
                      type="button"
                      className="px-5 py-2.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-xl font-bold text-sm transition-all cursor-pointer"
                      onClick={() => setOpenDiagnosisModal(true)}
                    >
                      Registrar Diagnóstico y Receta
                    </button>
                  )}

                  {/* Diagnóstico ya registrado */}
                  {selectedAppt.estado === "completada" && selectedAppt.notas && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200/50">
                      <Check className="w-4 h-4" />
                      <span>Diagnóstico y Receta Registrados</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Notas / Diagnóstico Registrado preview */}
            {selectedAppt.notas && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-150 rounded-2xl text-sm space-y-2">
                <p className="font-bold text-gray-700 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-blue-900" />
                  Resumen de la Consulta:
                </p>
                <p className="text-gray-500 whitespace-pre-line text-xs font-medium leading-relaxed">
                  {selectedAppt.notas}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay citas registradas para hoy.</p>
          </div>
        )}

        {/* BOTTOM SCHEDULE LIST GRID */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">
            Agenda del Día
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer flex items-center justify-between group hover:-translate-y-0.5 transition-all duration-200 ${
                  selectedAppt?.id === appt.id
                    ? "border-blue-900 ring-2 ring-blue-900/10"
                    : "border-gray-100 hover:border-gray-200"
                }`}
                onClick={() => setSelectedAppt(appt)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar circular */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-150 flex items-center justify-center shrink-0">
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
                      <span>{formatTime12h(appt.fecha_hora)}</span>
                      {appt.estado === "completada" ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold ml-2">
                          Atendido
                        </span>
                      ) : appt.reprogramada_de ? (
                        <span className="text-[10px] text-orange-650 bg-orange-50 px-1.5 py-0.5 rounded font-bold ml-2">
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

            {/* DASHED HORARIO COMPLETO CARD */}
            <div className="bg-gray-50/50 rounded-2xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <Calendar className="w-8 h-8 text-gray-300 mb-2" />
              <h4 className="text-xs font-bold text-gray-700">Nada más por hoy</h4>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                {tomorrowCount > 0 ? `Mañana hay ${tomorrowCount} citas más.` : "No hay citas para mañana."}
              </p>
              <span className="text-[10px] font-bold text-blue-900 tracking-wider uppercase mt-3">
                Horario Completo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: HISTORIAL CLÍNICO DEL PACIENTE */}
      {openHistoryModal && (
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
                onClick={() => setOpenHistoryModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950"></div>
                  <p className="text-gray-500 mt-2 text-xs">Cargando documentos...</p>
                </div>
              ) : patientHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic text-sm">
                  El paciente no cuenta con registros médicos anteriores.
                </div>
              ) : (
                <div className="space-y-4">
                  {patientHistory.map((item) => {
                    const date = new Date(item.created_at);
                    const month = date.toLocaleString("es-PE", { month: "short" }).toUpperCase();
                    const day = date.getDate();

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                      >
                        {/* Fecha */}
                        <div className="w-[50px] h-[55px] rounded-xl bg-white border border-gray-150 flex flex-col items-center justify-center shrink-0 shadow-sm">
                          <span className="text-[9px] font-bold text-gray-400">{month}</span>
                          <span className="text-lg font-black text-blue-900 leading-none mt-0.5">{day}</span>
                        </div>

                        {/* Detalle */}
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider mb-1.5 ${
                            item.tipo === "Consulta"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-purple-50 text-purple-700 border-purple-100"
                          }`}>
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
                className="px-5 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                onClick={() => setOpenHistoryModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR DIAGNÓSTICO Y RECETA */}
      {openDiagnosisModal && selectedAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">Registrar Consulta</h3>
                <p className="text-xs text-blue-100/80 mt-1">
                  Paciente: {selectedAppt.pacientes?.usuarios?.full_name}
                </p>
              </div>
              <button
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
                onClick={() => setOpenDiagnosisModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDiagnosis} className="flex flex-col">
              <div className="p-6 space-y-4">
                {/* Diagnóstico */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Diagnóstico Final *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-sm text-gray-750 placeholder-gray-400 resize-none"
                    placeholder="Describe los hallazgos y el diagnóstico médico..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                {/* Receta */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Receta Médica / Medicación (Opcional)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-sm text-gray-750 placeholder-gray-400 resize-none"
                    placeholder="Especifica los medicamentos, dosis y duración..."
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                  onClick={() => setOpenDiagnosisModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDiagnosis}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingDiagnosis ? "Guardando..." : "Guardar Ficha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{modalOpen && (
  <div
    className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 ${
      modalClosing ? "animate-fadeOut" : "animate-fadeIn"
    }`}
  >
    <div
      className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ${
        modalClosing ? "animate-scaleOut" : "animate-scaleIn"
      }`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${
          modalType === "success"
            ? "bg-green-100 text-green-600"
            : modalType === "error"
            ? "bg-red-100 text-red-600"
            : "bg-amber-100 text-amber-600"
        }`}
      >
        {modalType === "success" ? "✓" : modalType === "error" ? "×" : "⚠"}
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
        {modalTitle}
      </h2>

      <p className="text-sm text-center text-gray-600 mb-6">
        {modalMessage}
      </p>

      <button
        onClick={closeModal}
        className={`w-full py-3 rounded-xl text-white font-bold transition ${
          modalType === "success"
            ? "bg-blue-900 hover:bg-blue-800"
            : modalType === "error"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-amber-600 hover:bg-amber-700"
        }`}
      >
        Entendido
      </button>
    </div>
  </div>
)}
<style> {`
@keyframes fadeIn {@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modalIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-15px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modalOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(-10px);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.3s ease forwards;
}

.animate-modalIn {
  animation: modalIn 0.3s ease forwards;
}

.animate-modalOut {
  animation: modalOut 0.3s ease forwards;
  
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-15px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(-10px);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.25s ease forwards;
}

.animate-scaleIn,
.animate-modalIn {
  animation: scaleIn 0.3s ease forwards;
}

.animate-scaleOut,
.animate-modalOut {
  animation: scaleOut 0.25s ease forwards;
}  
}
  `}</style>
    </div>
  );
};

export default AppointmentsCenter;