import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'

const ITERATIONS = 120000
const KEYLEN = 32
const DIGEST = 'sha256'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
  const hash = derived.toString('hex')
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
    const iterations = parseInt(parts[1], 10)
    const salt = parts[2]
    const hashHex = parts[3]
    const computed = pbkdf2Sync(password, salt, iterations, KEYLEN, DIGEST)
    const storedBuf = Buffer.from(hashHex, 'hex')
    return timingSafeEqual(computed, storedBuf)
  } catch {
    return false
  }
}

