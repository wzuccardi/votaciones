import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const leaderId = searchParams.get('leaderId')
    const candidateId = searchParams.get('candidateId')
    
    // Filtros opcionales
    const municipalityId = searchParams.get('municipalityId')
    const pollingStationId = searchParams.get('pollingStationId')
    const witnessId = searchParams.get('witnessId')

    if (!leaderId && !candidateId) {
      return NextResponse.json(
        { success: false, error: 'leaderId o candidateId requerido' },
        { status: 400 }
      )
    }

    // Construir filtros para testigos
    const witnessWhere: any = leaderId ? { leaderId } : { leader: { candidateId } }
    
    // Aplicar filtros adicionales
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

    // Obtener testigos
    const witnesses = await db.electoralWitness.findMany({
      where: witnessWhere,
      include: {
        voter: {
          select: {
            name: true,
            document: true
          }
        },
        pollingStation: {
          include: {
            municipality: true
          }
        },
        tableReports: true
      }
    })

    // Obtener todas las mesas reportadas por estos testigos
    const witnessIds = witnesses.map(w => w.id)
    const allReports = await db.table.findMany({
      where: {
        reportedBy: {
          in: witnessIds
        },
        reportedAt: { not: null }
      },
      include: {
        witness: {
          include: {
            voter: {
              select: {
                name: true,
                document: true
              }
            },
            pollingStation: {
              include: {
                municipality: true
              }
            }
          }
        }
      }
    })

    // Calcular estadísticas
    const totalWitnesses = witnesses.length
    const activeWitnesses = witnesses.filter(w => w.arrivedAtStation).length
    const confirmedWitnesses = witnesses.filter(w => w.confirmedAttendance).length
    
    const totalTablesAssigned = witnesses.reduce((sum, w) => {
      const tables = JSON.parse(w.assignedTables)
      return sum + tables.length
    }, 0)

    const totalTablesReported = allReports.length
    const coveragePercentage = totalTablesAssigned > 0 
      ? Math.round((totalTablesReported / totalTablesAssigned) * 100)
      : 0

    // Votos totales
    const totalVotesCandidate = allReports.reduce((sum, r) => sum + (r.votesCandidate || 0), 0)
    const totalVotesRegistered = allReports.reduce((sum, r) => sum + (r.votesRegistered || 0), 0)
    const totalVotesBlank = allReports.reduce((sum, r) => sum + (r.votesBlank || 0), 0)
    const totalVotesNull = allReports.reduce((sum, r) => sum + (r.votesNull || 0), 0)

    // Irregularidades
    const irregularities = allReports.filter(r => r.hasIrregularities).length

    // Puestos únicos cubiertos
    const uniqueStations = new Set(witnesses.map(w => w.pollingStationId)).size

    // Reportes por hora (últimas 24 horas)
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentReports = allReports.filter(r => 
      r.reportedAt && new Date(r.reportedAt) >= last24Hours
    )

    const reportsByHour = Array.from({ length: 24 }, (_, i) => {
      const hourStart = new Date(last24Hours.getTime() + i * 60 * 60 * 1000)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const count = recentReports.filter(r => {
        const reportTime = new Date(r.reportedAt!)
        return reportTime >= hourStart && reportTime < hourEnd
      }).length

      return {
        hour: hourStart.getHours(),
        count
      }
    })

    // Top 5 testigos más activos
    const witnessActivity = witnesses.map(w => ({
      name: w.voter?.name || 'Desconocido',
      document: w.voter?.document || '',
      tablesReported: w.tableReports?.length || 0,
      lastReportAt: w.tableReports && w.tableReports.length > 0 
        ? w.tableReports.sort((a, b) => 
            new Date(b.reportedAt || 0).getTime() - new Date(a.reportedAt || 0).getTime()
          )[0].reportedAt
        : null
    })).sort((a, b) => b.tablesReported - a.tablesReported).slice(0, 5)

    // Datos para gráficas dinámicas
    let votesByMunicipality: any[] = []
    let votesByStation: any[] = []
    let votesByTable: any[] = []

    if (!pollingStationId && !municipalityId) {
      // Vista General: Votos por Municipio
      const municipalityVotes = new Map<string, { votes: number, total: number }>()
      
      for (const report of allReports) {
        const muniName = report.witness?.pollingStation?.municipality?.name || 'Desconocido'
        if (!municipalityVotes.has(muniName)) {
          municipalityVotes.set(muniName, { votes: 0, total: 0 })
        }
        const data = municipalityVotes.get(muniName)!
        data.votes += report.votesCandidate || 0
        data.total += report.totalVotes || 0
      }

      votesByMunicipality = Array.from(municipalityVotes.entries()).map(([name, data]) => ({
        name,
        votes: data.votes,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.votes / data.total) * 100) : 0
      })).sort((a, b) => b.votes - a.votes)

    } else if (municipalityId && !pollingStationId) {
      // Vista Municipio: Votos por Puesto
      const stationVotes = new Map<string, { votes: number, total: number }>()
      
      for (const report of allReports) {
        const stationName = report.witness?.pollingStation?.name || 'Desconocido'
        if (!stationVotes.has(stationName)) {
          stationVotes.set(stationName, { votes: 0, total: 0 })
        }
        const data = stationVotes.get(stationName)!
        data.votes += report.votesCandidate || 0
        data.total += report.totalVotes || 0
      }

      votesByStation = Array.from(stationVotes.entries()).map(([name, data]) => ({
        name: name.length > 30 ? name.substring(0, 30) + '...' : name,
        votes: data.votes,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.votes / data.total) * 100) : 0
      })).sort((a, b) => b.votes - a.votes)

    } else if (pollingStationId) {
      // Vista Puesto: Votos por Mesa
      const tableVotes = new Map<number, { votes: number, total: number }>()
      
      for (const report of allReports) {
        const tableNum = report.number
        if (!tableVotes.has(tableNum)) {
          tableVotes.set(tableNum, { votes: 0, total: 0 })
        }
        const data = tableVotes.get(tableNum)!
        data.votes += report.votesCandidate || 0
        data.total += report.totalVotes || 0
      }

      votesByTable = Array.from(tableVotes.entries()).map(([number, data]) => ({
        number,
        votes: data.votes,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.votes / data.total) * 100) : 0
      })).sort((a, b) => a.number - b.number)
    }

    return NextResponse.json({
      success: true,
      data: {
        witnesses: {
          total: totalWitnesses,
          active: activeWitnesses,
          confirmed: confirmedWitnesses
        },
        tables: {
          assigned: totalTablesAssigned,
          reported: totalTablesReported,
          coverage: coveragePercentage
        },
        votes: {
          candidate: totalVotesCandidate,
          registered: totalVotesRegistered,
          blank: totalVotesBlank,
          null: totalVotesNull,
          percentage: totalVotesRegistered > 0 
            ? Math.round((totalVotesCandidate / totalVotesRegistered) * 100)
            : 0
        },
        irregularities,
        uniqueStations,
        reportsByHour,
        topWitnesses: witnessActivity,
        votesByMunicipality,
        votesByStation,
        votesByTable
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
