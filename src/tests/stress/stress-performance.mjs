/**
 * 25.3 - Pruebas de Estrés — Lógica de Negocio del Frontend
 * 25.5 - Pruebas de Rendimiento — Utilidades del FrontEnd
 *
 * Descripción: Prueba bajo carga las funciones de utilidad pura del sistema.
 *              No requiere conexión a internet ni base de datos.
 *              Se ejecuta con: node --experimental-vm-modules src/tests/stress/stress-performance.mjs
 *
 * Métricas evaluadas:
 *   - Tiempo de ejecución bajo N iteraciones
 *   - Operaciones por segundo (OPS)
 *   - Memoria heap usada antes/después
 *   - Consistencia de resultados (determinismo)
 */

// ─── Importaciones inline (ESM compatible sin bundler) ───────────────────────

// Replicación local de las funciones puras a testear
// (evita la necesidad del bundler de Vite para este script standalone)

/** parseNaiveDateTime — replica de src/lib/date-utils.ts */
function parseNaiveDateTime(fechaHoraStr) {
  if (!fechaHoraStr) return new Date();
  const naive = fechaHoraStr
    .replace('Z', '')
    .replace(/[+-]\d{2}:\d{2}$/, '');
  const match = naive.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      parseInt(hour), parseInt(minute), second ? parseInt(second) : 0
    );
  }
  return new Date(naive.replace(' ', 'T'));
}

function getLocalDateStr(fechaHoraStr) {
  if (!fechaHoraStr) return '';
  try {
    const date = parseNaiveDateTime(fechaHoraStr);
    return date.toLocaleDateString('sv-SE');
  } catch {
    return fechaHoraStr.includes('T') ? fechaHoraStr.split('T')[0] : fechaHoraStr.split(' ')[0];
  }
}

function formatTime12h(fechaHoraStr) {
  if (!fechaHoraStr) return '';
  try {
    const date = parseNaiveDateTime(fechaHoraStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

/** getInitials — replica de src/components/Navbar/index.tsx */
function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/** parseTimeToMinutes — replica de src/lib/availability-service.ts */
function parseTimeToMinutes(tStr) {
  const parts = tStr.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function formatMinutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** escapeText — replica de src/lib/ics-generator.ts */
function escapeText(text) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// ─── Utilidades de benchmark ──────────────────────────────────────────────────

const results = [];

function benchmark(name, fn, iterations = 100_000) {
  const memBefore = process.memoryUsage().heapUsed;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn(i);
  }

  const elapsed = performance.now() - start;
  const memAfter = process.memoryUsage().heapUsed;
  const ops = Math.round(iterations / (elapsed / 1000));
  const memDelta = ((memAfter - memBefore) / 1024).toFixed(2);

  const result = {
    name,
    iterations,
    elapsedMs: elapsed.toFixed(2),
    opsPerSec: ops.toLocaleString(),
    memDeltaKB: memDelta,
    status: elapsed < 2000 ? 'PASS ✅' : 'WARN ⚠️',
  };

  results.push(result);
  return result;
}

// ─── PRUEBA 25.5.1 — parseNaiveDateTime bajo carga ───────────────────────────

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 25.3 & 25.5 — PRUEBAS DE ESTRÉS Y RENDIMIENTO — FRONTEND');
console.log('══════════════════════════════════════════════════════════\n');

const timestamps = [
  '2026-06-16T14:00:00+00:00',
  '2026-06-16T09:30:00Z',
  '2026-06-16T08:00:00-05:00',
  '2026-06-16 15:45:00',
  '2026-07-01T10:30',
];

benchmark('parseNaiveDateTime — 100k llamadas (timestamps variados)', (i) => {
  parseNaiveDateTime(timestamps[i % timestamps.length]);
}, 100_000);

// ─── PRUEBA 25.5.2 — getLocalDateStr bajo carga ──────────────────────────────

benchmark('getLocalDateStr — 100k llamadas', (i) => {
  getLocalDateStr(timestamps[i % timestamps.length]);
}, 100_000);

// ─── PRUEBA 25.5.3 — formatTime12h bajo carga ────────────────────────────────

benchmark('formatTime12h — 100k llamadas', (i) => {
  formatTime12h(timestamps[i % timestamps.length]);
}, 100_000);

// ─── PRUEBA 25.5.4 — getInitials bajo carga ──────────────────────────────────

const names = ['Juan Pérez', 'María del Carmen López', 'Carlos', 'Ana Gómez', 'Pedro Alonso'];
benchmark('getInitials — 100k llamadas (nombres variados)', (i) => {
  getInitials(names[i % names.length]);
}, 100_000);

// ─── PRUEBA 25.5.5 — parseTimeToMinutes + formatMinutesToTime ─────────────────

const times = ['09:00', '10:30', '11:15', '13:00', '15:45', '16:30'];
benchmark('parseTimeToMinutes + formatMinutesToTime roundtrip — 100k', (i) => {
  const t = times[i % times.length];
  formatMinutesToTime(parseTimeToMinutes(t));
}, 100_000);

// ─── PRUEBA 25.5.6 — escapeText ICS bajo carga ───────────────────────────────

const icsTexts = [
  'Cita médica con Dr. García',
  'Cita, revisión anual; consulta general',
  'Nota con\nnueva línea',
  'Ruta: C:\\System\\file',
  'Texto simple sin caracteres especiales',
];
benchmark('escapeText (ICS) — 100k llamadas (textos variados)', (i) => {
  escapeText(icsTexts[i % icsTexts.length]);
}, 100_000);

// ─── PRUEBA 25.3.1 — Generación de slots de disponibilidad ───────────────────

benchmark('Generación de slots de disponibilidad — 50k cálculos', (i) => {
  // Simula el algoritmo de getAvailableSlots para un rango de 8:00 a 18:00
  const startMins = 8 * 60;
  const endMins = 18 * 60;
  const duration = 30;
  const slots = [];
  let current = startMins;
  while (current + duration <= endMins) {
    slots.push(formatMinutesToTime(current));
    current += duration;
  }
  return slots; // 20 slots generados cada iteración
}, 50_000);

// ─── PRUEBA 25.3.2 — Verificación de horarios ocupados (Set lookup) ──────────

benchmark('Verificación de slots ocupados con Set — 100k lookups', (i) => {
  const occupied = new Set(['09:00', '10:30', '13:00', '16:30']);
  const slot = times[i % times.length];
  return occupied.has(slot);
}, 100_000);

// ─── PRUEBA 25.3.3 — Filtrado de slots (pipeline completo) ───────────────────

benchmark('Pipeline completo: generar + filtrar slots — 10k ejecuciones', (_i) => {
  const weeklyRanges = [
    { hora_inicio: '08:00', hora_fin: '12:00' },
    { hora_inicio: '14:00', hora_fin: '18:00' },
  ];
  const pauses = [{ hora_inicio: '10:00', hora_fin: '10:30' }];
  const occupied = new Set(['09:00', '15:00']);

  const generated = [];
  weeklyRanges.forEach(range => {
    let current = parseTimeToMinutes(range.hora_inicio);
    const end = parseTimeToMinutes(range.hora_fin);
    while (current + 30 <= end) {
      generated.push(formatMinutesToTime(current));
      current += 30;
    }
  });

  return generated.filter(slot => {
    const slotMins = parseTimeToMinutes(slot);
    const isPaused = pauses.some(p =>
      slotMins >= parseTimeToMinutes(p.hora_inicio) &&
      slotMins < parseTimeToMinutes(p.hora_fin)
    );
    return !isPaused && !occupied.has(slot);
  });
}, 10_000);

// ─── Prueba de consistencia (determinismo) ────────────────────────────────────

console.log('\n─── Verificación de determinismo ───────────────────────────\n');

const consistencyTests = [
  {
    fn: () => parseNaiveDateTime('2026-06-16T14:00:00+00:00').getHours(),
    expected: 14,
    name: 'parseNaiveDateTime es determinista',
  },
  {
    fn: () => getLocalDateStr('2026-06-16T14:00:00+00:00'),
    expected: '2026-06-16',
    name: 'getLocalDateStr es determinista',
  },
  {
    fn: () => getInitials('Juan Pérez'),
    expected: 'JP',
    name: 'getInitials es determinista',
  },
  {
    fn: () => parseTimeToMinutes('09:30'),
    expected: 570,
    name: 'parseTimeToMinutes es determinista',
  },
  {
    fn: () => formatMinutesToTime(570),
    expected: '09:30',
    name: 'formatMinutesToTime es determinista',
  },
  {
    fn: () => escapeText('a,b;c'),
    expected: 'a\\,b\\;c',
    name: 'escapeText es determinista',
  },
];

let consistencyPass = 0;
consistencyTests.forEach(({ fn, expected, name }) => {
  const r1 = fn(); const r2 = fn(); const r3 = fn();
  const ok = r1 === r2 && r2 === r3 && r1 === expected;
  console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'} — ${name}`);
  if (ok) consistencyPass++;
});

// ─── Resumen ──────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════');
console.log(' RESULTADOS DE RENDIMIENTO (25.5)');
console.log('══════════════════════════════════════════════════════════\n');
console.log(
  `${'Prueba'.padEnd(55)} ${'Iteraciones'.padStart(12)} ${'Tiempo(ms)'.padStart(12)} ${'OPS/s'.padStart(14)} ${'Mem ΔKB'.padStart(10)} ${'Estado'.padStart(10)}`
);
console.log('─'.repeat(115));

results.forEach(r => {
  console.log(
    `${r.name.padEnd(55)} ${String(r.iterations).padStart(12)} ${String(r.elapsedMs).padStart(12)} ${String(r.opsPerSec).padStart(14)} ${String(r.memDeltaKB).padStart(10)} ${r.status.padStart(10)}`
  );
});

const allPass = results.every(r => r.status.startsWith('PASS'));
const totalIter = results.reduce((s, r) => s + r.iterations, 0);
const totalTime = results.reduce((s, r) => s + parseFloat(r.elapsedMs), 0);

console.log('\n══════════════════════════════════════════════════════════');
console.log(` Total iteraciones ejecutadas : ${totalIter.toLocaleString()}`);
console.log(` Tiempo total                 : ${totalTime.toFixed(2)} ms`);
console.log(` Pruebas de rendimiento       : ${results.filter(r => r.status.startsWith('PASS')).length}/${results.length} PASS`);
console.log(` Pruebas de determinismo      : ${consistencyPass}/${consistencyTests.length} PASS`);
console.log(` Estado general               : ${allPass ? '✅ TODAS APROBADAS' : '⚠️ ALGUNAS ALERTAS'}`);
console.log('══════════════════════════════════════════════════════════\n');

process.exit(allPass ? 0 : 1);
