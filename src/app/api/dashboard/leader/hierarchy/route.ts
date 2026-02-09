import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

// GET - Obtener jerarquía completa de un líder (incluyendo sublíderes recursivos)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const role = (session.user as any).role
    if (role !== 'leader' && role !== 'candidate') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const leaderId = searchParams.get('leaderId')

    if (!leaderId) {
      return NextResponse.json({ error: 'leaderId requerido' }, { status: 400 })
    }

    // Función recursiva para obtener toda la jerarquía
    async function getLeaderHierarchy(id: string): Promise<any> {
      const leader = await prisma.leader.findUnique({
        where: { id },
        include: {
          voters: {
            include: {
              pollingStation: {
                include: {
                  municipality: true
                }
              }
            },
            orderBy: { name: 'asc' }
          },
          candidate: {
            select: {
              name: true,
              party: true
            }
          }
        }
      })

      if (!leader) return null

      // Obtener sublíderes directos
      const subLeaders = await prisma.leader.findMany({
        where: { parentLeaderId: id },
        orderBy: { name: 'asc' }
      })

      // Recursivamente obtener la jerarquía de cada sublíder
      const subLeadersWithHierarchy = await Promise.all(
        subLeaders.map(async (subLeader) => await getLeaderHierarchy(subLeader.id))
      )

      return {
        id: leader.id,
        document: leader.document,
        name: leader.name,
        candidate: leader.candidate,
        voters: leader.voters,
        votersCount: leader.voters.length,
        subLeaders: subLeadersWithHierarchy,
        subLeadersCount: subLeaders.length,
        // Calcular totales recursivos
        totalVoters: leader.voters.length + subLeadersWithHierarchy.reduce((sum, sl) => sum + (sl?.totalVoters || 0), 0),
        totalSubLeaders: subLeaders.length + subLeadersWithHierarchy.reduce((sum, sl) => sum + (sl?.totalSubLeaders || 0), 0)
      }
    }

    const hierarchy = await getLeaderHierarchy(leaderId)

    if (!hierarchy) {
      return NextResponse.json({ error: 'Líder no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: hierarchy })
  } catch (error) {
    console.error('Error fetching hierarchy:', error)
    return NextResponse.json({ error: 'Error al obtener jerarquía' }, { status: 500 })
  }
}
