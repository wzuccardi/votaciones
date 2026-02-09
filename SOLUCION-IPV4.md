# 🔧 Solución: Usar Session Pooler en vez de Direct Connection

## El Problema
La "Direct connection" no es compatible con IPv4, que es lo que la mayoría de redes usan.

## ✅ Solución

En la pantalla de Supabase que estás viendo:

1. **Cambia el Method dropdown:**
   - De: `Direct connection`
   - A: `Session pooler` (o `Transaction`)

2. **Copia la nueva URL** que aparece (debería empezar diferente)

3. **Pégala aquí** y la configuraré automáticamente

## Ejemplo de cómo deberían verse las URLs correctas:

- ❌ **Direct** (no funciona en IPv4):
  ```
  postgresql://postgres:PASSWORD@db.oozvcinaymqkarwsnidg.supabase.co:5432/postgres
  ```

- ✅ **Session Pooler** (funciona en IPv4):
  ```
  postgresql://postgres.oozvcinaymqkarwsnidg:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
  ```

Nota la diferencia:
- Pooler usa: `aws-0-REGION.pooler.supabase.com`
- Direct usa: `db.XXXXX.supabase.co`

## 🎯 Una vez tengas la URL del Session Pooler

Pégala aquí y ejecutaremos:
```bash
node scripts/test-db-connection.js
```

¡Debería funcionar! 🚀
