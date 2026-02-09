# Pasos para Crear Proyecto Supabase - AppVotaciones

## ✅ Estado Actual
- Logueado en Supabase con: wzuccardi@gmail.com

## 📝 Paso 1: Crear Nuevo Proyecto

En el dashboard de Supabase:

1. **Click en "New Project"** (botón verde en la parte superior)

2. **Configura el proyecto:**
   - **Name**: `AppVotaciones` (o `app-votaciones`)
   - **Database Password**: 
     - Click en "Generate a password" para crear una segura
     - **⚠️ CRÍTICO**: COPIA y GUARDA esta contraseña (no podrás verla después)
     - Ejemplo: `xK9#mP2$vL8@qR5`
   - **Region**: South America (São Paulo) - us-east-1 también sirve
   - **Pricing Plan**: Free

3. **Click en "Create new project"**
   - Espera 1-2 minutos mientras se crea

---

## 📝 Paso 2: Obtener Connection Strings

Una vez creado el proyecto:

1. **Ve a Settings** (ícono de engranaje ⚙️ en el sidebar izquierdo)

2. **Click en "Database"** (en la lista de Settings)

3. **Scroll hasta "Connection string"**

4. **Copia ambas URLs**:

   **A) Connection Pooling** (con Transaction mode):
   - Click en "Transaction"
   - Verás algo como:
   ```
   postgresql://postgres.xxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
   - **Reemplaza `[YOUR-PASSWORD]`** con la contraseña que guardaste
   - Agrega `?pgbouncer=true` al final

   **B) Direct Connection**:
   - Scroll un poco más abajo
   - Verás algo como:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
   - **Reemplaza `[YOUR-PASSWORD]`** con la misma contraseña

---

## 📝 Paso 3: Formato Final de las URLs

Deberías tener algo como esto (EJEMPLO, los tuyos serán diferentes):

```
# Connection Pooling (para DATABASE_URL)
postgresql://postgres.abcdefghijklmnop:xK9#mP2$vL8@qR5@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true

# Direct Connection (para DIRECT_URL)
postgresql://postgres:xK9#mP2$vL8@qR5@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## ✅ Siguiente Paso

Una vez que tengas AMBAS URLs completas (con tu contraseña), pégalas aquí y actualizaré el archivo .env automáticamente.

**Formato esperado:**
```
DATABASE_URL=tu-connection-pooling-url-aquí
DIRECT_URL=tu-direct-connection-url-aquí
```
