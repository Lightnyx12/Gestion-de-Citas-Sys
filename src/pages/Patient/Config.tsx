import { useEffect, useState, useRef } from "react";
import { User, UserPen, Shield, Mail, Calendar, Lock, X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";


import {
  getPatientProfile,
  updatePatientProfile,
  uploadPatientAvatar,
  updatePatientPassword,
} from "./patient-service";

const Config = () => {
  const [profile, setProfile] = useState<any>({
    dni: "",
    fecha_nac: "",
    direccion: "",
    alergias: "",
    foto_url: "",
    email: "",
    full_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);

  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalClosing, setPasswordModalClosing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [modalType, setModalType] = useState<
    "success" | "error" | "warning"
    >("success");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* =====================================
      CARGAR PERFIL
  ===================================== */
  useEffect(() => {
    loadProfile();
  }, []);

  const openModal = (
  type: "success" | "error" | "warning",
  title: string,
  message: string
) => {
  setModalType(type);
  setModalTitle(title);
  setModalMessage(message);
  setShowModal(true);
};

const closeModal = () => {
  setClosingModal(true);

  setTimeout(() => {
    setShowModal(false);
    setClosingModal(false);
  }, 300);
};

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getPatientProfile();
      setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================
      SUBIR FOTO
  ===================================== */
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      const imageUrl = await uploadPatientAvatar(file);
      setProfile((prev: any) => ({
        ...prev,
        foto_url: imageUrl,
      }));
      openModal(
  "success",
  "Foto actualizada",
  "Tu foto de perfil fue actualizada correctamente."
);
    } catch (error) {
      console.error(error);
      openModal(
  "error",
  "Error",
  "No se pudo subir la imagen."
);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================
      GUARDAR
  ===================================== */
  const handleSave = async () => {
  const nameRegex =
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

  if (
    profile.full_name &&
    !nameRegex.test(profile.full_name)
  ) {
    return openModal(
      "warning",
      "Nombre inválido",
      "El nombre solo puede contener letras y espacios."
    );
  }

  if (
    profile.dni &&
    !/^\d{8}$/.test(profile.dni)
  ) {
    return openModal(
      "warning",
      "DNI inválido",
      "El DNI debe contener exactamente 8 números."
    );
  }

  try {
    setLoading(true);

    await updatePatientProfile(profile);

    openModal(
      "success",
      "Perfil actualizado",
      "Los cambios fueron guardados correctamente."
    );
  } catch (error) {
    console.error(error);

    openModal(
      "error",
      "Error",
      "No se pudo actualizar el perfil."
    );
  } finally {
    setLoading(false);
  }
};

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  /* =====================================
      Contraseña
  ===================================== */

  const closePasswordModal = () => {
  setPasswordModalClosing(true);

  setTimeout(() => {
    setShowPasswordModal(false);
    setPasswordModalClosing(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, 300);
};

const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();

  if (newPassword !== confirmPassword) {
    return openModal(
      "warning",
      "Contraseñas diferentes",
      "La nueva contraseña y la confirmación no coinciden."
    );
  }

  try {
    setPasswordLoading(true);

    await updatePatientPassword(
      profile.email,
      currentPassword,
      newPassword
    );

    closePasswordModal();

    setTimeout(() => {
      openModal(
        "success",
        "Contraseña actualizada",
        "Tu contraseña fue cambiada correctamente."
      );
    }, 350);
  } catch (error: any) {
    console.error(error);

    openModal(
      "error",
      "Error",
      error.message || "No se pudo cambiar la contraseña."
    );
  } finally {
    setPasswordLoading(false);
  }
};

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight">
            Notificaciones y Ajustes
          </h1>
          <p className="text-gray-500 mt-2">
            Administra tu información personal, preferencias de alertas y seguridad de tu cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: PROFILE CARD & SECURITY */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
              {/* Profile Avatar Header */}
              <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
                <div className="relative group cursor-pointer shrink-0" onClick={triggerFileSelect}>
                  <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-gray-50 flex items-center justify-center overflow-hidden shadow-sm group-hover:opacity-95 transition-all">
                    {profile.foto_url ? (
                      <img
                        src={profile.foto_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-9 h-9 text-blue-900/60" />
                    )}
                  </div>

                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center shadow shadow-blue-950/20 group-hover:scale-105 transition-transform">
                    <UserPen className="w-4 h-4" />
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 truncate">
                    {profile.full_name || "Paciente"}
                  </h2>
                  <p className="text-sm text-gray-400 truncate">{profile.email}</p>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
              />

              {/* FORM FIELDS */}
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                    value={profile.full_name || ""}
                    placeholder="Completa tu nombre"
                    onChange={(e) => {
                      const value = e.target.value;

                      if (
                        value === "" ||
                          /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/.test(value)
                      ) {
                      setProfile({
                        ...profile,
                        full_name: value,
                      });
                    }
                    }}
                  />
                </div>

                {/* Email (Disabled) */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed font-medium text-sm"
                    value={profile.email || ""}
                    disabled
                  />
                </div>

                {/* DNI */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    DNI / Documento
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                    value={profile.dni || ""}
                    placeholder="Completa tu DNI"
                    onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 8);

                    setProfile({
                      ...profile,
                      dni: value,
                   });
                  }}
                  />
                </div>

                {/* Fecha Nacimiento */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                    value={profile.fecha_nac || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        fecha_nac: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                    value={profile.direccion || ""}
                    placeholder="Completa tu dirección"
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        direccion: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Alergias */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Alergias Conocidas
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                    value={profile.alergias || ""}
                    placeholder="Ej. Ninguna, Penicilina, Mariscos"
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        alergias: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Password link */}
              <div className="pt-2">
                <button
                  type="button"
                  className="text-sm font-bold text-blue-900 hover:text-blue-800 transition-colors"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Cambiar contraseña
                </button>
              </div>
            </div>

            {/* SECURITY INFO */}
            
          </div>

          {/* RIGHT COLUMN: PREFERENCES */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* TOP DUAL CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Calendar card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between gap-4">
                <div className="flex justify-between items-center">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
                  </label>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">Añadir al Calendario</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Sincroniza y guarda automáticamente las citas médicas en tu calendario de preferencia (Google, Outlook, etc.).
                  </p>
                </div>
              </div>

              {/* Email card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between gap-4">
                <div className="flex justify-between items-center">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
                  </label>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">Email Informativo</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Recibe recordatorios de cita, recetas y boletines mensuales de salud en tu correo electrónico principal.
                  </p>
                </div>
              </div>
            </div>

            {/* PREFERENCES LIST */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-50">
                Preferencias de Frecuencia
              </h2>

              <div className="space-y-6">
                {/* Reminders time */}
                <div className="flex justify-between items-center gap-4">
                  <div className="max-w-[70%]">
                    <h4 className="text-sm font-bold text-gray-700 mb-1">Recordatorios de Cita</h4>
                  </div>
                  <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer">
                    24 horas antes
                  </button>
                </div>
              </div>
                    

            </div>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-900 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-900 mb-1">Tus datos están protegidos</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  AuraHealth utiliza cifrado avanzado para asegurar que tu información personal y clínica permanezca estrictamente confidencial bajo normativas médicas vigentes.
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end items-center gap-4 mt-2">
              <button
                className="px-5 py-3 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-750 transition-colors cursor-pointer"
                onClick={loadProfile}
              >
                Cancelar
              </button>

              <button
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer bg-blue-900 hover:bg-blue-800 text-white shadow-blue-900/10`}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showPasswordModal && (
  <div
    className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
      passwordModalClosing
        ? "animate-fadeOut"
        : "animate-fadeIn"
    }`}
  >
    <div
      className={`bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl ${
        passwordModalClosing
          ? "animate-modalOut"
          : "animate-modalIn"
      }`}
    >
      <div className="bg-blue-900 text-white p-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">
            Cambiar contraseña
          </h2>
          <p className="text-sm text-blue-100 mt-1">
            Ingresa tu contraseña actual y define una nueva.
          </p>
        </div>

        <button
          type="button"
          onClick={closePasswordModal}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={handleChangePassword}
        className="p-6 space-y-4"
      >
        <input
          type="password"
          placeholder="Contraseña actual"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10"
          value={currentPassword}
          onChange={(e) =>
            setCurrentPassword(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Nueva contraseña"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
        />

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={closePasswordModal}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex-1 py-3 rounded-xl bg-blue-900 text-white font-bold disabled:opacity-50"
          >
            {passwordLoading
              ? "Guardando..."
              : "Actualizar"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {showModal && (
  <div
    className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
      closingModal
        ? "animate-fadeOut"
        : "animate-fadeIn"
    }`}
  >
    <div
      className={`bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl ${
        closingModal
          ? "animate-modalOut"
          : "animate-modalIn"
      }`}
    >
      <div
  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
    modalType === "success"
      ? "bg-green-100"
      : modalType === "error"
      ? "bg-red-100"
      : modalType === "warning"
      ? "bg-amber-100"
      : "bg-green-100"
  }`}
>
  {modalType === "success" && (
    <CheckCircle className="w-10 h-10 text-green-600" />
  )}

  {modalType === "error" && (
    <XCircle className="w-10 h-10 text-red-600" />
  )}

  {modalType === "warning" && (
    <AlertTriangle className="w-10 h-10 text-amber-600" />
  )}
</div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        {modalTitle}
      </h2>

      <p className="text-gray-600 mb-8">
        {modalMessage}
      </p>

      <button
        onClick={closeModal}
        className={`w-full py-3 rounded-xl text-white font-semibold ${
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

export default Config;
