# Requirements Document - Sistema de Reportes PDF

## Introduction

Sistema completo de generación de reportes en PDF para la plataforma electoral, permitiendo a líderes y candidatos generar reportes detallados de votantes con filtros geográficos avanzados (por zona, puesto de votación, mesa), reportes comparativos, y exportación de datos con branding personalizado.

## Glossary

- **System**: Plataforma de Gestión Electoral Colombia 2026
- **Report**: Documento PDF generado con información de votantes y líderes
- **Leader_Report**: Reporte de un líder con sus votantes
- **Candidate_Report**: Reporte de un candidato con todos sus líderes y votantes
- **Geographic_Filter**: Filtro por departamento, municipio, zona, puesto o mesa
- **Polling_Station**: Puesto de votación con ubicación geográfica
- **Voting_Table**: Mesa de votación dentro de un puesto
- **Zone**: Zona o comuna dentro de un municipio
- **PDF_Library**: Librería jsPDF para generación de PDFs
- **Branding**: Colores y logo personalizados del candidato

## Requirements

### Requirement 1: Configurar Librería de PDFs

**User Story:** Como desarrollador, quiero configurar una librería de generación de PDFs, para que el sistema pueda crear documentos profesionales.

#### Acceptance Criteria

1. THE System SHALL instalar jsPDF y jspdf-autotable
2. THE System SHALL crear módulo de utilidades en `/src/lib/pdf-utils.ts`
3. THE System SHALL crear templates reutilizables para reportes
4. THE System SHALL implementar función para agregar encabezados con branding
5. THE System SHALL implementar función para agregar pies de página con fecha
6. THE System SHALL implementar función para agregar tablas con formato profesional

### Requirement 2: Reporte de Votantes para Líderes

**User Story:** Como líder, quiero generar un reporte PDF con todos mis votantes, para tener un documento impreso de mi base electoral.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/reports/leader/voters`
2. WHEN un líder solicita el reporte, THE System SHALL incluir solo sus propios votantes
3. THE System SHALL incluir en el reporte: nombre, cédula, municipio, puesto, mesa
4. THE System SHALL incluir logo y colores del candidato en el reporte
5. THE System SHALL incluir fecha de generación del reporte
6. THE System SHALL ordenar votantes alfabéticamente por nombre
7. THE System SHALL implementar paginación automática para reportes grandes
8. THE System SHALL agregar botón "Descargar Reporte PDF" en dashboard del líder

### Requirement 3: Reporte Completo para Candidatos

**User Story:** Como candidato, quiero generar un reporte completo con todos mis líderes y votantes, para tener una visión general de mi campaña.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/reports/candidate/full`
2. THE System SHALL incluir estadísticas generales en la primera página
3. THE System SHALL incluir desglose por líder con sus votantes
4. THE System SHALL incluir total de votantes por municipio
5. THE System SHALL incluir total de votantes por departamento
6. THE System SHALL incluir gráfica de distribución geográfica
7. THE System SHALL ordenar líderes por cantidad de votantes (descendente)

### Requirement 4: Reporte de Solo Líderes

**User Story:** Como candidato, quiero generar un reporte solo con mis líderes, para analizar mi estructura organizativa.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/reports/candidate/leaders`
2. THE System SHALL incluir lista de líderes con cantidad de votantes
3. THE System SHALL incluir estadísticas de rendimiento por líder
4. THE System SHALL incluir distribución geográfica de líderes
5. THE System SHALL incluir datos de contacto de cada líder
6. THE System SHALL ordenar líderes por cantidad de votantes

### Requirement 5: Reporte por Zona/Comuna

**User Story:** Como candidato, quiero generar reportes filtrados por zona o comuna, para analizar mi cobertura en áreas específicas.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/reports/candidate/by-zone`
2. WHEN se solicita reporte por zona, THE System SHALL filtrar por departamento y municipio
3. THE System SHALL agrupar líderes y votantes por zona/comuna
4. THE System SHALL incluir total de líderes por zona
5. THE System SHALL incluir total de votantes por zona
6. THE System SHALL incluir desglose detallado de cada líder en la zona
7. THE System SHALL incluir lista completa de votantes por zona
8. THE System SHALL agregar selector de zona en dashboard del candidato

### Requirement 6: Reporte por Puesto de Votación

**User Story:** Como candidato, quiero generar reportes por puesto de votación, para conocer mi cobertura en cada puesto.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/reports/candidate/by-polling-station`
2. WHEN se solicita reporte por puesto, THE System SHALL filtrar por departamento, municipio y puesto
3. THE System SHALL incluir información del puesto (nombre, dirección, coordenadas)
4. THE System SHALL incluir total de líderes con votantes en ese puesto
5. THE System SHALL incluir total de votantes registrados en ese puesto
6. THE System SHALL incluir lista de líderes con sus votantes en ese puesto
7. THE System SHALL incluir distribución por mesas dentro del puesto
8. THE System SHALL agregar selector de puesto en dashboard del candidato

### Requirement 7: Reporte por Mesa de Votación

**User Story:** Como candidato, quiero generar reportes por mesa de votación, para tener control detallado de cada mesa.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/reports/candidate/by-table`
2. WHEN se solicita reporte por mesa, THE System SHALL filtrar por puesto y número de mesa
3. THE System SHALL incluir información del puesto y mesa específica
4. THE System SHALL incluir total de votantes en esa mesa
5. THE System SHALL incluir líderes responsables de esos votantes
6. THE System SHALL incluir lista detallada de votantes con todos sus datos
7. THE System SHALL incluir datos de contacto del líder responsable
8. THE System SHALL agregar selector de mesa en dashboard del candidato

### Requirement 8: Reporte Comparativo Multi-ubicación

**User Story:** Como candidato, quiero comparar múltiples ubicaciones en un solo reporte, para identificar áreas fuertes y débiles.

#### Acceptance Criteria

1. THE System SHALL crear endpoint `/api/reports/candidate/comparative`
2. WHEN se solicita reporte comparativo, THE System SHALL permitir seleccionar múltiples zonas/puestos/mesas
3. THE System SHALL incluir tabla comparativa de cobertura
4. THE System SHALL incluir gráficas de barras por ubicación
5. THE System SHALL identificar zonas con mayor cobertura
6. THE System SHALL identificar zonas con menor cobertura
7. THE System SHALL incluir recomendaciones de áreas a fortalecer

### Requirement 9: Interfaz de Generación de Reportes

**User Story:** Como candidato, quiero una interfaz intuitiva para generar reportes, para poder crear documentos personalizados fácilmente.

#### Acceptance Criteria

1. THE System SHALL crear sección "Reportes" en dashboard del candidato
2. THE System SHALL implementar filtros por departamento
3. THE System SHALL implementar filtros por municipio
4. THE System SHALL implementar filtros por zona/comuna
5. THE System SHALL implementar filtros por puesto de votación
6. THE System SHALL implementar filtros por mesa de votación
7. THE System SHALL implementar filtros por líder específico
8. THE System SHALL implementar filtros por rango de fechas de registro
9. THE System SHALL mostrar vista previa de datos antes de generar PDF
10. THE System SHALL mostrar indicador de progreso durante generación

### Requirement 10: Exportación Alternativa

**User Story:** Como usuario, quiero exportar datos a Excel/CSV además de PDF, para poder analizar datos en hojas de cálculo.

#### Acceptance Criteria

1. THE System SHALL implementar exportación a formato CSV
2. THE System SHALL implementar exportación a formato Excel (XLSX)
3. WHEN se exporta a CSV, THE System SHALL incluir todos los campos de datos
4. WHEN se exporta a Excel, THE System SHALL incluir formato de tabla
5. THE System SHALL agregar botones de exportación en interfaz de reportes
6. THE System SHALL usar el mismo sistema de filtros para todas las exportaciones

### Requirement 11: Historial de Reportes

**User Story:** Como candidato, quiero ver un historial de reportes generados, para poder descargar reportes anteriores.

#### Acceptance Criteria

1. THE System SHALL crear tabla `Report` en base de datos
2. WHEN se genera un reporte, THE System SHALL guardar registro con fecha, tipo y filtros
3. THE System SHALL mostrar lista de reportes generados en dashboard
4. THE System SHALL permitir descargar reportes anteriores
5. THE System SHALL permitir eliminar reportes antiguos
6. THE System SHALL limitar historial a últimos 30 días

### Requirement 12: Branding en Reportes

**User Story:** Como candidato, quiero que mis reportes incluyan mi branding personalizado, para mantener identidad visual de campaña.

#### Acceptance Criteria

1. WHEN se genera un reporte, THE System SHALL obtener branding del candidato
2. THE System SHALL incluir logo del candidato en encabezado
3. THE System SHALL usar colores primarios del candidato en encabezados
4. THE System SHALL usar colores secundarios en tablas
5. THE System SHALL incluir nombre del partido en pie de página
6. IF el candidato no tiene branding, THE System SHALL usar colores por defecto

### Requirement 13: Validación de Permisos en Reportes

**User Story:** Como desarrollador, quiero validar permisos en endpoints de reportes, para que solo usuarios autorizados generen reportes.

#### Acceptance Criteria

1. THE System SHALL validar autenticación en todos los endpoints de reportes
2. WHEN un líder solicita reporte, THE System SHALL validar que es su propio reporte
3. WHEN un candidato solicita reporte, THE System SHALL validar que es su propia campaña
4. THE System SHALL retornar error 401 si no hay sesión válida
5. THE System SHALL retornar error 403 si no tiene permisos
6. THE System SHALL registrar intentos de acceso no autorizado

### Requirement 14: Optimización de Reportes Grandes

**User Story:** Como usuario, quiero que los reportes grandes se generen eficientemente, para no tener tiempos de espera excesivos.

#### Acceptance Criteria

1. WHEN un reporte tiene más de 100 votantes, THE System SHALL usar paginación en PDF
2. WHEN un reporte tiene más de 500 votantes, THE System SHALL mostrar advertencia de tiempo
3. THE System SHALL implementar streaming para reportes muy grandes
4. THE System SHALL limitar reportes a máximo 5000 registros
5. THE System SHALL sugerir filtros adicionales si el reporte es muy grande
6. THE System SHALL mostrar progreso durante generación de reportes grandes

### Requirement 15: Manejo de Errores en Reportes

**User Story:** Como usuario, quiero recibir mensajes claros cuando hay errores en reportes, para entender qué sucedió.

#### Acceptance Criteria

1. WHEN no hay datos para el reporte, THE System SHALL mostrar mensaje "No hay datos disponibles"
2. WHEN falla la generación del PDF, THE System SHALL mostrar mensaje de error genérico
3. WHEN hay error de permisos, THE System SHALL mostrar mensaje "No tienes permisos"
4. WHEN hay error de red, THE System SHALL mostrar mensaje "Error de conexión"
5. THE System SHALL registrar errores de generación en logs del servidor
6. THE System SHALL permitir reintentar generación después de error

---

**Total de Requisitos:** 15
**Total de Criterios de Aceptación:** 95
