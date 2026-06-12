type appointment_status = 'pending' | 'confirmed' | 'cancelled';

export interface User {
  dni: number;
  name: string;
  email: string;
  password: string;
}

export interface Appointment {
    id:number;
    userDni: number;
    date: string;
    time: string;
    status: appointment_status;
}

export interface Especiality {
  id: string,
  nombre: string
}

export interface CreatedDoctorData {
  fullName: string,
  generatedEmail: string,
  generatedPassword: string
}

export interface DoctorList {
  id: string
  usuario_id: string
  especialidad_id: string
  bio: string | null
  is_available: boolean
  usuario: {
    full_name: string
    email: string
  }
  especialidad: {
    nombre: string
  }
}

export interface Doctor {
  id: string
  usuario_id: string
  especialidad_id: string
  bio: string | null
  is_available: boolean
  usuario: { full_name: string; email: string }
  especialidad: { nombre: string }
}

