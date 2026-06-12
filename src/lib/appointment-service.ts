import { supabase } from "./supabase";

/* =========================================
   HORARIOS FIJOS
========================================= */
export const AVAILABLE_TIMES = [
  "09:00",
  "10:30",
  "11:15",
  "13:00",
  "15:45",
  "16:30",
];

/* =========================================
   OBTENER ESPECIALIDADES
========================================= */
export const getSpecialties = async () => {
  const { data, error } = await supabase
    .from("especialidades")
    .select("*")
    .eq("is_active", true)
    .order("nombre");

  if (error) {
    throw error;
  }

  return data;
};

/* =========================================
   OBTENER DOCTORES
========================================= */
export const getDoctorsBySpecialty =
  async (specialtyId: string) => {
    const { data, error } =
      await supabase
        .from("doctores")
        .select(`
          *,
          especialidades (
            nombre
          )
        `)
        .eq(
          "especialidad_id",
          specialtyId
        )
        .eq("is_available", true);

    if (error) {
      throw error;
    }

    return data;
  };

/* =========================================
   OBTENER HORARIOS OCUPADOS
========================================= */
export const getOccupiedTimes =
  async (
    doctorId: string,
    selectedDate: string
  ) => {
    const start =
      `${selectedDate}T00:00:00`;

    const end =
      `${selectedDate}T23:59:59`;

    const { data, error } =
      await supabase
        .from("citas")
        .select("fecha_hora")
        .eq("doctor_id", doctorId)
        .gte("fecha_hora", start)
        .lte("fecha_hora", end)
        .eq("estado", "pendiente");

    if (error) {
      throw error;
    }

    return (data || []).map((item) => {
      const date = item.fecha_hora
        .split("T")[1]
        .substring(0, 5);

      return date;
    });
  };

/* =========================================
   VALIDAR CITA MISMO DÍA
========================================= */
export const hasAppointmentSameDay =
  async (selectedDate: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    /* =========================
        OBTENER PACIENTE
    ========================= */
    const {
      data: patientData,
    } = await supabase
      .from("pacientes")
      .select("id")
      .eq("usuario_id", user.id)
      .single();

    if (!patientData) return false;

    const start =
      `${selectedDate}T00:00:00`;

    const end =
      `${selectedDate}T23:59:59`;

    const { data } = await supabase
      .from("citas")
      .select("id")
      .eq(
        "paciente_id",
        patientData.id
      )
      .gte("fecha_hora", start)
      .lte("fecha_hora", end)
      .eq("estado", "pendiente");

    return data && data.length > 0;
  };

/* =========================================
   CREAR CITA
========================================= */
export const createAppointment =
  async ({
    doctorId,
    date,
    time,
  }: {
    doctorId: string;
    date: string;
    time: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(
        "Usuario no autenticado"
      );
    }

    /* =========================
        PACIENTE
    ========================= */
    const {
      data: patientData,
      error: patientError,
    } = await supabase
      .from("pacientes")
      .select("id")
      .eq("usuario_id", user.id)
      .single();

    if (
      patientError ||
      !patientData
    ) {
      throw new Error(
        "Paciente no encontrado"
      );
    }

    /* =========================
        VALIDAR MISMO DÍA
    ========================= */
    const alreadyHasAppointment =
      await hasAppointmentSameDay(
        date
      );

    if (
      alreadyHasAppointment
    ) {
      throw new Error(
        "Ya tienes una cita ese día"
      );
    }

    /* =========================
        VALIDAR HORA PASADA
    ========================= */
    const appointmentDate =
      new Date(
        `${date}T${time}:00`
      );

    const now = new Date();

    if (
      appointmentDate <= now
    ) {
      throw new Error(
        "No puedes reservar horas pasadas"
      );
    }

    /* =========================
        VALIDAR DOCTOR
    ========================= */
    const {
      data: doctorData,
    } = await supabase
      .from("doctores")
      .select("is_available")
      .eq("id", doctorId)
      .single();

    if (
      !doctorData?.is_available
    ) {
      throw new Error(
        "Doctor no disponible"
      );
    }

    /* =========================
        VALIDAR HORARIO OCUPADO
    ========================= */
    const occupied =
      await getOccupiedTimes(
        doctorId,
        date
      );

    if (
      occupied.includes(time)
    ) {
      throw new Error(
        "Horario ocupado"
      );
    }

    /* =========================
        ANTI SPAM
    ========================= */
    const {
      data: recentAppointments,
    } = await supabase
      .from("citas")
      .select("id")
      .eq(
        "paciente_id",
        patientData.id
      )
      .gte(
        "created_at",
        new Date(
          Date.now() -
            1000 * 60 * 2
        ).toISOString()
      );

    if (
      recentAppointments &&
      recentAppointments.length >=
        3
    ) {
      throw new Error(
        "Demasiadas reservas en poco tiempo"
      );
    }

    /* =========================
        INSERTAR CITA
    ========================= */
    const { data, error } =
      await supabase
        .from("citas")
        .insert({
          paciente_id:
            patientData.id,
          doctor_id: doctorId,
          fecha_hora: `${date} ${time}:00`,
          estado: "pendiente",
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  };

  /* =========================================
   GET PATIENT APPOINTMENTS
========================================= */
export const getPatientAppointments =
  async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(
        "Usuario no autenticado"
      );
    }

    // GET PATIENT
    const {
      data: patientData,
      error: patientError,
    } = await supabase
      .from("pacientes")
      .select("id")
      .eq("usuario_id", user.id)
      .single();

    if (
      patientError ||
      !patientData
    ) {
      throw new Error(
        "Paciente no encontrado"
      );
    }

    const { data, error } =
      await supabase
        .from("citas")
        .select(`
          *,
          doctores (
            id,
            nombre,
            apellido,
            foto_url,
            especialidades (
              nombre
            )
          )
        `)
        .eq(
          "paciente_id",
          patientData.id
        )
        .neq("estado", "cancelada")
        .order("fecha_hora", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data;
  };

/* =========================================
   CANCEL APPOINTMENT
========================================= */
export const cancelAppointment =
  async (appointmentId: string) => {
    const { error } =
      await supabase
        .from("citas")
        .update({
          estado: "cancelada",
        })
        .eq("id", appointmentId);

    if (error) {
      throw error;
    }

    return true;
  };

  /* =========================================
   RESCHEDULE APPOINTMENT
========================================= */
export const rescheduleAppointment =
  async ({
    appointmentId,
    doctorId,
    oldDate,
    newDate,
    newTime,
  }: {
    appointmentId: string;
    doctorId: string;
    oldDate: string;
    newDate: string;
    newTime: string;
  }) => {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(
        "Usuario no autenticado"
      );
    }

    // GET PATIENT
    const {
      data: patientData,
      error: patientError,
    } = await supabase
      .from("pacientes")
      .select("id")
      .eq("usuario_id", user.id)
      .single();

    if (patientError || !patientData) {
      throw new Error(
        "Paciente no encontrado"
      );
    }

    // VALIDATE NEW DATE NOT PASSED
    const appointmentDate = new Date(
      `${newDate}T${newTime}:00`
    );

    const now = new Date();

    if (appointmentDate <= now) {
      throw new Error(
        "No puedes reservar horas pasadas"
      );
    }

    // VALIDATE NO EXISTING APPOINTMENT ON NEW DATE
    const alreadyHasAppointment =
      await hasAppointmentSameDay(newDate);

    if (alreadyHasAppointment) {
      throw new Error(
        "Ya tienes una cita ese día"
      );
    }

    // VALIDATE TIME NOT OCCUPIED
    const occupied = await getOccupiedTimes(
      doctorId,
      newDate
    );

    if (occupied.includes(newTime)) {
      throw new Error(
        "Horario ocupado"
      );
    }

    // CANCEL OLD
    await supabase
      .from("citas")
      .update({
        estado: "cancelada",
      })
      .eq("id", appointmentId);

    // CREATE NEW
    const { error } =
      await supabase
        .from("citas")
        .insert({
          paciente_id:
            patientData.id,

          doctor_id: doctorId,

          fecha_hora: `${newDate} ${newTime}:00`,

          estado: "pendiente",

          reprogramada_de:
            appointmentId,

          fecha_hora_original:
            oldDate,
        });

    if (error) {
      throw error;
    }

    return true;
  };