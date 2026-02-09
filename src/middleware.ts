import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ratelimit, authRatelimit, apiRatelimit, fallbackRateLimit } from '@/lib/rate-limit'

function addSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  const isDev = process.env.NODE_ENV !== 'production'
  const csp = [
    "default-src 'self'",
    `img-src 'self' data: blob:${isDev ? ' http: https:' : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    `connect-src 'self'${isDev ? ' ws: wss: blob: data:' : ''}`
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)
}

async function checkRateLimit(req: NextRequest, path: string): Promise<boolean> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  // Seleccionar el rate limiter apropiado según el endpoint
  let limiter = ratelimit
  if (path.startsWith('/api/auth')) {
    limiter = authRatelimit
  } else if (path.startsWith('/api/')) {
    limiter = apiRatelimit
  }

  // Si Redis está configurado, usar Upstash
  if (limiter) {
    const { success } = await limiter.limit(ip)
    return success
  }

  // Fallback en memoria para desarrollo (SOLO desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    const limit = path.startsWith('/api/auth') ? 10 : 120
    return await fallbackRateLimit(ip, limit)
  }

  // En producción sin Redis, bloquear (fuerza a configurar Redis)
  return false
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isApi = path.startsWith('/api/')

  // Verificar rate limit
  const rateLimitOk = await checkRateLimit(req, path)
  if (!rateLimitOk) {
    const res = isApi
      ? NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })
      : NextResponse.redirect(new URL('/login', req.url))
    addSecurityHeaders(res)
    return res
  }

  const isVoterDashboard =
    path.startsWith('/dashboard/voter') ||
    path.startsWith('/api/dashboard/voter')
  const requiresAuth =
    !isVoterDashboard &&
    (path.startsWith('/dashboard') ||
      path.startsWith('/api/dashboard') ||
      path.startsWith('/api/admin') ||
      path.startsWith('/api/data/colombia-data') ||
      path.startsWith('/api/data/load-polling-stations'))

  if (requiresAuth) {
    const token = await getToken({ req })
    if (!token) {
      const res = isApi
        ? NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', req.url))
      addSecurityHeaders(res)
      return res
    }
    if (path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
      if ((token as any).role !== 'candidate') {
        const res = isApi
          ? NextResponse.json({ error: 'No autorizado' }, { status: 403 })
          : NextResponse.redirect(new URL('/dashboard/candidate', req.url))
        addSecurityHeaders(res)
        return res
      }
    }
  }

  const res = NextResponse.next()
  addSecurityHeaders(res)
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
