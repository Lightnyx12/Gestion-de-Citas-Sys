import { X } from "lucide-react";

interface DiagnosisModalProps {
  isOpen: boolean;
  patientName: string;
  diagnosis: string;
  prescription: string;
  saving: boolean;
  onClose: () => void;
  onDiagnosisChange: (value: string) => void;
  onPrescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const DiagnosisModal = ({
  isOpen,
  patientName,
  diagnosis,
  prescription,
  saving,
  onClose,
  onDiagnosisChange,
  onPrescriptionChange,
  onSubmit,
}: DiagnosisModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">Registrar Consulta</h3>
            <p className="text-xs text-blue-100/80 mt-1">
              Paciente: {patientName}
            </p>
          </div>
          <button
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="p-6 space-y-4">
            {/* Diagnóstico */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Diagnóstico Final *
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-sm text-gray-700 placeholder-gray-400 resize-none"
                placeholder="Describe los hallazgos y el diagnóstico médico..."
                value={diagnosis}
                onChange={(e) => onDiagnosisChange(e.target.value)}
              />
            </div>

            {/* Receta */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Receta Médica / Medicación (Opcional)
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-sm text-gray-700 placeholder-gray-400 resize-none"
                placeholder="Especifica los medicamentos, dosis y duración..."
                value={prescription}
                onChange={(e) => onPrescriptionChange(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Ficha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiagnosisModal;
