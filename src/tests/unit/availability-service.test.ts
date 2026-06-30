/**
 * 25.1 - Pruebas Unitarias (Frontend)
 * Módulo: availability-service.ts — helpers de tiempo
 * Descripción: Valida los métodos internos de conversión de tiempo
 *              (parseTimeToMinutes, formatMinutesToTime) y el algoritmo
 *              de generación de slots del servicio de disponibilidad.
 */

import { describe, it, expect } from 'vitest';
import { availabilityService } from '../../lib/availability-service';

// ─── parseTimeToMinutes ────────────────────────────────────────────────────────

describe('availabilityService.parseTimeToMinutes', () => {
  it('convierte "09:00" a 540 minutos', () => {
    expect(availabilityService.parseTimeToMinutes('09:00')).toBe(540);
  });

  it('convierte "00:00" a 0 minutos', () => {
    expect(availabilityService.parseTimeToMinutes('00:00')).toBe(0);
  });

  it('convierte "23:59" a 1439 minutos', () => {
    expect(availabilityService.parseTimeToMinutes('23:59')).toBe(1439);
  });

  it('convierte "10:30" a 630 minutos', () => {
    expect(availabilityService.parseTimeToMinutes('10:30')).toBe(630);
  });

  it('convierte "16:30" a 990 minutos', () => {
    expect(availabilityService.parseTimeToMinutes('16:30')).toBe(990);
  });

  it('convierte "12:00" (mediodía) a 720 minutos', () => {
    expect(availabilityService.parseTimeToMinutes('12:00')).toBe(720);
  });
});

// ─── formatMinutesToTime ──────────────────────────────────────────────────────

describe('availabilityService.formatMinutesToTime', () => {
  it('convierte 540 a "09:00"', () => {
    expect(availabilityService.formatMinutesToTime(540)).toBe('09:00');
  });

  it('convierte 0 a "00:00"', () => {
    expect(availabilityService.formatMinutesToTime(0)).toBe('00:00');
  });

  it('convierte 1439 a "23:59"', () => {
    expect(availabilityService.formatMinutesToTime(1439)).toBe('23:59');
  });

  it('convierte 630 a "10:30"', () => {
    expect(availabilityService.formatMinutesToTime(630)).toBe('10:30');
  });

  it('rellena con cero los minutos menores de 10', () => {
    expect(availabilityService.formatMinutesToTime(61)).toBe('01:01');
  });

  it('rellena con cero las horas menores de 10', () => {
    expect(availabilityService.formatMinutesToTime(30)).toBe('00:30');
  });
});

// ─── Roundtrip parseTimeToMinutes ↔ formatMinutesToTime ───────────────────────

describe('roundtrip parseTimeToMinutes ↔ formatMinutesToTime', () => {
  const times = ['09:00', '10:30', '11:15', '13:00', '15:45', '16:30'];

  times.forEach(time => {
    it(`convierte "${time}" a minutos y regresa al mismo string`, () => {
      const mins = availabilityService.parseTimeToMinutes(time);
      const back = availabilityService.formatMinutesToTime(mins);
      expect(back).toBe(time);
    });
  });
});
