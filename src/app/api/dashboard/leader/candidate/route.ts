import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const leaderId = searchParams.get('leaderId')

    if (!leaderId) {
      return NextResponse.json({
        error: 'ID de líder requerido',
        message: 'Se requiere el ID del líder'
      }, { status: 400 })
    }
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionLeaderId = (session as any).user?.id
    if (role === 'leader' && sessionLeaderId !== leaderId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const leader = await db.leader.findUnique({
      where: { id: leaderId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            party: true,
            primaryColor: true,
            secondaryColor: true,
            logoUrl: true,
            photoUrl: true
          }
        }
      }
    })

    if (!leader) {
      return NextResponse.json({
        error: 'Líder no encontrado',
        message: 'El líder no existe'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: leader.candidate
    })

  } catch (error) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener el candidato'
    }, { status: 500 })
  }
}
