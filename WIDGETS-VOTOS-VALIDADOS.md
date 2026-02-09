# Widgets de Votos Validados - Implementación Completa

## ✅ Implementado

Se han agregado widgets separados para distinguir entre votos reportados, validados y pendientes, con código de colores para mejor visualización.

## 📊 Nueva Estructura de Widgets

### Fila 1: Estado de Mesas (4 widgets)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Mesas Reportadas │  │ Mesas Validadas  │  │ Mesas Pendientes │  │ Última Actualiz. │
│      4 / 6       │  │        2         │  │        2         │  │    02:16 a.m.    │
│  [Progress Bar]  │  │  ✓ Verificadas   │  │  ⏳ Sin verificar│  │  Auto-actualiz.  │
│  67% completado  │  │  50% reportadas  │  │   Por validar    │  │      activa      │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Fila 2: Votos por Estado (3 widgets con código de colores)

```
┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────────┐
│ 🔵 Votos Reportados         │  │ 🟢 Votos Validados ✓        │  │ 🟡 Votos Pendientes         │
│                             │  │                             │  │                             │
│        190                  │  │         130                 │  │          60                 │
│  De 372 votos totales       │  │  De 220 votos totales       │  │  De 152 votos totales       │
│      51.08%                 │  │       59.09%                │  │      39.47%                 │
│                             │  │                             │  │                             │
│ Todas las mesas reportadas  │  │  Solo mesas verificadas     │  │   Mesas sin verificar       │
└─────────────────────────────┘  └─────────────────────────────┘  └─────────────────────────────┘
   Borde azul                      Borde verde                      Borde amarillo
```

## 🎨 Código de Colores

| Color | Significado | Uso |
|-------|-------------|-----|
| 🔵 **Azul** | Reportados | Todos los datos reportados por testigos (sin filtrar) |
| 🟢 **Verde** | Validados | Datos verificados y aprobados por candidato/líder |
| 🟡 **Amarillo** | Pendientes | Datos reportados pero aún sin validar |

## 📈 Estadísticas Calculadas

### API (`/api/dashboard/candidate/resultados`)

**Nuevos campos agregados:**

```typescript
{
  // Existentes
  totalVotesCandidate: number      // Votos de todas las mesas reportadas
  totalVotesGeneral: number        // Total de votos de todas las mesas
  percentage: number               // Porcentaje general
  
  // NUEVOS - Votos Validados
  validatedVotesCandidate: number  // Votos solo de mesas validadas
  validatedVotesGeneral: number    // Total de votos de mesas validadas
  validatedPercentage: number      // Porcentaje de mesas validadas
  
  // NUEVOS - Votos Pendientes
  pendingVotesCandidate: number    // Votos de mesas sin validar
  pendingVotesGeneral: number      // Total de votos de mesas sin validar
  tablesPending: number            // Cantidad de mesas pendientes
}
```

### Cálculos:

```typescript
// Votos Validados
const validatedTables = tableResults.filter(t => t.isValidated)
const validatedVotesCandidate = validatedTables.reduce((sum, t) => sum + (t.votesCandidate || 0), 0)
const validatedVotesGeneral = validatedTables.reduce((sum, t) => sum + (t.totalVotes || 0), 0)

// Votos Pendientes
const pendingTables = tableResults.filter(t => !t.isValidated)
const pendingVotesCandidate = pendingTables.reduce((sum, t) => sum + (t.votesCandidate || 0), 0)
const pendingVotesGeneral = pendingTables.reduce((sum, t) => sum + (t.totalVotes || 0), 0)
```

## 🎯 Beneficios

### Para el Candidato:
- ✅ **Visibilidad clara**: Distingue entre datos preliminares y verificados
- ✅ **Toma de decisiones**: Usa datos validados para análisis oficial
- ✅ **Control de calidad**: Ve cuántos votos faltan por validar
- ✅ **Comparación**: Detecta discrepancias entre reportados y validados

### Para el Análisis:
- ✅ **Datos confiables**: Porcentaje basado en mesas verificadas
- ✅ **Progreso de validación**: Ve cuántas mesas faltan por revisar
- ✅ **Detección de errores**: Compara votos reportados vs validados
- ✅ **Priorización**: Identifica qué mesas necesitan validación urgente

## 📱 Diseño Responsive

- **Desktop**: 2 filas (4 + 3 widgets)
- **Tablet**: Se adapta a 2 columnas
- **Mobile**: 1 columna, scroll vertical

## 🔄 Actualización en Tiempo Real

- Los widgets se actualizan automáticamente cada 30 segundos
- Al validar una mesa, los contadores cambian inmediatamente:
  - **Mesas Validadas**: +1
  - **Mesas Pendientes**: -1
  - **Votos Validados**: +X (votos de esa mesa)
  - **Votos Pendientes**: -X

## 💡 Casos de Uso

### Escenario 1: Noche Electoral
```
Reportados: 190 votos (4 mesas)
Validados: 0 votos (0 mesas)
Pendientes: 190 votos (4 mesas)

→ El candidato ve que tiene 190 votos reportados
→ Pero sabe que debe validarlos antes de confiar en ellos
→ Prioriza validar las mesas más importantes
```

### Escenario 2: Después de Validar
```
Reportados: 190 votos (4 mesas)
Validados: 130 votos (2 mesas)
Pendientes: 60 votos (2 mesas)

→ El candidato confía en los 130 votos validados
→ Sabe que tiene 60 votos más por verificar
→ Puede usar el 59.09% validado para reportes oficiales
```

### Escenario 3: Detección de Errores
```
Mesa 1 reportada: 50 votos
Mesa 1 validada: Se detecta error, se desvalida
Pendientes: +50 votos

→ El candidato puede corregir antes de usar los datos
→ Los votos validados siguen siendo confiables
```

## 🎨 Estilos Aplicados

### Bordes de Color:
```css
border-l-4 border-l-blue-500   /* Reportados */
border-l-4 border-l-green-500  /* Validados */
border-l-4 border-l-yellow-500 /* Pendientes */
```

### Badges:
```tsx
<Badge className="bg-blue-500">51.08%</Badge>      // Reportados
<Badge className="bg-green-500">59.09%</Badge>     // Validados
<Badge className="border-yellow-500">Por validar</Badge> // Pendientes
```

## 📄 Archivos Modificados

1. ✅ `src/app/api/dashboard/candidate/resultados/route.ts`
   - Agregados cálculos de votos validados y pendientes
   - Nuevos campos en la respuesta

2. ✅ `src/app/dashboard/candidate/resultados/page.tsx`
   - Actualizada interfaz `Stats` con nuevos campos
   - Reemplazado widget "Votos Obtenidos" por 3 widgets separados
   - Agregado widget "Mesas Pendientes"
   - Código de colores implementado

## 🚀 Próximas Mejoras Sugeridas

- 📊 Gráfica comparativa (reportados vs validados)
- 🔔 Notificación cuando hay mesas sin validar por X horas
- 📈 Historial de validaciones por hora
- 🎯 Filtro para ver solo mesas validadas en las tablas
- 📱 Alerta si hay gran discrepancia entre reportados y validados

## Fecha de Implementación
3 de febrero de 2026
