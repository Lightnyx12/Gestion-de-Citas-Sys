# 🏥 Gestión de Citas Médicas

> Sistema web de gestión de citas médicas con roles diferenciados para pacientes, doctores y administradores, construido sobre una arquitectura moderna con React + Supabase.

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

## 🏗️ Arquitectura

Este proyecto sigue una arquitectura **SPA (Single Page Application)** con patrón **Feature-Based / Role-Based** en el frontend, combinada con un backend **BaaS (Backend as a Service)** mediante Supabase.

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                    │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              React 19 + TypeScript               │   │
│   │                                                 │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│   │  │  Páginas │  │Componentes│  │   Contextos  │  │   │
│   │  │ (Router) │  │  (UI)    │  │ (Auth/State) │  │   │
│   │  └────┬─────┘  └──────────┘  └──────┬───────┘  │   │
│   │       │                             │           │   │
│   │  ┌────▼─────────────────────────────▼───────┐  │   │
│   │  │              Capa de Servicios            │  │   │
│   │  │   (appointment / availability / doctor)   │  │   │
│   │  └────────────────────┬──────────────────────┘  │   │
│   └───────────────────────│─────────────────────────┘   │
│                           │                             │
└───────────────────────────│─────────────────────────────┘
                            │ Supabase JS SDK
┌───────────────────────────▼─────────────────────────────┐
│                     SUPABASE (BaaS)                      │
│                                                         │
│   ┌─────────────┐   ┌──────────────┐   ┌────────────┐  │
│   │  PostgreSQL  │   │     Auth     │   │  Realtime  │  │
│   │  (Base de   │   │  (JWT / RLS) │   │  (futura   │  │
│   │   datos)    │   │              │   │   integr.) │  │
│   └─────────────┘   └──────────────┘   └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Patrón de enrutamiento por roles

```
/login  ──► Público
/register ► Público

/ ─────────────────────────► Redirige según rol
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
/patient   /doctor    /admin
```

---

## 📁 Estructura de Directorios

```
📦 Gestion-de-Citas-Sys/
│
├── 📄 index.html                  # Punto de entrada HTML
├── ⚙️  vite.config.ts              # Configuración de Vite
├── ⚙️  tailwind.config.js          # Configuración de TailwindCSS
├── ⚙️  tsconfig.json               # Configuración de TypeScript
├── 📦 package.json                # Dependencias del proyecto
├── 🔒 .env                        # Variables de entorno (Supabase)
│
└── 📂 src/
    │
    ├── 🚀 main.tsx                # Bootstrap de la app (BrowserRouter)
    ├── 🗺️  App.tsx                 # Enrutador principal + guards de rol
    ├── 🎨 index.css               # Estilos globales base
    │
    ├── 📂 context/                # 🧠 Estado global (React Context)
    │   ├── AuthContext.tsx        #    Autenticación, sesión, rol del usuario
    │   └── AppointmentContext.tsx #    Estado compartido de citas
    │
    ├── 📂 lib/                    # ⚙️  Servicios y utilidades
    │   ├── supabase.ts            #    Cliente Supabase configurado
    │   ├── appointment-service.ts #    CRUD de citas médicas
    │   ├── availability-service.ts#    Gestión de disponibilidad semanal
    │   ├── doctor-service.ts      #    Consulta de doctores
    │   ├── doctor-profile-service.ts # Perfil y especialidades del doctor
    │   ├── medical-history-service.ts# Historial médico del paciente
    │   ├── support-service.ts     #    Tickets de soporte
    │   ├── config-service.ts      #    Configuración de perfil
    │   └── date-utils.ts          #    Helpers de fechas y horarios
    │
    ├── 📂 types/                  # 🔷 Definición de tipos TypeScript
    │   └── types.ts               #    Interfaces: User, Appointment, Doctor…
    │
    ├── 📂 components/             # 🧩 Componentes compartidos
    │   ├── Navbar.tsx             #    Barra de navegación superior
    │   ├── Sidebar.tsx            #    Sidebar del paciente
    │   ├── SidebarDoctor.tsx      #    Sidebar del doctor
    │   ├── SidebarAdmin.tsx       #    Sidebar del administrador
    │   ├── ProtectedRoute.tsx     #    Guard de rutas por rol
    │   ├── ReprogramModal.tsx     #    Modal para reprogramar citas
    │   └── index.ts               #    Re-exportaciones centralizadas
    │
    ├── 📂 layout/                 # 🖼️  Layouts por rol
    │   ├── PatientLayout.tsx
    │   ├── DoctorLayout.tsx
    │   └── AdminLayout.tsx
    │
    └── 📂 pages/                  # 📄 Páginas organizadas por rol
        │
        ├── 🔑 Login.tsx           # Inicio de sesión
        ├── 📝 Register.tsx        # Registro de nuevos usuarios
        │
        ├── 📂 Patient/            # 👤 Módulo Paciente
        │   ├── Schedule.tsx       #    Buscar y agendar citas
        │   ├── Appointment.tsx    #    Ver y gestionar mis citas
        │   ├── MedicHistory.tsx   #    Historial médico
        │   ├── Config.tsx         #    Configuración de perfil
        │   ├── Suport.tsx         #    Centro de soporte
        │   └── patient-service.tsx#    Helpers del paciente
        │
        ├── 📂 Doctor/             # 🩺 Módulo Doctor
        │   ├── DoctorAvailability.tsx #  Gestión de disponibilidad semanal
        │   ├── AppointmentsCenter.tsx #  Centro de citas del doctor
        │   ├── DoctorProfileEdit.tsx  #  Edición de perfil profesional
        │   ├── NotificationsCenter.tsx#  Centro de notificaciones
        │   └── components/            #  Sub-componentes propios del doctor
        │
        └── 📂 Administrator/      # 🛡️  Módulo Administrador
            ├── Dashboard.tsx      #    Panel de control general
            ├── AdminDoctors.tsx   #    Listado de doctores
            └── AdminDoctorManager.tsx # Gestión individual de doctores
```

---

## 🧩 Módulos del Sistema

### 👤 Módulo Paciente
| Página | Ruta | Descripción |
|---|---|---|
| 🗓️ Agendar Cita | `/patient/schedule` | Busca doctores por especialidad y reserva un turno disponible |
| 📋 Mis Citas | `/patient/appointments` | Lista de citas activas con opciones de reprogramación y cancelación |
| 📁 Historial Médico | `/patient/history` | Registro de consultas anteriores y diagnósticos |
| ⚙️ Configuración | `/patient/config` | Gestión del perfil personal y datos del paciente |
| 🆘 Soporte | `/patient/support` | Envío y seguimiento de tickets de ayuda |

### 🩺 Módulo Doctor
| Página | Ruta | Descripción |
|---|---|---|
| 🕐 Disponibilidad | `/doctor/availability` | Define horarios y días disponibles por semana |
| 📅 Centro de Citas | `/doctor/appointments` | Vista de todas las citas asignadas con filtros |
| 👨‍⚕️ Perfil Profesional | `/doctor/editprofile` | Edita especialidad, foto, descripción y datos clínicos |
| 🔔 Notificaciones | `/doctor/notifications` | Alertas y avisos de nuevas citas o cambios |

### 🛡️ Módulo Administrador
| Página | Ruta | Descripción |
|---|---|---|
| 📊 Dashboard | `/admin/dashboard` | Métricas globales del sistema |
| 👨‍⚕️ Doctores | `/admin/AdminDoctors` | Listado completo de doctores registrados |
| 🔧 Gestor de Médicos | `/admin/AdminDocManager` | Crear, editar y administrar cuentas de doctores |

---

## ✨ Funcionalidades Clave

### 🔐 Autenticación y Autorización
- Login y registro con **Supabase Auth** (JWT)
- Sesión persistente con recarga de página
- **Guard de rutas** por rol (`patient`, `doctor`, `admin`)
- Redirección automática al home de cada rol

### 🗓️ Gestión de Citas
- Búsqueda de doctores por **especialidad**
- Selección de fecha con visualización de **horarios disponibles** en tiempo real
- Reprogramación de citas desde un **modal dedicado** con validación de slots
- Cancelación de citas con actualización de estado en BD

### 🕐 Disponibilidad Semanal del Doctor
- Configuración de días habilitados por día de la semana
- Definición de **franja horaria** (hora inicio / hora fin)
- Duración de turno configurable (15, 20, 30, 45, 60 min)
- Persistencia en tabla `disponibilidad_semanal` con Supabase

### 🩺 Perfil Profesional del Doctor
- Edición de especialidad, descripción y datos de contacto
- Subida de foto de perfil
- Información visible para los pacientes en el buscador

### 📁 Historial Médico
- Registro cronológico de consultas del paciente
- Vista de diagnósticos y notas de cada visita

### 🛡️ Panel de Administración
- Métricas del sistema (citas activas, doctores, pacientes)
- Gestión completa de cuentas médicas (alta / baja / edición)

---

## ⚙️ Stack Tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| ⚛️ React | 19 | Framework UI principal |
| 🔷 TypeScript | 6 | Tipado estático |
| ⚡ Vite | 8 | Build tool y dev server |
| 🌐 React Router | 7 | Enrutamiento SPA |
| 🎨 TailwindCSS | 3 | Estilos utilitarios |
| 🗃️ Supabase JS | 2 | BaaS: Auth + PostgreSQL |
| 🎯 Lucide React | 1 | Librería de iconos |

---

## 🚀 Instalación y Desarrollo

```bash
# 1. Clona el repositorio
git clone <url-del-repo>
cd Gestion-de-Citas-Sys

# 2. Instala dependencias (se usa pnpm)
pnpm install

# 3. Configura las variables de entorno
cp .env.example .env
# Rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# 4. Inicia el servidor de desarrollo
pnpm run dev
```

### Variables de entorno requeridas

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

---

## 🗄️ Base de Datos (Supabase / PostgreSQL)

Las principales tablas del sistema son:

| Tabla | Descripción |
|---|---|
| `usuarios` | Datos del perfil de usuario (rol, DNI, contacto) |
| `doctores` | Perfil profesional del doctor (especialidad, foto) |
| `citas` | Registro de citas médicas (paciente, doctor, estado) |
| `disponibilidad_semanal` | Horarios semanales configurados por cada doctor |
| `historial_medico` | Registros de consultas del paciente |
| `soporte_tickets` | Tickets de ayuda enviados por pacientes |

---

<div align="center">
  <sub>Desarrollado con ❤️ · React + Supabase · 2026</sub>
</div>
