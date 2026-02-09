# Design Document - Optimización y Limpieza

## Overview

Este diseño implementa optimizaciones críticas de performance, limpieza de base de datos, eliminación de archivos innecesarios, y preparación para producción. El problema principal identificado es que la base de datos contiene 12,916 puestos de votación y 1,157 municipios cargados innecesariamente, causando que pese más de 3MB con solo 2-3 usuarios reales. La solución incluye limpieza de datos, carga bajo demanda, índices de base de datos, paginación, caché con React Query, y múltiples optimizaciones de código.

## Architecture

### Problema Identificado

```
Base de Datos Actual (3.16 MB):
├── Candidatos: 2
├── Líderes: 2  
├── Votantes: 1
├── Departamentos: 67 ← 66 INNECESARIOS
├── Municipios: 1,157 ← MAYORÍA INNECESARIOS
└── Puestos de Votación: 12,916 ← MAYORÍA INNECESARIOS

Total: 14,145 registros (99.9% son datos geográficos no usados)
```

### Solución Propuesta - Solo Departamento de Bolívar

```
Base de Datos Optimizada (<500 KB):
├── Candidatos: 2
├── Líderes: 2
├── Votantes: 1
├── Departamentos: 1 (SOLO Bolívar)
├── Municipios: ~45 (solo de Bolívar)
└── Puestos: ~600 (solo de Bolívar)

Total: ~650 registros (reducción del 95.4%)
Alcance: Solo departamento de Bolívar
UI: Sin dropdown de departamentos
```

### Arquitectura Simplificada - Solo Bolívar

```
┌─────────────────────────────────────────┐
│         Cliente (React)                 │
│  - React Query para caché               │
│  - Sin selector de departamento         │
│  - Solo municipios de Bolívar           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         API Layer                       │
│  - /api/geo/municipalities (Bolívar)    │
│  - /api/geo/polling-stations/:munId     │
│  - departmentId hardcodeado             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Database                        │
│  - 1 Departamento (Bolívar)             │
│  - ~45 Municipios (Bolívar)             │
│  - ~600 Puestos (Bolívar)               │
│  - Caché: React Query (cliente)         │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Cleanup Script - Solo Bolívar (`/scripts/cleanup-database-bolivar.ts`)

```typescript
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

// Código DANE del departamento de Bolívar
const BOLIVAR_CODE = '13'

interface CleanupReport {
  before: {
    departments: number
    municipalities: number
    pollingStations: number
    voters: number
    totalSize: string
  }
  after: {
    departments: number
    municipalities: number
    pollingStations: number
    voters: number
    totalSize: string
  }
  deleted: {
    departments: number
    municipalities: number
    pollingStations: number
  }
}

async function cleanupDatabaseBolivar(): Promise<CleanupReport> {
  console.log('🧹 Iniciando limpieza - Solo Departamento de Bolívar...\n')
  
  // 1. Crear backup
  console.log('📦 Creando backup...')
  await createBackup()
  
  // 2. Obtener estadísticas iniciales
  const before = await getStats()
  console.log('📊 Estado inicial:', before)
  
  // 3. Obtener ID del departamento de Bolívar
  const bolivar = await prisma.department.findUnique({
    where: { code: BOLIVAR_CODE }
  })
  
  if (!bolivar) {
    throw new Error('Departamento de Bolívar no encontrado en la base de datos')
  }
  
  console.log(`\n🎯 Departamento de Bolívar encontrado: ${bolivar.name} (ID: ${bolivar.id})`)
  
  // 4. Eliminar puestos de votación de otros departamentos
  console.log('\n🗑️  Eliminando puestos de votación de otros departamentos...')
  const deletedPollingStations = await prisma.pollingStation.deleteMany({
    where: {
      municipality: {
        departmentId: { not: bolivar.id }
      }
    }
  })
  console.log(`  ✓ Eliminados: ${deletedPollingStations.count} puestos`)
  
  // 5. Eliminar municipios de otros departamentos
  console.log('\n🗑️  Eliminando municipios de otros departamentos...')
  const deletedMunicipalities = await prisma.municipality.deleteMany({
    where: {
      departmentId: { not: bolivar.id }
    }
  })
  console.log(`  ✓ Eliminados: ${deletedMunicipalities.count} municipios`)
  
  // 6. Eliminar otros departamentos
  console.log('\n🗑️  Eliminando otros departamentos...')
  const deletedDepartments = await prisma.department.deleteMany({
    where: {
      id: { not: bolivar.id }
    }
  })
  console.log(`  ✓ Eliminados: ${deletedDepartments.count} departamentos`)
  
  // 7. Obtener estadísticas finales
  const after = await getStats()
  console.log('\n📊 Estado final:', after)
  
  // 8. Ejecutar VACUUM para reducir tamaño del archivo
  console.log('\n🔧 Ejecutando VACUUM...')
  await prisma.$executeRawUnsafe('VACUUM')
  
  const report: CleanupReport = {
    before,
    after,
    deleted: {
      departments: deletedDepartments.count,
      municipalities: deletedMunicipalities.count,
      pollingStations: deletedPollingStations.count
    }
  }
  
  // 9. Guardar reporte
  fs.writeFileSync(
    'cleanup-report-bolivar.json',
    JSON.stringify(report, null, 2)
  )
  
  console.log('\n✅ Limpieza completada!')
  console.log(`📄 Reporte guardado en: cleanup-report-bolivar.json`)
  console.log(`\n📍 La aplicación ahora trabaja SOLO con el departamento de Bolívar`)
  
  return report
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `prisma/backups/dev-${timestamp}.db`
  
  // Crear carpeta de backups si no existe
  if (!fs.existsSync('prisma/backups')) {
    fs.mkdirSync('prisma/backups', { recursive: true })
  }
  
  // Copiar archivo de base de datos
  fs.copyFileSync('prisma/dev.db', backupPath)
  console.log(`  ✓ Backup creado: ${backupPath}`)
}

async function getStats() {
  const [departments, municipalities, pollingStations, voters] = await Promise.all([
    prisma.department.count(),
    prisma.municipality.count(),
    prisma.pollingStation.count(),
    prisma.voter.count()
  ])
  
  // Obtener tamaño del archivo
  const stats = fs.statSync('prisma/dev.db')
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  
  return {
    departments,
    municipalities,
    pollingStations,
    voters,
    totalSize: `${sizeMB} MB`
  }
}

cleanupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
```

### 2. Geographic Data API - Solo Bolívar (`/src/app/api/geo/`)

#### `/src/app/api/geo/municipalities/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Código DANE del departamento de Bolívar
const BOLIVAR_CODE = '13'

export async function GET() {
  try {
    // Obtener departamento de Bolívar
    const bolivar = await db.department.findUnique({
      where: { code: BOLIVAR_CODE }
    })
    
    if (!bolivar) {
      return NextResponse.json(
        { error: 'Departamento de Bolívar no encontrado' },
        { status: 404 }
      )
    }
    
    // Obtener municipios de Bolívar
    const municipalities = await db.municipality.findMany({
      where: { departmentId: bolivar.id },
      select: {
        id: true,
        name: true,
        code: true,
        departmentId: true
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(municipalities)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching municipalities' },
      { status: 500 }
    )
  }
}
```

#### `/src/app/api/geo/polling-stations/[municipalityId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { municipalityId: string } }
) {
  try {
    const pollingStations = await db.pollingStation.findMany({
      where: { municipalityId: params.municipalityId },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        community: true,
        latitude: true,
        longitude: true,
        municipalityId: true
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(pollingStations)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching polling stations' },
      { status: 500 }
    )
  }
}
```

### 3. Paginated Voters API (`/src/app/api/dashboard/candidate/voters/paginated/route.ts`)

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos por defecto
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

// Query keys - Simplificado para solo Bolívar
export const queryKeys = {
  municipalities: ['municipalities'], // Solo Bolívar
  pollingStations: (municipalityId: string) => ['pollingStations', municipalityId],
  voters: (filters: any) => ['voters', filters],
  candidate: (id: string) => ['candidate', id],
  leader: (id: string) => ['leader', id]
}
```

### 5. Geographic Data Hooks - Solo Bolívar (`/src/hooks/use-geographic-data.ts`)

```typescript
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'

export function useMunicipalities() {
  return useQuery({
    queryKey: queryKeys.municipalities,
    queryFn: async () => {
      const res = await fetch('/api/geo/municipalities')
      if (!res.ok) throw new Error('Failed to fetch municipalities')
      return res.json()
    },
    staleTime: 60 * 60 * 1000 // 1 hora (datos estáticos de Bolívar)
  })
}

export function usePollingStations(municipalityId: string | null) {
  return useQuery({
    queryKey: queryKeys.pollingStations(municipalityId || ''),
    queryFn: async () => {
      if (!municipalityId) return []
      const res = await fetch(`/api/geo/polling-stations/${municipalityId}`)
      if (!res.ok) throw new Error('Failed to fetch polling stations')
      return res.json()
    },
    enabled: !!municipalityId,
    staleTime: 30 * 60 * 1000 // 30 minutos
  })
}
```

### 3. Paginated Voters API (`/src/app/api/dashboard/candidate/voters/paginated/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || user.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const municipalityId = searchParams.get('municipalityId')
    const pollingStationId = searchParams.get('pollingStationId')
    const leaderId = searchParams.get('leaderId')
    const search = searchParams.get('search')
    
    // Construir filtros
    const where: any = {
      leader: {
        candidateId: user.id
      }
    }
    
    if (municipalityId) {
      where.municipalityId = municipalityId
    }
    
    if (pollingStationId) {
      where.pollingStationId = pollingStationId
    }
    
    if (leaderId) {
      where.leaderId = leaderId
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { document: { contains: search } }
      ]
    }
    
    // Obtener total de registros
    const total = await db.voter.count({ where })
    
    // Obtener página de datos
    const voters = await db.voter.findMany({
      where,
      include: {
        leader: {
          select: {
            id: true,
            name: true
          }
        },
        municipality: {
          select: {
            id: true,
            name: true
          }
        },
        pollingStation: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    
    return NextResponse.json({
      data: voters,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching voters' },
      { status: 500 }
    )
  }
}
```

### 7. Database Schema Updates (`prisma/schema.prisma`)

```prisma
// Agregar índices para optimización
model Voter {
  // ... campos existentes
  
  @@index([document])
  @@index([municipalityId])
  @@index([pollingStationId])
  @@index([leaderId])
  @@index([name])
}

model Leader {
  // ... campos existentes
  
  @@index([candidateId])
  @@index([document])
}

model PollingStation {
  // ... campos existentes
  
  @@index([municipalityId])
  @@index([code])
  @@index([municipalityId, code])
}

model Municipality {
  // ... campos existentes
  
  @@index([departmentId])
  @@index([code])
}

// Eliminar modelo DocumentIndex (no se usa)
// model DocumentIndex { ... } ← ELIMINAR
```

## Data Models

### Geographic Data Structure - Solo Bolívar

```typescript
interface Department {
  id: string
  name: 'Bolívar' // Solo este departamento
  code: '13' // Código DANE de Bolívar
}

interface Municipality {
  id: string
  name: string
  code: string
  departmentId: string // Siempre será el ID de Bolívar
}

interface PollingStation {
  id: string
  name: string
  code: string
  address: string | null
  community: string | null
  latitude: number | null
  longitude: number | null
  municipalityId: string // Municipio de Bolívar
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Database Cleanup Preserves Bolívar Data
*For any* cleanup operation, the department of Bolívar and all its municipalities and polling stations should remain in the database after cleanup.
**Validates: Requirements 2.1, 2.3, 2.4**

### Property 2: Only Bolívar Data Remains
*For any* query after cleanup, all departments, municipalities, and polling stations should belong to Bolívar (code '13').
**Validates: Requirements 2.2, 2.5, 2.6**

### Property 3: Pagination Correctness
*For any* paginated query with page P and pageSize S, the returned data should contain at most S items, and the total count should match the actual number of records.
**Validates: Requirements 6.2, 6.3**

### Property 4: Search Accuracy
*For any* search query Q, all returned results should contain Q in either the name or document field.
**Validates: Requirements 7.2, 7.3**

### Property 5: Cache Invalidation
*For any* cached geographic data, when the underlying data changes, the cache should be invalidated within the configured staleTime.
**Validates: Requirements 9.5**

### Property 6: Index Performance Improvement
*For any* indexed query, the query execution time should be significantly faster than the same query without indexes.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 7: File Cleanup Safety
*For any* file deletion operation, only files matching the specified patterns should be deleted, and no source code files should be removed.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 8: Database Size Reduction
*For any* database after cleanup containing only Bolívar data, the file size should be less than 500KB.
**Validates: Requirements 2.9**

### Property 9: No Department Selector Needed
*For any* form or filter in the UI, there should be no department selector, only municipality selector.
**Validates: Requirements 3.1, 3.2**

### Property 10: React Query Cache Efficiency
*For any* repeated query within the staleTime window, the data should be served from cache without making a network request.
**Validates: Requirements 8.5, 8.6, 9.4**

## Error Handling

### Database Cleanup Errors

```typescript
// Backup failed
{
  error: 'Backup failed',
  message: 'No se pudo crear backup de la base de datos'
}

// Cleanup failed
{
  error: 'Cleanup failed',
  message: 'Error durante la limpieza. La base de datos no fue modificada.',
  details: error.message
}
```

### Geographic Data Errors

```typescript
// CSV not found
{
  error: 'CSV not found',
  message: 'Archivo de datos geográficos no encontrado'
}

// Invalid department/municipality
{
  error: 'Not found',
  message: 'Departamento/Municipio no encontrado'
}
```

## Testing Strategy

### Unit Tests

- Funciones de lectura de CSV
- Funciones de limpieza de base de datos
- Hooks de React Query
- Utilidades de paginación

### Integration Tests

- Flujo completo de carga de datos geográficos
- Flujo de limpieza de base de datos
- Paginación de votantes
- Búsqueda de votantes
- Caché de React Query

### Property-Based Tests

1. **Test Database Cleanup Preserves Bolívar Data**: Ejecutar limpieza, verificar que Bolívar y sus datos permanecen
2. **Test Only Bolívar Data Remains**: Después de limpieza, verificar que todos los datos son de Bolívar
3. **Test Pagination Correctness**: Generar datasets aleatorios, paginar, verificar que no hay duplicados ni faltantes
4. **Test Search Accuracy**: Generar búsquedas aleatorias, verificar que todos los resultados coinciden
5. **Test Cache Invalidation**: Realizar queries, modificar datos, verificar invalidación
6. **Test Index Performance**: Comparar tiempos de query con y sin índices
7. **Test File Cleanup Safety**: Ejecutar limpieza, verificar que solo se eliminan archivos correctos
8. **Test Database Size Reduction**: Ejecutar limpieza, verificar reducción a <500KB
9. **Test No Department Selector**: Verificar que UI no tiene selector de departamento
10. **Test React Query Cache Efficiency**: Realizar queries repetidas, verificar que no hay requests duplicados

### Performance Tests

- Medir tiempo de carga de página con paginación vs sin paginación
- Medir tiempo de búsqueda con índices vs sin índices
- Medir tamaño de bundle antes y después de optimizaciones
- Medir uso de memoria con caché de React Query

## Implementation Notes

### Database Cleanup Process - Solo Bolívar

1. **Backup**: Siempre crear backup antes de modificar
2. **Identificar Bolívar**: Obtener departamento con código '13'
3. **Eliminar en orden**: Primero puestos, luego municipios, luego departamentos
4. **VACUUM**: Ejecutar para reducir tamaño de archivo
5. **Verificar**: Confirmar que solo queda Bolívar

### UI Simplification

- **Eliminar dropdown de departamentos** de todos los formularios
- **Hardcodear departmentId** de Bolívar en queries
- **Simplificar filtros** en reportes y búsquedas
- **Actualizar documentación** para reflejar alcance solo Bolívar

### React Query Configuration

```typescript
// Tiempos de caché recomendados - Solo Bolívar
- Municipios: 1 hora (datos estáticos de Bolívar)
- Puestos: 30 minutos (cambian raramente)
- Votantes: 1 minuto (cambian frecuentemente)
- Estadísticas: 30 segundos (tiempo real)
```

### Performance Optimizations

1. **Índices de base de datos**: Reducen queries de segundos a milisegundos
2. **Paginación**: Reduce carga inicial de 12,916 registros a 50
3. **Caché**: Elimina requests redundantes
4. **Code splitting**: Reduce bundle inicial
5. **Lazy loading**: Carga componentes bajo demanda

### Migration Path - Solo Bolívar

```
1. Ejecutar script de análisis (analyze-db.ts)
2. Crear backup de base de datos
3. Ejecutar script de limpieza (cleanup-database-bolivar.ts)
4. Agregar índices (migración de Prisma)
5. Implementar APIs de datos geográficos (sin departamentos)
6. Implementar React Query
7. Actualizar componentes para eliminar selector de departamento
8. Hardcodear departmentId de Bolívar en queries
9. Eliminar archivos innecesarios
10. Configurar ESLint
11. Preparar para producción
```

### Geographic Scope

**IMPORTANTE**: La aplicación está diseñada exclusivamente para el **departamento de Bolívar, Colombia**.

- No hay selector de departamentos en la UI
- Todos los municipios son de Bolívar
- Todos los puestos de votación son de Bolívar
- El código DANE de Bolívar es '13'
- Si en el futuro se requiere expandir a otros departamentos, se puede usar el archivo CSV como fuente de datos

---

**Versión**: 1.0.0
**Fecha**: 23 de enero de 2026
