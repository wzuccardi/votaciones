import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const candidateId = searchParams.get('candidateId')
  if (!candidateId) {
    return new Response('candidateId requerido', { status: 400 })
  }
  const session = await getServerSession(authOptions as any)
  if (!session) {
    return new Response('No autenticado', { status: 401 })
  }
  const role = (session as any).user?.role
  const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id
  if (role === 'candidate' && sessionCandidateId !== candidateId) {
    return new Response('No autorizado', { status: 403 })
  }
  if (role === 'leader') {
    const leader = await db.leader.findUnique({
      where: { id: (session as any).user?.id },
      select: { candidateId: true }
    })
    if (!leader || leader.candidateId !== candidateId) {
      return new Response('No autorizado', { status: 403 })
    }
  }

  const encoder = new TextEncoder()
  let prev: string | null = null
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      const pushBranding = async () => {
        try {
          const candidate = await db.candidate.findUnique({
            where: { id: candidateId },
            select: {
              id: true,
              primaryColor: true,
              secondaryColor: true,
              logoUrl: true,
              photoUrl: true,
              updatedAt: true
            }
          })
          if (!candidate) return
          const curr = JSON.stringify({
            primaryColor: candidate.primaryColor,
            secondaryColor: candidate.secondaryColor,
            logoUrl: candidate.logoUrl,
            photoUrl: candidate.photoUrl,
            updatedAt: candidate.updatedAt?.toISOString()
          })
          if (curr !== prev) {
            prev = curr
            send('branding', JSON.parse(curr))
          }
        } catch {}
      }

      // Initial push
      await pushBranding()
      // Heartbeat
      const ping = setInterval(() => {
        if (closed) return
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 15000)
      // Poll changes
      const poll = setInterval(() => {
        if (closed) return
        pushBranding()
      }, 5000)

      // Close handling
      const notifyClose = () => {
        if (closed) return
        closed = true
        clearInterval(ping)
        clearInterval(poll)
        try { controller.close() } catch {}
      }
      // When the client closes the connection
      // @ts-ignore
      req.signal?.addEventListener?.('abort', notifyClose)
    },
    cancel() {
      closed = true
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked'
    }
  })
}
