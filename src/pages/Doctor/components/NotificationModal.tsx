import type { ModalType } from "./appointments.types";

interface NotificationModalProps {
  isOpen: boolean;
  closing: boolean;
  type: ModalType;
  title: string;
  message: string;
  onClose: () => void;
}

const NotificationModal = ({
  isOpen,
  closing,
  type,
  title,
  message,
  onClose,
}: NotificationModalProps) => {
  if (!isOpen) return null;

  const iconBg =
    type === "success"
      ? "bg-green-100 text-green-600"
      : type === "error"
        ? "bg-red-100 text-red-600"
        : "bg-amber-100 text-amber-600";

  const btnBg =
    type === "success"
      ? "bg-blue-900 hover:bg-blue-800"
      : type === "error"
        ? "bg-red-600 hover:bg-red-700"
        : "bg-amber-600 hover:bg-amber-700";

  const icon = type === "success" ? "✓" : type === "error" ? "×" : "⚠";

  return (
    <>
      <div
        className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 ${closing ? "animate-fadeOut" : "animate-fadeIn"
          }`}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ${closing ? "animate-scaleOut" : "animate-scaleIn"
            }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${iconBg}`}
          >
            {icon}
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
            {title}
          </h2>
          <p className="text-sm text-center text-gray-600 mb-6">{message}</p>

          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl text-white font-bold transition ${btnBg}`}
          >
            Entendido
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(-15px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scaleOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.92) translateY(-10px); }
        }
        .animate-fadeIn   { animation: fadeIn  0.25s ease forwards; }
        .animate-fadeOut  { animation: fadeOut 0.3s  ease forwards; }
        .animate-scaleIn  { animation: scaleIn 0.3s  ease forwards; }
        .animate-scaleOut { animation: scaleOut 0.25s ease forwards; }
      `}</style>
    </>
  );
};


export default NotificationModal;
