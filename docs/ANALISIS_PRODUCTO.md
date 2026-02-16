# 🎓 Exam Generator - Análisis Profesional y Estrategia de Producto

**Fecha:** 15 de febrero de 2026  
**Versión:** 1.0.0  
**Autor:** Análisis del producto

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de la Aplicación Actual](#análisis-de-la-aplicación-actual)
3. [Análisis de la Competencia](#análisis-de-la-competencia)
4. [Estrategias de Registro de Usuarios](#estrategias-de-registro-de-usuarios)
5. [Recomendaciones y Roadmap](#recomendaciones-y-roadmap)
6. [Conclusión](#conclusión)

---

## 🎯 Resumen Ejecutivo

**Exam Generator** es una plataforma completa de generación de exámenes con IA que permite a profesores crear evaluaciones a partir de documentos PDF/DOCX. La aplicación tiene una base sólida con arquitectura limpia, autenticación robusta y funcionalidad principal implementada.

**Puntos Fuertes:**

- Arquitectura profesional con DDD
- IA integrada (GPT-4o con RAG)
- Autenticación JWT + OAuth
- Manejo de documentos y procesamiento en background

**Puntos Críticos:**

- **No existe sistema de invitaciones** (el problema más crítico)
- No hay descubrimiento de alumnos
- Búsqueda de alumnos debe ser por ID (muy limitado)

**Oportunidad de Mercado:**
El mercado de plataformas de evaluación educativa está dominado por Kahoot!, Quizizz/Wayground, Quizalize y Socrative. Aunque hay competencia fuerte, nuestra propuesta de valor es única: **generación de exámenes con IA basada en documentos propios**, algo que las competidores no ofrecen de forma nativa.

---

## 📊 Análisis de la Aplicación Actual

### Arquitectura Técnica

```
Frontend: Next.js 15 (App Router)
Backend: Fastify + TypeScript
Database: PostgreSQL 16 con pgvector
Queue: BullMQ + Redis
Storage: Azure Blob Storage
AI: Azure OpenAI (GPT-4o)
Infrastructure: Azure Container Apps (Terraform)
```

### Entidades de Dominio

| Entidad           | Propósito                 | Estado           |
| ----------------- | ------------------------- | ---------------- |
| `User`            | Profesores y alumnos      | ✅ Completo      |
| `Document`        | PDF/DOCX subidos          | ✅ Completo      |
| `DocumentChunk`   | Fragmentos con embeddings | ✅ Completo      |
| `Exam`            | Exámenes generados        | ✅ Completo      |
| `Question`        | Preguntas de examen       | ✅ Completo      |
| `ExamAssignment`  | Asignaciones a alumnos    | ✅ Completo      |
| `StudentAnswer`   | Respuestas de alumnos     | ✅ Completo      |
| `UserPreferences` | Preferencias de usuario   | ✅ Completo      |
| `Invitation`      | Invitaciones pendientes   | ❌ **NO EXISTE** |
| `Class`           | Clases/Aulas              | ❌ **NO EXISTE** |

### Funcionalidades Implementadas

#### ✅ Para Profesores

- Registro/Login (email/password + Google OAuth)
- Gestión completa de documentos (upload, list, view, delete, download)
- Generación de exámenes con IA (configurable: preguntas, dificultad, tipos)
- Asignación de exámenes a alumnos (por ID)
- Dashboard con estadísticas

#### ✅ Para Alumnos

- Registro/Login
- Ver exámenes asignados
- Comenzar y enviar exámenes
- Ver resultados y calificaciones
- Dashboard básico

#### ❌ Crítico: Falta Sistema de Invitaciones

**El problema actual:**

- Los profesores no pueden invitar alumnos por email
- Los alumnos deben registrarse manualmente
- Los profesores necesitan conocer el ID exacto del alumno para asignar exámenes
- No hay gestión de "clases" o grupos
- No hay códigos de clase para que los alumnos se unan

**Impacto:** La UX para agregar alumnos es extremadamente deficiente y no-scalable.

---

## 🏆 Análisis de la Competencia

### Comparativa de Plataformas Principales

| Plataforma                 | Enfoque Principal                | Usuarios         | Generador de IA | Sistema de Clases        | Precio (aprox.) |
| -------------------------- | -------------------------------- | ---------------- | --------------- | ------------------------ | --------------- |
| **Kahoot!**                | Gamificación en vivo             | 8M+ profesores   | ❌ Básico       | ✅ Códigos de clase      | $3-19/mes       |
| **Wayground (ex-Quizizz)** | Biblioteca de recursos + AI      | 90% escuelas USA | ✅ Avanzado     | ✅ Google Classroom sync | Contactar       |
| **Quizalize**              | Juegos educativos + gamificación | 250K+ profesores | ✅ Básico       | ✅ Códigos de clase      | Gratis + $/mes  |
| **Socrative**              | Evaluación en tiempo real        | 3M+ profesores   | ✅ Nuevo        | ✅ Rooms/Códigos         | $79.99/año      |

### Kahoot! - El Líder del Mercado

**Propuesta de Valor:**

- Gamificación masiva con juegos en vivo
- Experiencia muy engaging para alumnos
- Categorías: Escuelas, Negocios, Hogar
- Múltiples juegos (Blockerzz, Goalzz, Hoopzz, Battlerzz)

**Sistema de Usuarios:**

- Profesores registran códigos de clase (ej: "ABC123")
- Alumnos entraran con el código (sin necesidad de cuenta, opcional)
- Integración con Google Classroom y Microsoft Teams
- Apps móviles nativas

**Precios:**

- Kahoot!+: $3/mes (individual)
- Kahoot! One: $19/mos (all-in-one)
- Kahoot! 360: $19/mes (empresas)

**Debilidades:**

- No genera exámenes desde documentos
- Creación de contenido manualmente o desde biblioteca
- IA es limitada (principalmente para adaptar contenido existente)

### Wayground (ex-Quizizz) - El Competidor AI

**Propuesta de Valor:**

- Biblioteca masiva de recursos alineados a estándares
- IA para generar y diferenciar contenido
- 25+ formatos de recursos (presentaciones, videos, flashcards, evaluaciones)
- Automodificaciones para alumnos con necesidades especiales

**Sistema de Usuarios:**

- Integración con Google Classroom
- Students join con email o Google/Microsoft OAuth
- No usa códigos de clase (enfoque enterprise)

**Precios:**

- Se vende a nivel escuela/distrito (enterprise)
- Modelo B2B predominante

**Debilidades:**

- Enfoque mayormente en biblioteca de contenido pre-creado
- No generación desde documentos propios
- Más complejo de implementar para profesores individuales

### Quizalize - El Equilibrista

**Propuesta de Valor:**

- Juegos educativos tipo Kahoot!
- Generador de AI básico
- Integración Google Classroom, Microsoft Teams
- Dashboard de progreso por estándar
- Diferenciación automática por nivel

**Sistema de Usuarios:**

- Profesores create clases con códigos
- Alumnos join con código (anónimo o con login)
- 20 students gratis, 200 en plan pagado

**Precios:**

- Basic: Gratis (20 students, 1 class)
- Standard: $/mes (200 students, unlimited classes)

**Debilidades:**

- Sin generación de exámenes desde documentos
- Enfocado en quizzes rápidos más que evaluaciones formales

### Socrative - El Evaluador Profesional

**Propuesta de Valor:**

- Evaluación en tiempo real con feedback instantáneo
- Reports detallados y exportables
- AI para crear assessments rápidamente
- Space Races (gamificación simple)

**Sistema de Usuarios:**

- Profesores create "rooms" con nombres únicos
- Alumnos entran con nombre de room
- Requiere login solo para profesores

**Precios:**

- $79.99/año para profesores individuales
- Planes para escuelas enteras

**Debilidades:**

- Menos gamificado que Kahoot!
- AI es nueva, menos madura
- Sin generación desde documentos personalizados

---

## 💡 Estrategias de Registro de Usuarios

### Análisis de Modelos de la Competencia

| Modelo                     | Cómo Funciona                                  | Ventajas                             | Desventajas                       | Quién lo Usa                |
| -------------------------- | ---------------------------------------------- | ------------------------------------ | --------------------------------- | --------------------------- |
| **Código de Clase**        | Profesor crea clase con código (ej: "MATH101") | Students join en segundos sin cuenta | Tracking limitado si anónimo      | Kahoot!, Quizalize          |
| **Email Invitation**       | Teacher invita por email con link              | Tracking completo, profesional       | Requiere que alumnos tengan email | Wayground, Google Classroom |
| **OAuth/LMS Sync**         | Integración con Google Classroom/MSTeams       | Auto-sync de alumnos, enterprise     | Complejo de implementar           | Wayground, Kahoot! 360      |
| **Mixed (Código + Login)** | Código para entrar, login opcional             | Flexible, tracking opcional          | Más complejo UX                   | Quizalize, Kahoot!          |
| **Room Names**             | Profesor crea "room" con nombre único          | Simple, sin pre-configuración        | No persistencia entre sesiones    | Socrative                   |

### Recomendación: Modelo Híbrido de 3 Niveles

Para **Exam Generator**, recomiendo un sistema híbrido que combine lo mejor de cada competidor:

#### Nivel 1: Profesores (Gestión Completa)

```
1. Registro tradicional (email/password o OAuth)
2. Creación de "Clases" con código único (ej: "PROF-JOHN-7834")
3. Invitación por email individual o CSV
4. Integración (futura) con Google Classroom
```

#### Nivel 2: Alumnos - Opción A: Código de Clase (Recomendada)

```
1. Alumno entra a exam-generator.com/student/join
2. Ingresa código de clase (ej: "PROF-JOHN-7834")
3. Registro opcional:
   - Anónimo: Solo nombre (ej: "María G.")
   - Con cuenta: Email + password (para tracking persistente)
4. Automáticamente se une a la clase
```

**Ventajas:**

- Entrada rápida (< 10 segundos)
- No requiere email para alumnas jóvenes
- Profesional con tracking si el alumno crea cuenta

#### Nivel 2: Alumnos - Opción B: Invitación por Email

```
1. Profesor invita alumnos por email
2. Email contiene: "Únete a la clase de Profesor X"
3. Click en link → Registro rápido o login existente
4. Automáticamente se une a la clase
```

**Ventajas:**

- Profesional para adultos/universidades
- Email se convierte en identificador único
- Recuperación de cuenta fácil

#### Nivel 2: Alumnos - Opción C: Importación por CSV

```
1. Profesor sube archivo: nombre, email, id_estudiante
2. Sistema crea cuentas en estado "pendiente"
3. Primer login con link temporal
```

**Ventajas:**

- Ideal para escuelas con listas pre-existentes
- Bulk operation para cientos de alumnos

---

## 🎨 Diseño del Sistema de Invitaciones Propuesto

### Nuevas Entidades de Dominio

```typescript
// Class (Clase/Aula)
class Class {
  id: UUID
  teacherId: UUID (FK → User)
  name: string (ej: "Matemáticas 8vo Grado - Grupo A")
  code: string (único, ej: "MATH8A-X7K3")
  description?: string
  color?: string
  createdAt: DateTime
  updatedAt: DateTime
  students: StudentEnrollment[]
}

// StudentEnrollment (Enrollment/Inscripción)
class StudentEnrollment {
  id: UUID
  classId: UUID (FK → Class)
  studentId: UUID (FK → User)
  enrolledAt: DateTime
  isActive: boolean
}

// Invitation (Invitación Pendiente)
class Invitation {
  id: UUID
  classId: UUID (FK → Class)
  teacherId: UUID (FK → User)
  email: string
  status: PENDING | ACCEPTED | EXPIRED
  token: string (UUID para enlace de aceptación)
  expiresAt: DateTime
  acceptedAt?: DateTime
}
```

### Flujos de Usuario Propuestos

#### Flow 1: Teacher Creates Class & Generates Code

```
1. Teacher: → Dashboard → "Crear Nueva Clase"
2. Ingresa: Nombre, descripción (opcional)
3. Sistema: Genera código único automáticamente (ej: "MATH8A-X7K3")
4. Teacher puede:
   - Copiar código para compartir
   - Generar QR code del código
   - Invitar por email individual
   - Invitar por CSV
```

#### Flow 2: Student Joins with Class Code

```
1. Student: → exam-generator.com/student/join
2. Ingresa código de clase: "MATH8A-X7K3"
3. Opciones:
   A. Anónimo: Ingresa solo nombre → Se joins como estudiante temporal
   B. Con cuenta:
      - Si tiene cuenta: Login → Joints clase
      - Si no tiene cuenta: Register → Joints clase
4. Confirmación: "¡Te uniste a Matemáticas 8vo Grado!"
```

#### Flow 3: Teacher Invites by Email

```
1. Teacher: → Clase → "Invitar Alumnos"
2. Ingresa emails separados por coma o sube CSV
3. Sistema crea invitaciones y envía emails:
   Subject: "Invitación a unirte a [Nombre Clase]"
   Body: "El profesor [Nombre] te invita a...
          [Click aquí para aceptar]"
4. Student clicks link → Acepta → Se une a clase
```

#### Flow 4: Assigning Exams to Classes

```
ANTES (Current):
- Teacher necesita ID exacto del alumno → Impráctico

DESPUÉS (Proposed):
- Teacher: → Exam → "Asignar a Clase"
- Selecciona: Clase(s) entera
- Opcional: Excluir alumnos específicos
- Selecciona: Fecha límite (due date)
- Sistema crea assignments para todos los estudiantes de la clase
```

### UI/UX Wireframes Conceptuales

#### Teacher Dashboard - Classes Tab

```
┌─────────────────────────────────────────────────┐
│  📚 Mis Clases              [+ Nueva Clase]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Matemáticas 8vo Grado - Grupo A         │   │
│  │ Código: MATH8A-X7K3  📋 Copy  📱 QR    │   │
│  │ 👥 24 estudiantes  📊 5 exámenes       │   │
│  │ [Ver Alumnos] [Ver Exámenes] ...        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Historia Universal                    │   │
│  │ Código: HIST101-QW2R  📋 Copy  📱 QR   │   │
│  │ 👥 18 estudiantes  📊 3 exámenes       │   │
│  │ [Ver Alumnos] [Ver Exámenes] ...        │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Student Join Page

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🎓 Únete a una Clase                          │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │                                         │   │
│   │   Ingresa el código de clase:           │   │
│   │                                         │   │
│   │   ┌─────────────────────────────────┐   │   │
│   │   │  MATH8A-X7K3                   │   │   │
│   │   └─────────────────────────────────┘   │   │
│   │                                         │   │
│   │        [Unirse a la Clase]             │   │
│   │                                         │   │
│   │   ¿No tienes código? Contacta a tu    │   │
│   │   profesor para obtenerlo.             │   │
│   │                                         │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
│   [Unirse sin cuenta]  [Crear cuenta]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🗺️ Recomendaciones y Roadmap

### Prioridad 1: Sistema de Clases e Invitaciones (CRÍTICO)

**Tiempo estimado:** 2-3 semanas

#### Backend

1. Crear entidades `Class`, `StudentEnrollment`, `Invitation`
2. APIs:
   - `POST /classes` - Crear clase
   - `GET /classes` - Listar clases del profesor
   - `GET /classes/:code` - Obtener clase por código
   - `POST /classes/:classId/join` - Unirse a clase (student)
   - `POST /classes/:classId/invite` - Invitar por email
   - `POST /classes/:classId/invite/csv` - Import por CSV
   - `DELETE /classes/:classId/students/:studentId` - Eliminar estudiante

3. Email service para envío de invitaciones (Azure Communication Services)

#### Frontend

1. Dashboard de clases para profesores
2. Página `/student/join` para unirse con código
3. Componente de QR code generation
4. Modal de invitación por email
5. Vista de gestión de alumnos por clase

#### Database

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(class_id, student_id)
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_code ON classes(code);
CREATE INDEX idx_enrollments_class ON student_enrollments(class_id);
CREATE INDEX idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_invitations_class ON invitations(class_id);
CREATE INDEX idx_invitations_token ON invitations(token);
```

---

### Prioridad 2: Asignación de Exámenes a Clases (ALTA)

**Tiempo estimado:** 1-2 semanas

#### Backend

1. Modificar `POST /students/assignments` para aceptar `classId` en lugar de solo `studentId`
2. Crear bulk assignment para asignar a toda la clase
3. API: `POST /exams/:examId/assign` con body `{ classIds: [], dueDate, excludeStudentIds: [] }`

#### Frontend

1. UI para asignar exámenes a clases selectas
2. Checklist de estudiantes permitiendo excepciones
3. Calendar view de assignments por clase

---

### Prioridad 3: Búsqueda y Gestión de Estudiantes (MEDIA)

**Tiempo estimado:** 1 semana

#### Backend

1. `GET /classes/:classId/students` - Listar estudiantes de clase
2. `GET /students/search` - Buscar estudiantes por nombre/email (con paginación)
3. `DELETE /students/:studentId` - Eliminar cuenta (profesor admin only, con confirmación)

#### Frontend

1. Tabla de estudiantes con búsqueda
2. Acciones: Ver historial, Eliminar, Transferir a otra clase
3. Bulk actions (asignar exámenes, eliminar)

---

### Prioridad 4: Integración Google Classroom (MEDIA-BAJA)

**Tiempo estimado:** 2-3 semanas

#### Backend

1. Implementar Google Classroom API OAuth flow para teachers
2. Sincronización de alumnos desde Google Classroom
3. Webhooks para mantener sincronización

#### Frontend

1. "Conectar con Google Classroom"
2. Importar clase desde Google Classroom
3. Sync automático de estudiantes con Google Classroom

---

### Prioridad 5: Analytics Avanzado (BAJA)

**Tiempo estimado:** 2 semanas

#### Backend

1. Aggregated metrics por clase (promedio, distribución)
2. Performance trends over time
3. Export to CSV/PDF

#### Frontend

1. Dashboard de clase con métricas
2. Gráficos de rendimiento
3. Report generator

---

### Prioridad 6: Gamificación y Engagement (BAJA)

**Tiempo estimado:** 3-4 semanas

1. Badges y achievements
2. Leaderboards por clase
3. Streak tracking
4. Notificaciones push para deadlines

---

## 💰 Estrategia de Pricing y Monetización

### Modelo Propuesto: Freemium con Tiers

| Feature                       | Free   | Teacher Pro | School District |
| ----------------------------- | ------ | ----------- | --------------- |
| Número de clases              | 1      | Unlimited   | Unlimited       |
| Estudiantes por clase         | 10     | 50          | Unlimited       |
| Exámenes generados con AI/mes | 3      | 50          | Unlimited       |
| Almacenamiento de documentos  | 500 MB | 10 GB       | Unlimited       |
| Códigos de clase              | ✅     | ✅          | ✅              |
| Invitaciones por email        | 5/mes  | Unlimited   | Unlimited       |
| Google Classroom sync         | ❌     | ✅          | ✅              |
| Analytics avanzados           | ❌     | ✅          | ✅              |
| Branding personalize          | ❌     | ✅          | Custom          |
| Priority Support              | ❌     | ✅          | Dedicated       |

**Precios propuestos:**

- Free: $0 (para profesor individual probar)
- Teacher Pro: $12/mes o $99/año (20% discount)
- School District: Contactar (enterprise pricing: ~$5-10/student/año)

---

## 🎯 Diferenciación Competitiva

### Nuestra Ventaja Única

**Exam Generator es la ÚNICA plataforma que:**

1. ✅ **Genera exámenes desde TUS documentos** (PDF/DOCX)
2. ✅ Usa **RAG (Retrieval-Augmented Generation)** para exámenes basados en contenido específico
3. ✅ **Procesamiento automático** de documentos con embeddings
4. ✅ **3 tipos de preguntas** (multiple choice, true/false, short answer)
5. ✅ Configurable por **dificultad y cantidad**

**Las competencias:**

- Kahoot!: Juegos, pero creas contenido manualmente
- Wayground: Biblioteca masiva + AI, pero no desde tus documentos
- Quizalize: Generador AI básico, sin RAG
- Socrative: Evaluación real-time, sin generación de exámenes

### Pitch de Venta para Profesores

> "Exam Generator es la única plataforma que transforma tus apuntes en exámenes profesionales en minutos. Sube tus PDF/DOCX, configura el tipo de examen y genera preguntas basadas en TU contenido específico. No más crear preguntas desde cero o usar exámenes genéricos."

### Casos de Uso Ideales

1. **Profesores universitarios:** Generan exámenes de apuntes, artículos, papers propios
2. **Escuelas privadas:** Content creation para material propio sin copyright
3. **Formación corporativa:** Evaluaciones basadas en documentación interna
4. **Preparación oposiciones:** Exámenes desde material específico

---

## 📋 Conclusiones y Recomendaciones Final

### Resumen

1. **La base técnica es sólida** - Arquitectura limpia, DDD, stack moderno
2. **El problema crítico es la falta de gestión de alumnos** - Sin clases o invitaciones, el producto no es usable en escala
3. **La competencia es fuerte pero nuestra propuesta es única** - Generación desde documentos con RAG es un diferenciador real

### Recomendaciones Inmediatas

1. **IMPLEMENTAR AHORA** Sistema de clases e invitaciones (Prioridad 1)
2. El modelo híbrido (código de clase + invitaciones por email) es el ideal
3. Roadmap de 8 semanas para MVP funcional de gestión de alumnos:
   - Semana 1-2: Sistema de clases básico
   - Semana 3-4: Invitaciones y códigos de clase
   - Semana 5-6: Asignación de exámenes a clases
   - Semana 7-8: Búsqueda y gestión de estudiantes

### Estrategia Go-to-Market

1. **Beta Private** (1-2 meses):
   - 10-20 profesores piloto
   - Feedback iterativo
   - Refinar UX del sistema de clases

2. **Beta Public** (3-4 meses):
   - Freemium model
   - Marketing a profesores individuales
   - Content marketing (blogs, videos demo)

3. **Launch Full** (6+ meses):
   - Contact schools and districts
   - Google Classroom sync (feature key)
   - Enterprise pricing

### KPIs de Éxito

- **Activation Rate:** % de profesores que crean una clase (target: >60%)
- **Student Acquisition Rate:** Avg estudiantes por profesor (target: >15)
- **Retention:** % de profesores activos después de 30 días (target: >40%)
- **Free-to-Paid Conversion:** % de free users que upgradan (target: >5%)

---

## 📎 Anexos

### A. Tech Stack Completo

**Frontend:**

- Next.js 15.1 (App Router)
- TypeScript 5.7
- Tailwind CSS 3.4
- shadcn/ui components
- React i18n (i18next)
- TanStack Query (react-query)

**Backend:**

- Fastify 5.2
- TypeScript 5.7
- Prisma ORM 6.2
- PostgreSQL 16 + pgvector
- BullMQ 6.0 + Redis
- Azure Blob Storage
- Azure OpenAI (GPT-4o, text-embedding-3-small)
- Firebase Genkit (AI orchestration)

**Infrastructure:**

- Azure Container Apps
- Azure PostgreSQL Flexible Server
- Azure Cache for Redis
- Azure Key Vault
- Terraform (IaC)

**Development:**

- pnpm 10 (package manager)
- Turborepo (monorepo)
- ESLint + Prettier
- Husky + lint-staged

### B. Costos de Azure (estimado mensual)

| Service        | Free Tier Usage        | Paid Tier Est.                   |
| -------------- | ---------------------- | -------------------------------- |
| Container Apps | $0 (180k vCPU-sec/mes) | $30-100/mes                      |
| PostgreSQL     | $0 (Free tier)         | $15-100/mes                      |
| Redis Cache    | $0 (Basic)             | $15-50/mes                       |
| Blob Storage   | $0 (5GB)               | $1-20/mes                        |
| OpenAI API     | $0                     | $50-200/mes (dependiendo de uso) |
| Key Vault      | $0                     | $5/mes                           |
| **Total**      | **$0**                 | **$116-475/mes**                 |

### C. Referencias

- Kahoot!: https://kahoot.com
- Wayground (ex-Quizizz): https://wayground.com
- Quizalize: https://www.quizalize.com
- Socrative: https://www.socrative.com
- Next.js Docs: https://nextjs.org/docs
- OpenAI API: https://platform.openai.com/docs
- Prisma: https://www.prisma.io/docs

---

**Fin del Documento**

Para preguntas o clarificaciones, contactar al equipo de desarrollo.
