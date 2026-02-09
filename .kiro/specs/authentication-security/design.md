# Design Document - Autenticación y Seguridad

## Overview

Este diseño implementa un sistema de autenticación robusto usando NextAuth.js v4 con provider de credentials, reemplazando completamente el sistema actual basado en localStorage. El sistema incluye hash de contraseñas con bcrypt, validación de permisos por rol, protección de rutas con middleware, y validación de sesiones en todos los endpoints API.

## Architecture

### Flujo de Autenticación

```
Usuario → Formulario Login → NextAuth signIn() → Credentials Provider
                                                        ↓
                                                  Validar en DB
                                                        ↓
                                                  Comparar bcrypt
                                                        ↓
                                              Crear JWT con rol
                                                        ↓
                                            Guardar en cookie httpOnly
                                                        ↓
                                              Redirigir a dashboard
```

### Arquitectura de Capas

```
┌─────────────────────────────────────────┐
│         Cliente (React)                 │
│  - useSession hook                      │
│  - signIn/signOut functions             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Middleware                      │
│  - Protección de rutas                  │
│  - Validación de roles                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         NextAuth.js                     │
│  - Session management                   │
│  - JWT tokens                           │
│  - Callbacks                            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         API Routes                      │
│  - getServerSession                     │
│  - Validación de permisos               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Database (Prisma)               │
│  - Contraseñas hasheadas                │
│  - Datos de usuarios                    │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. NextAuth Configuration (`/src/lib/auth.ts`)

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        document: { label: "Cédula", type: "text" },
        password: { label: "Contraseña", type: "password" },
        role: { label: "Rol", type: "text" }
      },
      async authorize(credentials) {
        // Validar credenciales
        // Buscar usuario en DB según rol
        // Comparar contraseña con bcrypt
        // Retornar usuario con rol
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Agregar rol e id al token
    },
    async session({ session, token }) {
      // Agregar datos del token a la sesión
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET
}
```

### 2. Session Provider (`/src/app/providers.tsx`)

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children, session }: { children: React.ReactNode; session: any }) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
```

### 3. Middleware (`/middleware.ts`)

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Validar rol según ruta
    if (path.startsWith('/dashboard/candidate') && token?.role !== 'candidate') {
      return NextResponse.redirect(new URL(`/dashboard/${token?.role}`, req.url))
    }
    
    if (path.startsWith('/dashboard/leader') && token?.role !== 'leader') {
      return NextResponse.redirect(new URL(`/dashboard/${token?.role}`, req.url))
    }
    
    if (path.startsWith('/dashboard/voter') && token?.role !== 'voter') {
      return NextResponse.redirect(new URL(`/dashboard/${token?.role}`, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### 4. Auth Helper (`/src/lib/auth-helpers.ts`)

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return null
  }
  
  return session.user
}

export async function requireAuth(requiredRole?: string) {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  if (requiredRole && user.role !== requiredRole) {
    throw new Error('Forbidden')
  }
  
  return user
}
```

### 5. Password Hashing Utilities (`/src/lib/password.ts`)

```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

## Data Models

### Session Data Structure

```typescript
interface Session {
  user: {
    id: string
    document: string
    name: string
    role: 'candidate' | 'leader' | 'voter'
    candidateId?: string  // Para líderes
    leaderId?: string     // Para votantes
    party?: string        // Para candidatos
  }
  expires: string
}
```

### JWT Token Structure

```typescript
interface JWT {
  id: string
  document: string
  name: string
  role: 'candidate' | 'leader' | 'voter'
  candidateId?: string
  leaderId?: string
  party?: string
  iat: number
  exp: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password Hash Verification
*For any* valid password and its hash, verifying the password against the hash should return true, and verifying any other password should return false.
**Validates: Requirements 2.2, 2.3**

### Property 2: Session Role Consistency
*For any* authenticated user, the role in the session should match the role in the database.
**Validates: Requirements 1.5, 5.5**

### Property 3: Authorization Enforcement
*For any* protected endpoint, requests without valid authentication should return 401, and requests without proper permissions should return 403.
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 4: Dashboard Access Control
*For any* user with role R, accessing a dashboard for role R' where R ≠ R' should redirect to the correct dashboard for role R.
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 5: Data Isolation by Role
*For any* líder L, querying voters should return only voters where leaderId = L.id.
**Validates: Requirements 5.3, 5.4, 9.4, 9.5**

### Property 6: Candidate Data Scope
*For any* candidato C, querying leaders should return only leaders where candidateId = C.id, and querying voters should return only voters whose leader.candidateId = C.id.
**Validates: Requirements 5.5, 9.2, 9.3**

### Property 7: Voter Privacy
*For any* votante V, the dashboard should display only data where voter.id = V.id, and should not display any other voters or leaders.
**Validates: Requirements 5.1, 5.2**

### Property 8: Session Persistence
*For any* authenticated user, the session should persist across page reloads until expiration or logout.
**Validates: Requirements 1.4, 8.3, 8.4**

### Property 9: Middleware Protection
*For any* request to /dashboard/*, an unauthenticated request should redirect to /login.
**Validates: Requirements 3.1, 7.3**

### Property 10: Password Storage Security
*For any* stored password in the database, it should be a bcrypt hash and not plain text.
**Validates: Requirements 2.2, 2.4**

## Error Handling

### Authentication Errors

```typescript
// 401 Unauthorized - No hay sesión válida
{
  error: 'Unauthorized',
  message: 'Debes iniciar sesión para acceder'
}

// 403 Forbidden - Sesión válida pero sin permisos
{
  error: 'Forbidden',
  message: 'No tienes permisos para acceder a este recurso'
}

// 400 Bad Request - Credenciales incorrectas
{
  error: 'Invalid credentials',
  message: 'Cédula o contraseña incorrecta'
}
```

### Error Handling Strategy

1. **Client-side**: Usar toast notifications para errores de autenticación
2. **Server-side**: Registrar errores en logs sin exponer detalles al cliente
3. **Redirects**: Redirigir automáticamente a login cuando la sesión expire
4. **Validation**: Validar datos antes de intentar autenticación

## Testing Strategy

### Unit Tests

- Hashear y verificar contraseñas con bcrypt
- Validar estructura de JWT tokens
- Verificar callbacks de NextAuth
- Probar funciones helper de autenticación

### Integration Tests

- Flujo completo de login
- Flujo completo de registro
- Protección de rutas con middleware
- Validación de permisos en endpoints

### Property-Based Tests

Cada propiedad de correctness debe tener su test correspondiente:

1. **Test Password Hash Verification**: Generar contraseñas aleatorias, hashearlas, y verificar que solo la contraseña correcta pase la verificación
2. **Test Session Role Consistency**: Crear usuarios con diferentes roles y verificar que la sesión siempre refleje el rol correcto
3. **Test Authorization Enforcement**: Hacer peticiones a endpoints protegidos sin auth (debe retornar 401) y con auth pero sin permisos (debe retornar 403)
4. **Test Dashboard Access Control**: Intentar acceder a dashboards con roles incorrectos y verificar redirección
5. **Test Data Isolation by Role**: Crear múltiples líderes con votantes y verificar que cada líder solo vea sus propios votantes
6. **Test Candidate Data Scope**: Crear múltiples candidatos con líderes y verificar que cada candidato solo vea sus propios datos
7. **Test Voter Privacy**: Verificar que un votante solo pueda ver su propia información
8. **Test Session Persistence**: Verificar que la sesión persista después de recargar la página
9. **Test Middleware Protection**: Intentar acceder a rutas protegidas sin autenticación
10. **Test Password Storage Security**: Verificar que todas las contraseñas en DB sean hashes bcrypt válidos

### Manual Testing Checklist

- [ ] Registrar candidato y verificar que puede acceder a su dashboard
- [ ] Registrar líder y verificar que puede acceder a su dashboard
- [ ] Registrar votante y verificar que puede acceder a su dashboard
- [ ] Intentar acceder a dashboard sin login (debe redirigir)
- [ ] Intentar acceder a dashboard de otro rol (debe redirigir)
- [ ] Cerrar sesión y verificar que redirige a home
- [ ] Verificar que la sesión persiste después de recargar
- [ ] Verificar que líder solo ve sus votantes
- [ ] Verificar que candidato ve todos sus líderes y votantes
- [ ] Verificar que votante solo ve su información

## Implementation Notes

### Migration Steps

1. **Instalar dependencias**: `npm install next-auth bcryptjs @types/bcryptjs`
2. **Crear configuración de NextAuth**: `/src/lib/auth.ts`
3. **Crear API route**: `/src/app/api/auth/[...nextauth]/route.ts`
4. **Crear Providers**: `/src/app/providers.tsx`
5. **Actualizar layout**: Envolver con SessionProvider
6. **Crear middleware**: `/middleware.ts`
7. **Actualizar endpoints de registro**: Hashear contraseñas
8. **Actualizar componentes**: Usar useSession
9. **Actualizar endpoints API**: Validar sesiones
10. **Eliminar código de localStorage**: Limpiar referencias antiguas

### Environment Variables Required

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
```

### Breaking Changes

- **localStorage ya no se usa**: Todos los componentes deben migrar a useSession
- **Contraseñas existentes**: Necesitan ser re-hasheadas (usuarios deben cambiar contraseña)
- **Rutas protegidas**: Ahora requieren sesión válida
- **API endpoints**: Ahora validan autenticación

### Performance Considerations

- JWT tokens son stateless (no requieren consultas a DB en cada request)
- Sesiones se cachean en el cliente
- Middleware es eficiente (solo valida token, no consulta DB)
- bcrypt es computacionalmente costoso (usar async)

---

**Versión**: 1.0.0
**Fecha**: 23 de enero de 2026
