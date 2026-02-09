import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código requerido' },
        { status: 400 }
      )
    }

    // Buscar testigo por código único
    const witness = await db.electoralWitness.findUnique({
      where: { uniqueCode: code },
      include: {
        voter: {
          select: {
            id: true,
            name: true,
            document: true,
            tel: true,
            celular: true,
            email: true
          }
        },
        pollingStation: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            community: true
          }
        }
      }
    })

    if (!witness) {
      return NextResponse.json(
        { success: false, error: 'Código inválido' },
        { status: 404 }
      )
    }

    // Parsear las mesas asignadas
    const assignedTables = JSON.parse(witness.assignedTables)

    return NextResponse.json({
      success: true,
      data: {
        id: witness.id,
        voter: witness.voter,
        pollingStation: witness.pollingStation,
        assignedTables,
        confirmedAttendance: witness.confirmedAttendance,
        receivedCredential: witness.receivedCredential,
        arrivedAtStation: witness.arrivedAtStation,
        reportedVotingStart: witness.reportedVotingStart,
        reportedVotingEnd: witness.reportedVotingEnd,
        deliveredAct: witness.deliveredAct,
        arrivedAt: witness.arrivedAt,
        votingStartAt: witness.votingStartAt,
        votingEndAt: witness.votingEndAt,
        actDeliveredAt: witness.actDeliveredAt
      }
    })
  } catch (error) {
    console.error('Error fetching witness:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
