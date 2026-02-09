# Design Document - Sistema de Testigos Electorales

## Overview

Sistema completo de gestión de testigos electorales que permite a los líderes designar votantes como testigos, asignarles mesas específicas, y generar reportes de cobertura. Incluye dashboard de monitoreo, comunicación automática, y reportes de priorización de mesas.

## Architecture

### Flujo Principal del Sistema

```
Líder → Analiza Reporte de Mesas → Designa Testigos → Asigna Mesas → Comunica → Monitorea
                    ↓                      ↓              ↓            ↓          ↓
            Priorización por      Modal de        Multi-selector   SMS/WhatsApp  Dashboard
            cantidad votantes     Asignación      de mesas         automático    de cobertura
```

### Arquitectura de Componentes

```
┌───ss  ElectoralWitness?
  canBeWitness      Boolean @default(true)
}

// Actualizar modelo Leader
model Leader {
  // ... campos existentes
  electoralWitnesses ElectoralWitness[]
}

// Actualizar modelo PollingStation
model PollingStation {
  // ... campos existentes
  electoralWitnesses ElectoralWitness[]
}
```

---

Este diseño implementa completamente el sistema de testigos electorales con todas las mejoras sugeridas. ¿Te parece bien empezar a implementarlo paso a paso?ncyContact  String?
  notes             String?
  confirmedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([leaderId])
  @@index([pollingStationId])
  @@index([status])
}

enum WitnessStatus {
  ASSIGNED
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum ExperienceLevel {
  FIRST_TIME
  EXPERIENCED
}

enum Availability {
  FULL_DAY
  MORNING
  AFTERNOON
}

// Actualizar modelo Voter
model Voter {
  // ... campos existentes
  electoralWitneaderId          String
  leader            Leader   @relation(fields: [leaderId], references: [id], onDelete: Cascade)
  pollingStationId  String
  pollingStation    PollingStation @relation(fields: [pollingStationId], references: [id])
  assignedTables    Json     // Array de números: [5, 8, 15, 20]
  status            WitnessStatus @default(ASSIGNED)
  experience        ExperienceLevel @default(FIRST_TIME)
  availability      Availability @default(FULL_DAY)
  hasTransport      Boolean  @default(false)
  emergedashboard del líder, agregar:
<Button 
  variant="ghost" 
  size="sm" 
  onClick={() => window.location.href = '/dashboard/leader/testigos'}
>
  <Users className="w-4 h-4 mr-2" />
  Testigos
</Button>
```

## Database Migration

### Prisma Schema Update:

```prisma
// Agregar al schema.prisma existente:

model ElectoralWitness {
  id                String   @id @default(cuid())
  voterId           String   @unique
  voter             Voter    @relation(fields: [voterId], references: [id], onDelete: Cascade)
  lernal.pageSize.getHeight() - 15, 196, doc.internal.pageSize.getHeight() - 15)
    
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Plan de Testigos - ${leaderName} | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  doc.save(`Plan_Testigos_${leaderName.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}
```

## Navigation Updates

### Agregar nueva ruta en el menú del líder:

```typescript
// En el header del   })
  
  // Contactos de emergencia
  doc.setFontSize(14)
  doc.text('Contactos de Emergencia', 14, yPos + 15)
  
  doc.setFontSize(11)
  doc.text(`Líder: ${leaderName}`, 14, yPos + 25)
  doc.text('Coordinador de Campaña: [Número]', 14, yPos + 32)
  doc.text('Línea de Emergencia: [Número]', 14, yPos + 39)
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(14, doc.inteor del puesto con su cédula',
    '3. Ubicarse cerca de las mesas asignadas sin interferir',
    '4. Observar el proceso de votación y conteo',
    '5. Reportar cualquier irregularidad al líder inmediatamente',
    '6. Permanecer hasta el cierre y conteo final',
    '7. Tomar fotos del acta de escrutinio (si es permitido)',
    '8. Reportar resultados al líder al finalizar'
  ]
  
  let yPos = 35
  doc.setFontSize(11)
  instructions.forEach(instruction => {
    doc.text(instruction, 14, yPos)
    yPos += 8
lColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  })
  
  // Nueva página para instrucciones
  doc.addPage()
  
  doc.setFontSize(18)
  doc.setTextColor(40, 40, 40)
  doc.text('Instrucciones para Testigos', 14, 20)
  
  const instructions = [
    '1. Llegar al puesto de votación 30 minutos antes del inicio (7:30 AM)',
    '2. Presentarse con el coordinadestigos Asignados', 14, 125)
  
  const witnessData = witnesses.map(witness => [
    witness.voter.name,
    witness.voter.document,
    witness.pollingStation.name,
    witness.assignedTables.join(', '),
    witness.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente',
    witness.voter.celular || witness.voter.tel || 'N/A'
  ])
  
  autoTable(doc, {
    startY: 130,
    head: [['Nombre', 'Cédula', 'Puesto', 'Mesas', 'Estado', 'Teléfono']],
    body: witnessData,
    theme: 'grid',
    headStyles: { 
      filetTextColor(40, 40, 40)
  doc.text('Resumen Ejecutivo', 14, 85)
  
  doc.setFontSize(11)
  doc.text(`Total de Testigos: ${witnesses.length}`, 14, 95)
  
  const totalTables = witnesses.reduce((sum, w) => sum + w.assignedTables.length, 0)
  doc.text(`Total de Mesas Cubiertas: ${totalTables}`, 14, 102)
  
  const pollingStations = new Set(witnesses.map(w => w.pollingStationId)).size
  doc.text(`Puestos de Votación: ${pollingStations}`, 14, 109)
  
  // Tabla de testigos
  doc.setFontSize(14)
  doc.text('Lista de Ta 103', 105, 28, { align: 'center' })
  doc.setFontSize(11)
  doc.text('Partido Conservador - Es Confianza', 105, 35, { align: 'center' })
  
  // Información del líder
  doc.setFontSize(12)
  doc.setTextColor(60, 60, 60)
  doc.text(`Líder Responsable: ${leaderName}`, 14, 65)
  
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.text(`Fecha de generación: ${fecha}`, 14, 72)
  
  // Resumen ejecutivo
  doc.setFontSize(16)
  doc.sm 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateWitnessPlan(witnesses: any[], leaderName: string) {
  const doc = new jsPDF()
  
  // Header con branding
  const primaryBlue = [37, 99, 235]
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
  doc.rect(0, 0, 210, 50, 'F')
  
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text('Plan de Testigos Electorales', 105, 18, { align: 'center' })
  
  doc.setFontSize(14)
  doc.text('Alonso del Río - Cámarrs > 50 ? 'HIGH' : 'MEDIUM'
      }))

    return NextResponse.json({
      success: true,
      data: {
        coverageByStation: validCoverage,
        totalStats,
        criticalGaps
      }
    })
  } catch (error) {
    console.error('Error analyzing coverage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Reports Integration

### Nuevo Reporte: Plan de Testigos Electorales

#### `/src/lib/witness-pdf-generator.ts`

```typescript
import jsPDF fro.witnesses, 0)
    }

    totalStats.coveragePercentage = Math.round(
      (totalStats.coveredTables / totalStats.totalTables) * 100
    )

    // Identificar brechas críticas
    const criticalGaps = validCoverage
      .filter(station => station.coveragePercentage < 50)
      .map(station => ({
        pollingStation: station.pollingStation.name,
        coveragePercentage: station.coveragePercentage,
        uncoveredTables: station.totalTables - station.coveredTables,
        priority: station.totalVote const validCoverage = coverageAnalysis.filter(Boolean)

    // Calcular estadísticas generales
    const totalStats = {
      totalPollingStations: validCoverage.length,
      totalVoters: validCoverage.reduce((sum, station) => sum + station.totalVoters, 0),
      totalTables: validCoverage.reduce((sum, station) => sum + station.totalTables, 0),
      coveredTables: validCoverage.reduce((sum, station) => sum + station.coveredTables, 0),
      totalWitnesses: validCoverage.reduce((sum, station) => sum + stationMath.random() * 20) + 5 > 15 ? 'HIGH' : 'MEDIUM'
        })).sort((a, b) => b.votersCount - a.votersCount)

        return {
          pollingStation: voter.pollingStation,
          totalVoters: votersInStation,
          totalTables: tables.length,
          coveredTables: coveredTables.size,
          coveragePercentage: Math.round((coveredTables.size / tables.length) * 100),
          witnesses: witnesses.length,
          tablesByPriority,
          witnessDetails: witnesses
        }
      })
    )

       witnesses.forEach(witness => {
          (witness.assignedTables as number[]).forEach(table => {
            coveredTables.add(table)
          })
        })

        // Identificar mesas con más votantes (simulado - necesitarías datos reales)
        const tablesByPriority = tables.map(table => ({
          number: parseInt(table.number),
          votersCount: Math.floor(Math.random() * 20) + 5, // Simulado
          hasWitness: coveredTables.has(parseInt(table.number)),
          priority: Math.floor(ionId: voter.pollingStationId },
          select: { number: true }
        })

        // Obtener testigos asignados en este puesto
        const witnesses = await db.electoralWitness.findMany({
          where: {
            leaderId,
            pollingStationId: voter.pollingStationId
          },
          include: {
            voter: {
              select: { name: true, document: true }
            }
          }
        })

        // Calcular mesas cubiertas
        const coveredTables = new Set()
    ra
    const coverageAnalysis = await Promise.all(
      votersWithPollingStations.map(async (voter) => {
        if (!voter.pollingStationId) return null

        // Contar votantes del líder en este puesto
        const votersInStation = await db.voter.count({
          where: {
            leaderId,
            pollingStationId: voter.pollingStationId
          }
        })

        // Obtener mesas disponibles en este puesto
        const tables = await db.table.findMany({
          where: { pollingStats: 401 })
    }

    const leaderId = (session.user as any).id

    // Obtener todos los puestos donde el líder tiene votantes
    const votersWithPollingStations = await db.voter.findMany({
      where: { leaderId },
      select: {
        pollingStationId: true,
        pollingStation: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      distinct: ['pollingStationId']
    })

    // Para cada puesto, obtener análisis de cobertuoverage Analysis API

#### `/src/app/api/dashboard/leader/witnesses/coverage/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'leader') {
      return NextResponse.json({ error: 'Unauthorized' }, { statu: witnessId, leaderId }
    })

    if (!witness) {
      return NextResponse.json({ 
        error: 'Testigo no encontrado' 
      }, { status: 404 })
    }

    await db.electoralWitness.delete({
      where: { id: witnessId }
    })

    return NextResponse.json({
      success: true,
      message: 'Testigo eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting witness:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 2. C || (session.user as any).role !== 'leader') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leaderId = (session.user as any).id
    const { searchParams } = new URL(req.url)
    const witnessId = searchParams.get('witnessId')

    if (!witnessId) {
      return NextResponse.json({ error: 'witnessId is required' }, { status: 400 })
    }

    // Verificar que el testigo pertenece al líder
    const witness = await db.electoralWitness.findFirst({
      where: { iddata: updateData,
      include: {
        voter: true,
        pollingStation: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedWitness
    })
  } catch (error) {
    console.error('Error updating witness:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Eliminar testigo
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user }

    const leaderId = (session.user as any).id
    const body = await req.json()
    const { witnessId, ...updateData } = body

    // Verificar que el testigo pertenece al líder
    const witness = await db.electoralWitness.findFirst({
      where: { id: witnessId, leaderId }
    })

    if (!witness) {
      return NextResponse.json({ 
        error: 'Testigo no encontrado' 
      }, { status: 404 })
    }

    const updatedWitness = await db.electoralWitness.update({
      where: { id: witnessId },
      extResponse.json({
      success: true,
      data: witness
    })
  } catch (error) {
    console.error('Error creating witness:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Actualizar testigo
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'leader') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   ({ 
        error: 'Este votante ya está asignado como testigo' 
      }, { status: 400 })
    }

    // Crear testigo electoral
    const witness = await db.electoralWitness.create({
      data: {
        voterId,
        leaderId,
        pollingStationId,
        assignedTables,
        experience,
        availability,
        hasTransport,
        emergencyContact,
        notes,
        status: 'ASSIGNED'
      },
      include: {
        voter: true,
        pollingStation: true
      }
    })

    return N status: 400 })
    }

    // Verificar que el votante pertenece al líder
    const voter = await db.voter.findFirst({
      where: { id: voterId, leaderId }
    })

    if (!voter) {
      return NextResponse.json({ 
        error: 'Votante no encontrado o no pertenece a este líder' 
      }, { status: 404 })
    }

    // Verificar que no sea ya un testigo
    const existingWitness = await db.electoralWitness.findUnique({
      where: { voterId }
    })

    if (existingWitness) {
      return NextResponse.json{ error: 'Unauthorized' }, { status: 401 })
    }

    const leaderId = (session.user as any).id
    const body = await req.json()
    
    const {
      voterId,
      pollingStationId,
      assignedTables,
      experience,
      availability,
      hasTransport,
      emergencyContact,
      notes
    } = body

    // Validaciones
    if (!voterId || !pollingStationId || !assignedTables || assignedTables.length === 0) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos' 
      }, {ationId)).size
    }

    return NextResponse.json({
      success: true,
      data: witnesses,
      stats
    })
  } catch (error) {
    console.error('Error fetching witnesses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Asignar nuevo testigo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'leader') {
      return NextResponse.json(electoralWitness.findMany({
      where: { leaderId },
      include: {
        voter: true,
        pollingStation: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calcular estadísticas
    const stats = {
      totalWitnesses: witnesses.length,
      confirmedWitnesses: witnesses.filter(w => w.status === 'CONFIRMED').length,
      totalTables: witnesses.reduce((acc, w) => acc + (w.assignedTables as number[]).length, 0),
      pollingStationsCovered: new Set(witnesses.map(w => w.pollingSt from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Obtener testigos del líder
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'leader') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leaderId = (session.user as any).id
    
    const witnesses = await db.
  </Button>
  <Button size="sm" variant="destructive" onClick={() => handleDeleteVoter(voter.id)}>
    Eliminar
  </Button>
  <Button 
    size="sm" 
    variant="default" 
    onClick={() => openWitnessAssignment(voter)}
    className="bg-amber-600 hover:bg-amber-700"
  >
    <Star className="w-4 h-4 mr-1" />
    Designar Testigo
  </Button>
</div>
```

## API Endpoints

### 1. Witness Management API

#### `/src/app/api/dashboard/leader/witnesses/route.ts`

```typescript
import { NextRequest, NextResponse }"w-4 h-4 mr-2" />
                  Asignar Testigo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 3. Modificación al Dashboard del Líder

#### Agregar botón "Designar Testigo" a cada votante:

```typescript
// En src/app/dashboard/leader/page.tsx
// Agregar al final de cada tarjeta de votante:

<div className="flex gap-2 mt-2">
  <Button size="sm" variant="outline" onClick={() => openEditVoter(voter)}>
    Editarant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <CheckCircle className=s de validación:</h4>
                    <ul className="list-disc list-inside text-sm text-destructive mt-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button vari        rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Errores de validación */}
          {validationErrors.length > 0 && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Errore) => setFormData({...formData, emergencyContact: e.target.value})}
                />
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas e Instrucciones</Label>
                <Textarea
                  id="notes"
                  placeholder="Instrucciones especiales, observaciones, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
          
                  <Car className="w-4 h-4" />
                  Tiene transporte propio
                </Label>
              </div>

              {/* Contacto de emergencia */}
              <div className="space-y-2">
                <Label htmlFor="emergency-contact">Contacto de Emergencia</Label>
                <Input
                  id="emergency-contact"
                  placeholder="Nombre y teléfono de contacto"
                  value={formData.emergencyContact}
                  onChange={(e       </Select>
                </div>
              </div>

              {/* Transporte */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="transport"
                  checked={formData.hasTransport}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, hasTransport: checked as boolean})
                  }
                />
                <Label htmlFor="transport" className="flex items-center gap-2">ueChange={(value) => setFormData({...formData, availability: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_DAY">Todo el día</SelectItem>
                      <SelectItem value="MORNING">Solo mañana</SelectItem>
                      <SelectItem value="AFTERNOON">Solo tarde</SelectItem>
                    </SelectContent>
           er>
                    <SelectContent>
                      <SelectItem value="FIRST_TIME">Primera vez</SelectItem>
                      <SelectItem value="EXPERIENCED">Experimentado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Disponibilidad */}
                <div className="space-y-2">
                  <Label>Disponibilidad</Label>
                  <Select 
                    value={formData.availability} 
                    onValent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Experiencia */}
                <div className="space-y-2">
                  <Label>Experiencia como Testigo</Label>
                  <Select 
                    value={formData.experience} 
                    onValueChange={(value) => setFormData({...formData, experience: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigg cursor-pointer" 
                            onClick={() => handleTableToggle(table)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información Adicional</CardTitle>
            </CardHeader>
            <CardContsName="text-sm font-medium">{table.number}</span>
                      </div>
                    ))}
                  </div>
                  
                  {selectedTables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTables.map(table => (
                        <Badge key={table} variant="default" className="text-xs">
                          Mesa {table}
                          <X 
                            className="w-3 h-3 ml-1        className={`
                          flex items-center justify-center p-2 rounded cursor-pointer transition-colors
                          ${selectedTables.includes(parseInt(table.number))
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                          }
                        `}
                        onClick={() => handleTableToggle(parseInt(table.number))}
                      >
                        <span clas))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de Mesas */}
              {selectedPollingStation && (
                <div className="space-y-2">
                  <Label>Mesas Asignadas *</Label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                    {availableTables.map((table: any) => (
                      <div
                        key={table.number}
                 placeholder="Selecciona el puesto de votación" />
                  </SelectTrigger>
                  <SelectContent>
                    {pollingStations.map((station: any) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                        {station.address && (
                          <span className="text-muted-foreground"> - {station.address}</span>
                        )}
                      </SelectItem>
                               <MapPin className="w-4 h-4" />
                Asignación de Puesto y Mesas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de Puesto */}
              <div className="space-y-2">
                <Label htmlFor="polling-station">Puesto de Votación *</Label>
                <Select value={selectedPollingStation} onValueChange={setSelectedPollingStation}>
                  <SelectTrigger>
                    <SelectValue <p className="text-sm">{voter.celular || voter.tel || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Municipio</Label>
                  <p className="text-sm">{voter.municipality}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asignación de Puesto y Mesas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nombre</Label>
                  <p className="text-sm">{voter.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cédula</Label>
                  <p className="text-sm">{voter.document}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Teléfono</Label>
                 
            Designar Testigo Electoral
          </DialogTitle>
          <DialogDescription>
            Asigna a {voter.name} como testigo electoral en un puesto de votación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Testigo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Testigo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
     lity: 'FULL_DAY',
        hasTransport: false,
        emergencyContact: '',
        notes: ''
      })
      
    } catch (error) {
      toast.error('Error al asignar testigo')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!voter) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />setIsSubmitting(true)
    
    try {
      const assignmentData = {
        voterId: voter.id,
        pollingStationId: selectedPollingStation,
        assignedTables: selectedTables,
        ...formData
      }
      
      await onAssign(assignmentData)
      toast.success(`${voter.name} ha sido designado como testigo electoral`)
      onClose()
      
      // Reset form
      setSelectedPollingStation('')
      setSelectedTables([])
      setFormData({
        experience: 'FIRST_TIME',
        availabiselectedTables.includes(parseInt(voter.tableNumber))) {
      errors.push('El testigo no puede ser asignado a su propia mesa de votación')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleTableToggle = (tableNumber: number) => {
    setSelectedTables(prev => 
      prev.includes(tableNumber)
        ? prev.filter(t => t !== tableNumber)
        : [...prev, tableNumber]
    )
  }

  const handleSubmit = async () => {
    if (!validateAssignment()) {
      return
    }

    ading tables:', error)
    }
  }

  const validateAssignment = () => {
    const errors = []
    
    if (!selectedPollingStation) {
      errors.push('Debe seleccionar un puesto de votación')
    }
    
    if (selectedTables.length === 0) {
      errors.push('Debe asignar al menos una mesa')
    }
    
    if (selectedTables.length > 5) {
      errors.push('No se recomienda asignar más de 5 mesas por testigo')
    }
    
    // Validar que el testigo no esté en su propia mesa
    if (voter.tableNumber &&  = await response.json()
        setPollingStations(data.data || [])
      }
    } catch (error) {
      console.error('Error loading polling stations:', error)
    }
  }

  const loadAvailableTables = async (pollingStationId: string) => {
    try {
      const response = await fetch(`/api/data/tables?pollingStationId=${pollingStationId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableTables(data.data || [])
      }
    } catch (error) {
      console.error('Error loando se abre el modal
  useEffect(() => {
    if (isOpen && voter) {
      loadPollingStations()
    }
  }, [isOpen, voter])

  // Cargar mesas cuando se selecciona un puesto
  useEffect(() => {
    if (selectedPollingStation) {
      loadAvailableTables(selectedPollingStation)
    }
  }, [selectedPollingStation])

  const loadPollingStations = async () => {
    try {
      const response = await fetch(`/api/data/polling-stations?municipalityId=${voter.municipalityId}`)
      if (response.ok) {
        const data, setSelectedPollingStation] = useState('')
  const [availableTables, setAvailableTables] = useState([])
  const [selectedTables, setSelectedTables] = useState<number[]>([])
  const [formData, setFormData] = useState({
    experience: 'FIRST_TIME',
    availability: 'FULL_DAY',
    hasTransport: false,
    emergencyContact: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Cargar puestos de votación cumponents/ui/separator'
import { 
  User, 
  MapPin, 
  Clock, 
  Car, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface WitnessAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  voter: any
  onAssign: (assignmentData: any) => void
}

export function WitnessAssignmentModal({ 
  isOpen, 
  onClose, 
  voter, 
  onAssign 
}: WitnessAssignmentModalProps) {
  const [pollingStations, setPollingStations] = useState([])
  const [selectedPollingStationport { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/co        
        {witness.notes && (
          <div className="mt-3 p-2 bg-muted rounded text-sm">
            <strong>Notas:</strong> {witness.notes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 2. Modal de Asignación de Testigo

#### Ubicación: `/src/components/ui/witness-assignment-modal.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
imdiv>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={witness.status === 'CONFIRMED' ? 'default' : 'secondary'}
            >
              {witness.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente'}
            </Badge>
            
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-1" />
              Contactar
            </Button>
          </div>
        </div>
p className="text-sm text-muted-foreground">CC: {witness.voter.document}</p>
              <p className="text-sm text-muted-foreground">{witness.pollingStation.name}</p>
              
              {/* Mesas asignadas */}
              <div className="flex flex-wrap gap-1 mt-2">
                {witness.assignedTables.map((table: number) => (
                  <Badge key={table} variant="secondary" className="text-xs">
                    Mesa {table}
                  </Badge>
                ))}
              </n WitnessCard({ witness }: { witness: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{witness.voter.name}</h4>
              <           <WitnessCard key={witness.id} witness={witness} />
            ))}
          </div>
        </TabsContent>

        {/* Tab: Cobertura */}
        <TabsContent value="coverage" className="space-y-4">
          <CoverageAnalysis coverageReport={coverageReport} />
        </TabsContent>

        {/* Tab: Reportes */}
        <TabsContent value="reports" className="space-y-4">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para tarjeta de testigo
functiode Testigos */}
        <TabsContent value="witnesses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Lista de Testigos Asignados</h3>
            <Button onClick={() => window.location.href = '/dashboard/leader'}>
              <Star className="w-4 h-4 mr-2" />
              Designar Nuevos Testigos
            </Button>
          </div>

          <div className="grid gap-4">
            {witnesses.map((witness: any) => (
         </div>
            <p className="text-xs text-muted-foreground">
              cobertura total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="witnesses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="witnesses">Mis Testigos</TabsTrigger>
          <TabsTrigger value="coverage">Cobertura</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        {/* Tab: Lista      de {/* total polling stations */} puestos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado General</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.coveragePercentage || 0}%
       />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puestos Cubiertos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pollingStationsCovered || 0}</div>
            <p className="text-xs text-muted-foreground">
         ="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura de Mesas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.coveredTables || 0}/{stats?.totalTables || 0}
            </div>
            <Progress 
              value={stats?.coveragePercentage || 0} 
              className="mt-2"
           pace-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testigos Asignados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWitnesses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.confirmedWitnesses || 0} confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader classNameame="container mx-auto px-4 py-6">
      {/* Header con estadísticas */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Testigos Electorales</h1>
        <p className="text-muted-foreground">
          Gestiona la cobertura de testigos en puestos de votación
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between sriangle, 
  Star,
  MessageSquare,
  FileText,
  TrendingUp
} from 'lucide-react'

interface WitnessStats {
  totalWitnesses: number
  totalTables: number
  coveredTables: number
  coveragePercentage: number
  confirmedWitnesses: number
  pollingStationsCovered: number
}

export default function TestigosPage() {
  const [stats, setStats] = useState<WitnessStats | null>(null)
  const [witnesses, setWitnesses] = useState([])
  const [coverageReport, setCoverageReport] = useState([])
  
  return (
    <div classNrales

#### Ubicación: `/src/app/dashboard/leader/testigos/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  AlertT
  FIRST_TIME    // Primera vez
  EXPERIENCED   // Experimentado
}

enum Availability {
  FULL_DAY      // Todo el día
  MORNING       // Solo mañana
  AFTERNOON     // Solo tarde
}
```

### Extended Voter Model

```prisma
// Agregar a modelo Voter existente
model Voter {
  // ... campos existentes
  
  // Nueva relación
  electoralWitness  ElectoralWitness?
  
  // Nuevo campo para marcar si puede ser testigo
  canBeWitness      Boolean @default(true)
}
```

## UI Components

### 1. Dashboard de Testigos Electo    Boolean  @default(false)
  emergencyContact  String?
  notes             String?
  confirmedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([leaderId])
  @@index([pollingStationId])
  @@index([status])
}

enum WitnessStatus {
  ASSIGNED      // Asignado pero no confirmado
  CONFIRMED     // Confirmó asistencia
  ACTIVE        // En el puesto votando
  COMPLETED     // Completó su función
  CANCELLED     // Cancelado
}

enum ExperienceLevel {elation(fields: [voterId], references: [id])
  leaderId          String
  leader            Leader   @relation(fields: [leaderId], references: [id])
  pollingStationId  String
  pollingStation    PollingStation @relation(fields: [pollingStationId], references: [id])
  assignedTables    Json     // Array de números de mesa: [5, 8, 15, 20]
  status            WitnessStatus @default(ASSIGNED)
  experience        ExperienceLevel @default(FIRST_TIME)
  availability      Availability @default(FULL_DAY)
  hasTransport  ────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  - ElectoralWitness Model               │
│  - Polling Station Analytics           │
│  - Table Assignment Logic              │
└─────────────────────────────────────────┘
```

## Data Models

### ElectoralWitness Model

```prisma
model ElectoralWitness {
  id                String   @id @default(cuid())
  voterId           String   @unique
  voter             Voter    @r──────────────────────────────────────┐
│         UI Layer                        │
│  - Dashboard de Testigos                │
│  - Modal de Asignación                  │
│  - Reportes de Cobertura                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  - Witness Assignment Service           │
│  - Coverage Analysis Service            │
│  - Communication Service                │
└─────────────