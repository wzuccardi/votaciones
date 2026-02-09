import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { verifyPassword } from './password'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        document: { label: 'Documento', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
        role: { label: 'Rol', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials) return null
        const { document, password, role } = credentials as { document: string; password: string; role: 'candidate' | 'leader' | 'witness' }
        if (!document || !password || !role) return null

        if (role === 'candidate') {
          const candidate = await db.candidate.findUnique({ where: { document } })
          if (!candidate) return null
          const ok = verifyPassword(password, candidate.password)
          if (!ok) return null
          return {
            id: candidate.id,
            name: candidate.name,
            role: 'candidate',
          } as any
        }

        if (role === 'leader') {
          const leader = await db.leader.findUnique({
            where: { document },
            include: { candidate: true }
          })
          if (!leader) return null
          const ok = verifyPassword(password, leader.password)
          if (!ok) return null
          return {
            id: leader.id,
            name: leader.name,
            role: 'leader',
            candidateId: leader.candidateId
          } as any
        }

        if (role === 'witness') {
          // Buscar votante que sea testigo electoral
          const voter = await db.voter.findUnique({
            where: { document },
            include: {
              electoralWitness: {
                include: {
                  pollingStation: true
                }
              }
            }
          })
          
          // Validar que existe, tiene contraseña y es testigo
          if (!voter || !voter.password || !voter.electoralWitness) return null
          
          const ok = verifyPassword(password, voter.password)
          if (!ok) return null
          
          return {
            id: voter.id,
            name: voter.name,
            role: 'witness',
            witnessId: voter.electoralWitness.id,
            uniqueCode: voter.electoralWitness.uniqueCode
          } as any
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.candidateId = (user as any).candidateId || null
        token.witnessId = (user as any).witnessId || null
        token.uniqueCode = (user as any).uniqueCode || null
      }
      return token
    },
    async session({ session, token }) {
      (session as any).user = {
        id: token.id,
        role: token.role,
        candidateId: token.candidateId || null,
        witnessId: token.witnessId || null,
        uniqueCode: token.uniqueCode || null,
        name: session.user?.name || null
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

