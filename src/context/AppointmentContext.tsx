import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  especialidad: string
  fecha: string
  hora: string
  patientName: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

interface AppointmentContextType {
  appointments: Appointment[]
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void
  cancelAppointment: (id: string) => void
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined)

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const addAppointment = (appointment: Omit<Appointment, 'id'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
    }
    setAppointments([...appointments, newAppointment])
  }

  const cancelAppointment = (id: string) => {
    setAppointments(
      appointments.map((apt) =>
        apt.id === id ? { ...apt, status: 'cancelled' } : apt
      )
    )
  }

  return (
    <AppointmentContext.Provider value={{ appointments, addAppointment, cancelAppointment }}>
      {children}
    </AppointmentContext.Provider>
  )
}

export function useAppointments() {
  const context = useContext(AppointmentContext)
  if (!context) throw new Error('useAppointments debe estar dentro de AppointmentProvider')
  return context
}
