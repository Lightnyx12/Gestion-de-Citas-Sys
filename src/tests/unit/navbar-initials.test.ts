/**
 * 25.1 - Pruebas Unitarias (Frontend)
 * Módulo: Navbar/index.tsx — función helper getInitials
 * Descripción: Valida la lógica de generación de iniciales del nombre de usuario.
 */

import { describe, it, expect } from 'vitest';

// ─── Función extraída (igual a la del componente) ─────────────────────────────
// En producción debería exportarse desde el componente para ser testeable.
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getInitials (Navbar helper)', () => {
  it('genera iniciales correctas para nombre completo', () => {
    expect(getInitials('Juan Pérez')).toBe('JP');
  });

  it('toma solo las dos primeras palabras cuando el nombre tiene más', () => {
    expect(getInitials('María del Carmen López')).toBe('MD');
  });

  it('retorna una sola inicial para nombre sin apellido', () => {
    expect(getInitials('Carlos')).toBe('C');
  });

  it('convierte a mayúsculas aunque el input sea minúsculas', () => {
    expect(getInitials('ana gómez')).toBe('AG');
  });

  it('ignora espacios múltiples entre palabras', () => {
    expect(getInitials('Luis   Martínez')).toBe('LM');
  });

  it('ignora espacios al inicio y al final', () => {
    expect(getInitials('  Pedro Alonso  ')).toBe('PA');
  });

  it('maneja cadena vacía sin lanzar error', () => {
    expect(getInitials('')).toBe('');
  });

  it('maneja cadena con solo espacios', () => {
    expect(getInitials('   ')).toBe('');
  });

  it('produce máximo 2 caracteres aunque el nombre tenga muchas palabras', () => {
    const initials = getInitials('A B C D E F');
    expect(initials.length).toBeLessThanOrEqual(2);
  });
});
