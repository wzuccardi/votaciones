import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    
    // Filtros opcionales
    const municipalityId = searchParams.get('municipalityId')
    const pollingStationId = searchParams.get('pollingStationId')

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    // Construir filtros para las mesas
    const tableWhere: any = {
      witness: {
        leader: {
          candidateId
        }
      },
      reportedAt: { not: null }
    }

    // Aplicar filtros adicionales
    if (pollingStationId) {
      tableWhere.pollingStationId = pollingStationId
    } else if (municipalityId) {
      tableWhere.pollingStation = {
        municipalityId
      }
    }

    // Obtener todas las mesas reportadas por testigos del candidato
    const tableResults = await db.table.findMany({
      where: tableWhere,
      include: {
        pollingStation: {
          include: {
            municipality: {
              select: {
                name: true
              }
            }
          }
        },
        witness: {
          include: {
            voter: {
              select: {
                name: true,
                document: true
              }
            },
            leader: {
              select: {
                name: true,
                document: true
              }
            }
          }
        }
      },
      orderBy: {
        reportedAt: 'desc'
      }
    })

    // Calcular estadísticas generales
    const totalTablesReported = tableResults.length
    const tablesValidated = tableResults.filter(t => t.isValidated).length
    
    // Votos totales (todas las mesas reportadas)
    const totalVotesCandidate = tableResults.reduce((sum, t) => sum + (t.votesCandidate || 0), 0)
    const totalVotesGeneral = tableResults.reduce((sum, t) => sum + (t.totalVotes || 0), 0)
    const percentage = totalVotesGeneral > 0 ? (totalVotesCandidate / totalVotesGeneral) * 100 : 0
    
    // Votos validados (solo mesas validadas)
    const validatedTables = tableResults.filter(t => t.isValidated)
    const validatedVotesCandidate = validatedTables.reduce((sum, t) => sum + (t.votesCandidate || 0), 0)
    const validatedVotesGeneral = validatedTables.reduce((sum, t) => sum + (t.totalVotes || 0), 0)
    const validatedPercentage = validatedVotesGeneral > 0 ? (validatedVotesCandidate / validatedVotesGeneral) * 100 : 0
    
    // Votos pendientes de validación
    const pendingTables = tableResults.filter(t => !t.isValidated)
    const pendingVotesCandidate = pendingTables.reduce((sum, t) => sum + (t.votesCandidate || 0), 0)
    const pendingVotesGeneral = pendingTables.reduce((sum, t) => sum + (t.totalVotes || 0), 0)

    // Obtener total de mesas esperadas (suma de todas las mesas asignadas a testigos)
    // Aplicar los mismos filtros que a las mesas reportadas
    const witnessWhere: any = {
      leader: {
        candidateId
      }
    }

    if (pollingStationId) {
      witnessWhere.pollingStationId = pollingStationId
    } else if (municipalityId) {
      witnessWhere.pollingStation = {
        municipalityId
      }
    }

    const witnesses = await db.electoralWitness.findMany({
      where: witnessWhere,
      select: {
        assignedTables: true
      }
    })

    const totalTablesExpected = witnesses.reduce((sum, w) => {
      const tables = JSON.parse(w.assignedTables)
      return sum + tables.length
    }, 0)

    // Última actualización
    const lastUpdate = tableResults.length > 0 
      ? tableResults[0].reportedAt 
      : null

    // Agrupar por puesto de votación
    const pollingStationMap = new Map<string, {
      id: string
      name: string
      code: string
      municipality: string
      totalTables: number
      tablesReported: number
      votesCandidate: number
      totalVotes: number
      witnesses: Array<{
        name: string
        document: string
        leader: string
        tablesAssigned: number[]
      }>
    }>()

    for (const table of tableResults) {
      const psId = table.pollingStation.id
      if (!pollingStationMap.has(psId)) {
        pollingStationMap.set(psId, {
          id: psId,
          name: table.pollingStation.name,
          code: table.pollingStation.code,
          municipality: table.pollingStation.municipality.name,
          totalTables: table.pollingStation.totalTables,
          tablesReported: 0,
          votesCandidate: 0,
          totalVotes: 0,
          witnesses: []
        })
      }

      const ps = pollingStationMap.get(psId)!
      ps.tablesReported++
      ps.votesCandidate += table.votesCandidate || 0
      ps.totalVotes += table.totalVotes || 0
    }

    // Agregar información de testigos asignados a cada puesto
    const witnessesWithDetails = await db.electoralWitness.findMany({
      where: witnessWhere,
      include: {
        voter: {
          select: {
            name: true,
            document: true
          }
        },
        leader: {
          select: {
            name: true
          }
        },
        pollingStation: {
          select: {
            id: true
          }
        }
      }
    })

    for (const witness of witnessesWithDetails) {
      const psId = witness.pollingStation.id
      if (pollingStationMap.has(psId)) {
        const ps = pollingStationMap.get(psId)!
        const tables = JSON.parse(witness.assignedTables)
        ps.witnesses.push({
          name: witness.voter.name,
          document: witness.voter.document,
          leader: witness.leader.name,
          tablesAssigned: tables
        })
      }
    }

    const pollingStations = Array.from(pollingStationMap.values()).map(ps => ({
      ...ps,
      percentage: ps.totalVotes > 0 ? (ps.votesCandidate / ps.totalVotes) * 100 : 0
    }))

    // Agrupar por municipio
    const municipalityMap = new Map<string, {
      name: string
      totalTables: number
      tablesReported: number
      votesCandidate: number
      totalVotes: number
    }>()

    for (const table of tableResults) {
      const muniName = table.pollingStation.municipality.name
      if (!municipalityMap.has(muniName)) {
        municipalityMap.set(muniName, {
          name: muniName,
          totalTables: 0,
          tablesReported: 0,
          votesCandidate: 0,
          totalVotes: 0
        })
      }

      const muni = municipalityMap.get(muniName)!
      muni.tablesReported++
      muni.votesCandidate += table.votesCandidate || 0
      muni.totalVotes += table.totalVotes || 0
    }

    // Obtener total de mesas por municipio
    for (const [muniName, data] of municipalityMap.entries()) {
      const totalTables = await db.table.count({
        where: {
          pollingStation: {
            municipality: {
              name: muniName
            }
          },
          witness: {
            leader: {
              candidateId
            }
          }
        }
      })
      data.totalTables = totalTables
    }

    const municipalities = Array.from(municipalityMap.values()).map(muni => ({
      ...muni,
      percentage: muni.totalVotes > 0 ? (muni.votesCandidate / muni.totalVotes) * 100 : 0
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalTables: totalTablesExpected,
        tablesReported: totalTablesReported,
        tablesValidated,
        totalVotesCandidate,
        totalVotesGeneral,
        percentage,
        // Nuevas estadísticas de votos validados
        validatedVotesCandidate,
        validatedVotesGeneral,
        validatedPercentage,
        // Estadísticas de votos pendientes
        pendingVotesCandidate,
        pendingVotesGeneral,
        tablesPending: totalTablesReported - tablesValidated,
        lastUpdate
      },
      tableResults,
      pollingStations,
      municipalities
    })
  } catch (error) {
    console.error('Error fetching electoral results:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
