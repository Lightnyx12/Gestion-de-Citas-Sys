/**
 * 25.1 - Pruebas Unitarias (Frontend)
 * Módulo: ics-generator.ts
 * Descripción: Valida la generación correcta de archivos iCalendar (.ics)
 *              para la función de exportación de citas al calendario del paciente.
 */

import { describe, it, expect } from 'vitest';
import { generateICS, type ICSEventData } from '../../lib/ics-generator';

// ─── Datos de prueba reutilizables ────────────────────────────────────────────

const baseEvent: ICSEventData = {
  title: 'Cita médica con Dr. García',
  start: new Date('2026-07-15T10:00:00'),
  description: 'Consulta general en AuraHealth',
  location: 'AuraHealth — Clínica Principal',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateICS', () => {
  it('genera una cadena no vacía', () => {
    const content = generateICS(baseEvent);
    expect(content).toBeTruthy();
    expect(typeof content).toBe('string');
  });

  it('contiene la cabecera BEGIN:VCALENDAR', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('BEGIN:VCALENDAR');
  });

  it('contiene BEGIN:VEVENT y END:VEVENT', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('BEGIN:VEVENT');
    expect(content).toContain('END:VEVENT');
  });

  it('contiene VERSION:2.0', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('VERSION:2.0');
  });

  it('incluye el título del evento en SUMMARY', () => {
    const content = generateICS(baseEvent);
    // El punto (.) no es un carácter especial en iCalendar — no se escapa
    expect(content).toContain('SUMMARY:Cita médica con Dr. García');
  });

  it('incluye la descripción escapada en DESCRIPTION', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('DESCRIPTION:Consulta general en AuraHealth');
  });

  it('incluye la ubicación en LOCATION', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('LOCATION:AuraHealth — Clínica Principal');
  });

  it('calcula el fin como 30 minutos después cuando no se provee', () => {
    const content = generateICS(baseEvent);
    // DTSTART: 10:00:00 → DTEND: 10:30:00 (formato UTC)
    expect(content).toContain('DTSTART:');
    expect(content).toContain('DTEND:');

    const dtstart = content.match(/DTSTART:(\d{8}T\d{6}Z)/)?.[1];
    const dtend = content.match(/DTEND:(\d{8}T\d{6}Z)/)?.[1];
    expect(dtstart).toBeTruthy();
    expect(dtend).toBeTruthy();

    if (dtstart && dtend) {
      const startDate = new Date(
        dtstart.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
      );
      const endDate = new Date(
        dtend.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
      );
      const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      expect(diffMinutes).toBe(30);
    }
  });

  it('usa el fin personalizado cuando se provee', () => {
    const eventWithEnd: ICSEventData = {
      ...baseEvent,
      end: new Date('2026-07-15T11:30:00'),
    };
    const content = generateICS(eventWithEnd);
    const dtend = content.match(/DTEND:(\d{8}T\d{6}Z)/)?.[1];
    expect(dtend).toBeTruthy();
  });

  it('genera un UID único en cada llamada', () => {
    const content1 = generateICS(baseEvent);
    const content2 = generateICS(baseEvent);
    const uid1 = content1.match(/UID:(.+)/)?.[1];
    const uid2 = content2.match(/UID:(.+)/)?.[1];
    expect(uid1).not.toBe(uid2);
  });

  it('el UID contiene el sufijo @aurahealth', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('@aurahealth');
  });

  it('escapa la coma en el título', () => {
    const eventWithComma: ICSEventData = {
      title: 'Cita, revisión anual',
      start: new Date('2026-07-15T10:00:00'),
    };
    const content = generateICS(eventWithComma);
    expect(content).toContain('SUMMARY:Cita\\, revisión anual');
  });

  it('escapa el punto y coma en la descripción', () => {
    const eventWithSemicolon: ICSEventData = {
      title: 'Cita',
      start: new Date('2026-07-15T10:00:00'),
      description: 'Cita; con revisión',
    };
    const content = generateICS(eventWithSemicolon);
    expect(content).toContain('DESCRIPTION:Cita\\; con revisión');
  });

  it('no incluye DESCRIPTION cuando no se proporciona', () => {
    const eventWithoutDesc: ICSEventData = {
      title: 'Solo título',
      start: new Date('2026-07-15T10:00:00'),
    };
    const content = generateICS(eventWithoutDesc);
    expect(content).not.toContain('DESCRIPTION:');
  });

  it('no incluye LOCATION cuando no se proporciona', () => {
    const eventWithoutLoc: ICSEventData = {
      title: 'Sin ubicación',
      start: new Date('2026-07-15T10:00:00'),
    };
    const content = generateICS(eventWithoutLoc);
    expect(content).not.toContain('LOCATION:');
  });

  it('contiene STATUS:CONFIRMED', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('STATUS:CONFIRMED');
  });

  it('contiene PRODID de AuraHealth', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('AuraHealth');
  });

  it('usa separadores de línea CRLF (\\r\\n) según estándar RFC 5545', () => {
    const content = generateICS(baseEvent);
    expect(content).toContain('\r\n');
  });
});
