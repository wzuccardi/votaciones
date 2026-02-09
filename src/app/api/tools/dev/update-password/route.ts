import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'No permitido en producción' }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const document: string | undefined = body?.document
    const password: string | undefined = body?.password
    if (!document || !password) {
      return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })
    }
    const candidate = await db.candidate.findUnique({ where: { document }, select: { id: true } })
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }
    const updated = await db.candidate.update({
      where: { document },
      data: { password: hashPassword(password) },
      select: { id: true, document: true }
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'No permitido en producción' }, { status: 403 })
    }
    const { searchParams } = new URL(req.url)
    const document = searchParams.get('document') || undefined
    const password = searchParams.get('password') || undefined
    if (!document || !password) {
      return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })
    }
    const candidate = await db.candidate.findUnique({ where: { document }, select: { id: true } })
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }
    const updated = await db.candidate.update({
      where: { document },
      data: { password: hashPassword(password) },
      select: { id: true, document: true }
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
