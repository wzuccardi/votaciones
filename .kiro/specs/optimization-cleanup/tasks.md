# Implementation Plan: Optimización y Limpieza

## Overview

Implementación completa de optimizaciones de performance, limpieza de base de datos (reducción de 3.16MB a <500KB), eliminación de 12,916 puestos de votación innecesarios, carga bajo demanda de datos geográficos, índices de base de datos, paginación, caché con React Query, limpieza de archivos, y preparación para producción.

## Tasks

- [x] 1. Analizar y diagnosticar base de datos
  - [x] 1.1 Crear script `/scripts/analyze-db.ts`
    - Contar registros en todas las tablas
    - Identificar tablas con más registros
    - Identificar campos con datos grandes
    - Generar reporte de uso de espacio
    - Documentar hallazgos
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

  - [x] 1.2 Ejecutar análisis y revisar resultados
    - Ejecutar script con `npx tsx scripts/analyze-db.ts`
    - Revisar reporte generado
    - Identificar datos innecesarios
    - _Requirements: 1.6_
    - **RESULTADO**: 14,145 registros, 3.16 MB (99.9% datos geográficos innecesarios)

- [x] 2. Crear script de limpieza de base de datos - Solo Bolívar
  - [x] 2.1 Crear `/scripts/cleanup-database-bolivar.ts`
    - Definir constante BOLIVAR_CODE = '13'
    - Implementar función createBackup
    - Implementar función getStats
    - Obtener departamento de Bolívar por código
    - Eliminar puestos de otros departamentos
    - Eliminar municipios de otros departamentos
    - Eliminar otros 66 departamentos
    - Ejecutar VACUUM para reducir tamaño
    - Generar reporte de limpieza
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
    - **COMPLETADO**: Script creado y ejecutado exitosamente

  - [x] 2.2 Verificar preservación de datos de Bolívar
    - Ejecutar limpieza
    - Verificar que Bolívar permanece
    - Verificar que otros departamentos fueron eliminados
    - **Property 1: Database Cleanup Preserves Bolívar Data**
    - **Validates: Requirements 2.1, 2.3, 2.4**
    - **VERIFICADO**: Bolívar preservado, 66 departamentos eliminados

  - [x] 2.3 Verificar solo datos de Bolívar
    - Después de limpieza, consultar todos los departamentos
    - Verificar que solo existe Bolívar
    - **Property 2: Only Bolívar Data Remains**
    - **Validates: Requirements 2.2, 2.5, 2.6**
    - **VERIFICADO**: Solo 1 departamento (Bolívar) en la base de datos

- [x] 3. Ejecutar limpieza de base de datos
  - Crear backup de base de datos actual
  - Ejecutar script de limpieza
  - Verificar reducción de tamaño a <500KB
  - Verificar que aplicación funciona correctamente
  - _Requirements: 2.9_
  - **COMPLETADO**: Reducción de 3.16 MB → 92 KB (97% reducción)

- [x] 3.1 Importar datos de Bolívar desde CSV
  - Crear script `/scripts/import-bolivar-data.ts`
  - Leer CSV y filtrar solo registros de Bolívar
  - Importar 4 municipios de Bolívar
  - Importar 201 puestos de votación de Bolívar
  - **COMPLETADO**: 211 registros totales, 140 KB tamaño final

- [x] 4. Eliminar dropdown de departamentos de la UI
  - [x] 4.1 Actualizar formulario de registro de votantes
    - Eliminar selector de departamento
    - Mostrar solo selector de municipios
    - Hardcodear departmentId de Bolívar
    - _Requirements: 3.1, 3.2, 3.3_
    - **COMPLETADO**: `src/app/page.tsx` actualizado

  - [x] 4.2 Actualizar dashboard de líder
    - Eliminar filtro de departamento
    - Actualizar formulario de nuevo votante
    - _Requirements: 3.4_
    - **COMPLETADO**: `src/app/dashboard/leader/page.tsx` actualizado

  - [x] 4.3 Actualizar interfaz de búsqueda
    - Eliminar selector de departamento
    - _Requirements: 3.5_
    - **COMPLETADO**: Selectores eliminados de ambos archivos

  - [x] 4.4 Hardcodear departmentId en queries
    - Actualizar queries de votantes
    - Actualizar queries de municipios
    - Actualizar queries de puestos
    - _Requirements: 3.6_
    - **COMPLETADO**: API de municipios actualizada

  - [x] 4.5 Verificar ausencia de selector de departamento
    - Verificar que UI no tiene selector de departamento
    - **Property 9: No Department Selector Needed**
    - **Validates: Requirements 3.1, 3.2**
    - **VERIFICADO**: Selectores eliminados, solo municipios de Bolívar

- [ ] 5. Implementar APIs de datos geográficos - Solo Bolívar
  - [ ] 5.1 Crear endpoint `/src/app/api/geo/municipalities/route.ts`
    - Definir constante BOLIVAR_CODE = '13'
    - Obtener departamento de Bolívar
    - Retornar municipios de Bolívar ordenados
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 5.2 Crear endpoint `/src/app/api/geo/polling-stations/[municipalityId]/route.ts`
    - Obtener puestos por municipalityId
    - Retornar lista ordenada
    - _Requirements: 4.4, 4.5_

- [ ] 6. Eliminar tabla DocumentIndex innecesaria
  - [ ] 5.1 Verificar que DocumentIndex no tiene registros
    - Ejecutar query para contar registros
    - Confirmar que está vacía
    - _Requirements: 5.1_

  - [ ] 5.2 Actualizar schema de Prisma
    - Eliminar modelo DocumentIndex
    - Ejecutar migración
    - _Requirements: 5.2, 5.3_

  - [ ] 5.3 Verificar que aplicación funciona
    - Buscar referencias a DocumentIndex en código
    - Eliminar código que lo use
    - Probar aplicación
    - _Requirements: 5.4, 5.5_

- [ ] 6. Agregar índices a base de datos
  - [ ] 6.1 Actualizar schema de Prisma con índices
    - Agregar @@index([document]) en Voter
    - Agregar @@index([municipalityId]) en Voter
    - Agregar @@index([pollingStationId]) en Voter
    - Agregar @@index([leaderId]) en Voter
    - Agregar @@index([name]) en Voter
    - Agregar @@index([candidateId]) en Leader
    - Agregar @@index([document]) en Leader
    - Agregar @@index([municipalityId]) en PollingStation
    - Agregar @@index([code]) en PollingStation
    - Agregar @@index([municipalityId, code]) en PollingStation
    - Agregar @@index([departmentId]) en Municipality
    - Agregar @@index([code]) en Municipality
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 6.2 Ejecutar migración de Prisma
    - Ejecutar `npx prisma migrate dev --name add-indexes`
    - Verificar que índices se crearon
    - _Requirements: 4.7_

  - [ ] 6.3 Escribir test de performance de índices
    - Medir tiempo de query sin índices
    - Medir tiempo de query con índices
    - Verificar mejora significativa
    - **Property 6: Index Performance Improvement**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 7. Configurar React Query
  - [ ] 7.1 Instalar dependencias
    - Instalar @tanstack/react-query
    - _Requirements: 8.1_

  - [ ] 7.2 Crear configuración `/src/lib/react-query.ts`
    - Crear QueryClient con opciones
    - Definir queryKeys
    - Configurar staleTime por tipo de dato
    - _Requirements: 8.2, 8.5, 8.6_

  - [ ] 7.3 Actualizar Providers
    - Importar QueryClientProvider
    - Envolver app con QueryClientProvider
    - _Requirements: 8.3_

- [ ] 8. Crear hooks de datos geográficos - Solo Bolívar
  - [ ] 8.1 Crear `/src/hooks/use-geographic-data.ts`
    - Implementar useMunicipalities hook (sin parámetro de departamento)
    - Implementar usePollingStations hook
    - Configurar caché apropiado para cada uno
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 8.2 Escribir test de eficiencia de caché
    - Realizar queries repetidas
    - Verificar que no hay requests duplicados
    - **Property 10: React Query Cache Efficiency**
    - **Validates: Requirements 8.5, 8.6, 9.4**

- [ ] 9. Implementar paginación de votantes
  - [ ] 9.1 Crear endpoint `/src/app/api/dashboard/candidate/voters/paginated/route.ts`
    - Recibir parámetros de paginación
    - Implementar filtros (municipio, puesto, líder, búsqueda)
    - Implementar ordenamiento
    - Retornar máximo 50 por página
    - Retornar metadata de paginación
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 9.2 Actualizar UI para usar paginación
    - Actualizar dashboard de candidato
    - Usar TanStack Table para paginación
    - Agregar controles de página
    - _Requirements: 6.6_

  - [ ] 9.3 Escribir test de correctitud de paginación
    - Generar datasets aleatorios
    - Paginar datos
    - Verificar que no hay duplicados ni faltantes
    - **Property 3: Pagination Correctness**
    - **Validates: Requirements 6.2, 6.3**

- [ ] 10. Implementar búsqueda del lado del servidor
  - [ ] 10.1 Crear endpoint `/src/app/api/search/voters/route.ts`
    - Recibir query de búsqueda
    - Buscar por nombre con LIKE
    - Buscar por cédula exacta
    - Retornar resultados paginados
    - Limitar a 100 resultados
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 10.2 Actualizar componentes para usar búsqueda del servidor
    - Actualizar barra de búsqueda
    - Usar debounce para evitar requests excesivos
    - _Requirements: 7.6_

  - [ ] 10.3 Escribir test de precisión de búsqueda
    - Generar búsquedas aleatorias
    - Verificar que todos los resultados coinciden
    - **Property 4: Search Accuracy**
    - **Validates: Requirements 7.2, 7.3**

- [ ] 11. Checkpoint - Verificar optimizaciones de base de datos
  - Verificar que base de datos pesa <500KB
  - Verificar que solo existe departamento de Bolívar
  - Verificar que queries son rápidas con índices
  - Verificar que paginación funciona
  - Verificar que búsqueda funciona
  - Verificar que UI no tiene selector de departamento

- [ ] 12. Limpiar archivos innecesarios del proyecto
  - [ ] 12.1 Eliminar carpetas innecesarias
    - Eliminar carpeta `skills/` completa
    - Eliminar carpeta `mini-services/` completa
    - Eliminar carpeta `examples/` completa
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 12.2 Limpiar archivos temporales
    - Eliminar archivos `~$*.docx`
    - Revisar carpeta `Genio/` y limpiar
    - _Requirements: 10.4, 10.5_

  - [ ] 12.3 Eliminar archivos de base de datos duplicados
    - Mantener solo `prisma/dev.db`
    - Eliminar `prisma/db/custom.db`
    - Eliminar `db/custom.db`
    - _Requirements: 10.7_

  - [ ] 12.4 Actualizar .gitignore
    - Agregar patrones para archivos temporales
    - Agregar `~$*`
    - Agregar `*.db-journal`
    - Agregar `prisma/backups/`
    - _Requirements: 10.6_

  - [ ] 12.5 Escribir test de seguridad de limpieza
    - Ejecutar limpieza
    - Verificar que solo se eliminan archivos correctos
    - **Property 7: File Cleanup Safety**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 13. Configurar ESLint correctamente
  - [ ] 13.1 Actualizar next.config.ts
    - Reactivar `reactStrictMode: true`
    - Eliminar `ignoreBuildErrors: true`
    - _Requirements: 11.1, 11.2_

  - [ ] 13.2 Actualizar eslint.config.mjs
    - Eliminar `ignoreDuringBuilds: true`
    - Configurar reglas apropiadas
    - _Requirements: 11.3, 11.5_

  - [ ] 13.3 Corregir errores de ESLint
    - Ejecutar `npm run lint`
    - Corregir todos los errores
    - _Requirements: 11.4_

  - [ ] 13.4 Verificar script de lint
    - Verificar que `npm run lint` funciona
    - _Requirements: 11.6_

- [ ] 14. Limpiar dependencias no utilizadas
  - [ ] 14.1 Identificar dependencias no utilizadas
    - Usar herramienta como depcheck
    - Listar dependencias no usadas
    - _Requirements: 12.1_

  - [ ] 14.2 Eliminar dependencias
    - Eliminar de package.json
    - Ejecutar `npm prune`
    - Actualizar package-lock.json
    - _Requirements: 12.2, 12.3, 12.5_

  - [ ] 14.3 Verificar que aplicación funciona
    - Ejecutar aplicación
    - Probar funcionalidades principales
    - _Requirements: 12.4_

  - [ ] 14.4 Documentar dependencias eliminadas
    - Crear lista de dependencias eliminadas
    - Documentar razón de eliminación
    - _Requirements: 12.6_

- [ ] 15. Optimizar Server-Sent Events de branding
  - [ ] 15.1 Actualizar endpoint de SSE
    - Implementar heartbeat cada 30 segundos
    - Cerrar conexión después de 5 minutos
    - Enviar datos solo cuando hay cambios
    - Limitar conexiones simultáneas
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 15.2 Actualizar cliente SSE
    - Agregar manejo de reconexión automática
    - _Requirements: 13.5_

  - [ ] 15.3 Agregar métricas de SSE
    - Registrar número de conexiones activas
    - Registrar duración de conexiones
    - _Requirements: 13.6_

- [ ] 16. Preparar migración a PostgreSQL
  - [ ] 16.1 Crear script de migración
    - Crear `/scripts/migrate-to-postgres.ts`
    - Leer datos de SQLite
    - Escribir a PostgreSQL
    - _Requirements: 14.1_

  - [ ] 16.2 Actualizar schema para PostgreSQL
    - Verificar compatibilidad
    - Ajustar tipos si es necesario
    - _Requirements: 14.2_

  - [ ] 16.3 Configurar variables de entorno
    - Agregar DATABASE_URL para producción
    - Documentar configuración
    - _Requirements: 14.3_

  - [ ] 16.4 Documentar proceso de migración
    - Crear guía paso a paso
    - Incluir comandos necesarios
    - _Requirements: 14.4_

  - [ ] 16.5 Crear backup antes de migración
    - Implementar función de backup
    - _Requirements: 14.5_

  - [ ] 16.6 Probar migración en desarrollo
    - Ejecutar migración en entorno local
    - Verificar que datos se transfieren correctamente
    - _Requirements: 14.6_

- [ ] 17. Configurar variables de entorno
  - [ ] 17.1 Crear .env.example
    - Listar todas las variables necesarias
    - Agregar comentarios explicativos
    - _Requirements: 15.1, 15.2_

  - [ ] 17.2 Separar variables por entorno
    - Identificar variables de desarrollo
    - Identificar variables de producción
    - _Requirements: 15.3_

  - [ ] 17.3 Implementar validación de variables
    - Crear función de validación
    - Ejecutar al iniciar aplicación
    - _Requirements: 15.4_

  - [ ] 17.4 Usar variables en configuración
    - DATABASE_URL para base de datos
    - NEXTAUTH_SECRET y NEXTAUTH_URL
    - _Requirements: 15.5, 15.6_

- [ ] 18. Crear documentación del proyecto
  - [ ] 18.1 Actualizar README.md
    - Agregar instrucciones de instalación
    - Agregar comandos de desarrollo
    - Agregar información del proyecto
    - _Requirements: 16.1_

  - [ ] 18.2 Documentar estructura de base de datos
    - Crear diagrama ER
    - Documentar relaciones
    - _Requirements: 16.2_

  - [ ] 18.3 Documentar endpoints de API
    - Listar todos los endpoints
    - Agregar ejemplos de uso
    - _Requirements: 16.3_

  - [ ] 18.4 Documentar flujo de autenticación
    - Crear diagrama de flujo
    - Explicar proceso paso a paso
    - _Requirements: 16.4_

  - [ ] 18.5 Crear guía de despliegue
    - Documentar proceso de despliegue
    - Incluir configuración de hosting
    - _Requirements: 16.5_

  - [ ] 18.6 Documentar arquitectura del sistema
    - Crear diagrama de arquitectura
    - Explicar componentes principales
    - _Requirements: 16.6_

- [ ] 19. Implementar script de importación de datos
  - [ ] 19.1 Crear `/scripts/import-polling-stations.ts`
    - Leer archivo CSV
    - Validar datos
    - Crear departamentos si no existen
    - Crear municipios si no existen
    - Crear puestos con georreferenciación
    - Mostrar progreso
    - Generar reporte
    - Importar solo bajo demanda
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9_

- [ ] 20. Configurar pre-commit hooks
  - [ ] 20.1 Instalar husky
    - Ejecutar `npx husky-init`
    - _Requirements: 18.1_

  - [ ] 20.2 Configurar hooks
    - Configurar pre-commit para ESLint
    - Configurar pre-commit para Prettier
    - Configurar pre-commit para type checking
    - _Requirements: 18.2, 18.3, 18.4_

  - [ ] 20.3 Documentar uso de hooks
    - Explicar cómo funcionan
    - Explicar cómo hacer bypass con --no-verify
    - _Requirements: 18.5, 18.6_

- [ ] 21. Optimizar imports y code splitting
  - [ ] 21.1 Implementar dynamic imports
    - Usar dynamic imports para dashboards
    - Usar dynamic imports para componentes grandes
    - _Requirements: 19.1, 19.2_

  - [ ] 21.2 Configurar code splitting
    - Actualizar next.config.ts
    - _Requirements: 19.3_

  - [ ] 21.3 Analizar bundle size
    - Usar herramienta de análisis
    - Identificar bundles grandes
    - _Requirements: 19.4_

  - [ ] 21.4 Optimizar imports de librerías
    - Optimizar imports de shadcn/ui
    - Usar tree shaking
    - _Requirements: 19.5_

  - [ ] 21.5 Implementar lazy loading
    - Lazy load componentes no críticos
    - _Requirements: 19.6_

- [ ] 22. Implementar manejo de errores global
  - [ ] 22.1 Crear ErrorBoundary
    - Crear componente ErrorBoundary
    - Envolver app con ErrorBoundary
    - _Requirements: 20.1_

  - [ ] 22.2 Crear página de error personalizada
    - Crear `app/error.tsx`
    - Diseñar UI de error amigable
    - _Requirements: 20.2_

  - [ ] 22.3 Implementar logging de errores
    - Configurar logging en servidor
    - Registrar errores con contexto
    - Registrar stack trace en desarrollo
    - _Requirements: 20.3, 20.4, 20.5_

  - [ ] 22.4 Configurar monitoreo de errores (opcional)
    - Integrar con servicio de monitoreo
    - _Requirements: 20.6_

- [ ] 23. Optimizar imágenes y assets
  - [ ] 23.1 Usar Next.js Image component
    - Reemplazar <img> con <Image>
    - _Requirements: 21.1_

  - [ ] 23.2 Optimizar logos de candidatos
    - Implementar compresión antes de guardar
    - _Requirements: 21.2_

  - [ ] 23.3 Implementar lazy loading de imágenes
    - Configurar loading="lazy"
    - _Requirements: 21.3_

  - [ ] 23.4 Usar formatos modernos
    - Convertir a WebP cuando sea posible
    - _Requirements: 21.4_

  - [ ] 23.5 Comprimir imágenes grandes
    - Implementar compresión automática
    - _Requirements: 21.5_

  - [ ] 23.6 Configurar caché de imágenes
    - Configurar headers de caché
    - _Requirements: 21.6_

- [ ] 24. Preparar para despliegue en producción
  - [ ] 24.1 Decidir plataforma de hosting
    - Evaluar opciones (Vercel/Railway/VPS)
    - Seleccionar plataforma
    - _Requirements: 22.1_

  - [ ] 24.2 Configurar base de datos PostgreSQL
    - Crear instancia de PostgreSQL
    - Configurar conexión
    - _Requirements: 22.2_

  - [ ] 24.3 Configurar variables de entorno
    - Agregar variables en plataforma
    - Verificar configuración
    - _Requirements: 22.3_

  - [ ] 24.4 Configurar SSL/HTTPS
    - Configurar certificado SSL
    - _Requirements: 22.4_

  - [ ] 24.5 Configurar dominio personalizado
    - Configurar DNS
    - Conectar dominio
    - _Requirements: 22.5_

  - [ ] 24.6 Crear proceso de CI/CD
    - Configurar GitHub Actions o similar
    - Automatizar despliegues
    - _Requirements: 22.6_

- [ ] 25. Implementar monitoreo y logging
  - [ ] 25.1 Configurar logging estructurado
    - Instalar Winston o Pino
    - Configurar niveles de log
    - _Requirements: 23.1_

  - [ ] 25.2 Registrar operaciones críticas
    - Agregar logs en operaciones importantes
    - _Requirements: 23.2_

  - [ ] 25.3 Registrar errores con contexto
    - Incluir contexto completo en logs de error
    - _Requirements: 23.3_

  - [ ] 25.4 Implementar health check endpoint
    - Crear `/api/health`
    - Verificar estado de DB y servicios
    - _Requirements: 23.4_

  - [ ] 25.5 Monitorear performance de queries
    - Identificar queries lentas
    - Registrar tiempos de ejecución
    - _Requirements: 23.5_

  - [ ] 25.6 Configurar alertas (opcional)
    - Configurar alertas para errores críticos
    - _Requirements: 23.6_

- [ ] 26. Crear tests de integración
  - [ ] 26.1 Configurar framework de testing
    - Instalar Jest o Vitest
    - Configurar entorno de testing
    - _Requirements: 24.1_

  - [ ] 26.2 Crear tests de flujo de registro
    - Test de registro de candidato
    - Test de registro de líder
    - Test de registro de votante
    - _Requirements: 24.2_

  - [ ] 26.3 Crear tests de autenticación
    - Test de login
    - Test de logout
    - Test de sesión
    - _Requirements: 24.3_

  - [ ] 26.4 Crear tests de CRUD de votantes
    - Test de crear votante
    - Test de actualizar votante
    - Test de eliminar votante
    - _Requirements: 24.4_

  - [ ] 26.5 Crear tests de generación de reportes
    - Test de reporte de líder
    - Test de reporte de candidato
    - _Requirements: 24.5_

  - [ ] 26.6 Configurar tests en CI/CD
    - Ejecutar tests automáticamente
    - _Requirements: 24.6_

- [ ] 27. Checkpoint final - Verificar todo funciona
  - Verificar que base de datos pesa <500KB
  - Verificar que aplicación carga rápido
  - Verificar que paginación funciona
  - Verificar que búsqueda funciona
  - Verificar que caché funciona
  - Verificar que reportes se generan
  - Verificar que autenticación funciona
  - Ejecutar todos los tests
  - Verificar que no hay errores de ESLint
  - Verificar que build de producción funciona

## Notes

- **Orden crítico**: Ejecutar limpieza de DB antes de actualizar UI
- **Backups**: Siempre crear backup antes de modificar base de datos
- **Testing incremental**: Probar después de cada checkpoint
- **Performance**: Monitorear mejoras de performance en cada paso
- **Documentación**: Documentar cambios importantes
- **Producción**: No desplegar hasta completar todos los pasos
- **Alcance geográfico**: La aplicación es SOLO para el departamento de Bolívar
- **Sin dropdown de departamentos**: Simplificar UI eliminando selector de departamento

---

**Total de tareas**: 27 tareas principales, 95+ sub-tareas
**Tiempo estimado**: 18-25 horas de implementación
**Prioridad**: CRÍTICA - Base para performance y producción
**Reducción esperada**: Base de datos de 3.16MB a <500KB (reducción del 84%)
**Alcance**: Solo departamento de Bolívar, Colombia (código DANE '13')
