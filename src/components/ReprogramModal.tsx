import { useEffect, useState } from "react";
import { Calendar, Clock, X } from "lucide-react";

import {
  AVAILABLE_TIMES,
  getOccupiedTimes,
  rescheduleAppointment,
} from "../lib/appointment-service";

interface Props {
  open: boolean;
  onClose: () => void;
  appointment: any;
  onSuccess: () => void;
}

const ReprogramModal = ({
  open,
  onClose,
  appointment,
  onSuccess,
}: Props) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [feedbackClosing, setFeedbackClosing] = useState(false);

  useEffect(() => {
    setSelectedTime(""); // Limpiar hora seleccionada al cambiar la fecha
    if (!appointment || !selectedDate) return;
    loadOccupiedTimes();
  }, [selectedDate, appointment]);
  const openFeedbackModal = (
  title: string,
  message: string
) => {
  setFeedbackModal({
    open: true,
    title,
    message,
  });
};

const closeFeedbackModal = () => {
  setFeedbackClosing(true);

  setTimeout(() => {
    setFeedbackClosing(false);

    setFeedbackModal({
      open: false,
      title: "",
      message: "",
    });
  }, 250);
};

const handleClose = () => {
  setClosing(true);

  setTimeout(() => {
    setSelectedDate("");
    setSelectedTime("");
    setOccupiedTimes([]);
    setClosing(false);
    onClose();
  }, 250);
};

  const loadOccupiedTimes = async () => {
    try {
      const data = await getOccupiedTimes(
        appointment.doctor_id,
        selectedDate
      );
      setOccupiedTimes(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirm = async () => {
    try {
      if (!selectedDate || !selectedTime) {
        return openFeedbackModal(
          "Datos incompletos",
          "Debes seleccionar una fecha y una hora para reprogramar la cita."
        );
      }

      setLoading(true);

      await rescheduleAppointment({
        appointmentId: appointment.id,
        doctorId: appointment.doctor_id,
        oldDate: appointment.fecha_hora,
        newDate: selectedDate,
        newTime: selectedTime,
      });

      // Resetear estados al tener éxito
      setSelectedDate("");
      setSelectedTime("");
      setOccupiedTimes([]);

      openFeedbackModal(
        "Cita reprogramada",
        "La cita fue reprogramada correctamente."
      );
      onSuccess();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      openFeedbackModal(
        "Error",
        error.message || "Ocurrió un error al reprogramar la cita."
      );
    } finally {
      setLoading(false);
    }
  };

  const parseAppointmentDate = (str: string) => {
    if (!str) return new Date();
    return new Date(str.replace(" ", "T"));
  };

  const getAppointmentTime = (fechaHoraStr: string) => {
    if (!fechaHoraStr) return "";
    const match = fechaHoraStr.match(/(?:T|\s)(\d{2}:\d{2})/);
    return match ? match[1] : "";
  };

  const getAppointmentDateString = (fechaHoraStr: string) => {
    if (!fechaHoraStr) return "";
    const date = parseAppointmentDate(fechaHoraStr);
    if (isNaN(date.getTime())) return fechaHoraStr.split(" ")[0] || "";
    
    const rawDateStr = date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    return rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);
  };

  if (!open) return null;

  const localToday = new Date().toLocaleDateString('sv-SE');

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 md:p-6 ${
      closing
        ? "animate-fadeOut"
        : "animate-fadeIn"
      }`}
    >
      <div 
        className={`w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] ${
          closing
            ? "animate-scaleOut"
            : "animate-scaleIn"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 md:p-8 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Reprogramar Cita
            </h2>
            <p className="text-sm text-blue-100/80 mt-1.5">
              Elige un nuevo horario de acuerdo con tu disponibilidad y la del médico.
            </p>
          </div>
          <button
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
            onClick={handleClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY (Scrollable if content overflows) */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          {/* CURRENT APPOINTMENT INFO */}
          {appointment && (
            <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Cita Actual
                </p>
                <h3 className="text-lg font-bold text-blue-955 leading-tight">
                  Dr. {appointment.doctores?.nombre} {appointment.doctores?.apellido}
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  {appointment.doctores?.especialidades?.nombre || "Especialista"}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0 md:border-l md:border-gray-200 md:pl-6">
                <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                  <Calendar size={15} className="text-blue-900/60" />
                  <span>{getAppointmentDateString(appointment.fecha_hora)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                  <Clock size={15} className="text-blue-900/60" />
                  <span>{getAppointmentTime(appointment.fecha_hora)} hrs</span>
                </div>
              </div>
            </div>
          )}

          {/* GRID: SELECTION FORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DATE */}
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3 pb-1 border-b border-gray-100 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">1</span>
                Nueva Fecha
              </h3>
              <input
                type="date"
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium"
                min={localToday}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* TIME */}
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3 pb-1 border-b border-gray-100 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">2</span>
                Horarios Disponibles
              </h3>

              {!selectedDate ? (
                <div className="text-center text-gray-400 py-6 italic text-sm font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1">
                  <Calendar size={18} className="text-gray-300" />
                  <span>Selecciona una fecha primero</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {AVAILABLE_TIMES.map((time) => {
                    const isOccupied = occupiedTimes.includes(time);
                    return (
                      <button
                        key={time}
                        disabled={isOccupied}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          isOccupied
                            ? "bg-gray-150 border-gray-200 text-gray-350 cursor-not-allowed opacity-50"
                            : selectedTime === time
                            ? "bg-blue-900 text-white border-blue-900 hover:bg-blue-800"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50/50 hover:border-blue-300"
                        }`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time} hrs
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100 shrink-0">
          <button
            className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 bg-gray-150 hover:bg-gray-200 text-gray-700 cursor-pointer"
            onClick={handleClose}
          >
            Cancelar
          </button>

          <button
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              loading || !selectedDate || !selectedTime
                ? "bg-blue-900/40 text-white/60 cursor-not-allowed border-0"
                : "bg-blue-900 hover:bg-blue-800 text-white cursor-pointer shadow-sm"
            }`}
            onClick={handleConfirm}
            disabled={loading || !selectedDate || !selectedTime}
          >
            {loading ? "Reprogramando..." : "Confirmar Reprogramación"}
          </button>
        </div>
      </div>
      {feedbackModal.open && (
  <div
    className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 ${
      feedbackClosing
        ? "animate-fadeOut"
        : "animate-fadeIn"
    }`}
  >
    <div
      className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ${
        feedbackClosing
          ? "animate-scaleOut"
          : "animate-scaleIn"
      }`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-3">
        {feedbackModal.title}
      </h3>

      <p className="text-gray-600 mb-6">
        {feedbackModal.message}
      </p>

      <div className="flex justify-end">
        <button
          onClick={closeFeedbackModal}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold transition-all cursor-pointer"
        >
          Aceptar
        </button>
      </div>
    </div>
  </div>
)}
<style>{`
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes modalIn {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(-30px);
  }

  60% {
    transform: scale(1.02);
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
    transform: scale(0.92) translateY(-15px);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.3s ease forwards;
}

.animate-modalIn {
  animation: modalIn 0.35s ease forwards;
}

.animate-modalOut {
  animation: modalOut 0.3s ease forwards;
}
`}
</style>
    </div>
  );
};

export default ReprogramModal;