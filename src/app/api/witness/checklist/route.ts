import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, field, value } = body

    if (!code || !field || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Validar campo
    const validFields = [
      'confirmedAttendance',
      'receivedCredential',
      'arrivedAtStation',
      'reportedVotingStart',
      'reportedVotingEnd',
      'deliveredAct'
    ]

    if (!validFields.includes(field)) {
      return NextResponse.json(
        { success: false, error: 'Campo inválido' },
        { status: 400 }
      )
    }

    // Buscar testigo por código
    const witness = await db.electoralWitness.findUnique({
      where: { uniqueCode: code }
    })

    if (!witness) {
      return NextResponse.json(
        { success: false, error: 'Código inválido' },
        { status: 404 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {
      [field]: value
    }

    // Agregar timestamp si se marca como true
    if (value === true) {
      const now = new Date()
      if (field === 'arrivedAtStation') {
        updateData.arrivedAt = now
      } else if (field === 'reportedVotingStart') {
        updateData.votingStartAt = now
      } else if (field === 'reportedVotingEnd') {
        updateData.votingEndAt = now
      } else if (field === 'deliveredAct') {
        updateData.actDeliveredAt = now
      }
    }

    // Actualizar testigo
    const updatedWitness = await db.electoralWitness.update({
      where: { id: witness.id },
      data: updateData,
      include: {
        voter: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        pollingStation: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedWitness
    })
  } catch (error) {
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
