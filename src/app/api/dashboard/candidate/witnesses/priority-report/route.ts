import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'candidateId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el candidato existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    })

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidato no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los líderes del candidato
    const leaders = await prisma.leader.findMany({
      where: { candidateId },
      select: { id: true, name: true }
    })

    const leaderIds = leaders.map(l => l.id)

    // Obtener todos los votantes de los líderes con información de puesto y mesa
    const voters = await prisma.voter.findMany({
      where: { 
        leaderId: { in: leaderIds },
        pollingStationId: { not: null },
        tableNumber: { not: null }
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true
          }
        },
        pollingStation: {
          select: {
            id: true,
            name: true,
            code: true,
            community: true,
            address: true
          }
        },
        municipality: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Obtener testigos asignados
    const witnesses = await prisma.electoralWitness.findMany({
      where: { leaderId: { in: leaderIds } },
      select: {
        pollingStationId: true,
        assignedTables: true,
        leaderId: true
      }
    })

    // Agrupar votantes por puesto y mesa
    const tableStats: Record<string, {
      pollingStationId: string
      pollingStationName: string
      pollingStationCode: string
      community?: string
      address?: string
      municipalityId: string
      municipalityName: string
      tableNumber: string
      voterCount: number
      hasWitness: boolean
      witnessCount: number
      leaderBreakdown: Record<string, { name: string, count: number }>
      voters: Array<{
        id: string
        name: string
        document: string
        celular?: string
        tel?: string
        leaderName: string
      }>
    }> = {}

    voters.forEach(voter => {
      if (!voter.pollingStation || !voter.tableNumber || !voter.municipality || !voter.leader || !voter.pollingStationId || !voter.municipalityId) return

      const key = `${voter.pollingStationId}-${voter.tableNumber}`
      
      if (!tableStats[key]) {
        tableStats[key] = {
          pollingStationId: voter.pollingStationId,
          pollingStationName: voter.pollingStation.name,
          pollingStationCode: voter.pollingStation.code,
          community: voter.pollingStation.community || undefined,
          address: voter.pollingStation.address || undefined,
          municipalityId: voter.municipalityId,
          municipalityName: voter.municipality.name,
          tableNumber: voter.tableNumber,
          voterCount: 0,
          hasWitness: false,
          witnessCount: 0,
          leaderBreakdown: {},
          voters: []
        }
      }

      tableStats[key].voterCount++
      
      // Agregar al breakdown por líder
      if (!tableStats[key].leaderBreakdown[voter.leaderId!]) {
        tableStats[key].leaderBreakdown[voter.leaderId!] = {
          name: voter.leader.name,
          count: 0
        }
      }
      tableStats[key].leaderBreakdown[voter.leaderId!].count++

      tableStats[key].voters.push({
        id: voter.id,
        name: voter.name,
        document: voter.document,
        celular: voter.celular || undefined,
        tel: voter.tel || undefined,
        leaderName: voter.leader.name
      })
    })

    // Marcar mesas que tienen testigos asignados
    witnesses.forEach(witness => {
      const assignedTables = JSON.parse(witness.assignedTables) as number[]
      assignedTables.forEach(tableNum => {
        const key = `${witness.pollingStationId}-${tableNum}`
        if (tableStats[key]) {
          tableStats[key].hasWitness = true
          tableStats[key].witnessCount++
        }
      })
    })

    // Convertir a array y ordenar por cantidad de votantes (descendente)
    const priorityReport = Object.values(tableStats)
      .sort((a, b) => b.voterCount - a.voterCount)

    // Calcular estadísticas generales
    const totalTables = priorityReport.length
    const tablesWithWitness = priorityReport.filter(t => t.hasWitness).length
    const totalVoters = priorityReport.reduce((sum, t) => sum + t.voterCount, 0)
    const votersWithWitness = priorityReport
      .filter(t => t.hasWitness)
      .reduce((sum, t) => sum + t.voterCount, 0)

    // Agrupar por puesto de votación
    const byPollingStation: Record<string, {
      pollingStationId: string
      pollingStationName: string
      municipalityName: string
      community?: string
      totalTables: number
      tablesWithWitness: number
      totalVoters: number
      votersWithWitness: number
      coveragePercentage: number
    }> = {}

    priorityReport.forEach(table => {
      if (!byPollingStation[table.pollingStationId]) {
        byPollingStation[table.pollingStationId] = {
          pollingStationId: table.pollingStationId,
          pollingStationName: table.pollingStationName,
          municipalityName: table.municipalityName,
          community: table.community,
          totalTables: 0,
          tablesWithWitness: 0,
          totalVoters: 0,
          votersWithWitness: 0,
          coveragePercentage: 0
        }
      }

      const station = byPollingStation[table.pollingStationId]
      station.totalTables++
      station.totalVoters += table.voterCount
      
      if (table.hasWitness) {
        station.tablesWithWitness++
        station.votersWithWitness += table.voterCount
      }
    })

    // Calcular porcentajes de cobertura
    Object.values(byPollingStation).forEach(station => {
      station.coveragePercentage = station.totalTables > 0
        ? Math.round((station.tablesWithWitness / station.totalTables) * 100)
        : 0
    })

    // Estadísticas por líder
    const leaderStats = leaders.map(leader => {
      const leaderVoters = voters.filter(v => v.leaderId === leader.id)
      const leaderWitnesses = witnesses.filter(w => w.leaderId === leader.id)
      
      // Contar mesas únicas con testigos de este líder
      const tablesWithWitnessSet = new Set<string>()
      leaderWitnesses.forEach(w => {
        const tables = JSON.parse(w.assignedTables) as number[]
        tables.forEach(t => tablesWithWitnessSet.add(`${w.pollingStationId}-${t}`))
      })

      return {
        leaderId: leader.id,
        leaderName: leader.name,
        totalVoters: leaderVoters.length,
        totalWitnesses: leaderWitnesses.length,
        tablesWithWitness: tablesWithWitnessSet.size
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        tables: priorityReport,
        statistics: {
          totalTables,
          tablesWithWitness,
          tablesWithoutWitness: totalTables - tablesWithWitness,
          coveragePercentage: totalTables > 0 
            ? Math.round((tablesWithWitness / totalTables) * 100) 
            : 0,
          totalVoters,
          votersWithWitness,
          votersWithoutWitness: totalVoters - votersWithWitness,
          voterCoveragePercentage: totalVoters > 0
            ? Math.round((votersWithWitness / totalVoters) * 100)
            : 0,
          totalLeaders: leaders.length,
          totalWitnesses: witnesses.length
        },
        byPollingStation: Object.values(byPollingStation)
          .sort((a, b) => b.totalVoters - a.totalVoters),
        byLeader: leaderStats.sort((a, b) => b.totalVoters - a.totalVoters)
      }
    })

  } catch (error) {
    console.error('Error generating priority report:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}