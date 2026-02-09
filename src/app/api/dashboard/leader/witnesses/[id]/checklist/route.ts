import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { field, value } = body

    // Validar que el campo sea válido
    const validFields = [
      'confirmedAttendance',
      'receivedCredential',
      'arrivedAtStation',
      'reportedVotingStart',
      'reportedVotingEnd',
      'deliveredAct'
    ]

    if (!validFields.includes(field)) {
      return NextResponse.json({
        error: 'Campo inválido',
        message: `El campo ${field} no es válido`
      }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: any = {
      [field]: value
    }

    // Si se marca como true, agregar timestamp correspondiente
    if (value === true) {
      const now = new Date()
      if (field === 'arrivedAtStation') updateData.arrivedAt = now
      if (field === 'reportedVotingStart') updateData.votingStartAt = now
      if (field === 'reportedVotingEnd') updateData.votingEndAt = now
      if (field === 'deliveredAct') updateData.actDeliveredAt = now
    }

    // Actualizar el testigo
    const witness = await db.electoralWitness.update({
      where: { id },
      data: updateData,
      include: {
        voter: true,
        pollingStation: true
      }
    })

    // Si se confirmó la asistencia, actualizar el status a CONFIRMED
    if (field === 'confirmedAttendance' && value === true) {
      await db.electoralWitness.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      })
    }

    // Si se completó todo el checklist, actualizar el status a COMPLETED
    if (witness.confirmedAttendance && 
        witness.receivedCredential && 
        witness.arrivedAtStation && 
        witness.reportedVotingStart && 
        witness.reportedVotingEnd && 
        witness.deliveredAct) {
      await db.electoralWitness.update({
        where: { id },
        data: {
          status: 'COMPLETED'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: witness
    })
  } catch (error) {
    console.error('Error updating witness checklist:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al actualizar el checklist'
    }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const witness = await db.electoralWitness.findUnique({
      where: { id },
      select: {
        id: true,
        confirmedAttendance: true,
        receivedCredential: true,
        arrivedAtStation: true,
        reportedVotingStart: true,
        reportedVotingEnd: true,
        deliveredAct: true,
        arrivedAt: true,
        votingStartAt: true,
        votingEndAt: true,
        actDeliveredAt: true,
        voter: {
          select: {
            name: true,
            document: true,
            celular: true
          }
        },
        pollingStation: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    if (!witness) {
      return NextResponse.json({
        error: 'No encontrado',
        message: 'Testigo no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: witness
    })
  } catch (error) {
    console.error('Error fetching witness checklist:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener el checklist'
    }, { status: 500 })
  }
}
