import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leaderId = searchParams.get('leaderId')

    if (!leaderId) {
      return NextResponse.json(
        { success: false, error: 'leaderId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el líder existe
    const leader = await prisma.leader.findUnique({
      where: { id: leaderId }
    })

    if (!leader) {
      return NextResponse.json(
        { success: false, error: 'Líder no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los votantes del líder con información de puesto y mesa
    const voters = await prisma.voter.findMany({
      where: { 
        leaderId,
        pollingStationId: { not: null },
        tableNumber: { not: null }
      },
      include: {
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
      where: { leaderId },
      select: {
        pollingStationId: true,
        assignedTables: true
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
      voters: Array<{
        id: string
        name: string
        document: string
        celular?: string
        tel?: string
      }>
    }> = {}

    voters.forEach(voter => {
      if (!voter.pollingStation || !voter.tableNumber || !voter.municipality || !voter.pollingStationId || !voter.municipalityId) return

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
          voters: []
        }
      }

      tableStats[key].voterCount++
      tableStats[key].voters.push({
        id: voter.id,
        name: voter.name,
        document: voter.document,
        celular: voter.celular || undefined,
        tel: voter.tel || undefined
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
            : 0
        },
        byPollingStation: Object.values(byPollingStation)
          .sort((a, b) => b.totalVoters - a.totalVoters)
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