# Implementation Plan: Sistema de Reportes PDF

## Overview

Implementación completa del sistema de generación de reportes en PDF con jsPDF, incluyendo reportes para líderes y candidatos, filtros geográficos avanzados, exportación a múltiples formatos, branding personalizado, y optimización para reportes grandes.

## Tasks

- [ ] 1. Instalar dependencias y configurar entorno
  - Instalar jspdf y jspdf-autotable
  - Instalar xlsx para exportación a Excel
  - Configurar tipos de TypeScript
  - _Requirements: 1.1_

- [ ] 2. Crear utilidades de generación de PDFs
  - [ ] 2.1 Crear `/src/lib/pdf-utils.ts` con clase PDFGenerator
    - Implementar constructor con branding
    - Implementar método addHeader con logo y título
    - Implementar método addFooter con paginación
    - Implementar método addTable con autoTable
    - Implementar método addStatistics
    - Implementar método addContactInfo para mostrar teléfono y email
    - Implementar métodos save y getBlob
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 3. Crear servicio de reportes
  - [ ] 3.1 Crear `/src/lib/report-service.ts` con clase ReportService
    - Implementar generateLeaderReport
    - Implementar generateCandidateFullReport
    - Implementar generateCandidateLeadersReport
    - Implementar generateZoneReport
    - Implementar generatePollingStationReport
    - Implementar generateTableReport
    - Implementar generateComparativeReport
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

- [ ] 4. Crear servicio de exportación
  - [ ] 4.1 Crear `/src/lib/export-service.ts` con clase ExportService
    - Implementar exportToCSV
    - Implementar exportToExcel
    - _Requirements: 10.1, 10.2_

- [ ] 5. Implementar endpoint de reporte para líderes
  - [ ] 5.1 Crear `/src/app/api/reports/leader/voters/route.ts`
    - Validar autenticación con getAuthenticatedUser
    - Validar que user.role === 'leader'
    - Obtener votantes del líder desde DB
    - Incluir teléfono y correo electrónico del líder en el reporte
    - Ordenar votantes alfabéticamente
    - Obtener branding del candidato
    - Generar PDF con ReportService
    - Retornar blob con headers correctos
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 13.1, 13.2_

  - [ ] 5.2 Escribir test de propiedad para aislamiento de datos de líder
    - **Property 1: Leader Report Data Isolation**
    - **Validates: Requirements 2.2**

- [ ] 6. Implementar endpoint de reporte completo para candidatos
  - [ ] 6.1 Crear `/src/app/api/reports/candidate/full/route.ts`
    - Validar autenticación y rol de candidato
    - Obtener todos los líderes del candidato
    - Obtener todos los votantes de esos líderes
    - Calcular estadísticas generales
    - Calcular totales por municipio y departamento
    - Ordenar líderes por cantidad de votantes
    - Generar PDF con desglose por líder
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 13.1, 13.3_

  - [ ] 6.2 Escribir test de propiedad para completitud de reporte de candidato
    - **Property 2: Candidate Report Completeness**
    - **Validates: Requirements 3.2, 3.3**

  - [ ] 6.3 Escribir test de propiedad para ranking de líderes
    - **Property 7: Leader Ranking Accuracy**
    - **Validates: Requirements 3.7**

- [ ] 7. Implementar endpoint de reporte de solo líderes
  - [ ] 7.1 Crear `/src/app/api/reports/candidate/leaders/route.ts`
    - Validar autenticación y rol
    - Obtener líderes con count de votantes
    - Incluir teléfono y correo electrónico de cada líder
    - Calcular estadísticas de rendimiento
    - Obtener distribución geográfica
    - Ordenar por cantidad de votantes
    - Generar PDF con tabla de líderes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 8. Implementar endpoint de reporte por zona
  - [ ] 8.1 Crear `/src/app/api/reports/candidate/by-zone/route.ts`
    - Validar autenticación y rol
    - Recibir filtros de departamento y municipio en body
    - Filtrar líderes y votantes por zona
    - Agrupar datos por zona/comuna
    - Calcular totales por zona
    - Generar PDF con desglose por zona
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 8.2 Escribir test de propiedad para precisión de filtros geográficos
    - **Property 3: Geographic Filter Accuracy**
    - **Validates: Requirements 5.2**

  - [ ] 8.3 Escribir test de propiedad para agregación por zona
    - **Property 8: Zone Aggregation Correctness**
    - **Validates: Requirements 5.4, 5.5**

- [ ] 9. Implementar endpoint de reporte por puesto de votación
  - [ ] 9.1 Crear `/src/app/api/reports/candidate/by-polling-station/route.ts`
    - Validar autenticación y rol
    - Recibir pollingStationId en query params
    - Obtener información del puesto desde DB
    - Filtrar votantes por puesto
    - Agrupar por mesa dentro del puesto
    - Calcular totales de líderes y votantes
    - Generar PDF con distribución por mesas
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 10. Implementar endpoint de reporte por mesa
  - [ ] 10.1 Crear `/src/app/api/reports/candidate/by-table/route.ts`
    - Validar autenticación y rol
    - Recibir pollingStationId y tableNumber en query params
    - Obtener información del puesto y mesa
    - Filtrar votantes por mesa específica
    - Obtener líderes responsables
    - Incluir datos de contacto de líderes (teléfono y correo electrónico)
    - Generar PDF detallado
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 11. Implementar endpoint de reporte comparativo
  - [ ] 11.1 Crear `/src/app/api/reports/candidate/comparative/route.ts`
    - Validar autenticación y rol
    - Recibir array de locations en body
    - Obtener datos para cada ubicación
    - Calcular estadísticas comparativas
    - Identificar zonas con mayor/menor cobertura
    - Generar tabla comparativa
    - Generar gráficas de barras
    - Incluir recomendaciones
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 11.2 Escribir test de propiedad para precisión de datos comparativos
    - **Property 9: Comparative Data Accuracy**
    - **Validates: Requirements 8.3**

- [ ] 12. Checkpoint - Verificar generación básica de reportes
  - Probar generación de reporte de líder
  - Probar generación de reporte completo de candidato
  - Verificar que PDFs se descargan correctamente
  - Verificar que branding se aplica
  - Verificar permisos en endpoints

- [ ] 13. Implementar funcionalidad de branding en reportes
  - [ ] 13.1 Actualizar ReportService para obtener branding
    - Consultar tabla Candidate para obtener branding
    - Manejar caso cuando no hay branding configurado
    - Usar colores por defecto si no hay branding
    - _Requirements: 12.1, 12.6_

  - [ ] 13.2 Aplicar branding en PDFGenerator
    - Incluir logo en encabezado si existe
    - Usar colores primarios en encabezados
    - Usar colores secundarios en tablas
    - Incluir nombre del partido en pie de página
    - _Requirements: 12.2, 12.3, 12.4, 12.5_

  - [ ] 13.3 Escribir test de propiedad para consistencia de branding
    - **Property 4: Branding Consistency**
    - **Validates: Requirements 12.2, 12.3, 12.4**

- [ ] 14. Implementar exportación a CSV y Excel
  - [ ] 14.1 Crear endpoint `/src/app/api/reports/export/csv/route.ts`
    - Validar autenticación y permisos
    - Recibir filtros en body
    - Obtener datos según filtros
    - Convertir a formato CSV
    - Incluir todos los campos
    - Retornar archivo CSV
    - _Requirements: 10.1, 10.3, 10.6_

  - [ ] 14.2 Crear endpoint `/src/app/api/reports/export/excel/route.ts`
    - Validar autenticación y permisos
    - Recibir filtros en body
    - Obtener datos según filtros
    - Crear workbook con xlsx
    - Aplicar formato de tabla
    - Retornar archivo Excel
    - _Requirements: 10.2, 10.4, 10.6_

  - [ ] 14.3 Escribir test de propiedad para equivalencia de formatos
    - **Property 10: Export Format Equivalence**
    - **Validates: Requirements 10.3, 10.4**

- [ ] 15. Crear modelo de historial de reportes
  - [ ] 15.1 Actualizar schema de Prisma
    - Agregar modelo Report con campos necesarios
    - Agregar relación con Candidate
    - Agregar índices en candidateId y createdAt
    - Ejecutar migración
    - _Requirements: 11.1_

  - [ ] 15.2 Implementar guardado de historial
    - Guardar registro al generar reporte
    - Incluir tipo, filtros y fecha
    - _Requirements: 11.2_

- [ ] 16. Crear interfaz de reportes para candidatos
  - [ ] 16.1 Crear `/src/app/dashboard/candidate/reports/page.tsx`
    - Crear layout de página de reportes
    - Implementar sección de filtros
    - Agregar selector de departamento
    - Agregar selector de municipio
    - Agregar selector de zona/comuna
    - Agregar selector de puesto de votación
    - Agregar selector de mesa
    - Agregar selector de líder
    - Agregar selector de rango de fechas
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ] 16.2 Implementar botones de generación de reportes
    - Botón "Reporte Completo"
    - Botón "Solo Líderes"
    - Botón "Por Zona"
    - Botón "Por Puesto"
    - Botón "Por Mesa"
    - Botón "Comparativo"
    - Botón "Exportar CSV"
    - Botón "Exportar Excel"
    - _Requirements: 9.1, 10.5_

  - [ ] 16.3 Implementar vista previa de datos
    - Mostrar tabla con datos antes de generar
    - Actualizar vista previa al cambiar filtros
    - Mostrar conteo de registros
    - _Requirements: 9.9_

  - [ ] 16.4 Implementar indicador de progreso
    - Mostrar loading durante generación
    - Mostrar barra de progreso
    - Deshabilitar botones durante generación
    - _Requirements: 9.10_

- [ ] 17. Implementar historial de reportes en UI
  - [ ] 17.1 Crear endpoint `/src/app/api/reports/history/route.ts`
    - Obtener reportes del candidato
    - Ordenar por fecha descendente
    - Limitar a últimos 30 días
    - _Requirements: 11.3, 11.6_

  - [ ] 17.2 Agregar sección de historial en página de reportes
    - Mostrar lista de reportes generados
    - Mostrar fecha, tipo y filtros aplicados
    - Botón para descargar reporte anterior
    - Botón para eliminar reporte
    - _Requirements: 11.3, 11.4, 11.5_

- [ ] 18. Agregar botón de reporte en dashboard de líder
  - [ ] 18.1 Actualizar `/src/app/dashboard/leader/page.tsx`
    - Agregar botón "Descargar Reporte PDF"
    - Implementar función handleDownloadReport
    - Llamar a endpoint /api/reports/leader/voters
    - Descargar archivo PDF
    - Mostrar toast de éxito/error
    - _Requirements: 2.8_

- [ ] 19. Implementar validación de permisos en todos los endpoints
  - [ ] 19.1 Agregar validación en endpoints de reportes
    - Validar autenticación en todos los endpoints
    - Validar rol correcto (leader o candidate)
    - Validar que líder solo accede a sus reportes
    - Validar que candidato solo accede a su campaña
    - Retornar 401 si no hay sesión
    - Retornar 403 si no tiene permisos
    - Registrar intentos no autorizados
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ] 19.2 Escribir test de propiedad para validación de permisos
    - **Property 5: Report Permission Validation**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

- [ ] 20. Implementar optimizaciones para reportes grandes
  - [ ] 20.1 Agregar paginación en queries
    - Implementar paginación para reportes > 100 registros
    - Usar cursor-based pagination con Prisma
    - _Requirements: 14.1_

  - [ ] 20.2 Implementar advertencias y límites
    - Mostrar advertencia si reporte > 500 votantes
    - Limitar reportes a máximo 5000 registros
    - Sugerir filtros adicionales si muy grande
    - _Requirements: 14.2, 14.4, 14.5_

  - [ ] 20.3 Implementar indicador de progreso para reportes grandes
    - Mostrar progreso durante generación
    - Usar streaming si es posible
    - _Requirements: 14.3, 14.6_

  - [ ] 20.4 Escribir test para límite de registros
    - Verificar que reportes > 5000 registros son rechazados
    - _Requirements: 14.4_

- [ ] 21. Implementar manejo de errores
  - [ ] 21.1 Agregar manejo de errores en endpoints
    - Manejar caso de no datos disponibles
    - Manejar errores de generación de PDF
    - Manejar errores de permisos
    - Manejar errores de red
    - Registrar errores en logs
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 21.2 Implementar mensajes de error en UI
    - Mostrar toast para errores
    - Permitir reintentar después de error
    - Mostrar mensajes específicos según tipo de error
    - _Requirements: 15.1, 15.3, 15.4, 15.6_

- [ ] 22. Checkpoint - Verificar funcionalidad completa
  - Probar todos los tipos de reportes
  - Probar todos los filtros geográficos
  - Probar exportación a CSV y Excel
  - Verificar branding en reportes
  - Verificar permisos y seguridad
  - Probar con reportes grandes
  - Verificar historial de reportes
  - Probar manejo de errores

- [ ] 23. Optimización y pulido final
  - [ ] 23.1 Optimizar queries de base de datos
    - Agregar índices necesarios
    - Optimizar includes y selects
    - Usar agregaciones eficientes
    - _Requirements: Performance_

  - [ ] 23.2 Mejorar UX de interfaz de reportes
    - Agregar tooltips explicativos
    - Mejorar diseño de filtros
    - Agregar animaciones de carga
    - Mejorar feedback visual

  - [ ] 23.3 Agregar documentación
    - Documentar endpoints de API
    - Documentar estructura de filtros
    - Crear guía de uso para usuarios

## Notes

- **Orden importante**: Implementar endpoints antes de UI para poder probar
- **Testing incremental**: Probar después de cada checkpoint
- **Branding**: Asegurar que branding se aplica correctamente en todos los reportes
- **Performance**: Monitorear performance con reportes grandes
- **Límites**: Aplicar límites razonables para evitar timeouts
- **Permisos**: Validar permisos en TODOS los endpoints
- **Errores**: Manejar todos los casos de error con mensajes claros
- **Formatos**: Asegurar que PDF, CSV y Excel contienen los mismos datos

---

**Total de tareas**: 23 tareas principales, 50+ sub-tareas
**Tiempo estimado**: 12-16 horas de implementación
**Prioridad**: ALTA - Funcionalidad principal del sistema
