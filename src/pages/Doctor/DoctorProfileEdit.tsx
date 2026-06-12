import { useEffect, useRef, useState } from "react";
import {
  User,
  UserPen,
  Mail,
  Phone,
  MapPin,
  Lock,
  X,
  Stethoscope,
  ChevronDown,
} from "lucide-react";

import {
  getDoctorProfile,
  updateDoctorProfile,
  uploadDoctorAvatar,
  updateDoctorPassword,
  getActiveSpecialties,
} from "../../lib/doctor-profile-service";

interface Specialty {
  id: string;
  nombre: string;
}

const DoctorProfileEdit = () => {
  const [profile, setProfile] = useState<any>({
    id: "",
    nombre: "",
    apellido: "",
    fullName: "",
    especialidad_id: "",
    especialidad_nombre: "",
    bio: "",
    telefono: "",
    direccion: "",
    foto_url: "",
    email: "",
  });

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] =
    useState<"success" | "error" | "warning">("success");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
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

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [doctorData, specialtiesData] = await Promise.all([
        getDoctorProfile(),
        getActiveSpecialties(),
      ]);

      setProfile({
        id: doctorData.id || "",
        nombre: doctorData.nombre || "",
        apellido: doctorData.apellido || "",
        fullName: doctorData.fullName || "",
        especialidad_id: doctorData.especialidad_id || "",
        especialidad_nombre:
          doctorData.especialidad_nombre || "Sin especialidad",
        bio: doctorData.bio || "",
        telefono: doctorData.telefono || "",
        direccion: doctorData.direccion || "",
        foto_url: doctorData.foto_url || "",
        email: doctorData.email || "",
      });

      setSpecialties(specialtiesData || []);
    } catch (error: any) {
      console.error(error);

      openModal(
        "error",
        "Error",
        error.message || "No se pudo cargar el perfil del doctor."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const publicUrl = await uploadDoctorAvatar(profile.id, file);

      setProfile((prev: any) => ({
        ...prev,
        foto_url: publicUrl,
      }));

      openModal(
        "success",
        "Foto actualizada",
        "Tu foto de perfil fue actualizada correctamente."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error(error);

      openModal(
        "error",
        "Error",
        error.message || "No se pudo subir la imagen."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const onlyLetters =
      /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

    if (!profile.fullName.trim()) {
      return openModal(
        "warning",
        "Nombre requerido",
        "Debes ingresar tu nombre completo."
      );
    }

    if (!onlyLetters.test(profile.fullName.trim())) {
      return openModal(
        "warning",
        "Nombre inválido",
        "El nombre completo solo puede contener letras y espacios."
      );
    }

    if (profile.telefono && !/^\d+$/.test(profile.telefono)) {
      return openModal(
        "warning",
        "Teléfono inválido",
        "El teléfono solo puede contener números."
      );
    }

    if (!profile.especialidad_id) {
      return openModal(
        "warning",
        "Especialidad requerida",
        "Debes seleccionar una especialidad."
      );
    }

    try {
      setSaving(true);

      const updatedProfile = await updateDoctorProfile(profile);

      setProfile((prev: any) => ({
        ...prev,
        ...updatedProfile,
      }));

      openModal(
        "success",
        "Perfil actualizado",
        "Los cambios fueron guardados correctamente."
      );

      await loadInitialData();
    } catch (error: any) {
      console.error(error);

      openModal(
        "error",
        "Error",
        error.message || "No se pudieron guardar los cambios."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      return openModal(
        "warning",
        "Contraseña inválida",
        "La contraseña debe tener al menos 6 caracteres."
      );
    }

    if (newPassword !== confirmPassword) {
      return openModal(
        "warning",
        "Contraseñas diferentes",
        "Las contraseñas no coinciden."
      );
    }

    try {
      setPasswordLoading(true);

      await updateDoctorPassword(newPassword);

      openModal(
        "success",
        "Contraseña actualizada",
        "Tu contraseña fue establecida correctamente."
      );

      setOpenPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);

      openModal(
        "error",
        "Error",
        error.message || "No se pudo actualizar la contraseña."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Editar Perfil
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div
              className="relative group cursor-pointer mb-5"
              onClick={triggerFileSelect}
            >
              <div className="w-40 h-40 rounded-full bg-blue-50 border-4 border-gray-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:opacity-90 transition-all">
                {profile.foto_url ? (
                  <img
                    src={profile.foto_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-blue-900/60" />
                )}
              </div>

              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  Subiendo...
                </div>
              )}

              <div className="absolute bottom-1 right-2 w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center shadow shadow-blue-950/20 group-hover:scale-105 transition-transform">
                <UserPen className="w-5 h-5" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadAvatar}
            />

            <h2 className="text-xl font-bold text-slate-900 mb-1 leading-snug">
              Dr. {profile.nombre} {profile.apellido}
            </h2>

            <span className="inline-block mt-1 px-4 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-widest">
              {profile.especialidad_nombre}
            </span>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  Información Profesional
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-650 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                    value={profile.fullName}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (
                        value === "" ||
                        /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/.test(value)
                      ) {
                        setProfile({
                          ...profile,
                          fullName: value,
                        });
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-650 mb-2">
                    Especialidad
                  </label>

                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm appearance-none"
                      value={profile.especialidad_id}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          especialidad_id: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        Selecciona tu especialidad
                      </option>

                      {specialties.map((esp) => (
                        <option key={esp.id} value={esp.id}>
                          {esp.nombre}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-650 mb-2">
                  Biografía Profesional
                </label>

                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm resize-none mb-2"
                  placeholder="Cuéntanos acerca de tu formación, enfoque médico y trayectoria..."
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bio: e.target.value,
                    })
                  }
                />

                <p className="text-xs text-gray-450 leading-normal">
                  Describe tu trayectoria y enfoque médico para tus pacientes.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>

                <h2 className="text-lg font-bold text-gray-800">
                  Detalles de Contacto
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-650 mb-2">
                    Correo Electrónico
                  </label>

                  <div className="relative">
                    <input
                      type="email"
                      className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed font-medium text-sm"
                      value={profile.email}
                      disabled
                    />

                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-650 mb-2">
                    Teléfono de Contacto
                  </label>

                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                      placeholder="Ej. 987654321"
                      value={profile.telefono}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");

                        setProfile({
                          ...profile,
                          telefono: value,
                        });
                      }}
                    />

                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-655 mb-2">
                  Dirección de Consultorio
                </label>

                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-gray-700 font-medium text-sm"
                    placeholder="Ej. Av. San Martín 450"
                    value={profile.direccion}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        direccion: e.target.value,
                      })
                    }
                  />

                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-900" />
                  Seguridad y Acceso
                </h2>

                <p className="text-xs text-gray-450 leading-relaxed max-w-md">
                  Cambia tu contraseña temporal por una definitiva.
                </p>
              </div>

              <button
                type="button"
                className="px-5 py-3 rounded-xl font-bold text-sm bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-100 transition-all cursor-pointer whitespace-nowrap"
                onClick={() => setOpenPasswordModal(true)}
              >
                Establecer Credenciales Formales
              </button>
            </div>

            <div className="flex justify-end items-center gap-4 pt-2">
              <button
                type="button"
                className="px-5 py-3 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-750 transition-colors cursor-pointer"
                onClick={loadInitialData}
              >
                Descartar Cambios
              </button>

              <button
                type="button"
                className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-900 hover:bg-blue-800 text-white shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {openPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">
                  Credenciales Formales
                </h3>

                <p className="text-xs text-blue-100/80 mt-1">
                  Establece una contraseña segura definitiva.
                </p>
              </div>

              <button
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
                onClick={() => setOpenPasswordModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                    Nueva Contraseña
                  </label>

                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-sm text-gray-700"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                    Confirmar Contraseña
                  </label>

                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all text-sm text-gray-700"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                  onClick={() =>
                    setOpenPasswordModal(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading
                    ? "Estableciendo..."
                    : "Guardar Contraseña"}
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
              {modalType === "success"
                ? "✓"
                : modalType === "error"
                ? "×"
                : "⚠"}
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
    </div>
  );
};

export default DoctorProfileEdit;