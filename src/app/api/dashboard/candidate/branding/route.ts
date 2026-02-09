import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let candidateId = searchParams.get('candidateId')
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id
    if (!candidateId) {
      candidateId = sessionCandidateId || null
    }

    if (!candidateId) {
      return NextResponse.json({
        error: 'ID de candidato requerido',
        message: 'Se requiere el ID del candidato'
      }, { status: 400 })
    }
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

    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        name: true,
        party: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        photoUrl: true
      }
    })

    if (!candidate) {
      return NextResponse.json({
        error: 'Candidato no encontrado',
        message: 'El candidato no existe'
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: candidate })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { candidateId, primaryColor, secondaryColor, logoUrl, photoUrl } = body || {}
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id

    if (!candidateId) {
      return NextResponse.json({
        error: 'ID de candidato requerido',
        message: 'Se requiere el ID del candidato'
      }, { status: 400 })
    }
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
    const exists = await db.candidate.findUnique({ where: { id: candidateId }, select: { id: true } })
    if (!exists) {
      return NextResponse.json({
        error: 'Candidato no encontrado',
        message: 'El candidato no existe'
      }, { status: 404 })
    }

    const updated = await db.candidate.update({
      where: { id: candidateId },
      data: {
        primaryColor: primaryColor ?? null,
        secondaryColor: secondaryColor ?? null,
        logoUrl: logoUrl ?? null,
        photoUrl: photoUrl ?? null
      },
      select: {
        id: true,
        name: true,
        party: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        photoUrl: true
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Branding update error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
