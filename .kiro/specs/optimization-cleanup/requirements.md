# Requirements Document - Optimización y Limpieza

## Introduction

Optimización del rendimiento de la aplicación, limpieza del código y preparación para producción. Este spec incluye optimización de base de datos, implementación de paginación, caché, limpieza de archivos innecesarios, configuración de desarrollo, y preparación para despliegue en producción.

## Glossary

- **System**: Plataforma de Gestión Electoral Colombia 2026
- **Index**: Índice de base de datos para optimizar queries
- **Pagination**: Paginación de resultados para mejorar performance
- **Cache**: Almacenamiento temporal de datos para reducir queries
- **React_Query**: Librería TanStack Query para manejo de estado y caché
- **Migration**: Migración de base de datos de SQLite a PostgreSQL
- **Production**: Entorno de producción en hosting
- **ESLint**: Herramienta de linting para código JavaScript/TypeScript

## Requirements

### Requirement 1: Analizar y Diagnosticar Tamaño de Base de Datos

**User Story:** Como desarrollador, quiero analizar por qué la base de datos pesa más de 3MB con pocos usuarios, para identificar y resolver el problema.

#### Acceptance Criteria

1. THE System SHALL crear script de análisis de base de datos
2. THE System SHALL contar registros en todas las tablas
3. THE System SHALL identificar tablas con más registros
4. THE System SHALL identificar campos con datos grandes (base64, texto largo)
5. THE System SHALL generar reporte de uso de espacio por tabla
6. THE System SHALL identificar datos innecesarios o duplicados
7. THE System SHALL documentar hallazgos del análisis

### Requirement 2: Limpiar Base de Datos - Solo Departamento de Bolívar

**User Story:** Como desarrollador, quiero mantener solo datos del departamento de Bolívar, para reducir drásticamente el tamaño de la base de datos.

#### Acceptance Criteria

1. THE System SHALL mantener SOLO el departamento de Bolívar en la base de datos
2. THE System SHALL eliminar los otros 66 departamentos
3. THE System SHALL mantener SOLO municipios del departamento de Bolívar
4. THE System SHALL mantener SOLO puestos de votación del departamento de Bolívar
5. THE System SHALL eliminar todos los municipios de otros departamentos
6. THE System SHALL eliminar todos los puestos de votación de otros departamentos
7. THE System SHALL crear script de limpieza automática
8. THE System SHALL crear backup antes de limpiar
9. THE System SHALL reducir base de datos a menos de 500KB

### Requirement 3: Eliminar Dropdown de Departamentos

**User Story:** Como usuario, quiero ver solo municipios de Bolívar, para simplificar la interfaz ya que la aplicación es solo para este departamento.

#### Acceptance Criteria

1. THE System SHALL eliminar selector de departamento de todos los formularios
2. THE System SHALL mostrar solo selector de municipios (de Bolívar)
3. THE System SHALL actualizar formulario de registro de votantes
4. THE System SHALL actualizar filtros de reportes
5. THE System SHALL actualizar interfaz de búsqueda
6. THE System SHALL hardcodear departmentId de Bolívar en queries

### Requirement 4: Agregar Índices a Base de Datos

**User Story:** Como desarrollador, quiero agregar índices a la base de datos, para que las consultas sean más rápidas.

#### Acceptance Criteria

1. THE System SHALL agregar índice en campo `Voter.document`
2. THE System SHALL agregar índice en campo `Voter.municipalityId`
3. THE System SHALL agregar índice en campo `Voter.pollingStationId`
4. THE System SHALL agregar índice en campo `Voter.leaderId`
5. THE System SHALL agregar índice en campo `Leader.candidateId`
6. THE System SHALL agregar índice compuesto en `PollingStation(municipalityId, code)`
7. THE System SHALL ejecutar migración de Prisma para crear índices

### Requirement 5: Eliminar Tabla DocumentIndex Innecesaria

**User Story:** Como desarrollador, quiero eliminar la tabla DocumentIndex que no se está usando, para simplificar el schema y reducir complejidad.

#### Acceptance Criteria

1. THE System SHALL verificar que DocumentIndex no tiene registros
2. THE System SHALL eliminar modelo DocumentIndex del schema de Prisma
3. THE System SHALL ejecutar migración para eliminar tabla
4. THE System SHALL verificar que la aplicación funciona sin DocumentIndex
5. THE System SHALL eliminar cualquier código que referencie DocumentIndex

### Requirement 6: Implementar Paginación en Lista de Votantes

**User Story:** Como candidato, quiero que la lista de votantes use paginación, para que la página cargue más rápido con muchos votantes.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/dashboard/candidate/voters/paginated`
2. WHEN se solicita página de votantes, THE System SHALL retornar máximo 50 votantes por página
3. THE System SHALL retornar total de páginas y total de registros
4. THE System SHALL permitir ordenar por nombre, fecha de registro, municipio
5. THE System SHALL permitir filtrar por municipio, puesto, líder
6. THE System SHALL actualizar UI para usar paginación con TanStack Table

### Requirement 7: Implementar Búsqueda del Lado del Servidor

**User Story:** Como usuario, quiero que las búsquedas se procesen en el servidor, para que sean más rápidas y eficientes.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/search/voters`
2. WHEN se busca por nombre, THE System SHALL usar query LIKE en base de datos
3. WHEN se busca por cédula, THE System SHALL usar query exacta
4. THE System SHALL retornar resultados paginados
5. THE System SHALL limitar búsquedas a máximo 100 resultados
6. THE System SHALL actualizar componentes para usar búsqueda del servidor

### Requirement 8: Implementar React Query para Caché

**User Story:** Como desarrollador, quiero usar React Query para caché de datos, para reducir llamadas innecesarias a la API.

#### Acceptance Criteria

1. THE System SHALL instalar @tanstack/react-query
2. THE System SHALL crear QueryClient con configuración de caché
3. THE System SHALL envolver app con QueryClientProvider
4. THE System SHALL migrar llamadas API a useQuery hooks
5. THE System SHALL configurar staleTime de 5 minutos para datos geográficos
6. THE System SHALL configurar staleTime de 1 minuto para datos de votantes

### Requirement 9: Cachear Datos Geográficos de Bolívar

**User Story:** Como usuario, quiero que los datos geográficos de Bolívar se carguen rápido, para no esperar cada vez que selecciono un filtro.

#### Acceptance Criteria

1. THE System SHALL cachear lista de municipios de Bolívar en cliente
2. THE System SHALL cachear lista de puestos de votación por municipio
3. THE System SHALL usar React Query para gestionar caché
4. THE System SHALL invalidar caché solo cuando se actualicen datos geográficos
5. THE System SHALL pre-cargar municipios de Bolívar al iniciar sesión

### Requirement 10: Limpiar Proyecto de Archivos Innecesarios

**User Story:** Como desarrollador, quiero eliminar archivos innecesarios del proyecto, para mantener el repositorio limpio y organizado.

#### Acceptance Criteria

1. THE System SHALL eliminar carpeta `skills/` completa
2. THE System SHALL eliminar carpeta `mini-services/` completa
3. THE System SHALL eliminar carpeta `examples/` completa
4. THE System SHALL eliminar archivos temporales de Office (`~$*.docx`)
5. THE System SHALL revisar y limpiar carpeta `Genio/` de archivos no necesarios
6. THE System SHALL actualizar `.gitignore` para prevenir archivos temporales
7. THE System SHALL eliminar archivos de base de datos duplicados (mantener solo uno)

### Requirement 11: Configurar ESLint Correctamente

**User Story:** Como desarrollador, quiero que ESLint funcione correctamente, para mantener calidad de código.

#### Acceptance Criteria

1. THE System SHALL reactivar `reactStrictMode: true` en next.config.ts
2. THE System SHALL eliminar `ignoreBuildErrors: true` de next.config.ts
3. THE System SHALL eliminar `ignoreDuringBuilds: true` de eslint.config.mjs
4. THE System SHALL corregir todos los errores de ESLint existentes
5. THE System SHALL configurar reglas de ESLint apropiadas
6. THE System SHALL agregar script `npm run lint` funcional

### Requirement 12: Limpiar Dependencias No Utilizadas

**User Story:** Como desarrollador, quiero eliminar dependencias no utilizadas, para reducir tamaño del bundle y mejorar performance.

#### Acceptance Criteria

1. THE System SHALL identificar dependencias no utilizadas con herramienta
2. THE System SHALL eliminar dependencias no utilizadas de package.json
3. THE System SHALL ejecutar `npm prune` para limpiar node_modules
4. THE System SHALL verificar que la aplicación funciona después de limpieza
5. THE System SHALL actualizar package-lock.json
6. THE System SHALL documentar dependencias eliminadas

### Requirement 13: Optimizar Server-Sent Events de Branding

**User Story:** Como desarrollador, quiero optimizar el sistema de SSE para branding, para reducir uso de recursos del servidor.

#### Acceptance Criteria

1. THE System SHALL implementar heartbeat cada 30 segundos en lugar de enviar datos constantemente
2. THE System SHALL cerrar conexión SSE después de 5 minutos de inactividad
3. THE System SHALL enviar datos solo cuando hay cambios en branding
4. THE System SHALL limitar conexiones SSE simultáneas por usuario
5. THE System SHALL agregar manejo de reconexión automática en cliente
6. THE System SHALL registrar métricas de conexiones SSE

### Requirement 14: Preparar para Migración a PostgreSQL

**User Story:** Como desarrollador, quiero preparar la migración a PostgreSQL, para poder desplegar en producción.

#### Acceptance Criteria

1. THE System SHALL crear script de migración de SQLite a PostgreSQL
2. THE System SHALL actualizar schema de Prisma para ser compatible con PostgreSQL
3. THE System SHALL crear variables de entorno para DATABASE_URL de producción
4. THE System SHALL documentar proceso de migración
5. THE System SHALL crear backup de datos antes de migración
6. THE System SHALL probar migración en entorno de desarrollo

### Requirement 15: Configurar Variables de Entorno

**User Story:** Como desarrollador, quiero tener variables de entorno bien configuradas, para facilitar despliegue en diferentes entornos.

#### Acceptance Criteria

1. THE System SHALL crear archivo `.env.example` con todas las variables necesarias
2. THE System SHALL documentar cada variable de entorno
3. THE System SHALL separar variables de desarrollo y producción
4. THE System SHALL validar variables de entorno al iniciar aplicación
5. THE System SHALL usar variables de entorno para configuración de base de datos
6. THE System SHALL usar variables de entorno para NEXTAUTH_SECRET y NEXTAUTH_URL

### Requirement 16: Crear Documentación del Proyecto

**User Story:** Como desarrollador, quiero documentación completa del proyecto, para facilitar mantenimiento y onboarding.

#### Acceptance Criteria

1. THE System SHALL actualizar README.md con instrucciones de instalación
2. THE System SHALL documentar estructura de la base de datos
3. THE System SHALL documentar endpoints de API con ejemplos
4. THE System SHALL documentar flujo de autenticación
5. THE System SHALL crear guía de despliegue
6. THE System SHALL documentar arquitectura del sistema

### Requirement 17: Implementar Script de Importación de Datos

**User Story:** Como administrador, quiero un script para importar datos de puestos de votación, para cargar datos iniciales fácilmente.

#### Acceptance Criteria

1. THE System SHALL crear script `/scripts/import-polling-stations.ts`
2. THE System SHALL leer archivo CSV de puestos de votación
3. THE System SHALL validar datos antes de importar
4. THE System SHALL crear departamentos si no existen
5. THE System SHALL crear municipios si no existen
6. THE System SHALL crear puestos de votación con georreferenciación
7. THE System SHALL mostrar progreso durante importación
8. THE System SHALL generar reporte de importación con errores
9. THE System SHALL importar solo bajo demanda, no todos los puestos

### Requirement 18: Configurar Pre-commit Hooks

**User Story:** Como desarrollador, quiero pre-commit hooks, para asegurar calidad de código antes de commits.

#### Acceptance Criteria

1. THE System SHALL instalar husky para git hooks
2. THE System SHALL configurar pre-commit hook para ejecutar ESLint
3. THE System SHALL configurar pre-commit hook para ejecutar Prettier
4. THE System SHALL configurar pre-commit hook para ejecutar type checking
5. THE System SHALL permitir bypass de hooks con --no-verify si es necesario
6. THE System SHALL documentar uso de pre-commit hooks

### Requirement 19: Optimizar Imports y Code Splitting

**User Story:** Como desarrollador, quiero optimizar imports y code splitting, para reducir tamaño del bundle inicial.

#### Acceptance Criteria

1. THE System SHALL usar dynamic imports para componentes grandes
2. THE System SHALL usar dynamic imports para dashboards
3. THE System SHALL configurar code splitting en next.config.ts
4. THE System SHALL analizar bundle size con herramienta
5. THE System SHALL optimizar imports de librerías grandes (ej. shadcn/ui)
6. THE System SHALL lazy load componentes no críticos

### Requirement 20: Implementar Manejo de Errores Global

**User Story:** Como usuario, quiero que los errores se manejen consistentemente, para tener mejor experiencia cuando algo falla.

#### Acceptance Criteria

1. THE System SHALL crear componente ErrorBoundary para React
2. THE System SHALL crear página de error personalizada en Next.js
3. THE System SHALL implementar logging de errores en servidor
4. THE System SHALL mostrar mensajes de error amigables al usuario
5. THE System SHALL registrar errores con stack trace en desarrollo
6. THE System SHALL enviar errores críticos a servicio de monitoreo (opcional)

### Requirement 21: Optimizar Imágenes y Assets

**User Story:** Como usuario, quiero que las imágenes carguen rápido, para tener mejor experiencia de navegación.

#### Acceptance Criteria

1. THE System SHALL usar Next.js Image component para todas las imágenes
2. THE System SHALL optimizar logos de candidatos antes de guardar
3. THE System SHALL implementar lazy loading de imágenes
4. THE System SHALL usar formatos modernos (WebP) cuando sea posible
5. THE System SHALL comprimir imágenes grandes automáticamente
6. THE System SHALL cachear imágenes en CDN (si aplica)

### Requirement 22: Preparar para Despliegue en Producción

**User Story:** Como administrador, quiero preparar la aplicación para producción, para poder desplegarla en un servidor.

#### Acceptance Criteria

1. THE System SHALL decidir plataforma de hosting (Vercel/Railway/VPS)
2. THE System SHALL configurar base de datos PostgreSQL en producción
3. THE System SHALL configurar variables de entorno en plataforma
4. THE System SHALL configurar SSL/HTTPS
5. THE System SHALL configurar dominio personalizado
6. THE System SHALL crear proceso de CI/CD para despliegues automáticos

### Requirement 23: Implementar Monitoreo y Logging

**User Story:** Como administrador, quiero monitoreo y logging, para detectar y resolver problemas en producción.

#### Acceptance Criteria

1. THE System SHALL implementar logging estructurado con Winston o Pino
2. THE System SHALL registrar todas las operaciones críticas
3. THE System SHALL registrar errores con contexto completo
4. THE System SHALL implementar health check endpoint `/api/health`
5. THE System SHALL monitorear performance de queries lentas
6. THE System SHALL configurar alertas para errores críticos (opcional)

### Requirement 24: Crear Tests de Integración

**User Story:** Como desarrollador, quiero tests de integración, para asegurar que el sistema funciona correctamente end-to-end.

#### Acceptance Criteria

1. THE System SHALL configurar framework de testing (Jest/Vitest)
2. THE System SHALL crear tests para flujo de registro
3. THE System SHALL crear tests para flujo de autenticación
4. THE System SHALL crear tests para operaciones CRUD de votantes
5. THE System SHALL crear tests para generación de reportes
6. THE System SHALL ejecutar tests en CI/CD pipeline

---

**Total de Requisitos:** 24
**Total de Criterios de Aceptación:** 143
**Reducción esperada de DB:** De 3.16MB a <500KB (84% de reducción)
**Alcance geográfico:** Solo departamento de Bolívar
