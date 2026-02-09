import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/data/tables
 * Obtiene las mesas reales de un puesto de votación
 * 
 * Ahora usa datos reales de la tabla Table en la base de datos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pollingStationId = searchParams.get('pollingStationId')

    if (!pollingStationId) {
      return NextResponse.json(
        { success: false, error: 'pollingStationId es requerido' },
        { status: 400 }
      )
    }

    // Obtener información del puesto de votación
    const pollingStation = await db.pollingStation.findUnique({
      where: { id: pollingStationId },
      include: {
        municipality: true,
        tables: {
          orderBy: { number: 'asc' }
        }
      }
    })

    if (!pollingStation) {
      return NextResponse.json(
        { success: false, error: 'Puesto de votación no encontrado' },
        { status: 404 }
      )
    }

    // Formatear mesas para el frontend
    const tables = pollingStation.tables.map(table => ({
      id: table.id,
      number: table.number.toString(),
      pollingStationId: pollingStation.id,
      pollingStationName: pollingStation.name,
      // Información de reporte (si existe)
      isReported: table.reportedAt !== null,
      reportedAt: table.reportedAt,
      reportedBy: table.reportedBy,
      votesCandidate: table.votesCandidate,
      totalVotes: table.totalVotes
    }))

    return NextResponse.json({
      success: true,
      data: tables,
      metadata: {
        pollingStationId: pollingStation.id,
        pollingStationName: pollingStation.name,
        municipality: pollingStation.municipality.name,
        totalTables: pollingStation.totalTables,
        totalVoters: pollingStation.totalVoters,
        maleVoters: pollingStation.maleVoters,
        femaleVoters: pollingStation.femaleVoters,
        tablesInDatabase: tables.length
      }
    })

  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
