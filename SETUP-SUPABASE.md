# Guía Rápida: Configurar Supabase en 5 Minutos

## Opción A: Script Interactivo (Recomendado)

```bash
node scripts/setup-supabase.js
```

El script te guiará paso a paso y actualizará tu `.env` automáticamente.

---

## Opción B: Manual

### 1. Crear Proyecto en Supabase

1. Ve a: https://supabase.com
2. Click "Start your project" → Sign in con GitHub
3. Click "New Project"
4. Configura:
   - **Name**: `AppVotaciones`
   - **Database Password**: (Genera una segura - GUÁRDALA)
   - **Region**: `South America (São Paulo)`
   - **Plan**: `Free`
5. Click "Create new project" (espera 1-2 min)

### 2. Obtener Credenciales

1. Settings (⚙️) → Database
2. Busca "Connection string"
3. Copia **Connection Pooling**:
   ```
   postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```
4. Copia **Direct Connection**:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 3. Actualizar .env

Abre `c:\AppVotaciones\.env` y reemplaza:

```env
DATABASE_URL="postgresql://postgres.xxxxx:[TU-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[TU-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="58c9c2c1d7f34ac9b0f1b8a62b7f4c1bb8f9b3f3c7e9a2d1e0f5c4a3b2a190ef"
```

**IMPORTANTE**: Reemplaza `[TU-PASSWORD]` con la contraseña que creaste.

### 4. Aplicar Migración

```bash
npm run db:push
```

Verás algo como:
```
✔ Generated Prisma Client
Your database is now in sync with your Prisma schema.
```

### 5. Verificar

```bash
npm run db:studio
```

Se abrirá Prisma Studio en http://localhost:5555 mostrando tus tablas vacías.

---

## Verificación Completa

```bash
# 1. Push schema
npm run db:push

# 2. Ver tablas en Prisma Studio
npm run db:studio

# 3. Iniciar app
npm run dev
```

Abre http://localhost:3000 y prueba registrar un candidato.

---

## Troubleshooting

### Error: "Can't reach database server"
- Verifica que copiaste las URLs correctamente
- Asegúrate de reemplazar `[PASSWORD]` con tu contraseña real
- La contraseña NO debe tener corchetes [ ]

### Error: "Column does not exist"
- Ejecuta: `npm run db:push` nuevamente

### Las tablas no aparecen en Supabase Dashboard
- Las tablas están en el schema `public` por defecto
- Ve a Table Editor en Supabase para verlas

---

## ¿Listo? Continúa con:

```bash
npm run dev
```

¡Tu app ahora usa PostgreSQL en la nube! 🎉
