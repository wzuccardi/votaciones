# Dashboard de Monitoreo con Gráficas Dinámicas

## 🎨 Implementación Completada

Se ha creado un dashboard de monitoreo moderno y visual con gráficas dinámicas que cambian según los filtros aplicados.

## 📊 Gráficas Implementadas

### 1. Vista General (Sin Filtros)
**Gráfica**: Votación por Municipio
- **Eje X**: Nombres de municipios
- **Eje Y**: Cantidad de votos
- **Barras**:
  - Azul: Nuestros votos
  - Gris: Total de votos
- **Ordenamiento**: Por cantidad de votos (mayor a menor)

**Ejemplo**:
```
Cartagena:    [████████] 150 votos | [████████████] 300 total
Turbaco:      [████] 80 votos      | [████████] 200 total
Arjona:       [███] 50 votos       | [██████] 150 total
```

### 2. Vista Municipio (Filtro por Municipio)
**Gráfica**: Votación por Puesto de Votación
- **Eje X**: Nombres de puestos
- **Eje Y**: Cantidad de votos
- **Barras**:
  - Azul: Nuestros votos
  - Gris: Total de votos
- **Ordenamiento**: Por cantidad de votos (mayor a menor)
- **Nota**: Nombres largos se truncan a 30 caracteres

**Ejemplo**:
```
COLEGIO DE LA ESPERANZA:  [████] 50 votos | [████████] 100 total
BAYUNCA 2:                [███] 40 votos  | [██████] 80 total
ESCUELA CENTRAL:          [██] 30 votos   | [█████] 70 total
```

### 3. Vista Puesto (Filtro por Puesto)
**Gráfica**: Votación por Mesa
- **Eje X**: Número de mesa
- **Eje Y**: Cantidad de votos
- **Barras**:
  - Azul: Nuestros votos
  - Gris: Total de votos
- **Ordenamiento**: Por número de mesa (1, 2, 3, 4...)

**Ejemplo**:
```
Mesa 1:  [████] 25 votos | [██████] 50 total
Mesa 2:  [███] 20 votos  | [█████] 45 total
Mesa 3:  [████] 22 votos | [██████] 48 total
Mesa 4:  [███] 18 votos  | [████] 40 total
```

## 🎯 Características del Dashboard

### Diseño Moderno
- ✅ Gráficas de barras con Recharts
- ✅ Colores consistentes con el tema
- ✅ Tooltips informativos
- ✅ Leyenda clara
- ✅ Responsive (se adapta a móvil/tablet/desktop)

### Interactividad
- ✅ Gráfica cambia automáticamente según filtro
- ✅ Hover sobre barras muestra detalles
- ✅ Animaciones suaves
- ✅ Auto-refresh cada 30 segundos

### Información Mostrada
- ✅ Nuestros votos (azul)
- ✅ Total de votos (gris)
- ✅ Porcentaje calculado
- ✅ Comparación visual

## 🔧 Implementación Técnica

### Frontend
**Archivo**: `src/app/dashboard/leader/monitoreo/page.tsx`

**Componentes Agregados**:
```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
```

**Lógica de Gráfica Dinámica**:
```typescript
<BarChart
  data={
    selectedPollingStation 
      ? stats.votesByTable || []
      : selectedMunicipality 
        ? stats.votesByStation || []
        : stats.votesByMunicipality || []
  }
>
```

### Backend
**Archivo**: `src/app/api/dashboard/stats/route.ts`

**Datos Agregados**:
```typescript
// Vista General
votesByMunicipality: Array<{
  name: string
  votes: number
  total: number
  percentage: number
}>

// Vista Municipio
votesByStation: Array<{
  name: string
  votes: number
  total: number
  percentage: number
}>

// Vista Puesto
votesByTable: Array<{
  number: number
  votes: number
  total: number
  percentage: number
}>
```

**Lógica de Agregación**:
```typescript
if (!pollingStationId && !municipalityId) {
  // Agrupar por municipio
  const municipalityVotes = new Map()
  for (const report of allReports) {
    // Sumar votos por municipio
  }
} else if (municipalityId && !pollingStationId) {
  // Agrupar por puesto
} else if (pollingStationId) {
  // Agrupar por mesa
}
```

## 📱 Diseño Responsive

### Desktop (>1024px)
- Gráfica ocupa ancho completo
- Altura: 350px
- Etiquetas en ángulo de 45°

### Tablet (768px - 1024px)
- Gráfica se ajusta al contenedor
- Altura: 350px
- Etiquetas más pequeñas

### Mobile (<768px)
- Gráfica ocupa ancho completo
- Altura: 300px
- Etiquetas verticales

## 🎨 Personalización Visual

### Colores
```typescript
const COLORS = [
  '#3b82f6', // Azul (nuestros votos)
  '#94a3b8', // Gris (total votos)
  '#10b981', // Verde (éxito)
  '#f59e0b', // Amarillo (advertencia)
  '#ef4444', // Rojo (error)
]
```

### Tooltip Personalizado
```typescript
<Tooltip 
  contentStyle={{ 
    backgroundColor: '#1f2937', 
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#fff'
  }}
  formatter={(value, name) => {
    if (name === 'votes') return [value, 'Nuestros Votos']
    if (name === 'total') return [value, 'Total Votos']
    return [value, name]
  }}
/>
```

### Barras con Bordes Redondeados
```typescript
<Bar 
  dataKey="votes" 
  fill="#3b82f6" 
  radius={[8, 8, 0, 0]} // Bordes superiores redondeados
/>
```

## 📊 Ejemplo de Datos

### Vista General
```json
{
  "votesByMunicipality": [
    {
      "name": "Cartagena",
      "votes": 150,
      "total": 300,
      "percentage": 50
    },
    {
      "name": "Turbaco",
      "votes": 80,
      "total": 200,
      "percentage": 40
    }
  ]
}
```

### Vista Municipio
```json
{
  "votesByStation": [
    {
      "name": "COLEGIO DE LA ESPERANZA",
      "votes": 50,
      "total": 100,
      "percentage": 50
    },
    {
      "name": "BAYUNCA 2",
      "votes": 40,
      "total": 80,
      "percentage": 50
    }
  ]
}
```

### Vista Puesto
```json
{
  "votesByTable": [
    {
      "number": 1,
      "votes": 25,
      "total": 50,
      "percentage": 50
    },
    {
      "number": 2,
      "votes": 20,
      "total": 45,
      "percentage": 44
    }
  ]
}
```

## 🚀 Flujo de Uso

### Escenario 1: Monitoreo General
1. Abrir `/dashboard/leader/monitoreo`
2. No aplicar filtros
3. Ver gráfica de votación por municipio
4. Identificar municipios con mejor rendimiento

### Escenario 2: Análisis por Municipio
1. Aplicar filtro de municipio (ej: Cartagena)
2. Ver gráfica de votación por puesto
3. Identificar puestos con mejor/peor rendimiento
4. Tomar decisiones sobre dónde enfocar esfuerzos

### Escenario 3: Detalle por Puesto
1. Aplicar filtro de puesto (ej: COLEGIO DE LA ESPERANZA)
2. Ver gráfica de votación por mesa
3. Identificar mesas específicas
4. Verificar consistencia entre mesas

## ✅ Ventajas del Sistema

1. **Visual**: Fácil de entender de un vistazo
2. **Dinámico**: Cambia según contexto
3. **Informativo**: Muestra comparación directa
4. **Interactivo**: Tooltips con detalles
5. **Responsive**: Funciona en cualquier dispositivo
6. **Tiempo Real**: Se actualiza automáticamente

## 🎯 Próximas Mejoras Sugeridas

1. **Gráfica de Pastel**: Distribución de votos (nuestros vs otros)
2. **Gráfica de Línea**: Evolución de reportes por hora
3. **Mapa de Calor**: Cobertura geográfica
4. **Tabla de Ranking**: Top 10 puestos/mesas
5. **Alertas Visuales**: Destacar anomalías
6. **Exportar Gráficas**: Descargar como imagen

## 📝 Notas Técnicas

### Performance
- Las gráficas se renderizan solo cuando hay datos
- Los cálculos se hacen en el backend
- El frontend solo muestra los datos procesados

### Escalabilidad
- Funciona con cualquier cantidad de municipios/puestos/mesas
- Los nombres largos se truncan automáticamente
- Las gráficas se adaptan al tamaño de datos

### Mantenibilidad
- Código modular y reutilizable
- Fácil agregar nuevos tipos de gráficas
- Configuración centralizada de colores

## 🎉 Resultado Final

Un dashboard moderno, visual e informativo que permite:
- ✅ Ver votación por municipio (general)
- ✅ Ver votación por puesto (municipio)
- ✅ Ver votación por mesa (puesto)
- ✅ Comparar nuestros votos vs total
- ✅ Identificar tendencias y patrones
- ✅ Tomar decisiones informadas

¡El dashboard está listo para el día de las elecciones! 🗳️📊
