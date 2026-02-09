import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { hashPassword } from '@/lib/password'

// GET - Obtener sublíderes de un líder
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

    // Obtener sublíderes directos
    const subLeaders = await prisma.leader.findMany({
      where: { parentLeaderId: leaderId },
      include: {
        _count: {
          select: {
            voters: true,
            subLeaders: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, data: subLeaders })
  } catch (error) {
    console.error('Error fetching subleaders:', error)
    return NextResponse.json({ error: 'Error al obtener sublíderes' }, { status: 500 })
  }
}

// POST - Crear un sublíder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const role = (session.user as any).role
    if (role !== 'leader' && role !== 'candidate') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      document, 
      name, 
      password, 
      parentLeaderId,
      // Datos de votante
      celular,
      tel,
      email,
      municipalityId,
      pollingStationId,
      tableNumber
    } = body

    // Validaciones
    if (!document || !name || !password || !parentLeaderId) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Validar datos de votante
    if (!celular && !tel) {
      return NextResponse.json({ error: 'Debe proporcionar al menos un teléfono' }, { status: 400 })
    }
    if (!municipalityId || !pollingStationId || !tableNumber) {
      return NextResponse.json({ error: 'Información de votación incompleta' }, { status: 400 })
    }

    // Verificar que el documento no exista
    const existingDocument = await prisma.documentIndex.findUnique({
      where: { document }
    })

    if (existingDocument) {
      return NextResponse.json({ 
        error: 'Este documento ya está registrado en el sistema',
        alreadyLinked: true
      }, { status: 400 })
    }

    // Obtener el líder padre para obtener el candidateId
    const parentLeader = await prisma.leader.findUnique({
      where: { id: parentLeaderId },
      include: { candidate: true }
    })

    if (!parentLeader) {
      return NextResponse.json({ error: 'Líder padre no encontrado' }, { status: 404 })
    }

    // Verificar permisos: solo el líder padre o el candidato pueden crear sublíderes
    const userId = (session.user as any).id
    if (role === 'leader' && userId !== parentLeaderId) {
      return NextResponse.json({ 
        error: 'Solo puedes crear sublíderes bajo tu propia estructura' 
      }, { status: 403 })
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password)

    // Crear sublíder Y votante en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el sublíder
      const subLeader = await tx.leader.create({
        data: {
          document,
          name,
          password: hashedPassword,
          candidateId: parentLeader.candidateId,
          parentLeaderId
        }
      })

      // 2. Crear el votante asociado al líder padre (el sublíder vota en la red del líder padre)
      const voter = await tx.voter.create({
        data: {
          document,
          name,
          tel: tel || null,
          celular: celular || null,
          email: email || null,
          municipalityId,
          pollingStationId,
          tableNumber,
          leaderId: parentLeaderId // El votante pertenece al líder padre
        }
      })

      // 3. Registrar en DocumentIndex
      await tx.documentIndex.create({
        data: {
          document,
          userType: 'leader',
          linkedTo: parentLeader.candidate.name
        }
      })

      return { subLeader, voter }
    })

    return NextResponse.json({ 
      success: true, 
      data: result.subLeader,
      voter: result.voter,
      message: 'Sublíder creado exitosamente y registrado como votante'
    })
  } catch (error) {
    console.error('Error creating subleader:', error)
    return NextResponse.json({ error: 'Error al crear sublíder' }, { status: 500 })
  }
}

// DELETE - Eliminar un sublíder
export async function DELETE(request: NextRequest) {
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
    const subLeaderId = searchParams.get('subLeaderId')

    if (!subLeaderId) {
      return NextResponse.json({ error: 'subLeaderId requerido' }, { status: 400 })
    }

    // Verificar que el sublíder existe y obtener su información
    const subLeader = await prisma.leader.findUnique({
      where: { id: subLeaderId },
      include: {
        _count: {
          select: {
            voters: true,
            subLeaders: true
          }
        }
      }
    })

    if (!subLeader) {
      return NextResponse.json({ error: 'Sublíder no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    const userId = (session.user as any).id
    if (role === 'leader' && userId !== subLeader.parentLeaderId) {
      return NextResponse.json({ 
        error: 'Solo puedes eliminar sublíderes de tu propia estructura' 
      }, { status: 403 })
    }

    // Verificar que no tenga sublíderes
    if (subLeader._count.subLeaders > 0) {
      return NextResponse.json({ 
        error: 'No puedes eliminar un líder que tiene sublíderes. Elimina primero sus sublíderes.' 
      }, { status: 400 })
    }

    // Eliminar el sublíder (los votantes quedarán sin líder por el onDelete: SetNull)
    await prisma.leader.delete({
      where: { id: subLeaderId }
    })

    // Eliminar del DocumentIndex
    await prisma.documentIndex.delete({
      where: { document: subLeader.document }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Sublíder eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting subleader:', error)
    return NextResponse.json({ error: 'Error al eliminar sublíder' }, { status: 500 })
  }
}
