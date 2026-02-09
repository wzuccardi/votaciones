# Design Document - Sistema de Reportes PDF

## Overview

Este diseño implementa un sistema completo de generación de reportes en PDF usando jsPDF y jspdf-autotable, con capacidades de filtrado geográfico avanzado, exportación a múltiples formatos (PDF, CSV, Excel), branding personalizado, y optimización para reportes grandes. El sistema permite a líderes generar reportes de sus votantes y a candidatos generar reportes con múltiples niveles de detalle y filtros.

## Architecture

### Flujo de Generación de Reportes

```
Usuario → Interfaz de Reportes → Seleccionar Filtros → API Endpoint
                                                              ↓
                                                    Validar Permisos
                                                              ↓
                                                    Consultar Base de Datos
                                                              ↓
                                                    Obtener Branding
                                                              ↓
                                                    Generar PDF/CSV/Excel
                                                              ↓
                                                    Retornar Archivo
                                                              ↓
                                                    Guardar en Historial
```

### Arquitectura de Capas

```
┌─────────────────────────────────────────┐
│         UI Layer                        │
│  - Interfaz de filtros                  │
│  - Vista previa de datos                │
│  - Botones de descarga                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         API Layer                       │
│  - Endpoints de reportes                │
│  - Validación de permisos               │
│  - Procesamiento de filtros             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  - PDF Generator                        │
│  - CSV/Excel Exporter                   │
│  - Branding Service                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  - Prisma queries                       │
│  - Filtros geográficos                  │
│  - Agregaciones                         │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PDF Utilities (`/src/lib/pdf-utils.ts`)

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface BrandingConfig {
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  partyName: string
  candidateName: string
}

interface ReportHeader {
  title: string
  subtitle?: string
  date: Date
}

export class PDFGenerator {
  private doc: jsPDF
  private branding: BrandingConfig
  
  constructor(branding: BrandingConfig) {
    this.doc = new jsPDF()
    this.branding = branding
  }
  
  addHeader(header: ReportHeader): void {
    // Agregar logo si existe
    // Agregar título con color primario
    // Agregar subtítulo
    // Agregar fecha de generación
  }
  
  addFooter(pageNumber: number, totalPages: number): void {
    // Agregar nombre del partido
    // Agregar número de página
    // Agregar fecha
  }
  
  addTable(headers: string[], data: any[][], title?: string): void {
    // Usar autoTable con branding
    // Aplicar colores del candidato
    // Agregar título de tabla si existe
  }
  
  addStatistics(stats: Record<string, number>): void {
    // Agregar sección de estadísticas
    // Formato de tarjetas con números grandes
  }
  
  save(filename: string): void {
    this.doc.save(filename)
  }
  
  getBlob(): Blob {
    return this.doc.output('blob')
  }
}
```

### 2. Report Service (`/src/lib/report-service.ts`)

```typescript
import { db } from './db'
import { PDFGenerator } from './pdf-utils'

export interface ReportFilters {
  departmentId?: string
  municipalityId?: string
  pollingStationId?: string
  tableNumber?: string
  leaderId?: string
  dateFrom?: Date
  dateTo?: Date
}

export class ReportService {
  async generateLeaderReport(leaderId: string): Promise<Blob> {
    // Obtener votantes del líder
    // Obtener branding del candidato
    // Generar PDF con PDFGenerator
    // Retornar blob
  }
  
  async generateCandidateFullReport(candidateId: string): Promise<Blob> {
    // Obtener todos los líderes y votantes
    // Calcular estadísticas
    // Generar PDF con desglose por líder
  }
  
  async generateCandidateLeadersReport(candidateId: string): Promise<Blob> {
    // Obtener solo líderes con estadísticas
    // Generar PDF con tabla de líderes
  }
  
  async generateZoneReport(
    candidateId: string,
    filters: ReportFilters
  ): Promise<Blob> {
    // Filtrar por zona/comuna
    // Agrupar por zona
    // Generar PDF con desglose por zona
  }
  
  async generatePollingStationReport(
    candidateId: string,
    pollingStationId: string
  ): Promise<Blob> {
    // Obtener datos del puesto
    // Obtener votantes en ese puesto
    // Generar PDF con distribución por mesas
  }
  
  async generateTableReport(
    candidateId: string,
    pollingStationId: string,
    tableNumber: string
  ): Promise<Blob> {
    // Obtener votantes en esa mesa
    // Obtener líderes responsables
    // Generar PDF detallado
  }
  
  async generateComparativeReport(
    candidateId: string,
    locations: string[]
  ): Promise<Blob> {
    // Obtener datos de múltiples ubicaciones
    // Generar tabla comparativa
    // Agregar gráficas
  }
}
```

### 3. Export Service (`/src/lib/export-service.ts`)

```typescript
export class ExportService {
  exportToCSV(data: any[], filename: string): void {
    // Convertir datos a CSV
    // Descargar archivo
  }
  
  exportToExcel(data: any[], filename: string): void {
    // Usar librería como xlsx
    // Crear workbook con formato
    // Descargar archivo
  }
}
```

### 4. API Endpoints

#### `/src/app/api/reports/leader/voters/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { ReportService } from '@/lib/report-service'

export async function GET(req: NextRequest) {
  try {
    // Validar autenticación
    const user = await getAuthenticatedUser()
    if (!user || user.role !== 'leader') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Generar reporte
    const reportService = new ReportService()
    const pdfBlob = await reportService.generateLeaderReport(user.id)
    
    // Retornar PDF
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="votantes-${user.id}.pdf"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error generating report' }, { status: 500 })
  }
}
```

#### `/src/app/api/reports/candidate/full/route.ts`

```typescript
export async function GET(req: NextRequest) {
  // Similar estructura
  // Validar que user.role === 'candidate'
  // Generar reporte completo
}
```

#### `/src/app/api/reports/candidate/by-zone/route.ts`

```typescript
export async function POST(req: NextRequest) {
  // Recibir filtros en body
  // Validar permisos
  // Generar reporte filtrado
}
```

### 5. UI Components

#### Reports Dashboard (`/src/app/dashboard/candidate/reports/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

export default function ReportsPage() {
  const { data: session } = useSession()
  const [filters, setFilters] = useState({
    departmentId: '',
    municipalityId: '',
    pollingStationId: '',
    tableNumber: '',
    leaderId: '',
    dateFrom: null,
    dateTo: null
  })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  
  const handleGenerateReport = async (type: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/candidate/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-${type}-${Date.now()}.pdf`
      a.click()
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Generador de Reportes</h1>
      
      {/* Filtros */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Select
          label="Departamento"
          value={filters.departmentId}
          onChange={(value) => setFilters({ ...filters, departmentId: value })}
        />
        <Select
          label="Municipio"
          value={filters.municipalityId}
          onChange={(value) => setFilters({ ...filters, municipalityId: value })}
        />
        <Select
          label="Puesto de Votación"
          value={filters.pollingStationId}
          onChange={(value) => setFilters({ ...filters, pollingStationId: value })}
        />
      </div>
      
      {/* Botones de generación */}
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => handleGenerateReport('full')} disabled={loading}>
          Reporte Completo
        </Button>
        <Button onClick={() => handleGenerateReport('leaders')} disabled={loading}>
          Solo Líderes
        </Button>
        <Button onClick={() => handleGenerateReport('by-zone')} disabled={loading}>
          Por Zona
        </Button>
        <Button onClick={() => handleGenerateReport('by-polling-station')} disabled={loading}>
          Por Puesto
        </Button>
      </div>
      
      {/* Vista previa */}
      {preview && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Vista Previa</h2>
          {/* Tabla con datos */}
        </div>
      )}
      
      {/* Indicador de progreso */}
      {loading && (
        <div className="mt-6">
          <p>Generando reporte...</p>
          {/* Progress bar */}
        </div>
      )}
    </div>
  )
}
```

## Data Models

### Report History Model

```prisma
model Report {
  id          String   @id @default(cuid())
  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id])
  type        String   // 'full', 'leaders', 'by-zone', etc.
  filters     Json     // Filtros aplicados
  filename    String
  createdAt   DateTime @default(now())
  
  @@index([candidateId])
  @@index([createdAt])
}
```

### Report Data Structures

```typescript
interface VoterReportData {
  id: string
  document: string
  name: string
  phone: string
  municipality: string
  pollingStation: string
  tableNumber: string
  zone?: string
  leaderName: string
  registeredAt: Date
}

interface LeaderReportData {
  id: string
  document: string
  name: string
  phone: string
  votersCount: number
  municipalities: string[]
  registeredAt: Date
}

interface ZoneStatistics {
  zoneName: string
  leadersCount: number
  votersCount: number
  pollingStations: number
  coverage: number // Porcentaje
}

interface ComparativeData {
  location: string
  leadersCount: number
  votersCount: number
  coverage: number
  rank: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Leader Report Data Isolation
*For any* líder L, generating a report should return only voters where voter.leaderId = L.id.
**Validates: Requirements 2.2**

### Property 2: Candidate Report Completeness
*For any* candidato C, generating a full report should include all leaders where leader.candidateId = C.id and all voters where voter.leader.candidateId = C.id.
**Validates: Requirements 3.2, 3.3**

### Property 3: Geographic Filter Accuracy
*For any* report with geographic filters F, all returned data should match the filter criteria (departmentId, municipalityId, pollingStationId).
**Validates: Requirements 5.2, 6.2, 7.2**

### Property 4: Branding Consistency
*For any* generated report, if the candidate has branding configured, the PDF should include the logo and use the specified colors.
**Validates: Requirements 12.2, 12.3, 12.4**

### Property 5: Report Permission Validation
*For any* report request, if the user is not authenticated or does not have permission, the system should return 401 or 403.
**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

### Property 6: Data Ordering Consistency
*For any* voter report, voters should be ordered alphabetically by name.
**Validates: Requirements 2.6**

### Property 7: Leader Ranking Accuracy
*For any* leaders report, leaders should be ordered by votersCount in descending order.
**Validates: Requirements 3.7, 4.6**

### Property 8: Zone Aggregation Correctness
*For any* zone report, the total votersCount for a zone should equal the sum of voters in that zone across all leaders.
**Validates: Requirements 5.4, 5.5**

### Property 9: Comparative Data Accuracy
*For any* comparative report with locations L1, L2, ..., Ln, each location's statistics should match individual reports for those locations.
**Validates: Requirements 8.3, 8.4**

### Property 10: Export Format Equivalence
*For any* dataset D, exporting to CSV, Excel, and PDF should contain the same data (though formatted differently).
**Validates: Requirements 10.3, 10.4**

## Error Handling

### Report Generation Errors

```typescript
// No data available
{
  error: 'No data',
  message: 'No hay datos disponibles para este reporte'
}

// Permission denied
{
  error: 'Forbidden',
  message: 'No tienes permisos para generar este reporte'
}

// Report too large
{
  error: 'Report too large',
  message: 'El reporte es demasiado grande. Por favor aplica filtros adicionales.',
  maxRecords: 5000,
  currentRecords: 7500
}

// Generation failed
{
  error: 'Generation failed',
  message: 'Error al generar el reporte. Por favor intenta nuevamente.'
}
```

### Error Handling Strategy

1. **Client-side**: Mostrar toast notifications para errores
2. **Server-side**: Registrar errores detallados en logs
3. **Retry**: Permitir reintentar después de errores temporales
4. **Validation**: Validar filtros antes de generar reporte
5. **Limits**: Aplicar límites de tamaño y sugerir filtros

## Testing Strategy

### Unit Tests

- Generar PDFs con diferentes configuraciones de branding
- Validar formato de tablas en PDFs
- Probar funciones de exportación a CSV/Excel
- Validar cálculos de estadísticas
- Probar funciones de filtrado

### Integration Tests

- Flujo completo de generación de reporte de líder
- Flujo completo de generación de reporte de candidato
- Validación de permisos en endpoints
- Generación con diferentes filtros geográficos
- Exportación a múltiples formatos

### Property-Based Tests

1. **Test Leader Report Data Isolation**: Crear múltiples líderes con votantes, generar reporte para cada líder, verificar que solo contiene sus votantes
2. **Test Candidate Report Completeness**: Crear candidato con líderes y votantes, generar reporte completo, verificar que incluye todos
3. **Test Geographic Filter Accuracy**: Generar reportes con filtros aleatorios, verificar que todos los datos cumplen los filtros
4. **Test Branding Consistency**: Generar reportes con diferentes configuraciones de branding, verificar que se aplican correctamente
5. **Test Report Permission Validation**: Intentar generar reportes sin autenticación o con permisos incorrectos, verificar errores 401/403
6. **Test Data Ordering Consistency**: Generar reportes de votantes, verificar orden alfabético
7. **Test Leader Ranking Accuracy**: Generar reportes de líderes, verificar orden por cantidad de votantes
8. **Test Zone Aggregation Correctness**: Generar reportes por zona, verificar que totales coinciden con suma de partes
9. **Test Comparative Data Accuracy**: Generar reportes comparativos y reportes individuales, verificar que datos coinciden
10. **Test Export Format Equivalence**: Exportar mismos datos a PDF, CSV y Excel, verificar que contienen la misma información

### Manual Testing Checklist

- [ ] Generar reporte de líder y verificar que solo incluye sus votantes
- [ ] Generar reporte completo de candidato y verificar estadísticas
- [ ] Generar reporte por zona y verificar filtrado correcto
- [ ] Generar reporte por puesto de votación
- [ ] Generar reporte por mesa de votación
- [ ] Generar reporte comparativo con múltiples ubicaciones
- [ ] Exportar a CSV y verificar formato
- [ ] Exportar a Excel y verificar formato
- [ ] Verificar que branding se aplica correctamente
- [ ] Intentar generar reporte sin permisos (debe fallar)
- [ ] Generar reporte grande y verificar paginación
- [ ] Verificar historial de reportes

## Implementation Notes

### Dependencies

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "xlsx": "^0.18.5"
  }
}
```

### PDF Generation Best Practices

1. **Memory Management**: Para reportes grandes, generar en chunks
2. **Fonts**: Usar fuentes embebidas para caracteres especiales (tildes)
3. **Images**: Optimizar logos antes de incluir en PDF
4. **Colors**: Convertir colores hex a RGB para jsPDF
5. **Tables**: Usar autoTable para tablas complejas con paginación automática

### Performance Considerations

- **Caching**: Cachear datos geográficos (departamentos, municipios)
- **Pagination**: Implementar paginación en queries para reportes grandes
- **Streaming**: Considerar streaming para reportes muy grandes
- **Async**: Generar reportes de forma asíncrona para no bloquear UI
- **Limits**: Aplicar límites razonables (5000 registros máximo)

### Geographic Data Structure

```typescript
interface GeographicHierarchy {
  department: {
    id: string
    name: string
  }
  municipality: {
    id: string
    name: string
    departmentId: string
  }
  pollingStation: {
    id: string
    name: string
    address: string
    municipalityId: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  table: {
    number: string
    pollingStationId: string
  }
}
```

---

**Versión**: 1.0.0
**Fecha**: 23 de enero de 2026
