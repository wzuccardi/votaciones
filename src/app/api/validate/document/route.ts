import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const document = searchParams.get('document')

    if (!document) {
      return NextResponse.json({
        error: 'Documento requerido',
        message: 'Se requiere el número de documento'
      }, { status: 400 })
    }

    // Check in all tables
    const candidate = await db.candidate.findUnique({
      where: { document }
    })

    if (candidate) {
      return NextResponse.json({
        exists: true,
        type: 'candidate',
        message: `Documento ya vinculado a la campaña de ${candidate.name}`,
        candidateName: candidate.name,
        party: candidate.party
      })
    }

    const leader = await db.leader.findUnique({
      where: { document },
      include: { candidate: true }
    })

    if (leader) {
      return NextResponse.json({
        exists: true,
        type: 'leader',
        message: `Documento ya vinculado a la campaña de ${leader.candidate.name}`,
        candidateName: leader.candidate.name
      })
    }

    const voter = await db.voter.findUnique({
      where: { document },
      include: {
        leader: {
          include: {
            candidate: true
          }
        }
      }
    })

    if (voter) {
      const candidateName = voter.leader?.candidate?.name || 'No disponible'
      return NextResponse.json({
        exists: true,
        type: 'voter',
        message: `Documento ya vinculado a la campaña de ${candidateName}`,
        candidateName
      })
    }

    return NextResponse.json({
      exists: false,
      message: 'Documento disponible para registro'
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al validar el documento'
    }, { status: 500 })
  }
}
