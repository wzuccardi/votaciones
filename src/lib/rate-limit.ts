import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Configuración de Redis usando Upstash
// En desarrollo sin Redis configurado, retorna un rate limiter que siempre permite
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Estrategia de sliding window: 300 requests por minuto (aumentado para producción)
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null

// Rate limiters específicos para diferentes endpoints
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 m'), // Aumentado para producción
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null

export const apiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(150, '1 m'), // Aumentado para APIs generales
      analytics: true,
      prefix: '@upstash/ratelimit/api',
    })
  : null

/**
 * Fallback rate limiter en memoria para desarrollo local sin Redis
 * NOTA: Este es solo para desarrollo. En producción DEBE configurarse Upstash.
 */
const memoryBucket = new Map<string, { count: number; ts: number }>()

export async function fallbackRateLimit(identifier: string, limit: number = 300): Promise<boolean> {
  const now = Date.now()
  const windowMs = 60_000 // 1 minuto
  
  const entry = memoryBucket.get(identifier) || { count: 0, ts: now }
  
  if (now - entry.ts > windowMs) {
    entry.count = 0
    entry.ts = now
  }
  
  entry.count++
  memoryBucket.set(identifier, entry)
  
  return entry.count <= limit
}
