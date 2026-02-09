# Sistema de Filtros - Dashboard de Monitoreo

## 🎯 Funcionalidad Implementada

Se agregó un sistema completo de filtros al dashboard de monitoreo en tiempo real para que puedas ver los reportes de diferentes maneras.

## 📊 Tipos de Filtros

### 1. Vista General (Sin Filtros)
**Muestra**: Todos los datos del líder
- Total de testigos: 2
- Total de mesas asignadas: 4
- Todos los reportes de todos los testigos
- Estadísticas globales

### 2. Filtro por Municipio
**Ejemplo**: Seleccionar "Cartagena"
- Muestra solo testigos de ese municipio
- Mesas asignadas en ese municipio
- Reportes de ese municipio
- Puestos de votación filtrados

### 3. Filtro por Puesto de Votación
**Ejemplo**: Seleccionar "COLEGIO DE LA ESPERANZA"
- Muestra solo testigos de ese puesto
- **Mesas asignadas**: 2 (las de Antonia Marrugo)
- Reportes solo de ese puesto
- Estadísticas específicas del puesto

**Ejemplo 2**: Seleccionar "BAYUNCA 2 (SEDE LAS LATAS)"
- Muestra solo testigos de ese puesto
- **Mesas asignadas**: 2 (las de Maralara)
- Reportes solo de ese puesto

### 4. Filtro por Testigo Electoral
**Ejemplo**: Seleccionar "Antonia Marrugo"
- Muestra solo datos de ese testigo
- **Mesas asignadas**: 2 (mesas 1 y 2)
- Reportes solo de ese testigo
- Estadísticas individuales

**Ejemplo 2**: Seleccionar "Maralara"
- Muestra solo datos de ese testigo
- **Mesas asignadas**: 2 (mesas 3 y 4)
- Reportes solo de ese testigo

## 🎨 Interfaz de Usuario

### Ubicación
`/dashboard/leader/monitoreo`

### Componentes Agregados

#### 1. Botón de Filtros en el Header
```
┌─────────────────────────────────────┐
│ 🔍 Filtros [2]                      │
│ (Badge muestra cantidad de filtros) │
└─────────────────────────────────────┘
```

#### 2. Panel de Filtros Desplegable
Cuando haces clic en "Filtros", se despliega un panel con:

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Filtros de Reporte                    [Limpiar Filtros]│
│ Filtra los datos por municipio, puesto o testigo         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ [Municipio ▼]  [Puesto de Votación ▼]  [Testigo ▼]      │
│                                                           │
│                                    [Aplicar Filtros]      │
└──────────────────────────────────────────────────────────┘
```

#### 3. Indicador de Filtro Activo
En el subtítulo del header se muestra el filtro activo:
- "Seguimiento en tiempo real - **General**"
- "Seguimiento en tiempo real - **Municipio: Cartagena**"
- "Seguimiento en tiempo real - **Puesto: COLEGIO DE LA ESPERANZA**"
- "Seguimiento en tiempo real - **Testigo: Antonia Marrugo**"

## 🔄 Flujo de Uso

### Caso 1: Ver Todo (General)
1. Ir a `/dashboard/leader/monitoreo`
2. No seleccionar ningún filtro
3. **Resultado**: Muestra 4 mesas asignadas totales

### Caso 2: Filtrar por Puesto
1. Hacer clic en "Filtros"
2. Seleccionar municipio (si es necesario)
3. Seleccionar "COLEGIO DE LA ESPERANZA"
4. Hacer clic en "Aplicar Filtros"
5. **Resultado**: Muestra 2 mesas asignadas (las de Antonia)

### Caso 3: Filtrar por Testigo
1. Hacer clic en "Filtros"
2. Seleccionar "Maralara" en el dropdown de testigos
3. Hacer clic en "Aplicar Filtros"
4. **Resultado**: Muestra 2 mesas asignadas (mesas 3 y 4)

### Caso 4: Limpiar Filtros
1. Hacer clic en "Limpiar Filtros"
2. **Resultado**: Vuelve a la vista general con 4 mesas

## 📡 API Actualizada

### Endpoint
`GET /api/dashboard/stats`

### Parámetros de Query

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `leaderId` | string | ID del líder (requerido) | `clxxx...` |
| `municipalityId` | string | Filtrar por municipio | `clyyy...` |
| `pollingStationId` | string | Filtrar por puesto | `clzzz...` |
| `witnessId` | string | Filtrar por testigo | `claaa...` |

### Ejemplos de Uso

#### General (sin filtros)
```
GET /api/dashboard/stats?leaderId=clxxx
```
**Respuesta**: 4 mesas asignadas

#### Filtrado por Puesto
```
GET /api/dashboard/stats?leaderId=clxxx&pollingStationId=clzzz
```
**Respuesta**: 2 mesas asignadas (del puesto específico)

#### Filtrado por Testigo
```
GET /api/dashboard/stats?leaderId=clxxx&witnessId=claaa
```
**Respuesta**: 2 mesas asignadas (del testigo específico)

## 🎯 Estadísticas Filtradas

Cuando aplicas un filtro, TODAS las estadísticas se actualizan:

### Tarjetas de Estadísticas
- **Testigos Totales**: Cuenta solo testigos que cumplen el filtro
- **Testigos Activos**: Solo activos en el filtro
- **Cobertura de Mesas**: Porcentaje basado en mesas filtradas
- **Puestos Cubiertos**: Solo puestos que cumplen el filtro

### Votos Reportados
- **Votos del Candidato**: Solo de mesas filtradas
- **Total Registrados**: Solo de mesas filtradas
- **En Blanco/Nulos**: Solo de mesas filtradas

### Progreso de Reportes
- **Mesas Reportadas/Asignadas**: Solo del filtro
- **Irregularidades**: Solo del filtro

### Top Testigos
- Lista filtrada según criterio seleccionado

## 🔧 Implementación Técnica

### Archivos Modificados

1. **Frontend**: `src/app/dashboard/leader/monitoreo/page.tsx`
   - Agregado estado para filtros
   - Panel de filtros con dropdowns
   - Lógica de carga de municipios/puestos/testigos
   - Indicador visual de filtros activos

2. **Backend**: `src/app/api/dashboard/stats/route.ts`
   - Soporte para parámetros de filtro
   - Construcción dinámica de queries
   - Filtrado en cascada (municipio → puesto → testigo)

### Lógica de Filtrado

```typescript
// Construcción dinámica del WHERE clause
const witnessWhere: any = { leaderId }

if (witnessId) {
  witnessWhere.id = witnessId
}
if (pollingStationId) {
  witnessWhere.pollingStationId = pollingStationId
}
if (municipalityId) {
  witnessWhere.pollingStation = {
    municipalityId
  }
}
```

## ✅ Validaciones

### Filtros en Cascada
- Si seleccionas un municipio, solo se muestran puestos de ese municipio
- Si seleccionas un puesto, el filtro de testigo se limpia
- Si seleccionas un testigo, los otros filtros se limpian

### Dependencias
- **Puesto de Votación**: Requiere seleccionar municipio primero
- **Testigo**: Independiente, puede seleccionarse directamente

## 🔄 Auto-actualización

Los filtros se mantienen durante la auto-actualización:
- Cada 30 segundos se recargan los datos
- Los filtros seleccionados se mantienen
- No es necesario reaplicar los filtros

## 📱 Responsive

El panel de filtros es responsive:
- **Desktop**: 3 columnas (Municipio | Puesto | Testigo)
- **Tablet**: 2 columnas
- **Mobile**: 1 columna (stack vertical)

## 🎨 Indicadores Visuales

### Badge de Filtros Activos
```
🔍 Filtros [2]
```
Muestra cuántos filtros están activos

### Botón "Limpiar Filtros"
Solo aparece cuando hay filtros activos

### Subtítulo Dinámico
Muestra el filtro actual en lenguaje natural

## 📊 Ejemplo Práctico

### Escenario: Monitorear COLEGIO DE LA ESPERANZA

1. **Abrir dashboard**: `/dashboard/leader/monitoreo`
2. **Clic en "Filtros"**
3. **Seleccionar**:
   - Municipio: (el que corresponda)
   - Puesto: "COLEGIO DE LA ESPERANZA"
4. **Clic en "Aplicar Filtros"**

**Resultado**:
```
┌─────────────────────────────────────┐
│ Testigos Totales: 1                 │
│ (Antonia Marrugo)                   │
├─────────────────────────────────────┤
│ Cobertura de Mesas: 0%              │
│ 0/2 mesas reportadas                │
├─────────────────────────────────────┤
│ Votos Reportados: 0                 │
│ (Aún no hay reportes)               │
└─────────────────────────────────────┘
```

### Cuando Antonia Reporte las Mesas

**Con el mismo filtro activo**:
```
┌─────────────────────────────────────┐
│ Testigos Totales: 1                 │
│ Testigos Activos: 1                 │
├─────────────────────────────────────┤
│ Cobertura de Mesas: 100%            │
│ 2/2 mesas reportadas ✅             │
├─────────────────────────────────────┤
│ Votos Reportados: 150               │
│ Total: 300 votos                    │
└─────────────────────────────────────┘
```

## 🚀 Beneficios

1. **Monitoreo Granular**: Ver datos específicos por ubicación o persona
2. **Detección de Problemas**: Identificar rápidamente puestos sin reportar
3. **Seguimiento Individual**: Monitorear testigos específicos
4. **Análisis por Zona**: Comparar rendimiento entre municipios/puestos
5. **Toma de Decisiones**: Datos precisos para acciones específicas

## 📝 Notas Importantes

- Los filtros NO modifican los datos, solo cambian la vista
- Los datos originales permanecen intactos
- Puedes cambiar filtros en cualquier momento
- La auto-actualización respeta los filtros activos
- Los filtros se aplican a TODAS las estadísticas del dashboard

## 🔍 Verificación

Para verificar que funciona correctamente:

1. **Sin filtros**: Debe mostrar 4 mesas asignadas
2. **Filtro "COLEGIO DE LA ESPERANZA"**: Debe mostrar 2 mesas
3. **Filtro "BAYUNCA 2"**: Debe mostrar 2 mesas
4. **Filtro "Antonia Marrugo"**: Debe mostrar 2 mesas (1 y 2)
5. **Filtro "Maralara"**: Debe mostrar 2 mesas (3 y 4)

## ✅ Estado de Implementación

- ✅ API con soporte de filtros
- ✅ Frontend con panel de filtros
- ✅ Dropdowns en cascada
- ✅ Indicadores visuales
- ✅ Auto-actualización con filtros
- ✅ Responsive design
- ✅ Validaciones y dependencias
- ✅ Documentación completa

## 🎉 Resultado Final

Ahora tienes un dashboard de monitoreo completo con:
- Vista general de todos los testigos y mesas
- Filtros por municipio, puesto y testigo
- Estadísticas dinámicas que se actualizan según el filtro
- Interfaz intuitiva y fácil de usar
- Auto-actualización en tiempo real
