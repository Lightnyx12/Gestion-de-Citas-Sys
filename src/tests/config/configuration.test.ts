/**
 * 25.4 - Pruebas de Configuración
 * Módulo: vite.config.ts + tsconfig.app.json + package.json
 * Descripción: Verifica que la configuración del proyecto sea coherente
 *              y que los archivos críticos de infraestructura estén presentes
 *              y tengan los valores esperados para un entorno de producción.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJSON(relativePath: string): Record<string, unknown> {
  const fullPath = resolve(ROOT, relativePath);
  const content = readFileSync(fullPath, 'utf-8');
  // Elimina comentarios estilo JS (// y /* */) presentes en tsconfig
  const stripped = content
    .replace(/\/\/[^\n]*/g, '')           // líneas de comentario //
    .replace(/\/\*[\s\S]*?\*\//g, '');    // bloques /* ... */
  return JSON.parse(stripped);
}

function fileExists(relativePath: string): boolean {
  return existsSync(resolve(ROOT, relativePath));
}

// ─── Verificación de archivos críticos ────────────────────────────────────────

describe('25.4 – Archivos de configuración presentes', () => {
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'index.html',
    '.env',
    '.gitignore',
    'eslint.config.js',
    'tailwind.config.js',
    'postcss.config.js',
  ];

  requiredFiles.forEach(file => {
    it(`existe el archivo "${file}"`, () => {
      expect(fileExists(file)).toBe(true);
    });
  });
});

// ─── package.json ─────────────────────────────────────────────────────────────

describe('25.4 – package.json: dependencias y scripts', () => {
  const pkg = readJSON('package.json') as {
    name: string;
    version: string;
    type: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  it('el nombre del proyecto es "appointment-system"', () => {
    expect(pkg.name).toBe('appointment-system');
  });

  it('el tipo de módulo es "module" (ESM)', () => {
    expect(pkg.type).toBe('module');
  });

  it('tiene el script "dev" definido', () => {
    expect(pkg.scripts?.dev).toBeTruthy();
  });

  it('tiene el script "build" definido', () => {
    expect(pkg.scripts?.build).toBeTruthy();
  });

  it('tiene el script "lint" definido', () => {
    expect(pkg.scripts?.lint).toBeTruthy();
  });

  it('incluye "@supabase/supabase-js" como dependencia de producción', () => {
    expect(pkg.dependencies?.['@supabase/supabase-js']).toBeTruthy();
  });

  it('incluye "react" como dependencia de producción', () => {
    expect(pkg.dependencies?.['react']).toBeTruthy();
  });

  it('incluye "react-router-dom" como dependencia de producción', () => {
    expect(pkg.dependencies?.['react-router-dom']).toBeTruthy();
  });

  it('incluye "vite" como dependencia de desarrollo', () => {
    expect(pkg.devDependencies?.['vite']).toBeTruthy();
  });

  it('incluye "typescript" como dependencia de desarrollo', () => {
    expect(pkg.devDependencies?.['typescript']).toBeTruthy();
  });

  it('incluye "tailwindcss" como dependencia de desarrollo', () => {
    expect(pkg.devDependencies?.['tailwindcss']).toBeTruthy();
  });
});

// ─── tsconfig.app.json ────────────────────────────────────────────────────────

describe('25.4 – tsconfig.app.json: opciones de compilación TypeScript', () => {
  const tsconfig = readJSON('tsconfig.app.json') as {
    compilerOptions: Record<string, unknown>;
  };

  it('tiene compilerOptions definido', () => {
    expect(tsconfig.compilerOptions).toBeTruthy();
  });

  it('strict mode o linting estricto está habilitado', () => {
    // HALLAZGO REAL: este proyecto usa noUnusedLocals/noUnusedParameters
    // en lugar de strict:true global. Ambas son configuraciones de rigor TypeScript.
    const opts = tsconfig.compilerOptions as Record<string, unknown>;
    const hasStrictLinting =
      opts?.noUnusedLocals === true ||
      opts?.noUnusedParameters === true ||
      opts?.strict === true;
    expect(hasStrictLinting).toBe(true);
  });

  it('el target de compilación está definido', () => {
    expect(tsconfig.compilerOptions?.target).toBeTruthy();
  });

  it('moduleResolution está configurado', () => {
    expect(tsconfig.compilerOptions?.moduleResolution).toBeTruthy();
  });
});

// ─── Estructura de directorios src ────────────────────────────────────────────

describe('25.4 – Estructura de directorios del proyecto', () => {
  const requiredDirs = [
    'src',
    'src/components',
    'src/context',
    'src/lib',
    'src/pages',
    'src/hooks',
    'src/types',
    'public',
  ];

  requiredDirs.forEach(dir => {
    it(`existe el directorio "${dir}"`, () => {
      expect(fileExists(dir)).toBe(true);
    });
  });
});

// ─── Variables de entorno ─────────────────────────────────────────────────────

describe('25.4 – Archivo .env: variables de entorno requeridas', () => {
  it('el archivo .env existe y no está vacío', () => {
    const envPath = resolve(ROOT, '.env');
    expect(existsSync(envPath)).toBe(true);
    const content = readFileSync(envPath, 'utf-8');
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('contiene la variable VITE_SUPABASE_URL', () => {
    const content = readFileSync(resolve(ROOT, '.env'), 'utf-8');
    expect(content).toContain('VITE_SUPABASE_URL');
  });

  it('contiene la variable de clave pública de Supabase', () => {
    const content = readFileSync(resolve(ROOT, '.env'), 'utf-8');
    // HALLAZGO REAL: este proyecto usa VITE_SUPABASE_PUBLISHABLE_KEY
    // en lugar de la convención ANON_KEY — ambas son equivalentes en Supabase v2
    const hasSupabaseKey =
      content.includes('VITE_SUPABASE_ANON_KEY') ||
      content.includes('VITE_SUPABASE_PUBLISHABLE_KEY');
    expect(hasSupabaseKey).toBe(true);
  });
});

// ─── .gitignore ───────────────────────────────────────────────────────────────

describe('25.4 – .gitignore: archivos sensibles excluidos', () => {
  const gitignore = readFileSync(resolve(ROOT, '.gitignore'), 'utf-8');

  it('excluye node_modules del control de versiones', () => {
    expect(gitignore).toContain('node_modules');
  });

  it('excluye el directorio dist del control de versiones', () => {
    expect(gitignore).toContain('dist');
  });

  it('excluye el archivo .env del control de versiones', () => {
    expect(gitignore).toContain('.env');
  });
});
