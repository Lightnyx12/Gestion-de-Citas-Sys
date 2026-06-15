import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { availabilityService } from "../../lib/availability-service";

import type {
  Appointment,
  HistorialMedico,
  TabType
} from "./components/appointments.types";

import { getLocalDateStr } from "./components/appointments.types";

import AppointmentTabs, { EmptySelection } from "./components/AppointmentTabs";
import AppointmentList from "./components/AppointmentList";
import SelectedPatientCard from "./components/SelectedPatientCard";
import HistoryModal from "./components/HistoryModal";
import DiagnosisModal from "./components/DiagnosisModal";
import NotificationModal from "./components/NotificationModal";
import { useNotificationModal } from "./components/useNotificationModal";

// ─── Componente principal ─────────────────────────────────────────────────────

const AppointmentsCenter = () => {
  // Estado de datos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("today");

  // Estado del modal de historial
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [patientHistory, setPatientHistory] = useState<HistorialMedico[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Estado del modal de diagnóstico
  const [openDiagnosisModal, setOpenDiagnosisModal] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);

  // Hook del modal de notificación
  const {
    modalOpen,
    modalClosing,
    modalTitle,
    modalMessage,
    modalType,
    openModal,
    closeModal,
  } = useNotificationModal();

  // ─── Carga inicial de citas ─────────────────────────────────────────────────
  function loadAppointments(): Promise<void> {
    return (async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const docId = await availabilityService.getDoctorId(user.id);
        if (!docId) return;

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
        setAppointments((data || []) as unknown as Appointment[]);
      } catch (error) {
        console.error("Error al cargar citas:", error);
      } finally {
        setLoading(false);
      }
    })();
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  // ─── Derivar listas y cita seleccionada con useMemo ────────────────────────
  // (evita llamar setState dentro de useEffect → cascading renders)

  const todayStr = useMemo(() => new Date().toLocaleDateString("sv-SE"), []);

  const filteredAppointments = useMemo(() => {
    if (activeTab === "today") {
      return appointments.filter((a) => getLocalDateStr(a.fecha_hora) === todayStr);
    } else if (activeTab === "upcoming") {
      return appointments.filter((a) => {
        const isFuture = getLocalDateStr(a.fecha_hora) > todayStr;
        return isFuture && a.estado === "pendiente";
      });
    } else {
      return appointments.filter((a) => a.estado === "completada");
    }
  }, [appointments, activeTab, todayStr]);

  const selectedAppt = useMemo(() => {
    if (filteredAppointments.length === 0) return null;
    const explicit = filteredAppointments.find((a) => a.id === selectedApptId);
    if (explicit) return explicit;
    return (
      filteredAppointments.find(
        (a) => a.estado === "pendiente"
      ) ?? filteredAppointments[0]
    );
  }, [filteredAppointments, selectedApptId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAttendPatient = async (apptId: string) => {
    try {
      const { error } = await supabase
        .from("citas")
        .update({ estado: "completada" })
        .eq("id", apptId);

      if (error) throw error;

      openModal("success", "Paciente atendido", "Ahora puedes registrar su diagnóstico y receta.");
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, estado: "completada" } : a))
      );
    } catch (error) {
      console.error(error);
      openModal("error", "Error", "No se pudo marcar al paciente como atendido.");
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
      setPatientHistory((data || []) as HistorialMedico[]);
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
      return openModal("warning", "Diagnóstico requerido", "Debes ingresar un diagnóstico antes de guardar la ficha.");
    }

    try {
      setSavingDiagnosis(true);
      const patientId = selectedAppt.paciente_id;
      const apptId    = selectedAppt.id;

      // ── Construir los registros a insertar ──────────────────────────────────
      // "tipo" debe coincidir con el CHECK constraint: 'consulta' | 'receta' | 'analisis'
      const historialRows = [
        {
          paciente_id: patientId,
          tipo: "consulta",
          titulo: "Consulta Médica - Diagnóstico",
          descripcion: diagnosis.trim(),
        },
        ...(prescription.trim()
          ? [{
              paciente_id: patientId,
              tipo: "receta",
              titulo: "Receta Médica",
              descripcion: prescription.trim(),
            }]
          : []),
      ];

      const combinedNotes = `Diagnóstico: ${diagnosis.trim()}${
        prescription.trim() ? `\nReceta: ${prescription.trim()}` : ""
      }`;

      // ── async-parallel: insertar historial y actualizar cita en paralelo ────
      const [historialResult, apptResult] = await Promise.all([
        supabase.from("historial_medico").insert(historialRows),
        supabase.from("citas").update({ notas: combinedNotes }).eq("id", apptId),
      ]);

      if (historialResult.error) throw historialResult.error;
      if (apptResult.error)      throw apptResult.error;

      openModal("success", "Ficha guardada", "El diagnóstico y la receta fueron guardados correctamente.");
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, notas: combinedNotes } : a))
      );
      setDiagnosis("");
      setPrescription("");
      setOpenDiagnosisModal(false);
    } catch (error) {
      console.error("Error al guardar diagnóstico:", error);
      openModal("error", "Error", "No se pudo registrar el diagnóstico. Intenta nuevamente.");
    } finally {
      setSavingDiagnosis(false);
    }
  };


  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando agenda de citas...</p>
        </div>
      </div>
    );
  }

  // ─── Contadores para los tabs y el card de mañana ──────────────────────────
  const todayAppointments = appointments.filter((a) => getLocalDateStr(a.fecha_hora) === todayStr);
  const upcomingAppointments = appointments.filter((a) => {
    const isFuture = getLocalDateStr(a.fecha_hora) > todayStr;
    return isFuture && a.estado === "pendiente";
  });
  const completedAppointments = appointments.filter((a) => a.estado === "completada");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("sv-SE");
  const tomorrowCount = appointments.filter(
    (a) => getLocalDateStr(a.fecha_hora) === tomorrowStr
  ).length;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Próximas citas
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona la atención de tus pacientes programados.
          </p>
        </div>

        {/* TABS */}
        <AppointmentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayCount={todayAppointments.length}
          upcomingCount={upcomingAppointments.length}
          completedCount={completedAppointments.length}
        />

        {/* TARJETA DEL PACIENTE SELECCIONADO */}
        {selectedAppt ? (
          <SelectedPatientCard
            appt={selectedAppt}
            todayStr={todayStr}
            onOpenHistory={handleOpenHistory}
            onAttend={handleAttendPatient}
            onOpenDiagnosis={() => setOpenDiagnosisModal(true)}
          />
        ) : (
          <EmptySelection activeTab={activeTab} />
        )}

        {/* LISTA DE CITAS */}
        <AppointmentList
          appointments={filteredAppointments}
          selectedApptId={selectedAppt?.id ?? null}
          onSelect={setSelectedApptId}
          activeTab={activeTab}
          todayStr={todayStr}
          tomorrowCount={tomorrowCount}
        />
      </div>

      {/* MODALES */}
      <HistoryModal
        isOpen={openHistoryModal}
        loading={loadingHistory}
        history={patientHistory}
        onClose={() => setOpenHistoryModal(false)}
      />

      <DiagnosisModal
        isOpen={openDiagnosisModal && !!selectedAppt}
        patientName={selectedAppt?.pacientes?.usuarios?.full_name ?? ""}
        diagnosis={diagnosis}
        prescription={prescription}
        saving={savingDiagnosis}
        onClose={() => setOpenDiagnosisModal(false)}
        onDiagnosisChange={setDiagnosis}
        onPrescriptionChange={setPrescription}
        onSubmit={handleSaveDiagnosis}
      />

      <NotificationModal
        isOpen={modalOpen}
        closing={modalClosing}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={closeModal}
      />
    </div>
  );
};

export default AppointmentsCenter;