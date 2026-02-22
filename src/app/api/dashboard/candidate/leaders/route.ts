import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

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

    const leaders = await db.leader.findMany({
      where: { candidateId },
      include: {
        _count: {
          select: {
            voters: true,
            subLeaders: true
          }
        },
        parentLeader: {
          select: {
            id: true,
            name: true,
            document: true
          }
        }
      },
      orderBy: [
        { parentLeaderId: 'asc' }, // Primero líderes principales (null), luego sublíderes
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: leaders
    })

  } catch (error) {
    console.error('Error fetching leaders:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los líderes'
    }, { status: 500 })
  }
}

// PUT - Actualizar líder
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const role = (session as any).user?.role
    if (role !== 'candidate') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { leaderId, name, document, password, parentLeaderId } = body

    if (!leaderId || !name || !document) {
      return NextResponse.json({
        error: 'Datos incompletos',
        message: 'Se requieren leaderId, name y document'
      }, { status: 400 })
    }

    // Verificar que el líder pertenece al candidato
    const candidateId = (session as any).user?.id
    const existingLeader = await db.leader.findUnique({
      where: { id: leaderId },
      select: { candidateId: true, document: true }
    })

    if (!existingLeader || existingLeader.candidateId !== candidateId) {
      return NextResponse.json({ error: 'Líder no encontrado' }, { status: 404 })
    }

    // Si se cambió el documento, verificar que no exista otro líder con ese documento
    if (document !== existingLeader.document) {
      const documentExists = await db.leader.findUnique({
        where: { document }
      })

      if (documentExists) {
        return NextResponse.json({
          error: 'Documento duplicado',
          message: 'Ya existe un líder con ese documento'
        }, { status: 400 })
      }

      // Actualizar índice de documentos
      await db.documentIndex.deleteMany({
        where: { document: existingLeader.document }
      })

      await db.documentIndex.create({
        data: {
          document,
          userType: 'leader',
          linkedTo: candidateId
        }
      })
    }

    // Preparar datos de actualización
    const updateData: any = {
      name,
      document,
      parentLeaderId: parentLeaderId || null
    }

    // Si se proporciona nueva contraseña, hashearla
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password)
    }

    // Actualizar líder
    const updatedLeader = await db.leader.update({
      where: { id: leaderId },
      data: updateData,
      include: {
        _count: {
          select: {
            voters: true,
            subLeaders: true
          }
        },
        parentLeader: {
          select: {
            id: true,
            name: true,
            document: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedLeader,
      message: 'Líder actualizado exitosamente'
    })

  } catch (error: any) {
    console.error('Error updating leader:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: error.message || 'Ocurrió un error al actualizar el líder'
    }, { status: 500 })
  }
}

// DELETE - Eliminar líder
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const role = (session as any).user?.role
    if (role !== 'candidate') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { leaderId } = body

    if (!leaderId) {
      return NextResponse.json({
        error: 'ID requerido',
        message: 'Se requiere el ID del líder'
      }, { status: 400 })
    }

    // Verificar que el líder pertenece al candidato
    const candidateId = (session as any).user?.id
    const leader = await db.leader.findUnique({
      where: { id: leaderId },
      select: { 
        candidateId: true, 
        document: true,
        _count: {
          select: {
            voters: true,
            subLeaders: true
          }
        }
      }
    })

    if (!leader || leader.candidateId !== candidateId) {
      return NextResponse.json({ error: 'Líder no encontrado' }, { status: 404 })
    }

    // Verificar si tiene sublíderes
    if (leader._count.subLeaders > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar',
        message: `Este líder tiene ${leader._count.subLeaders} sublíderes. Elimina o reasigna los sublíderes primero.`
      }, { status: 400 })
    }

    // Verificar si tiene votantes
    if (leader._count.voters > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar',
        message: `Este líder tiene ${leader._count.voters} votantes. Elimina o reasigna los votantes primero.`
      }, { status: 400 })
    }

    // Eliminar índice de documento
    await db.documentIndex.deleteMany({
      where: { document: leader.document }
    })

    // Eliminar líder
    await db.leader.delete({
      where: { id: leaderId }
    })

    return NextResponse.json({
      success: true,
      message: 'Líder eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('Error deleting leader:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: error.message || 'Ocurrió un error al eliminar el líder'
    }, { status: 500 })
  }
}
