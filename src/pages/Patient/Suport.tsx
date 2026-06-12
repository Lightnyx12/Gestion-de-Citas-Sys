// src/pages/Patient/Suport.tsx

import { useState } from "react";

import {
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react";

import { sendAnonymousFeedback } from "../../lib/support-service";

const questions = [
  {
    question: "¿Cómo cancelar una cita médica?",
    answer: "Puedes cancelar tu cita ingresando a la sección 'Mis Citas', localizando la cita correspondiente en tus próximas citas y haciendo clic en 'Cancelar'. Es recomendable realizar la cancelación con al menos 24 horas de antelación para permitir que otros pacientes tomen el horario libre.",
  },
  {
    question: "¿Dónde descargar mis resultados?",
    answer: "Tus diagnósticos, indicaciones y recetas están guardados en tu 'Historia Clínica Digital'. Si posees un documento de análisis adjunto en formato PDF, aparecerá un botón que te permitirá descargarlo de forma directa.",
  },
  {
    question: "¿Cómo cambiar mis datos de contacto?",
    answer: "Dirígete a la sección de 'Ajustes' desde el panel de navegación lateral. Allí podrás editar tu información personal como número telefónico, dirección física, reportar alergias o subir una nueva fotografía de perfil.",
  },
];

const Suport = () => {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  
  const openModal = (title: string, message: string) => {
  setModalTitle(title);
  setModalMessage(message);
  setModalOpen(true);
};

  const closeModal = () => {
  setModalClosing(true);

  setTimeout(() => {
    setModalClosing(false);
    setModalOpen(false);
  }, 250);
};


  /* =====================================
      COPIAR TELÉFONO
  ===================================== */
  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText("+51 981 123 456");
      openModal(
        "Número Copiado",
        "El número de teléfono ha sido copiado al portapapeles."
      );
    } catch (error) {
      console.error(error);
    }
  };

  /* =====================================
      ENVIAR FEEDBACK
  ===================================== */
  const handleSubmit = async () => {
  try {
    const cleanMessage = message.replace(/\s/g, "");

    if (!message.trim()) {
      return openModal(
        "Mensaje requerido",
        "Debes escribir un comentario antes de enviarlo."
      );
    }

    if (!rating) {
      return openModal(
        "Calificación requerida",
        "Debes seleccionar una calificación."
      );
    }

    if (cleanMessage.length < 50) {
      return openModal(
        "Mensaje demasiado corto",
        "Tu comentario debe contener al menos 50 caracteres sin contar espacios."
      );
    }

    setLoading(true);

    await sendAnonymousFeedback(
      message,
      rating
    );

    openModal(
      "Comentario enviado",
      "Gracias por compartir tu opinión. Tu feedback fue enviado correctamente."
    );

    setMessage("");
    setRating(5);

  } catch (error) {
    console.error(error);

    openModal(
      "Error",
      "Ocurrió un error al enviar tu feedback. Inténtalo nuevamente."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight">
            Centro de Soporte
          </h1>
          <p className="text-gray-500 mt-2">
            Estamos aquí para ayudarte. Comunícate con nosotros o consulta nuestras preguntas frecuentes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: CONTACT CHANNELS & FAQ */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* PHONE CARD */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-900 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Llámanos</p>
                  <p className="text-base font-extrabold text-blue-900">+51 981 123 456</p>
                </div>
              </div>

              <button
                className="p-2 text-gray-400 hover:text-blue-900 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                onClick={copyPhone}
                title="Copiar número"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* WHATSAPP CARD */}
            <a
              href="https://wa.me/51981123456"
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:border-emerald-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">WhatsApp</p>
                    <p className="text-base font-extrabold text-emerald-700">Chat Instantáneo</p>
                  </div>
                </div>

                <ChevronRight className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
              </div>
            </a>

            {/* FAQ SECTION */}
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
  <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-50">
    Preguntas Frecuentes
  </h3>

  <div className="divide-y divide-gray-100">
    {questions.map((item, index) => {
      const isOpen = openQuestion === index;

      return (
        <div key={index} className="py-4 first:pt-0 last:pb-0">
          <div
            className="flex justify-between items-center cursor-pointer font-bold text-sm text-gray-700 hover:text-blue-900 transition-all select-none gap-3"
            onClick={() =>
              setOpenQuestion(isOpen ? null : index)
            }
          >
            <span>{item.question}</span>

            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                isOpen
                  ? "rotate-180 text-blue-900"
                  : "rotate-0 text-gray-400"
              }`}
            />
          </div>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isOpen
                ? "grid-rows-[1fr] opacity-100 mt-3"
                : "grid-rows-[0fr] opacity-0 mt-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                {item.answer}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>
          </div>

          {/* RIGHT COLUMN: OPINION FORM & PRIVACY */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* FEEDBACK FORM */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight mb-3">
                Tu Opinión nos Ayuda a Mejorar
              </h2>

              <p className="text-sm text-gray-550 leading-relaxed mb-6">
                Tus comentarios son analizados directamente para optimizar la calidad del servicio clínico y la experiencia en la plataforma.
              </p>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-650 mb-2 uppercase tracking-wider">
                  Tu Mensaje
                </label>
                <textarea
                  className="w-full min-h-[160px] p-4 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-sm text-gray-700 placeholder-gray-450 resize-none"
                  placeholder="Cuéntanos tu experiencia con detalle..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    Mínimo 50 caracteres (sin contar espacios)
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      message.replace(/\s/g, "").length >= 50
                      ? "text-green-600"
                      : "text-red-500"
                    }`}
                  >
                  {message.replace(/\s/g, "").length}/50
                  </span>
                </div>
              </div>

              {/* RATING */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 text-center mb-4">
                  ¿Cómo calificarías tu experiencia global?
                </p>

                <div className="flex justify-center gap-3 mb-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`w-12 h-12 rounded-full border font-bold text-sm transition-all cursor-pointer ${
                        rating === num
                          ? "bg-blue-900 border-blue-900 text-white scale-105 shadow-md shadow-blue-900/20"
                          : "border-gray-200 bg-gray-55 text-gray-700 hover:bg-blue-50/50 hover:border-blue-300"
                      }`}
                      onClick={() => setRating(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[320px] mx-auto">
                  <span>Insatisfecho</span>
                  <span>Excelente</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Comentarios"}
                </button>
              </div>
            </div>

            {/* PRIVACY CARD */}
            <div className="bg-gradient-to-br from-gray-800 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md border-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Privacidad Garantizada
              </p>

              <p className="text-lg md:text-xl font-bold text-white max-w-2xl leading-normal">
                Tus datos y comentarios son manejados de forma anónima y segura bajo los estándares de confidencialidad de datos médicos.
              </p>
            </div>
          </div>
        </div>
      </div>
      {modalOpen && (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${
      modalClosing ? "animate-fadeOut" : "animate-fadeIn"
    }`}
  >
    <div
      className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ${
        modalClosing ? "animate-scaleOut" : "animate-scaleIn"
      }`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-3">
        {modalTitle}
      </h3>

      <p className="text-gray-600 mb-6">
        {modalMessage}
      </p>

      <div className="flex justify-end">
        <button
          onClick={closeModal}
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

export default Suport;
