// ─── ICS Generator ────────────────────────────────────────────────────────────
// Genera un archivo .ics (iCalendar) descargable para añadir
// una cita al calendario del paciente (Google, Outlook, Apple).
// NO realiza ninguna sincronización automática — solo descarga el archivo.
// ──────────────────────────────────────────────────────────────────────────────

export interface ICSEventData {
  /** Título del evento, ej. "Cita con Dr. García" */
  title: string
  /** Fecha y hora de inicio (ISO 8601 o Date) */
  start: Date
  /** Fecha y hora de fin (ISO 8601 o Date). Por defecto start + 30 min */
  end?: Date
  /** Descripción libre del evento */
  description?: string
  /** Lugar del evento, ej. nombre de la clínica */
  location?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formatea una fecha a string UTC en formato iCalendar: YYYYMMDDTHHMMSSZ */
function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Escapa caracteres especiales en valores de texto iCalendar */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** Genera un UID único para el evento */
function generateUID(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `${timestamp}-${random}@aurahealth`
}

// ─── Generador principal ──────────────────────────────────────────────────────

/**
 * Genera el contenido completo de un archivo .ics a partir de los datos del evento.
 */
export function generateICS(event: ICSEventData): string {
  const start = event.start instanceof Date ? event.start : new Date(event.start)

  // Por defecto la cita dura 30 minutos
  const end = event.end
    ? event.end instanceof Date
      ? event.end
      : new Date(event.end)
    : new Date(start.getTime() + 30 * 60 * 1000)

  const now = new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AuraHealth//Gestion de Citas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

// ─── Descarga ─────────────────────────────────────────────────────────────────

/**
 * Descarga el contenido .ics como archivo en el navegador del usuario.
 * @param content  Resultado de generateICS()
 * @param filename Nombre del archivo sin extensión (se agrega .ics automáticamente)
 */
export function downloadICS(content: string, filename = 'cita-medica'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.ics`
  document.body.appendChild(link)
  link.click()

  // Limpiar
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Shortcut combinado ───────────────────────────────────────────────────────

/**
 * Genera y descarga directamente el archivo .ics.
 * Equivalente a llamar generateICS() + downloadICS() en secuencia.
 */
export function createAndDownloadICS(event: ICSEventData, filename?: string): void {
  const content = generateICS(event)
  downloadICS(content, filename)
}
