# 🔧 Troubleshooting Conexión Supabase

## ❌ Error Actual
Los intentos de `npx prisma db push` están fallando con error de conexión.

## 🔍 Verificación Necesaria

Por favor, verifica lo siguiente en tu dashboard de Supabase:

### 1. Connection String Correcta

1. Ve a **Settings** ⚙️ → **Database**
2. Scroll hasta **"Connection string"**
3. **IMPORTANTE**: Cambia el dropdown de "Session" a **"Transaction"**
4. Copia la URL COMPLETA (ya debería tener tu contraseña)

Ejemplo de cómo debería verse:
```
postgresql://postgres.oozvcinaymqkarwsnidg:Arena73102604722@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 2. Verificar que el Proyecto esté Activo

- Asegúrate de que el proyecto "AppVotaciones" muestre estado "Active" (verde)
- Si dice "Paused" o "Inactive", actívalo

### 3. Verificar IP Allowlist (si está configurado)

- En Settings → Database → Connection pooling
- Si ves "IP Allow List", asegúrate de que esté deshabilitado O agregado `0.0.0.0/0` para permitir todas las IPs

## ✅ Una vez verificado

Pega aquí la Connection String EXACTA que ves en Supabase (modo Transaction).

## 💡 Nota sobre Caracteres Especiales

Si tu contraseña tiene caracteres especiales como `@`, `#`, `$`, `&`, etc., puede que necesitemos URL-encodearlos:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`

Pero primero intentemos con la URL exacta que Supabase te muestra.
