# Implementation Plan: Autenticación y Seguridad

## Overview

Implementación completa del sistema de autenticación con NextAuth.js, reemplazando localStorage por cookies httpOnly, agregando hash de contraseñas con bcrypt, y protegiendo todas las rutas y endpoints con validación de permisos por rol.

## Tasks

- [ ] 1. Configurar NextAuth.js y dependencias
  - Instalar next-auth y bcryptjs
  - Crear variables de entorno
  - Generar NEXTAUTH_SECRET
  - _Requirements: 1.1, 2.1_

- [ ] 2. Crear configuración de autenticación
  - [ ] 2.1 Crear `/src/lib/auth.ts` con authOptions
    - Configurar CredentialsProvider
    - Implementar función authorize
    - Configurar callbacks (jwt, session)
    - Configurar páginas personalizadas
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [ ] 2.2 Crear `/src/lib/password.ts` con utilidades de hash
    - Implementar hashPassword
    - Implementar verifyPassword
    - Usar SALT_ROUNDS = 10
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 2.3 Crear `/src/lib/auth-helpers.ts` con helpers de validación
    - Implementar getAuthenticatedUser
    - Implementar requireAuth
    - Manejar errores de autenticación
    - _Requirements: 4.1, 4.2_

- [ ] 3. Crear API route de NextAuth
  - [ ] 3.1 Crear `/src/app/api/auth/[...nextauth]/route.ts`
    - Exportar handlers GET y POST
    - Usar authOptions
    - _Requirements: 1.1_

- [ ] 4. Crear SessionProvider
  - [ ] 4.1 Crear `/src/app/providers.tsx`
    - Implementar componente Providers
    - Envolver con SessionProvider
    - _Requirements: 8.6_

  - [ ] 4.2 Actualizar `/src/app/layout.tsx`
    - Importar Providers
    - Obtener session con getServerSession
    - Envolver children con Providers
    - _Requirements: 8.6_

- [ ] 5. Crear middleware de protección
  - [ ] 5.1 Crear `/middleware.ts`
    - Usar withAuth de next-auth
    - Validar roles según ruta
    - Configurar matcher para /dashboard/*
    - Redirigir a dashboard correcto según rol
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 6. Actualizar endpoint de registro
  - [ ] 6.1 Actualizar `/src/app/api/auth/register/route.ts`
    - Importar hashPassword
    - Hashear contraseña antes de guardar
    - Actualizar para candidatos
    - Actualizar para líderes
    - Actualizar para votantes
    - _Requirements: 2.2, 2.5_

- [ ] 7. Actualizar página principal
  - [ ] 7.1 Actualizar `/src/app/page.tsx`
    - Importar signIn de next-auth/react
    - Reemplazar localStorage con signIn
    - Actualizar handleRegisterCandidate
    - Actualizar handleRegisterLeader
    - Actualizar handleRegisterVoter
    - Eliminar referencias a localStorage
    - _Requirements: 6.1, 6.5, 8.4_

- [ ] 8. Actualizar página de login
  - [ ] 8.1 Actualizar `/src/app/login/page.tsx`
    - Importar signIn de next-auth/react
    - Usar signIn en handleLogin
    - Manejar errores de autenticación
    - Eliminar referencias a localStorage
    - _Requirements: 6.6, 8.5, 10.1_

- [ ] 9. Actualizar dashboard de candidato
  - [ ] 9.1 Actualizar `/src/app/dashboard/candidate/page.tsx`
    - Importar useSession y signOut
    - Reemplazar localStorage con useSession
    - Usar signOut en handleLogout
    - Validar rol en useEffect
    - Mostrar loading mientras carga sesión
    - _Requirements: 6.2, 6.3, 8.1_

- [ ] 10. Actualizar dashboard de líder
  - [ ] 10.1 Actualizar `/src/app/dashboard/leader/page.tsx`
    - Importar useSession y signOut
    - Reemplazar localStorage con useSession
    - Usar signOut en handleLogout
    - Validar rol en useEffect
    - Mostrar loading mientras carga sesión
    - _Requirements: 6.2, 6.3, 8.2_

- [ ] 11. Actualizar dashboard de votante
  - [ ] 11.1 Actualizar `/src/app/dashboard/voter/page.tsx`
    - Importar useSession y signOut
    - Reemplazar localStorage con useSession
    - Usar signOut en handleLogout
    - Validar rol en useEffect
    - Mostrar loading mientras carga sesión
    - _Requirements: 6.2, 6.3, 8.3_

- [ ] 12. Proteger endpoints de candidato
  - [ ] 12.1 Actualizar `/src/app/api/dashboard/candidate/stats/route.ts`
    - Importar getAuthenticatedUser
    - Validar sesión al inicio
    - Validar que user.id === candidateId
    - Retornar 401 si no hay sesión
    - Retornar 403 si no tiene permisos
    - _Requirements: 4.2, 4.3, 9.1_

  - [ ] 12.2 Actualizar `/src/app/api/dashboard/candidate/leaders/route.ts`
    - Importar getAuthenticatedUser
    - Validar sesión y permisos
    - Filtrar por candidateId del usuario autenticado
    - _Requirements: 4.2, 4.3, 9.2_

  - [ ] 12.3 Actualizar `/src/app/api/dashboard/candidate/voters/route.ts`
    - Importar getAuthenticatedUser
    - Validar sesión y permisos
    - Filtrar votantes por candidateId
    - _Requirements: 4.2, 4.3, 9.3_

  - [ ] 12.4 Actualizar `/src/app/api/dashboard/candidate/branding/route.ts`
    - Validar sesión en GET y POST
    - Validar que user.id === candidateId
    - _Requirements: 4.2, 4.3_

- [ ] 13. Proteger endpoints de líder
  - [ ] 13.1 Actualizar `/src/app/api/dashboard/leader/voters/route.ts` (GET)
    - Importar getAuthenticatedUser
    - Validar sesión
    - Validar que user.id === leaderId
    - Filtrar votantes por leaderId del usuario
    - _Requirements: 4.2, 4.3, 9.4, 5.3_

  - [ ] 13.2 Actualizar `/src/app/api/dashboard/leader/voters/route.ts` (POST)
    - Validar sesión
    - Validar que user.id === leaderId del body
    - Asignar leaderId del usuario autenticado
    - _Requirements: 4.2, 4.3, 9.5_

  - [ ] 13.3 Actualizar `/src/app/api/dashboard/leader/voters/route.ts` (PUT)
    - Validar sesión
    - Validar que el votante pertenece al líder autenticado
    - _Requirements: 4.2, 4.3, 9.5_

  - [ ] 13.4 Actualizar `/src/app/api/dashboard/leader/voters/route.ts` (DELETE)
    - Validar sesión
    - Validar que el votante pertenece al líder autenticado
    - _Requirements: 4.2, 4.3, 9.5_

  - [ ] 13.5 Actualizar `/src/app/api/dashboard/leader/candidate/route.ts`
    - Validar sesión
    - Validar que user.id === leaderId
    - _Requirements: 4.2, 4.3_

- [ ] 14. Proteger endpoints de votante
  - [ ] 14.1 Actualizar `/src/app/api/dashboard/voter/details/route.ts`
    - Importar getAuthenticatedUser
    - Validar sesión
    - Validar que user.id === voterId
    - Retornar solo datos del votante autenticado
    - _Requirements: 4.2, 4.3, 9.6, 5.1_

- [ ] 15. Implementar filtrado de datos por rol
  - [ ] 15.1 Actualizar queries de votantes para líder
    - Filtrar WHERE leaderId = user.id
    - No mostrar votantes de otros líderes
    - _Requirements: 5.3, 5.4_

  - [ ] 15.2 Actualizar queries de líderes para candidato
    - Filtrar WHERE candidateId = user.id
    - _Requirements: 5.5_

  - [ ] 15.3 Actualizar queries de votantes para candidato
    - Filtrar WHERE leader.candidateId = user.id
    - _Requirements: 5.5_

- [ ] 16. Manejo de errores de autenticación
  - [ ] 16.1 Crear mensajes de error consistentes
    - Implementar mensajes para credenciales incorrectas
    - Implementar mensajes para sesión expirada
    - Implementar mensajes para permisos insuficientes
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 16.2 Configurar toast notifications
    - Mostrar errores en UI con toast
    - Configurar redirecciones con mensajes
    - _Requirements: 10.5_

  - [ ] 16.3 Configurar logging de errores
    - Registrar errores de autenticación en servidor
    - No exponer detalles técnicos al cliente
    - _Requirements: 10.4, 10.6_

- [ ] 17. Checkpoint - Verificar autenticación básica
  - Probar registro de candidato
  - Probar login de candidato
  - Probar acceso a dashboard de candidato
  - Probar logout
  - Verificar que sesión persiste en reload

- [ ] 18. Checkpoint - Verificar protección de rutas
  - Intentar acceder a dashboard sin login
  - Intentar acceder a dashboard de otro rol
  - Verificar redirecciones correctas
  - Verificar middleware funciona

- [ ] 19. Checkpoint - Verificar permisos en APIs
  - Probar endpoints sin autenticación (debe retornar 401)
  - Probar endpoints con rol incorrecto (debe retornar 403)
  - Verificar que líder solo ve sus votantes
  - Verificar que candidato ve todos sus datos

- [ ] 20. Limpieza final
  - [ ] 20.1 Eliminar todas las referencias a localStorage
    - Buscar y eliminar localStorage.setItem
    - Buscar y eliminar localStorage.getItem
    - Buscar y eliminar localStorage.removeItem
    - _Requirements: 6.1, 6.2_

  - [ ] 20.2 Actualizar variables de entorno
    - Documentar NEXTAUTH_URL
    - Documentar NEXTAUTH_SECRET
    - Actualizar .env.example si existe

  - [ ] 20.3 Verificar que no hay código obsoleto
    - Revisar imports no usados
    - Revisar funciones obsoletas
    - Limpiar comentarios de código viejo

- [ ] 21. Testing final
  - Ejecutar todos los flujos de autenticación
  - Verificar todos los roles
  - Verificar todos los permisos
  - Verificar manejo de errores

## Notes

- **Orden importante**: Seguir el orden de las tareas para evitar romper funcionalidad
- **Testing incremental**: Probar después de cada checkpoint
- **Backup**: Hacer commit antes de cambios grandes
- **Variables de entorno**: Generar NEXTAUTH_SECRET con `openssl rand -base64 32`
- **Contraseñas existentes**: Los usuarios existentes necesitarán cambiar su contraseña
- **Sesiones**: Las sesiones expiran después de 30 días
- **Middleware**: Solo protege rutas /dashboard/*, las demás son públicas

---

**Total de tareas**: 21 tareas principales, 40+ sub-tareas
**Tiempo estimado**: 6-8 horas de implementación
**Prioridad**: CRÍTICA - Base para todas las demás funcionalidades
