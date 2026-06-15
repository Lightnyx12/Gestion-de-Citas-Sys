import ReprogramModal from "../../components/ReprogramModal";
import { useEffect, useState } from "react";

import { Calendar, Clock, FileText, User } from "lucide-react";
import { parseNaiveDateTime } from "../../lib/date-utils";

import {
  cancelAppointment,
  getPatientAppointments,
} from "../../lib/appointment-service";

const Appointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [closingCancelModal, setClosingCancelModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [appointmentToCancel, setAppointmentToCancel] =
  useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const closeCancelModal = () => {
  setClosingCancelModal(true);

  setTimeout(() => {
    setShowCancelModal(false);
    setClosingCancelModal(false);
  }, 300);
};
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getPatientAppointments();
      setAppointments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
  if (!appointmentToCancel) return;

  try {
    await cancelAppointment(appointmentToCancel);
    closeCancelModal();
    setShowSuccessModal(true);
    loadAppointments();
  } catch (error) {
    console.error(error);
    closeCancelModal();
    setShowErrorModal(true);
  }
};

  const parseAppointmentDate = (str: string) => {
    return parseNaiveDateTime(str);
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
    
    // Capitalizar la primera letra del día de la semana
    const rawDateStr = date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);
  };

  const now = new Date();

  const upcomingAppointments = appointments.filter(
    (appointment) => parseAppointmentDate(appointment.fecha_hora) >= now,
  );

  const pastAppointments = appointments.filter((appointment) => {
    const date = parseAppointmentDate(appointment.fecha_hora);
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return date < now && diffDays <= 3;
  });

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight">
              Mis Citas Médicas
            </h1>
            <p className="text-gray-500 mt-2">
              Visualiza y gestiona tus próximas citas o revisa tu historial reciente.
            </p>
          </div>
        </div>

        <ReprogramModal
          open={openModal}
          appointment={selectedAppointment}
          onClose={() => setOpenModal(false)}
          onSuccess={loadAppointments}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
            <p className="text-gray-500 mt-4 font-medium animate-pulse">Cargando tus citas...</p>
          </div>
        ) : (
          <>
            {/* UPCOMING SECTION */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-200/60">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Próximas Citas
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {upcomingAppointments.length}
                </span>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center shadow-sm">
                  <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No tienes próximas citas programadas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Status Badge */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                            Pendiente
                          </span>
                        </div>

                        {/* Doctor Row */}
                        <div className="flex gap-4 items-center mb-5">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-150 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                            {appointment.doctores?.foto_url ? (
                              <img
                                src={appointment.doctores.foto_url}
                                alt={`Dr. ${appointment.doctores.nombre}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-7 h-7 text-blue-900/75" />
                            )}
                          </div>

                          <div>
                            <p className="text-lg font-bold text-gray-800 leading-snug group-hover:text-blue-950 transition-colors">
                              Dr. {appointment.doctores?.nombre}{" "}
                              {appointment.doctores?.apellido}
                            </p>
                            <p className="text-sm font-medium text-gray-500">
                              {appointment.doctores?.especialidades?.nombre || "Especialista"}
                            </p>
                          </div>
                        </div>

                        {/* Info details */}
                        <div className="space-y-2.5 my-4">
                          <div className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                            <Calendar className="w-4 h-4 text-blue-950/60" />
                            <span>{getAppointmentDateString(appointment.fecha_hora)}</span>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                            <Clock className="w-4 h-4 text-blue-955/60" />
                            <span>{getAppointmentTime(appointment.fecha_hora)} hrs</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50">
                        <button
                          className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-blue-900 hover:bg-blue-800 text-white shadow-sm hover:shadow cursor-pointer"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setOpenModal(true);
                          }}
                        >
                          Reprogramar
                        </button>

                        <button
                          className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-red-50 text-red-700 hover:bg-red-100/70 border border-red-100 cursor-pointer"
                          onClick={() => {
                            setAppointmentToCancel(
                              appointment.id
                            );

                            setShowCancelModal(true);
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAST SECTION */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-200/60">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Citas Pasadas (Últimos 3 días)
                </h2>
                <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {pastAppointments.length}
                </span>
              </div>

              {pastAppointments.length === 0 ? (
                <div className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center shadow-sm">
                  <FileText className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No hay citas en tu historial reciente</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity duration-300"
                    >
                      <div>
                        {/* Status Badge */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                            Completada
                          </span>
                        </div>

                        {/* Doctor Row */}
                        <div className="flex gap-4 items-center mb-5">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-150 shrink-0">
                            {appointment.doctores?.foto_url ? (
                              <img
                                src={appointment.doctores.foto_url}
                                alt={`Dr. ${appointment.doctores.nombre}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-7 h-7 text-gray-400" />
                            )}
                          </div>

                          <div>
                            <p className="text-lg font-bold text-gray-800 leading-snug">
                              Dr. {appointment.doctores?.nombre}{" "}
                              {appointment.doctores?.apellido}
                            </p>
                            <p className="text-sm font-medium text-gray-500">
                              {appointment.doctores?.especialidades?.nombre || "Especialista"}
                            </p>
                          </div>
                        </div>

                        {/* Info details */}
                        <div className="space-y-2.5 my-4">
                          <div className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{getAppointmentDateString(appointment.fecha_hora)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50">
                        <button className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gray-50 text-gray-600 border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed opacity-75">
                          <FileText className="w-4 h-4" />
                          <span>Ver Receta</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {showCancelModal && (
  <div
    className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
      closingCancelModal
        ? "animate-fadeOut"
        : "animate-fadeIn"
    }`}
  >
    <div
      className={`bg-white rounded-2xl p-6 max-w-md w-full ${
        closingCancelModal
          ? "animate-modalOut"
          : "animate-modalIn"
      }`}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Cancelar cita
      </h2>

      <p className="text-gray-600 mb-6">
        ¿Estás seguro de que deseas cancelar esta cita médica?
      </p>

      <div className="flex gap-3">
        <button
          onClick={closeCancelModal}
          className="flex-1 py-3 border rounded-xl font-semibold bg-blue-900 text-white hover:bg-blue-800 text-white shadow-sm hover:shadow cursor-pointer"
        >
          Volver
        </button>

        <button
          onClick={handleCancel}
          className="flex-1 py-3 font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-sm hover:shadow cursor-pointer"
        >
          Cancelar cita
        </button>
      </div>
    </div>
  </div>
)}
{showSuccessModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">

    <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-modalIn">

      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">

        <svg
          className="w-10 h-10 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>

      </div>

      <h2 className="text-2xl font-bold mb-3">
        Cita cancelada
      </h2>

      <p className="text-gray-600 mb-6">
        Tu cita fue cancelada correctamente.
      </p>

      <button
        onClick={() =>
          setShowSuccessModal(false)
        }
        className="w-full flex-1 py-3 border rounded-xl font-semibold bg-blue-900 text-white hover:bg-blue-800 text-white shadow-sm hover:shadow cursor-pointer"
      >
        Entendido
      </button>

    </div>

  </div>
)}  
{showErrorModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">

    <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-modalIn">

      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">

        <svg
          className="w-10 h-10 text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10A8 8 0 114 4.93V8a1 1 0 11-2 0V2a1 1 0 011-1h6a1 1 0 110 2H5.41A6 6 0 1016 10a1 1 0 112 0z"
            clipRule="evenodd"
          />
        </svg>

      </div>

      <h2 className="text-2xl font-bold mb-3">
        Error
      </h2>

      <p className="text-gray-600 mb-6">
        Ocurrió un problema al cancelar la cita.
      </p>

      <button
        onClick={() =>
          setShowErrorModal(false)
        }
        className="w-full py-3 bg-red-600 text-white rounded-xl"
      >
        Cerrar
      </button>
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

export default Appointments;
