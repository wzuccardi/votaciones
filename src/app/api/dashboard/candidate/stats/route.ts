import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json({
        error: 'ID de candidato requerido',
        message: 'Se requiere el ID del candidato'
      }, { status: 400 })
    }
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id
    if (role === 'candidate' && sessionCandidateId !== candidateId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (role === 'leader') {
      const leader = await db.leader.findUnique({
        where: { id: (session as any).user?.id },
        select: { candidateId: true }
      })
      if (!leader || leader.candidateId !== candidateId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Get total leaders
    const totalLeaders = await db.leader.count({
      where: { candidateId }
    })

    // Get total voters (through leaders)
    const voters = await db.voter.findMany({
      where: {
        leader: {
          candidateId
        }
      },
      include: {
        municipality: {
          include: {
            department: true
          }
        },
        pollingStation: true,
        leader: {
          include: {
            candidate: true
          }
        }
      }
    })

    const totalVoters = voters.length

    // Get voters by municipality
    const votersByMunicipality = voters.reduce((acc: any[], voter) => {
      const municipalityName = voter.municipality?.name || 'Sin municipio'
      const existing = acc.find(item => item.name === municipalityName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ name: municipalityName, count: 1, department: voter.municipality?.department?.name || '' })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count)

    // Get voters by department
    const votersByDepartment = voters.reduce((acc: any[], voter) => {
      const departmentName = voter.municipality?.department?.name || 'Sin departamento'
      const existing = acc.find(item => item.name === departmentName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ name: departmentName, count: 1 })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count)

    // Get voters by polling station
    const votersByPollingStation = voters.reduce((acc: any[], voter) => {
      const stationName = voter.pollingStation?.name || 'Sin puesto'
      const existing = acc.find(item => item.name === stationName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ name: stationName, count: 1, address: voter.pollingStation?.address })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count)

    // Get voters with geolocation (latitude, longitude) - return count
    const votersWithGeolocationCount = voters.filter(v =>
      v.pollingStation?.latitude && v.pollingStation?.longitude
    ).length

    // Get voters by leader
    const votersByLeader = voters.reduce((acc: any[], voter) => {
      const leaderName = voter.leader?.name || 'Sin líder'
      const existing = acc.find(item => item.name === leaderName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ name: leaderName, count: 1 })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: {
        totalLeaders,
        totalVoters,
        votersByMunicipality,
        votersByDepartment,
        votersByPollingStation,
        votersByLeader,
        votersWithGeolocation: votersWithGeolocationCount
      }
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener las estadísticas'
    }, { status: 500 })
  }
}
