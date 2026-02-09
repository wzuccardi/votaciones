import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  console.log('=== VALIDATE TABLE API CALLED ===')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user ? 'Found' : 'Not found')
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const role = (session.user as any).role
    console.log('User role:', role)
    
    // Solo candidatos y líderes pueden validar mesas
    if (role !== 'candidate' && role !== 'leader') {
      return NextResponse.json(
        { error: 'No tienes permisos para validar mesas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { tableId, isValidated } = body

    if (!tableId || typeof isValidated !== 'boolean') {
      console.log('Invalid data:', { tableId, isValidated })
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    console.log('Finding table:', tableId)
    
    // Verificar que la mesa existe
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        pollingStation: {
          include: {
            municipality: true
          }
        },
        witness: {
          include: {
            leader: {
              include: {
                candidate: true
              }
            }
          }
        }
      }
    })

    console.log('Table found:', table ? 'Yes' : 'No')

    if (!table) {
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      )
    }

    // Si es líder, verificar que la mesa pertenece a su red
    if (role === 'leader') {
      const leaderId = (session.user as any).id
      console.log('Leader validation:', { leaderId, witnessLeaderId: table.witness?.leaderId })
      
      if (!table.witness || table.witness.leaderId !== leaderId) {
        return NextResponse.json(
          { error: 'No tienes permisos para validar esta mesa' },
          { status: 403 }
        )
      }
    }

    // Actualizar el estado de validación
    console.log('Updating table:', {
      tableId,
      isValidated,
      userId: (session.user as any).id,
      role
    })
    
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        isValidated,
        validatedBy: isValidated ? (session.user as any).id : null,
        validatedAt: isValidated ? new Date() : null
      }
    })

    console.log('Table updated successfully:', updatedTable.id)

    return NextResponse.json({
      success: true,
      data: updatedTable
    })

  } catch (error) {
    console.error('=== ERROR IN VALIDATE TABLE API ===')
    console.error('Error validating table:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Error al validar mesa',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
