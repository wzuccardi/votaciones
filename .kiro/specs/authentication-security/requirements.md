# Requirements Document - Autenticación y Seguridad

## Introduction

Sistema de autenticación robusto con NextAuth.js y control de permisos por roles para la plataforma electoral. Este sistema reemplazará la autenticación actual basada en localStorage por un sistema seguro con cookies httpOnly, hash de contraseñas con bcrypt, y validación de permisos en todas las rutas.

## Glossary

- **System**: Plataforma de Gestión Electoral Colombia 2026
- **NextAuth**: Librería de autenticación para Next.js
- **Session**: Sesión de usuario autenticado almacenada en cookies httpOnly
- **Candidate**: Usuario con rol de candidato (administrador de campaña)
- **Leader**: Usuario con rol de líder (organizador de votantes)
- **Voter**: Usuario con rol de votante (participante)
- **Middleware**: Capa de validación que protege rutas y endpoints
- **Hash**: Contraseña encriptada con bcrypt
- **JWT**: JSON Web Token para sesiones

## Requirements

### Requirement 1: Implementar NextAuth.js

**User Story:** Como desarrollador, quiero implementar NextAuth.js, para que el sistema tenga autenticación segura con cookies httpOnly.

#### Acceptance Criteria

1. THE System SHALL instalar y configurar NextAuth.js v4
2. THE System SHALL crear archivo de configuración en `/src/lib/auth.ts`
3. THE System SHALL configurar provider de credentials para autenticación con documento y contraseña
4. THE System SHALL almacenar sesiones en cookies httpOnly
5. THE System SHALL incluir información de rol en el token JWT
6. THE System SHALL configurar callbacks para incluir datos del usuario en la sesión

### Requirement 2: Hash de Contraseñas con Bcrypt

**User Story:** Como administrador del sistema, quiero que las contraseñas se almacenen hasheadas, para que sean seguras y no se puedan leer en texto plano.

#### Acceptance Criteria

1. THE System SHALL instalar bcryptjs
2. WHEN un usuario se registra, THE System SHALL hashear la contraseña con bcrypt antes de guardarla
3. WHEN un usuario inicia sesión, THE System SHALL comparar la contraseña ingresada con el hash almacenado
4. THE System SHALL usar un salt rounds de 10 para el hash
5. THE System SHALL actualizar el endpoint `/api/auth/register` para hashear contraseñas
6. THE System SHALL actualizar la lógica de login para verificar hashes

### Requirement 3: Proteger Rutas del Dashboard

**User Story:** Como usuario, quiero que solo pueda acceder a mi dashboard correspondiente, para que la información esté protegida según mi rol.

#### Acceptance Criteria

1. WHEN un usuario no autenticado intenta acceder a un dashboard, THE System SHALL redirigir a la página de login
2. WHEN un candidato intenta acceder al dashboard de líder, THE System SHALL redirigir a su dashboard correcto
3. WHEN un líder intenta acceder al dashboard de candidato, THE System SHALL redirigir a su dashboard correcto
4. WHEN un votante intenta acceder a dashboards de candidato o líder, THE System SHALL redirigir a su dashboard correcto
5. THE System SHALL usar `getServerSession` en páginas del dashboard para validar autenticación
6. THE System SHALL mostrar mensaje de error cuando el acceso sea denegado

### Requirement 4: Proteger Endpoints API

**User Story:** Como desarrollador, quiero que todos los endpoints API validen autenticación y permisos, para que solo usuarios autorizados puedan acceder a los datos.

#### Acceptance Criteria

1. THE System SHALL crear función helper `getAuthenticatedUser` para validar sesiones en APIs
2. WHEN un endpoint recibe una petición sin sesión válida, THE System SHALL retornar error 401 Unauthorized
3. WHEN un líder intenta acceder a votantes de otro líder, THE System SHALL retornar error 403 Forbidden
4. WHEN un candidato intenta acceder a datos de otro candidato, THE System SHALL retornar error 403 Forbidden
5. THE System SHALL validar permisos en todos los endpoints de `/api/dashboard/*`
6. THE System SHALL validar permisos en endpoints de modificación de datos

### Requirement 5: Permisos de Visualización por Rol

**User Story:** Como usuario del sistema, quiero ver solo la información que corresponde a mi rol, para mantener la privacidad y seguridad de los datos.

#### Acceptance Criteria

1. WHEN un votante accede a su dashboard, THE System SHALL mostrar solo su información personal y ubicación de votación
2. WHEN un votante accede a su dashboard, THE System SHALL NOT mostrar lista de líderes ni otros votantes
3. WHEN un líder accede a su dashboard, THE System SHALL mostrar solo sus propios votantes
4. WHEN un líder accede a su dashboard, THE System SHALL NOT mostrar votantes de otros líderes
5. WHEN un candidato accede a su dashboard, THE System SHALL mostrar todos sus líderes y todos los votantes de su campaña
6. THE System SHALL filtrar datos en el servidor según el rol del usuario autenticado

### Requirement 6: Migrar de localStorage a NextAuth

**User Story:** Como desarrollador, quiero eliminar el uso de localStorage para autenticación, para que el sistema use solo NextAuth.js.

#### Acceptance Criteria

1. THE System SHALL eliminar todas las referencias a `localStorage.setItem('currentUser')`
2. THE System SHALL eliminar todas las referencias a `localStorage.getItem('currentUser')`
3. THE System SHALL usar `useSession` de NextAuth en componentes cliente
4. THE System SHALL usar `getServerSession` en componentes servidor
5. THE System SHALL actualizar la página principal para usar `signIn` de NextAuth
6. THE System SHALL actualizar la página de login para usar `signIn` de NextAuth

### Requirement 7: Crear Middleware de Protección

**User Story:** Como desarrollador, quiero un middleware que proteja automáticamente las rutas, para que no sea necesario validar manualmente en cada página.

#### Acceptance Criteria

1. THE System SHALL crear archivo `middleware.ts` en la raíz del proyecto
2. THE System SHALL configurar el middleware para proteger rutas `/dashboard/*`
3. WHEN un usuario no autenticado accede a una ruta protegida, THE System SHALL redirigir a `/login`
4. THE System SHALL permitir acceso a rutas públicas (`/`, `/login`, `/api/auth/*`)
5. THE System SHALL validar el rol del usuario en el middleware
6. THE System SHALL redirigir al dashboard correcto según el rol del usuario

### Requirement 8: Actualizar Componentes con useSession

**User Story:** Como desarrollador, quiero que todos los componentes usen useSession de NextAuth, para que la autenticación sea consistente en toda la aplicación.

#### Acceptance Criteria

1. THE System SHALL actualizar `/src/app/dashboard/candidate/page.tsx` para usar `useSession`
2. THE System SHALL actualizar `/src/app/dashboard/leader/page.tsx` para usar `useSession`
3. THE System SHALL actualizar `/src/app/dashboard/voter/page.tsx` para usar `useSession`
4. THE System SHALL actualizar `/src/app/page.tsx` para usar `signIn` de NextAuth
5. THE System SHALL actualizar `/src/app/login/page.tsx` para usar `signIn` de NextAuth
6. THE System SHALL crear componente `Providers` para envolver la app con `SessionProvider`

### Requirement 9: Validación de Permisos en Endpoints de Datos

**User Story:** Como desarrollador, quiero que los endpoints de datos validen permisos específicos, para que cada usuario solo pueda acceder a sus datos correspondientes.

#### Acceptance Criteria

1. THE System SHALL validar en `/api/dashboard/candidate/stats` que el usuario sea el candidato solicitado
2. THE System SHALL validar en `/api/dashboard/candidate/leaders` que el usuario sea el candidato solicitado
3. THE System SHALL validar en `/api/dashboard/candidate/voters` que el usuario sea el candidato solicitado
4. THE System SHALL validar en `/api/dashboard/leader/voters` que el usuario sea el líder solicitado
5. THE System SHALL validar en `/api/dashboard/leader/voters` (POST/PUT/DELETE) que el líder solo modifique sus propios votantes
6. THE System SHALL validar en `/api/dashboard/voter/details` que el usuario sea el votante solicitado

### Requirement 10: Manejo de Errores de Autenticación

**User Story:** Como usuario, quiero recibir mensajes claros cuando hay problemas de autenticación, para entender qué sucedió y cómo resolverlo.

#### Acceptance Criteria

1. WHEN las credenciales son incorrectas, THE System SHALL mostrar mensaje "Credenciales incorrectas"
2. WHEN la sesión expira, THE System SHALL redirigir a login con mensaje "Sesión expirada"
3. WHEN un usuario intenta acceder sin permisos, THE System SHALL mostrar mensaje "No tienes permisos para acceder"
4. WHEN hay un error de servidor, THE System SHALL mostrar mensaje genérico sin exponer detalles técnicos
5. THE System SHALL usar toast notifications para mostrar errores de autenticación
6. THE System SHALL registrar errores de autenticación en logs del servidor

---

**Total de Requisitos:** 10
**Total de Criterios de Aceptación:** 60
