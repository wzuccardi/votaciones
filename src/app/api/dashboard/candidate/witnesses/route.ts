import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Listar todos los testigos de los líderes del candidato
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'candidateId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el candidato existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    })

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidato no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los líderes del candidato
    const leaders = await prisma.leader.findMany({
      where: { candidateId },
      select: { id: true, name: true, document: true }
    })

    const leaderIds = leaders.map(l => l.id)

    // Obtener testigos de todos los líderes con información completa
    const witnesses = await prisma.electoralWitness.findMany({
      where: { 
        leaderId: { in: leaderIds }
      },
      include: {
        voter: {
          select: {
            id: true,
            document: true,
            name: true,
            tel: true,
            celular: true,
            email: true,
            tableNumber: true
          }
        },
        leader: {
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
            address: true,
            community: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formatear datos para el frontend
    const formattedWitnesses = witnesses.map(witness => ({
      id: witness.id,
      voter: witness.voter,
      leader: witness.leader,
      pollingStation: witness.pollingStation,
      assignedTables: JSON.parse(witness.assignedTables),
      status: witness.status,
      experience: witness.experience,
      availability: witness.availability,
      hasTransport: witness.hasTransport,
      emergencyContact: witness.emergencyContact,
      notes: witness.notes,
      confirmedAt: witness.confirmedAt,
      // Checklist fields
      confirmedAttendance: witness.confirmedAttendance,
      receivedCredential: witness.receivedCredential,
      arrivedAtStation: witness.arrivedAtStation,
      reportedVotingStart: witness.reportedVotingStart,
      reportedVotingEnd: witness.reportedVotingEnd,
      deliveredAct: witness.deliveredAct,
      // Timestamps
      arrivedAt: witness.arrivedAt,
      votingStartAt: witness.votingStartAt,
      votingEndAt: witness.votingEndAt,
      actDeliveredAt: witness.actDeliveredAt,
      createdAt: witness.createdAt,
      updatedAt: witness.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: formattedWitnesses
    })

  } catch (error) {
    console.error('Error fetching witnesses:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}