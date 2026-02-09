# ❌ Error P1001: Can't Reach Database Server

## El Problema
Prisma no puede conectarse a tu base de datos Supabase. Error completo:
```
P1001: Can't reach database server at `db.oozvcinaymqkarwsnidg.supabase.co:5432`
```

## ✅ Soluciones Paso a Paso

### 1. Verificar que el Proyecto esté Activo

**ESTO ES LO MÁS COMÚN:**

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Busca tu proyecto "AppVotaciones"
3. ¿Qué color ves junto al nombre del proyecto?
   - 🟢 **Verde ("Active")** → Bien, pasa al siguiente paso
   - 🟡 **Amarillo ("Paused")** → **¡ESTE ES EL PROBLEMA!**
   - 🔴 **Rojo** → Hay un error, contacta soporte

**Si está PAUSADO:**
1. Click en el proyecto
2. Busca el botón **"Restore"** o **"Unpause"**
3. Espera 30-60 segundos a que se active
4. Vuelve a intentar: `node scripts/test-db-connection.js`

---

### 2. Verificar Connection String

En Supabase Dashboard:
1. Settings ⚙️ → Database
2. Scroll a "Connection string"
3. Verifica que la URL sea EXACTAMENTE:
   ```
   postgresql://postgres:Arena73102604722@db.oozvcinaymqkarwsnidg.supabase.co:5432/postgres
   ```

---

### 3. Verificar Firewall/Red

Si tu organización o ISP bloquea conexiones a puertos no estándar:
1. Prueba desactivar tu VPN (si usas una)
2. Prueba desde otra red (ej: datos móviles)
3. Verifica que el puerto 5432 no esté bloqueado

---

### 4. Reiniciar Proyecto Supabase

Como último recurso:
1. En Supabase Dashboard → Settings → General
2. Scroll al final
3. "Pause project" → Confirmar
4. Espera 10 segundos
5. "Resume project"
6. Espera 1-2 minutos

---

## 🧪 Probar Conexión

Una vez que verifiques que el proyecto está ACTIVO (verde):

```bash
node scripts/test-db-connection.js
```

Deberías ver:
```
✅ SUCCESS! Database schema has been pushed to Supabase!
```

---

## 💡 Notas

- Los proyectos gratuitos de Supabase se **pausan automáticamente** después de 1 semana de inactividad
- Cuando se pausa, la base de datos NO responde a conexiones
- Reactivarlo toma ~30-60 segundos

---

## ¿Listo?

1. ✅ Verifica que el proyecto esté **Active (verde)**
2. ✅ Si estaba pausado, actívalo y espera 1 minuto
3. ✅ Ejecuta: `node scripts/test-db-connection.js`
4. ✅ Si funciona, ejecuta: `npm run dev` para probar la app
