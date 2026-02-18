# Fix: Contador de Municipios en Dashboard

## Problema
El dashboard mostraba 0 municipios a pesar de que la base de datos tenía 46 municipios importados correctamente.

## Causa Raíz
Inconsistencia en el formato de respuesta de los endpoints de la API:
- Los endpoints actualizados (`/api/data/departments`, `/api/data/municipalities`, `/api/data/polling-stations`) retornaban directamente el array de datos
- Los hooks de React Query esperaban el formato antiguo `{ success: true, data: [...] }`
- Los endpoints de `/api/data/candidates` y `/api/data/leaders` todavía usaban el formato antiguo

## Solución Implementada

### 1. Actualización de Endpoints
Se actualizaron todos los endpoints para usar un formato consistente (array directo):

#### `/api/data/candidates`
- ✅ Retorna array directo de candidatos
- ✅ Incluye conteo de líderes (`_count.leaders`)

#### `/api/data/leaders`
- ✅ Retorna array directo de líderes
- ✅ Incluye conteo de votantes y sublíderes (`_count.voters`, `_count.subLeaders`)
- ✅ Acepta parámetro opcional `candidateId`

#### `/api/data/municipalities`
- ✅ Ya actualizado previamente
- ✅ Retorna array directo
- ✅ Incluye información del departamento
- ✅ Incluye conteo de puestos de votación

#### `/api/data/polling-stations`
- ✅ Ya actualizado previamente
- ✅ Retorna array directo
- ✅ Incluye información del municipio
- ✅ Incluye conteo de mesas

### 2. Actualización de Hooks de React Query

#### `useMunicipalities.ts`
```typescript
// Antes
return data.success ? data.data : []

// Después
return Array.isArray(data) ? data : []
```
- ✅ Acepta parámetro opcional `departmentId`
- ✅ Incluye tipos completos con información del departamento

#### `usePollingStations.ts`
```typescript
// Antes
return data.success ? data.data : []

// Después
return Array.isArray(data) ? data : []
```
- ✅ Incluye tipos completos con información del municipio
- ✅ Incluye campos de votantes y mesas

#### `useCandidates.ts`
```typescript
// Antes
return data.success ? data.data : []

// Después
return Array.isArray(data) ? data : []
```
- ✅ Incluye tipos completos con conteo de líderes

#### `useLeaders.ts`
```typescript
// Antes
return data.success ? data.data : []

// Después
return Array.isArray(data) ? data : []
```
- ✅ Acepta parámetro opcional `candidateId`
- ✅ Incluye tipos completos con conteo de votantes y sublíderes

### 3. Tipos TypeScript Mejorados

Se actualizaron las interfaces de TypeScript en todos los hooks para incluir:
- Información de relaciones (department, municipality, candidate)
- Contadores (`_count`) para estadísticas
- Campos adicionales de los modelos (totalVoters, totalTables, etc.)

## Resultado

### Antes
```
0 Municipios (Bolívar)
639 Puestos de Votación
```

### Después
```
46 Municipios (Bolívar)
639 Puestos de Votación
```

## Archivos Modificados

### Endpoints API
- ✅ `src/app/api/data/candidates/route.ts`
- ✅ `src/app/api/data/leaders/route.ts`
- ✅ `src/app/api/data/municipalities/route.ts` (ya actualizado)
- ✅ `src/app/api/data/polling-stations/route.ts` (ya actualizado)

### Hooks React Query
- ✅ `src/hooks/queries/useCandidates.ts`
- ✅ `src/hooks/queries/useLeaders.ts`
- ✅ `src/hooks/queries/useMunicipalities.ts`
- ✅ `src/hooks/queries/usePollingStations.ts`

## Beneficios Adicionales

1. **Consistencia**: Todos los endpoints ahora usan el mismo formato de respuesta
2. **Tipos mejorados**: Interfaces TypeScript más completas y precisas
3. **Información adicional**: Los endpoints ahora incluyen contadores y relaciones útiles
4. **Mejor performance**: Se incluyen solo los datos necesarios con `select` en las relaciones

## Verificación

Para verificar que todo funciona correctamente:

1. Abrir la página principal: `https://alonsodelrio.org`
2. Verificar que el contador muestre "46 Municipios (Bolívar)"
3. Verificar que el contador muestre "639 Puestos de Votación"
4. Verificar que los dropdowns de registro funcionen correctamente

## Notas Técnicas

### Formato de Respuesta Estándar
Todos los endpoints GET ahora siguen este patrón:
```typescript
// Éxito
return NextResponse.json(data) // Array directo

// Error
return NextResponse.json({
  error: 'Tipo de error',
  message: 'Mensaje descriptivo'
}, { status: statusCode })
```

### Manejo de Errores en Hooks
Todos los hooks ahora validan que la respuesta sea un array:
```typescript
return Array.isArray(data) ? data : []
```

Esto previene errores si el endpoint retorna un formato inesperado.

---

**Fecha:** 18 de febrero de 2026  
**Tipo:** Bug Fix  
**Prioridad:** Alta  
**Estado:** ✅ Resuelto
