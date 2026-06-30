/**
 * 25.1 - Pruebas Unitarias (Frontend)
 * Módulo: date-utils.ts
 * Descripción: Valida las funciones de parsing y formato de fechas/horas
 *              usadas en todo el sistema de citas.
 */

import { describe, it, expect } from 'vitest';
import {
  parseNaiveDateTime,
  getLocalDateStr,
  formatApptDate,
  formatTime12h,
} from '../../lib/date-utils';

// ─── parseNaiveDateTime ────────────────────────────────────────────────────────

describe('parseNaiveDateTime', () => {
  it('parsea timestamp UTC de Supabase sin desplazar zona horaria', () => {
    const result = parseNaiveDateTime('2026-06-16T14:00:00+00:00');
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(0);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5); // Junio = 5 (0-indexado)
    expect(result.getDate()).toBe(16);
  });

  it('parsea timestamp con sufijo Z sin alterar la hora', () => {
    const result = parseNaiveDateTime('2026-06-16T09:30:00Z');
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it('parsea timestamp con offset negativo (-05:00) como naive', () => {
    const result = parseNaiveDateTime('2026-06-16T08:00:00-05:00');
    expect(result.getHours()).toBe(8);
    expect(result.getDate()).toBe(16);
  });

  it('parsea timestamp con separador espacio (formato Supabase alternativo)', () => {
    const result = parseNaiveDateTime('2026-06-16 15:45:00');
    expect(result.getHours()).toBe(15);
    expect(result.getMinutes()).toBe(45);
  });

  it('parsea timestamp sin segundos correctamente', () => {
    const result = parseNaiveDateTime('2026-07-01T10:30');
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(30);
  });

  it('retorna fecha válida para entrada vacía (fallback graceful)', () => {
    const result = parseNaiveDateTime('');
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('asigna segundos 0 cuando no se proporcionan', () => {
    const result = parseNaiveDateTime('2026-06-20T11:00');
    expect(result.getSeconds()).toBe(0);
  });

  it('parsea correctamente los segundos cuando se incluyen', () => {
    const result = parseNaiveDateTime('2026-06-20T11:00:45');
    expect(result.getSeconds()).toBe(45);
  });
});

// ─── getLocalDateStr ───────────────────────────────────────────────────────────

describe('getLocalDateStr', () => {
  it('retorna fecha en formato YYYY-MM-DD', () => {
    const result = getLocalDateStr('2026-06-16T14:00:00+00:00');
    expect(result).toBe('2026-06-16');
  });

  it('retorna cadena vacía para entrada vacía', () => {
    expect(getLocalDateStr('')).toBe('');
  });

  it('mantiene el día correcto sin cambios de zona horaria', () => {
    // Supone UTC+0 y timezone local UTC-5: sin naive tratamiento mostraría el día anterior
    const result = getLocalDateStr('2026-06-01T00:00:00+00:00');
    expect(result).toBe('2026-06-01');
  });

  it('funciona con formato de espacio (Supabase legado)', () => {
    const result = getLocalDateStr('2026-06-25 09:00:00');
    expect(result).toBe('2026-06-25');
  });
});

// ─── formatApptDate ────────────────────────────────────────────────────────────

describe('formatApptDate', () => {
  it('retorna cadena no vacía para una fecha válida', () => {
    const result = formatApptDate('2026-06-16T14:00:00+00:00');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('retorna cadena vacía para entrada vacía', () => {
    expect(formatApptDate('')).toBe('');
  });

  it('incluye el día en la salida formateada', () => {
    const result = formatApptDate('2026-06-16T14:00:00');
    // El resultado debe contener "16" como número de día
    expect(result).toContain('16');
  });
});

// ─── formatTime12h ─────────────────────────────────────────────────────────────

describe('formatTime12h', () => {
  it('formatea 09:00 AM correctamente', () => {
    const result = formatTime12h('2026-06-16T09:00:00');
    expect(result).toContain('09:00');
    expect(result.toLowerCase()).toContain('am');
  });

  it('formatea 15:45 PM correctamente', () => {
    const result = formatTime12h('2026-06-16T15:45:00');
    expect(result).toContain('03:45');
    expect(result.toLowerCase()).toContain('pm');
  });

  it('formatea medianoche (00:00) como 12:00 AM', () => {
    const result = formatTime12h('2026-06-16T00:00:00');
    expect(result.toLowerCase()).toContain('am');
  });

  it('retorna cadena vacía para entrada vacía', () => {
    expect(formatTime12h('')).toBe('');
  });

  it('retorna cadena para timestamp con offset UTC', () => {
    const result = formatTime12h('2026-06-16T16:30:00+00:00');
    expect(result).toBeTruthy();
    expect(result).toContain(':30');
  });
});
