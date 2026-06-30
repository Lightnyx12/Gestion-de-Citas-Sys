# Plan de Implementación — Módulo Administrativo

## Estado Actual

- **3 páginas admin**: Dashboard, Registro Doctor, Directorio Doctores
- **Sidebar con 3 items**
- Dashboard con 4 cards de stats + tabla de últimas 5 citas
- Sin auto-refresh, sin gráficos, sin paginación

---

## Fase 1: Quick Wins — Dashboard.tsx (Días 1-2)

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Cards clickeables → navegan a su página | `Dashboard.tsx:152-196` |
| 2 | Auto-refresh cada 60s con `setInterval` + indicador "Última actualización" | `Dashboard.tsx:32-93` |
| 3 | Skeleton loading por sección | `Dashboard.tsx:123-132` |
| 4 | Badges de estado con iconos + mejor contraste | `Dashboard.tsx:106-121` |
| 5 | Tooltip en cards al hover (info extra) | `Dashboard.tsx:153-194` |

---

## Fase 2: Dashboard Avanzado (Días 3-5)

| # | Tarea | Detalle |
|---|-------|---------|
| 6 | Gráfico de barras semanal (citas/día últimos 7 días) | CSS + Tailwind (sin librería) |
| 7 | Gráfico circular de especialidades (distribución doctores) | `conic-gradient` CSS |
| 8 | Tabla mejorada: columna especialidad, paginación (10/page), acciones directas | `Dashboard.tsx:221-258` |
| 9 | Filtros rápidos por estado arriba de la tabla | Nuevo estado + lógica |

---

## Fase 3: Nuevas Páginas Core (Días 6-12)

### 10 — Gestión de Citas Global
- **Archivo**: `src/pages/Administrator/AdminAppointments.tsx`
- **Ruta**: `/admin/AdminAppointments`
- **Features**:
  - Lista paginada de TODAS las citas del sistema
  - Filtros: doctor, paciente, fecha, estado
  - Acciones: cambiar estado, reprogramar
  - Vista calendario opcional

### 11 — Gestión de Pacientes
- **Archivo**: `src/pages/Administrator/AdminPatients.tsx`
- **Ruta**: `/admin/AdminPatients`
- **Features**:
  - Lista de pacientes con búsqueda
  - Ver perfil + historial de citas
  - Desactivar/reactivar cuenta

### 12 — Gestión de Especialidades
- **Archivo**: `src/pages/Administrator/AdminSpecialties.tsx`
- **Ruta**: `/admin/AdminSpecialties`
- **Features**:
  - CRUD completo: crear, editar, activar/desactivar
  - Validación de duplicados

---

## Fase 4: Reportes y Analytics (Días 13-16)

| # | Tarea | Detalle |
|---|-------|---------|
| 13 | Página de Reportes (`AdminReports.tsx`) | Selector de fechas, doctores más solicitados, tasa cancelación, feedback promedio |
| 14 | Exportación CSV | Botón descarga en reportes |

---

## Fase 5: Soporte y Auditoría (Días 17-20)

| # | Tarea | Detalle |
|---|-------|---------|
| 15 | Logs de Actividad (`AdminAuditLog.tsx`) | Tabla de eventos: creación/eliminación de doctores, cambios de estado |
| 16 | Panel de Feedback (`AdminFeedback.tsx`) | Ver feedback, marcar como leído, responder |
| 17 | Sidebar actualizado (`SidebarAdmin.tsx`) | Nuevas rutas organizadas en secciones |

---

## Mapa de Rutas Final

```
/admin/dashboard          → Dashboard mejorado
/admin/AdminDocManager    → Registrar Doctor (existe)
/admin/AdminDoctors       → Directorio Doctores (existe)
/admin/AdminAppointments  → Gestión de Citas Global  [NUEVA]
/admin/AdminPatients      → Gestión de Pacientes     [NUEVA]
/admin/AdminSpecialties   → Gestión de Especialidades [NUEVA]
/admin/AdminReports       → Reportes y Analytics     [NUEVA]
/admin/AdminFeedback      → Feedback de Pacientes    [NUEVA]
/admin/AdminAuditLog      → Auditoría / Logs         [NUEVA]
```

---

## Sidebar Propuesto

```
Dashboard         (LayoutDashboard)      → /admin/dashboard
─── GESTIÓN ───
Citas Global      (Calendar)             → /admin/AdminAppointments
Pacientes         (Users)                → /admin/AdminPatients
Doctores          (Stethoscope)          → /admin/AdminDoctors
Registrar Doctor  (Notebook)             → /admin/AdminDocManager
Especialidades    (Folder)               → /admin/AdminSpecialties
─── ANALYTICS ───
Reportes          (BarChart3)            → /admin/AdminReports
Feedback          (MessageSquare)        → /admin/AdminFeedback
Auditoría         (History)              → /admin/AdminAuditLog
```

---

## Dependencias

- **Ninguna obligatoria** para F1-F3 (charts con CSS puro)
- **Opcional F4**: `recharts` si se prefieren gráficos interactivos

---

## Preguntas Pendientes

1. ¿Empezar por Fase 1 (mejoras al dashboard) o ir directo a nuevas páginas?
2. ¿Gráficos con CSS puro o instalar recharts?
3. ¿Gestión de Pacientes permite editar datos o solo ver/desactivar?
4. ¿El admin debe poder crear especialidades desde el panel?
