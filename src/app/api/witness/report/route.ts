import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener reportes del testigo
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código requerido' },
        { status: 400 }
      )
    }

    // Buscar testigo
    const witness = await db.electoralWitness.findUnique({
      where: { uniqueCode: code },
      include: {
        tableReports: {
          include: {
            pollingStation: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            number: 'asc'
          }
        }
      }
    })

    if (!witness) {
      return NextResponse.json(
        { success: false, error: 'Código inválido' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: witness.tableReports
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo reporte de mesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code,
      tableNumber,
      votesRegistered,
      votesCandidate,
      votesBlank,
      votesNull,
      observations,
      hasIrregularities,
      irregularityType,
      irregularityDetails
    } = body

    if (!code || !tableNumber) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Buscar testigo
    const witness = await db.electoralWitness.findUnique({
      where: { uniqueCode: code }
    })

    if (!witness) {
      return NextResponse.json(
        { success: false, error: 'Código inválido' },
        { status: 404 }
      )
    }

    // Verificar que la mesa esté asignada al testigo
    const assignedTables = JSON.parse(witness.assignedTables)
    if (!assignedTables.includes(tableNumber)) {
      return NextResponse.json(
        { success: false, error: 'Mesa no asignada a este testigo' },
        { status: 403 }
      )
    }

    // Calcular total de votos
    const totalVotes = (votesRegistered || 0) + (votesBlank || 0) + (votesNull || 0)

    // Crear o actualizar reporte
    const report = await db.table.upsert({
      where: {
        pollingStationId_number: {
          pollingStationId: witness.pollingStationId,
          number: tableNumber
        }
      },
      update: {
        votesRegistered,
        votesCandidate,
        votesBlank,
        votesNull,
        totalVotes,
        observations,
        hasIrregularities: hasIrregularities || false,
        irregularityType,
        irregularityDetails,
        reportedAt: new Date(),
        reportedBy: witness.id
      },
      create: {
        number: tableNumber,
        pollingStationId: witness.pollingStationId,
        votesRegistered,
        votesCandidate,
        votesBlank,
        votesNull,
        totalVotes,
        observations,
        hasIrregularities: hasIrregularities || false,
        irregularityType,
        irregularityDetails,
        reportedAt: new Date(),
        reportedBy: witness.id
      }
    })

    // Actualizar contador de mesas reportadas del testigo
    const reportedCount = await db.table.count({
      where: {
        reportedBy: witness.id,
        reportedAt: { not: null }
      }
    })

    await db.electoralWitness.update({
      where: { id: witness.id },
      data: {
        tablesReported: reportedCount,
        lastReportAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar reporte existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code,
      reportId,
      votesRegistered,
      votesCandidate,
      votesBlank,
      votesNull,
      observations,
      hasIrregularities,
      irregularityType,
      irregularityDetails
    } = body

    if (!code || !reportId) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Buscar testigo
    const witness = await db.electoralWitness.findUnique({
      where: { uniqueCode: code }
    })

    if (!witness) {
      return NextResponse.json(
        { success: false, error: 'Código inválido' },
        { status: 404 }
      )
    }

    // Verificar que el reporte pertenezca al testigo
    const existingReport = await db.table.findUnique({
      where: { id: reportId }
    })

    if (!existingReport || existingReport.reportedBy !== witness.id) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado o no autorizado' },
        { status: 403 }
      )
    }

    // Calcular total de votos
    const totalVotes = (votesRegistered || 0) + (votesBlank || 0) + (votesNull || 0)

    // Actualizar reporte
    const updatedReport = await db.table.update({
      where: { id: reportId },
      data: {
        votesRegistered,
        votesCandidate,
        votesBlank,
        votesNull,
        totalVotes,
        observations,
        hasIrregularities: hasIrregularities || false,
        irregularityType,
        irregularityDetails,
        reportedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedReport
    })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
