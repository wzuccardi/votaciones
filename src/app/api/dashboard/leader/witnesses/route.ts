import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { hashPassword } from '@/lib/password'

const prisma = new PrismaClient()

// Contraseña estándar por defecto para nuevos testigos
const DEFAULT_WITNESS_PASSWORD = 'Testigo2026!'

// Schema para crear testigo electoral
const createWitnessSchema = z.object({
  leaderId: z.string(),
  voterId: z.string(),
  pollingStationId: z.string(),
  assignedTables: z.array(z.number()).min(1).max(5), // Mínimo 1, máximo 5 mesas
  experience: z.enum(['FIRST_TIME', 'EXPERIENCED']).default('FIRST_TIME'),
  availability: z.enum(['FULL_DAY', 'MORNING', 'AFTERNOON']).default('FULL_DAY'),
  hasTransport: z.boolean().default(false),
  emergencyContact: z.string().optional(),
  notes: z.string().optional()
})

// Schema para actualizar testigo electoral
const updateWitnessSchema = z.object({
  leaderId: z.string(),
  witnessId: z.string(),
  pollingStationId: z.string().optional(),
  assignedTables: z.array(z.number()).min(1).max(5).optional(),
  experience: z.enum(['FIRST_TIME', 'EXPERIENCED']).optional(),
  availability: z.enum(['FULL_DAY', 'MORNING', 'AFTERNOON']).optional(),
  hasTransport: z.boolean().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ASSIGNED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional()
})

// GET - Listar testigos electorales del líder
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leaderId = searchParams.get('leaderId')

    if (!leaderId) {
      return NextResponse.json(
        { success: false, error: 'leaderId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el líder existe
    const leader = await prisma.leader.findUnique({
      where: { id: leaderId }
    })

    if (!leader) {
      return NextResponse.json(
        { success: false, error: 'Líder no encontrado' },
        { status: 404 }
      )
    }

    // Obtener testigos con información completa
    const witnesses = await prisma.electoralWitness.findMany({
      where: { leaderId },
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
      uniqueCode: witness.uniqueCode,
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

// POST - Crear nuevo testigo electoral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createWitnessSchema.parse(body)

    // Verificar que el líder existe
    const leader = await prisma.leader.findUnique({
      where: { id: validatedData.leaderId }
    })

    if (!leader) {
      return NextResponse.json(
        { success: false, error: 'Líder no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el votante existe y pertenece al líder
    const voter = await prisma.voter.findUnique({
      where: { id: validatedData.voterId },
      include: { electoralWitness: true }
    })

    if (!voter) {
      return NextResponse.json(
        { success: false, error: 'Votante no encontrado' },
        { status: 404 }
      )
    }

    if (voter.leaderId !== validatedData.leaderId) {
      return NextResponse.json(
        { success: false, error: 'El votante no pertenece a este líder' },
        { status: 403 }
      )
    }

    // Verificar que el votante no es ya un testigo
    if (voter.electoralWitness) {
      return NextResponse.json(
        { success: false, error: 'Este votante ya es testigo electoral' },
        { status: 400 }
      )
    }

    // Verificar que el puesto de votación existe y pertenece al mismo municipio del votante
    const pollingStation = await prisma.pollingStation.findUnique({
      where: { id: validatedData.pollingStationId },
      include: { municipality: true }
    })

    if (!pollingStation) {
      return NextResponse.json(
        { success: false, error: 'Puesto de votación no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el puesto pertenece al mismo municipio del votante
    if (voter.municipalityId !== pollingStation.municipalityId) {
      return NextResponse.json(
        { success: false, error: 'El puesto de votación debe estar en el mismo municipio del testigo' },
        { status: 400 }
      )
    }

    // Crear el testigo electoral
    // Generar código único para auto-reporte (8 caracteres alfanuméricos)
    const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    
    // Asignar contraseña estándar al votante si no tiene
    const hashedPassword = await hashPassword(DEFAULT_WITNESS_PASSWORD)
    await prisma.voter.update({
      where: { id: validatedData.voterId },
      data: { password: hashedPassword }
    })
    
    const witness = await prisma.electoralWitness.create({
      data: {
        voterId: validatedData.voterId,
        leaderId: validatedData.leaderId,
        pollingStationId: validatedData.pollingStationId,
        assignedTables: JSON.stringify(validatedData.assignedTables),
        experience: validatedData.experience,
        availability: validatedData.availability,
        hasTransport: validatedData.hasTransport,
        emergencyContact: validatedData.emergencyContact,
        notes: validatedData.notes,
        uniqueCode: uniqueCode
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

    // Formatear respuesta
    const formattedWitness = {
      id: witness.id,
      voter: witness.voter,
      pollingStation: witness.pollingStation,
      assignedTables: JSON.parse(witness.assignedTables),
      status: witness.status,
      experience: witness.experience,
      availability: witness.availability,
      hasTransport: witness.hasTransport,
      emergencyContact: witness.emergencyContact,
      notes: witness.notes,
      confirmedAt: witness.confirmedAt,
      uniqueCode: witness.uniqueCode,
      createdAt: witness.createdAt,
      updatedAt: witness.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: formattedWitness,
      message: 'Testigo electoral asignado exitosamente'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating witness:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar testigo electoral
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateWitnessSchema.parse(body)

    // Verificar que el testigo existe y pertenece al líder
    const witness = await prisma.electoralWitness.findUnique({
      where: { id: validatedData.witnessId }
    })

    if (!witness) {
      return NextResponse.json(
        { success: false, error: 'Testigo no encontrado' },
        { status: 404 }
      )
    }

    if (witness.leaderId !== validatedData.leaderId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para editar este testigo' },
        { status: 403 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}
    
    if (validatedData.pollingStationId) {
      // Verificar que el puesto existe y pertenece al mismo municipio del votante
      const pollingStation = await prisma.pollingStation.findUnique({
        where: { id: validatedData.pollingStationId },
        include: { municipality: true }
      })
      if (!pollingStation) {
        return NextResponse.json(
          { success: false, error: 'Puesto de votación no encontrado' },
          { status: 404 }
        )
      }

      // Obtener información del votante para verificar municipio
      const voterInfo = await prisma.voter.findUnique({
        where: { id: witness.voterId },
        select: { municipalityId: true }
      })

      if (voterInfo?.municipalityId !== pollingStation.municipalityId) {
        return NextResponse.json(
          { success: false, error: 'El puesto de votación debe estar en el mismo municipio del testigo' },
          { status: 400 }
        )
      }

      updateData.pollingStationId = validatedData.pollingStationId
    }

    if (validatedData.assignedTables) {
      updateData.assignedTables = JSON.stringify(validatedData.assignedTables)
    }

    if (validatedData.experience) updateData.experience = validatedData.experience
    if (validatedData.availability) updateData.availability = validatedData.availability
    if (validatedData.hasTransport !== undefined) updateData.hasTransport = validatedData.hasTransport
    if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status) {
      updateData.status = validatedData.status
      // Si se confirma, agregar timestamp
      if (validatedData.status === 'CONFIRMED' && !witness.confirmedAt) {
        updateData.confirmedAt = new Date()
      }
    }

    // Actualizar testigo
    const updatedWitness = await prisma.electoralWitness.update({
      where: { id: validatedData.witnessId },
      data: updateData,
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

    // Formatear respuesta
    const formattedWitness = {
      id: updatedWitness.id,
      voter: updatedWitness.voter,
      pollingStation: updatedWitness.pollingStation,
      assignedTables: JSON.parse(updatedWitness.assignedTables),
      status: updatedWitness.status,
      experience: updatedWitness.experience,
      availability: updatedWitness.availability,
      hasTransport: updatedWitness.hasTransport,
      emergencyContact: updatedWitness.emergencyContact,
      notes: updatedWitness.notes,
      confirmedAt: updatedWitness.confirmedAt,
      createdAt: updatedWitness.createdAt,
      updatedAt: updatedWitness.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: formattedWitness,
      message: 'Testigo electoral actualizado exitosamente'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating witness:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar testigo electoral
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { leaderId, witnessId } = body

    if (!leaderId || !witnessId) {
      return NextResponse.json(
        { success: false, error: 'leaderId y witnessId son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el testigo existe y pertenece al líder
    const witness = await prisma.electoralWitness.findUnique({
      where: { id: witnessId }
    })

    if (!witness) {
      return NextResponse.json(
        { success: false, error: 'Testigo no encontrado' },
        { status: 404 }
      )
    }

    if (witness.leaderId !== leaderId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para eliminar este testigo' },
        { status: 403 }
      )
    }

    // Eliminar testigo
    await prisma.electoralWitness.delete({
      where: { id: witnessId }
    })

    return NextResponse.json({
      success: true,
      message: 'Testigo electoral eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting witness:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}