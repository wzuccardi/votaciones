import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
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
    
    // Validar permisos
    if (role === 'leader' && sessionLeaderId !== leaderId) {
      // Verificar si el leaderId solicitado es un sublíder del líder actual
      const requestedLeader = await db.leader.findUnique({
        where: { id: leaderId },
        select: { parentLeaderId: true }
      })
      
      if (!requestedLeader || requestedLeader.parentLeaderId !== sessionLeaderId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const voters = await db.voter.findMany({
      where: { leaderId },
      include: {
        municipality: {
          select: {
            id: true,
            name: true
          }
        },
        pollingStation: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform data to match frontend expectations
    const transformedVoters = voters.map(voter => ({
      id: voter.id,
      document: voter.document,
      name: voter.name,
      tel: (voter as any).tel,
      celular: (voter as any).celular,
      email: (voter as any).email,
      municipality: voter.municipality?.name,
      municipalityId: voter.municipalityId,
      pollingStation: voter.pollingStation?.name,
      pollingStationId: voter.pollingStationId,
      tableNumber: voter.tableNumber
    }))

    return NextResponse.json({
      success: true,
      data: transformedVoters
    })

  } catch (error) {
    console.error('Error fetching voters:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los votantes'
    }, { status: 500 })
  }
}

const createSchema = z.object({
  leaderId: z.string().min(1, 'El ID del líder es requerido'),
  document: z.string().min(1, 'La cédula es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
  tel: z.string().min(1, 'El teléfono es requerido'),
  celular: z.string().min(1, 'El celular es requerido'),
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  municipalityId: z.string().min(1, 'El municipio es requerido'),
  pollingStationId: z.string().min(1, 'El puesto de votación es requerido'),
  tableNumber: z.string().min(1, 'El número de mesa es requerido')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionLeaderId = (session as any).user?.id
    const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id
    if (role === 'leader' && sessionLeaderId !== data.leaderId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (role === 'candidate') {
      const leaderCheck = await db.leader.findUnique({ where: { id: data.leaderId }, select: { candidateId: true } })
      if (!leaderCheck || leaderCheck.candidateId !== sessionCandidateId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const leader = await db.leader.findUnique({ where: { id: data.leaderId } })
    if (!leader) {
      return NextResponse.json({ error: 'Líder no encontrado' }, { status: 404 })
    }

    // Prevent duplicates across all roles
    const existsCandidate = await db.candidate.findUnique({ where: { document: data.document } })
    const existsLeader = await db.leader.findUnique({ where: { document: data.document } })
    const existsVoter = await db.voter.findUnique({ where: { document: data.document } })
    if (existsCandidate || existsLeader || existsVoter) {
      return NextResponse.json({
        error: 'Documento ya registrado',
        message: 'El documento ya está vinculado a otra cuenta'
      }, { status: 400 })
    }

    const created = await db.voter.create({
      data: {
        leaderId: data.leaderId,
        document: data.document,
        name: data.name,
        tel: data.tel || null,
        celular: data.celular || null,
        email: data.email || null,
        municipalityId: data.municipalityId || null,
        pollingStationId: data.pollingStationId || null,
        tableNumber: data.tableNumber || null
      } as any
    })

    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Error de validación',
        message: error.issues[0]?.message || 'Datos inválidos',
        details: error.issues
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

const updateSchema = z.object({
  leaderId: z.string().min(1, 'El ID del líder es requerido'),
  voterId: z.string().min(1, 'El ID del votante es requerido'),
  document: z.string().min(1, 'La cédula es requerida').optional(),
  name: z.string().min(1, 'El nombre es requerido').optional(),
  tel: z.string().min(1, 'El teléfono es requerido').optional(),
  celular: z.string().min(1, 'El celular es requerido').optional(),
  email: z.string().email('Email inválido').min(1, 'El email es requerido').optional(),
  municipalityId: z.string().min(1, 'El municipio es requerido').optional(),
  pollingStationId: z.string().min(1, 'El puesto de votación es requerido').optional(),
  tableNumber: z.string().min(1, 'El número de mesa es requerido').optional()
})

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const data = updateSchema.parse(body)
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionLeaderId = (session as any).user?.id
    const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id

    const voter = await db.voter.findUnique({ where: { id: data.voterId } })
    if (!voter || voter.leaderId !== data.leaderId) {
      return NextResponse.json({ error: 'Votante no encontrado' }, { status: 404 })
    }
    if (role === 'leader' && sessionLeaderId !== data.leaderId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (role === 'candidate') {
      const leaderCheck = await db.leader.findUnique({ where: { id: data.leaderId }, select: { candidateId: true } })
      if (!leaderCheck || leaderCheck.candidateId !== sessionCandidateId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Optional document uniqueness check if updating document
    if (data.document && data.document !== voter.document) {
      const existsCandidate = await db.candidate.findUnique({ where: { document: data.document } })
      const existsLeader = await db.leader.findUnique({ where: { document: data.document } })
      const existsVoter = await db.voter.findUnique({ where: { document: data.document } })
      if (existsCandidate || existsLeader || existsVoter) {
        return NextResponse.json({
          error: 'Documento ya registrado',
          message: 'El documento ya está vinculado a otra cuenta'
        }, { status: 400 })
      }
    }

    const updated = await db.voter.update({
      where: { id: data.voterId },
      data: {
        document: data.document ?? undefined,
        name: data.name ?? undefined,
        tel: data.tel ?? undefined,
        celular: data.celular ?? undefined,
        email: data.email ?? undefined,
        municipalityId: data.municipalityId ?? undefined,
        pollingStationId: data.pollingStationId ?? undefined,
        tableNumber: data.tableNumber ?? undefined
      } as any
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Error de validación',
        message: error.issues[0]?.message || 'Datos inválidos',
        details: error.issues
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

const deleteSchema = z.object({
  leaderId: z.string().min(1),
  voterId: z.string().min(1)
})

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const data = deleteSchema.parse(body)
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionLeaderId = (session as any).user?.id
    const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id

    const voter = await db.voter.findUnique({ where: { id: data.voterId } })
    if (!voter || voter.leaderId !== data.leaderId) {
      return NextResponse.json({ error: 'Votante no encontrado' }, { status: 404 })
    }
    if (role === 'leader' && sessionLeaderId !== data.leaderId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (role === 'candidate') {
      const leaderCheck = await db.leader.findUnique({ where: { id: data.leaderId }, select: { candidateId: true } })
      if (!leaderCheck || leaderCheck.candidateId !== sessionCandidateId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    await db.voter.delete({ where: { id: data.voterId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Error de validación',
        message: error.issues[0]?.message || 'Datos inválidos',
        details: error.issues
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
