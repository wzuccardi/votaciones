# Task 8: Reporte por Puesto de Votación

## Estado: ✅ COMPLETADO

## Descripción
Se implementó un nuevo reporte en PDF que organiza las mesas de votación de un puesto específico de mayor a menor según el número de votantes registrados. Este reporte ayuda a determinar las mesas más importantes para asignar testigos electorales.

## Cambios Realizados

### 1. PDF Generator (`src/lib/pdf-generator.ts`)
- ✅ Agregada función `generatePollingStationReport()` con las siguientes características:
  - Header con foto del candidato y badge "103"
  - Información del puesto de votación (nombre, código, dirección, zona)
  - Estadísticas de cobertura de testigos electorales
  - Tabla de mesas ordenadas por número de votantes (de mayor a menor)
  - Indicadores visuales de cobertura (✓ Sí / ✗ No) con colores
  - Detalle de votantes para las top 5 mesas con más votantes
  - Footer con branding en todas las páginas

### 2. Candidate Dashboard (`src/app/dashboard/candidate/page.tsx`)
- ✅ Importada función `generatePollingStationReport`
- ✅ Agregados estados:
  - `selectedPollingStationId`: ID del puesto seleccionado
  - `pollingStations`: Lista de puestos de votación
  - `municipalities`: Lista de municipios
- ✅ Agregado useEffect para cargar municipios al montar
- ✅ Agregado useEffect para cargar puestos cuando se selecciona municipio
- ✅ Agregada función `handleGeneratePollingStationReport()`:
  - Valida selección de puesto
  - Filtra votantes del puesto
  - Obtiene testigos asignados al puesto
  - Genera PDF con toda la información
- ✅ Agregada Card en el diálogo de reportes:
  - Selector de municipio
  - Selector de puesto de votación (dependiente del municipio)
  - Botón para generar reporte

## Características del Reporte

### Información Incluida
1. **Header**: Foto del candidato, nombre, partido, badge 103
2. **Datos del Puesto**: Nombre, código, dirección, zona, total de votantes
3. **Cobertura de Testigos**:
   - Mesas con testigo vs total de mesas
   - Porcentaje de cobertura
   - Mesas sin testigo
4. **Tabla de Prioridad**:
   - Mesas ordenadas de mayor a menor por número de votantes
   - Columnas: Mesa, Votantes, Testigo (✓/✗), Nombre del Testigo
   - Colores: Verde para mesas con testigo, Rojo para mesas sin testigo
5. **Detalle Top 5 Mesas**:
   - Lista completa de votantes de las 5 mesas con más votantes
   - Nombre, cédula, teléfono de cada votante
   - Indicador de testigo asignado

### Ordenamiento
- Las mesas se ordenan de **mayor a menor** según el número de votantes
- Esto permite identificar rápidamente las mesas más importantes
- Facilita la toma de decisiones sobre asignación de testigos

## Flujo de Uso

1. Usuario abre el dashboard del candidato
2. Click en "Generar Reportes"
3. Selecciona "Reporte por Puesto de Votación"
4. Selecciona un municipio del dropdown
5. Selecciona un puesto de votación del dropdown (se cargan automáticamente)
6. Click en "Generar Reporte del Puesto"
7. Se descarga PDF con nombre: `Reporte_Puesto_[NombrePuesto]_[timestamp].pdf`

## Validaciones Implementadas
- ✅ Municipio debe ser seleccionado antes de puesto
- ✅ Puesto debe ser seleccionado antes de generar
- ✅ Manejo de errores con mensajes toast
- ✅ Estado de carga durante generación
- ✅ Validación de datos del puesto

## Integración con Sistema de Testigos
- El reporte muestra qué mesas tienen testigos asignados
- Indica el nombre del testigo para cada mesa
- Calcula porcentaje de cobertura
- Ayuda a identificar mesas prioritarias sin cobertura

## Archivos Modificados
1. `src/lib/pdf-generator.ts` - Nueva función de generación
2. `src/app/dashboard/candidate/page.tsx` - UI y lógica del reporte

## Testing Recomendado
- [ ] Generar reporte con puesto que tiene testigos
- [ ] Generar reporte con puesto sin testigos
- [ ] Verificar ordenamiento de mesas (mayor a menor)
- [ ] Verificar colores de indicadores de testigos
- [ ] Verificar detalle de top 5 mesas
- [ ] Verificar que el PDF se descarga correctamente
- [ ] Probar con diferentes municipios y puestos

## Notas Técnicas
- Se usa la API `/api/data/municipalities` para cargar municipios
- Se usa la API `/api/data/polling-stations?municipalityId=X` para cargar puestos
- Se usa la API `/api/dashboard/candidate/witnesses?candidateId=X` para obtener testigos
- Los votantes se filtran por nombre del puesto (no por ID debido a estructura de datos)
- El reporte usa la misma función `addHeaderWithPhoto()` que otros reportes para consistencia

## Próximos Pasos Sugeridos
- Agregar filtro por zona dentro del municipio
- Agregar opción de exportar a Excel además de PDF
- Agregar gráficos de cobertura de testigos
- Permitir generar reportes de múltiples puestos a la vez
