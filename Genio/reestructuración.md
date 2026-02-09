# Plan de Reestructuración y Mejoras - App Electoral Colombia 2026

## 📋 Estado Actual del Proyecto

### ✅ Funcionalidades Implementadas
- [x] Sistema de registro para Candidatos, Líderes y Votantes
- [x] Dashboards diferenciados por rol (Candidato, Líder, Votante)
- [x] Georreferenciación completa (Departamentos → Municipios → Puestos de Votación)
- [x] Sistema de branding personalizable (colores, logos) con streaming en tiempo real
- [x] Búsqueda y filtrado de votantes
- [x] Jerarquía multitenancy: Candidato → Líder → Votante
- [x] Base de datos con Prisma + SQLite
- [x] Autenticación básica con localStorage

### ⚠️ Problemas Identificados y Resueltos
- [x] **Performance**: Logging de queries desactivado
- [x] **Performance**: Reducción de llamadas API iniciales (de 5 a 3)
- [x] **Performance**: Eliminación de includes innecesarios en queries
- [x] **Performance**: Carga bajo demanda de municipios y puestos de votación

---

## 🎯 Tareas Pendientes

### 🔒 PRIORIDAD ALTA - Seguridad y Privacidad

#### 1. Reestructurar Permisos de Visualización
- [ ] **Votantes independientes**: Los votantes que se registran de manera independiente NO deben poder ver:
  - [ ] Lista de líderes
  - [ ] Lista de otros votantes
  - [ ] Información del candidato más allá de nombre y partido
  - [ ] Solo deben ver su propia información y ubicación de votación

- [ ] **Líderes**: Solo pueden ver y gestionar:
  - [ ] Sus propios votantes registrados
  - [ ] NO pueden ver votantes de otros líderes
  - [ ] Información básica del candidato al que pertenecen

- [ ] **Candidatos**: Pueden ver:
  - [ ] Todos sus líderes
  - [ ] Todos los votantes de todos sus líderes
  - [ ] Estadísticas completas de su campaña

#### 2. Implementar Autenticación Real
- [ ] Migrar de localStorage a NextAuth.js (ya instalado)
- [ ] Implementar cookies httpOnly para sesiones
- [ ] Agregar middleware de autenticación en rutas API
- [ ] Hash de contraseñas con bcrypt
- [ ] Validación de permisos en cada endpoint API
- [ ] Proteger rutas del dashboard con middleware

#### 3. Validación de Datos
- [ ] Agregar validación de permisos en todas las rutas API
- [ ] Verificar que un líder solo pueda modificar sus propios votantes
- [ ] Verificar que un candidato solo pueda ver sus propios datos
- [ ] Implementar rate limiting para prevenir abuso

---

### 📊 PRIORIDAD ALTA - Reportes en PDF

#### 4. Generar Reportes para Líderes
- [ ] Crear endpoint `/api/reports/leader/voters`
- [ ] Implementar generación de PDF con todos los votantes del líder
- [ ] Incluir en el reporte:
  - [ ] Datos personales (nombre, cédula)
  - [ ] Ubicación de votación (municipio, puesto, mesa)
  - [ ] Georreferenciación (coordenadas si están disponibles)
  - [ ] Fecha de registro
  - [ ] Logo y branding del candidato
- [ ] Botón de descarga en dashboard del líder

#### 5. Generar Reportes para Candidatos

##### Reportes Generales
- [ ] **Reporte completo**: Todos los líderes y votantes
  - [ ] Crear endpoint `/api/reports/candidate/full`
  - [ ] Incluir estadísticas generales
  - [ ] Desglose por líder con sus votantes
  - [ ] Gráficas de distribución geográfica
  - [ ] Total de votantes por municipio/departamento

- [ ] **Reporte de líderes**: Solo líderes
  - [ ] Crear endpoint `/api/reports/candidate/leaders`
  - [ ] Lista de líderes con cantidad de votantes
  - [ ] Estadísticas de rendimiento por líder
  - [ ] Distribución geográfica de líderes

##### Reportes por Ubicación Geográfica
- [ ] **Reporte por Zona/Comuna**
  - [ ] Crear endpoint `/api/reports/candidate/by-zone`
  - [ ] Filtrar por departamento y municipio
  - [ ] Agrupar líderes y votantes por zona/comuna
  - [ ] Incluir:
    - [ ] Total de líderes por zona
    - [ ] Total de votantes por zona
    - [ ] Desglose detallado de cada líder en la zona
    - [ ] Lista completa de votantes por zona
    - [ ] Mapa de cobertura por zona
  - [ ] Selector de zona en dashboard del candidato

- [ ] **Reporte por Puesto de Votación**
  - [ ] Crear endpoint `/api/reports/candidate/by-polling-station`
  - [ ] Filtrar por departamento, municipio y puesto específico
  - [ ] Incluir:
    - [ ] Información del puesto (nombre, dirección, coordenadas)
    - [ ] Total de líderes que tienen votantes en ese puesto
    - [ ] Total de votantes registrados en ese puesto
    - [ ] Lista de líderes con sus votantes en ese puesto
    - [ ] Distribución por mesas dentro del puesto
    - [ ] Datos de alcaldía, gobernación, concejo, asamblea, JAL
  - [ ] Selector de puesto de votación en dashboard

- [ ] **Reporte por Mesa de Votación**
  - [ ] Crear endpoint `/api/reports/candidate/by-table`
  - [ ] Filtrar por puesto de votación y número de mesa
  - [ ] Incluir:
    - [ ] Información del puesto y mesa específica
    - [ ] Total de votantes en esa mesa
    - [ ] Líderes responsables de esos votantes
    - [ ] Lista detallada de votantes con todos sus datos
    - [ ] Datos de contacto del líder responsable
    - [ ] Estrategia de cobertura para esa mesa
  - [ ] Selector de mesa en dashboard

- [ ] **Reporte Comparativo Multi-ubicación**
  - [ ] Crear endpoint `/api/reports/candidate/comparative`
  - [ ] Comparar múltiples zonas/puestos/mesas
  - [ ] Incluir:
    - [ ] Tabla comparativa de cobertura
    - [ ] Gráficas de barras por ubicación
    - [ ] Identificar zonas con mayor/menor cobertura
    - [ ] Recomendaciones de áreas a fortalecer

- [ ] Botones de descarga en dashboard del candidato con filtros avanzados

#### 6. Librería para PDFs
- [ ] Instalar y configurar `jsPDF` + `jspdf-autotable` o `pdfkit`
- [ ] Crear templates reutilizables para reportes
- [ ] Agregar logo y branding personalizado en PDFs
- [ ] Implementar paginación para reportes grandes
- [ ] Agregar encabezados y pies de página con información de campaña
- [ ] Incluir fecha y hora de generación del reporte
- [ ] Agregar tablas con formato profesional
- [ ] Incluir gráficas y mapas en PDFs (opcional con Chart.js)

#### 7. Interfaz de Generación de Reportes
- [ ] Crear sección "Reportes" en dashboard del candidato
- [ ] Implementar filtros avanzados:
  - [ ] Por departamento
  - [ ] Por municipio
  - [ ] Por zona/comuna
  - [ ] Por puesto de votación
  - [ ] Por mesa de votación
  - [ ] Por líder específico
  - [ ] Por rango de fechas de registro
- [ ] Vista previa de datos antes de generar PDF
- [ ] Opción de exportar a Excel/CSV además de PDF
- [ ] Historial de reportes generados
- [ ] Indicador de progreso durante generación de reportes grandes

---

### 🚀 PRIORIDAD MEDIA - Performance y Escalabilidad

#### 8. Optimización de Base de Datos
- [ ] Limpiar base de datos actual (3.3MB con pocos registros es sospechoso)
- [ ] Agregar índices en campos de búsqueda frecuente:
  - [ ] `Voter.document`
  - [ ] `Voter.municipalityId`
  - [ ] `Voter.pollingStationId`
  - [ ] `Leader.candidateId`
- [ ] Considerar migración a PostgreSQL para producción

#### 9. Paginación y Búsqueda del Lado del Servidor
- [ ] Implementar paginación en lista de votantes (dashboard candidato)
- [ ] Mover búsquedas de cliente a servidor
- [ ] Crear endpoint `/api/search/voters` con filtros
- [ ] Usar TanStack Table (ya instalado) para tablas con paginación

#### 10. Caché y Optimización
- [ ] Implementar React Query para caché de datos
- [ ] Caché de datos geográficos (departamentos, municipios)
- [ ] Optimizar Server-Sent Events para branding

---

### 🎨 PRIORIDAD MEDIA - Mejoras de UX/UI

#### 11. Flujo de Registro de Votantes por Líderes
- [ ] Mover formulario de registro de votantes al dashboard del líder
- [ ] Eliminar opción de auto-registro de votantes en página principal
- [ ] Agregar validación de duplicados antes de registrar
- [ ] Feedback visual mejorado durante operaciones

#### 12. Gestión de Votantes
- [ ] Implementar edición de votantes (ya existe en líder)
- [ ] Implementar eliminación de votantes (ya existe en líder)
- [ ] Agregar confirmación antes de eliminar
- [ ] Historial de cambios (opcional)

#### 13. Dashboard Mejorado
- [ ] Agregar gráficas de crecimiento temporal
- [ ] Mapa interactivo con georreferenciación
- [ ] Estadísticas en tiempo real
- [ ] Notificaciones de nuevos registros

---

### 🧹 PRIORIDAD BAJA - Limpieza y Mantenimiento

#### 14. Limpieza del Proyecto
- [ ] Eliminar carpeta `skills/` (14 subcarpetas no relacionadas)
- [ ] Eliminar carpeta `mini-services/` (vacía)
- [ ] Eliminar archivos temporales (`~$esumen.docx`)
- [ ] Limpiar dependencias no utilizadas
- [ ] Revisar y limpiar archivos en carpeta `Genio/`

#### 15. Configuración de Desarrollo
- [ ] Reactivar `reactStrictMode: true`
- [ ] Eliminar `ignoreBuildErrors: true`
- [ ] Eliminar `ignoreDuringBuilds: true`
- [ ] Configurar ESLint correctamente
- [ ] Agregar pre-commit hooks

#### 16. Documentación
- [ ] Documentar estructura de la base de datos
- [ ] Documentar endpoints API
- [ ] Crear guía de despliegue
- [ ] Documentar flujo de autenticación
- [ ] README con instrucciones de instalación

---

### 🌐 PRIORIDAD BAJA - Preparación para Producción

#### 17. Script de Importación de Datos
- [ ] Crear script para importar CSV de puestos de votación
- [ ] Validar datos del archivo `Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20260119 (1).csv`
- [ ] Automatizar carga inicial de datos geográficos

#### 18. Preparación para Hosting
- [ ] Decidir plataforma de despliegue (Vercel/Railway/VPS)
- [ ] Si Vercel: Migrar de SQLite a PostgreSQL
- [ ] Configurar variables de entorno
- [ ] Configurar SSL/HTTPS
- [ ] Configurar dominio personalizado

#### 19. Testing
- [ ] Tests unitarios para funciones críticas
- [ ] Tests de integración para API
- [ ] Tests de permisos y seguridad
- [ ] Tests de performance

---

## 📝 Notas Técnicas

### Stack Actual
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: SQLite (desarrollo), PostgreSQL (recomendado para producción)
- **Autenticación**: localStorage (temporal) → NextAuth.js (pendiente)
- **Estado**: Zustand, TanStack Query (instalado pero no usado)

### Recomendaciones de Arquitectura
1. Implementar middleware de autenticación antes de agregar más funcionalidades
2. Migrar a PostgreSQL antes de desplegar a producción
3. Usar React Query para todas las llamadas API
4. Implementar sistema de roles más robusto (enum en base de datos)

---

## 🎯 Próximos Pasos Inmediatos

1. **Implementar autenticación real** (NextAuth.js)
2. **Reestructurar permisos de visualización** según roles
3. **Implementar generación de reportes PDF**
4. **Limpiar proyecto** (eliminar carpetas innecesarias)
5. **Agregar paginación** en listas grandes

---

**Última actualización**: 23 de enero de 2026
**Versión**: 0.1.0

