# Guía de Configuración: Upstash Redis (Rate Limiting)

## ¿Por qué Upstash?

Upstash es un servicio de Redis serverless que funciona perfectamente con aplicaciones Next.js desplegadas en Vercel, Netlify u otros. Es gratuito hasta 10,000 comandos/día.

## Paso 1: Crear Cuenta en Upstash

1. Ve a [https://upstash.com](https://upstash.com)
2. Click en **"Get Started"** o **"Sign Up"**
3. Puedes autenticarte con GitHub o crear cuenta con email

## Paso 2: Crear Base de Datos Redis

1. Una vez dentro del dashboard, click en **"Create Database"**
2. Configura tu Redis:
   - **Name**: `appvotaciones-ratelimit` (o el nombre que prefieras)
   - **Type**: Selecciona **"Regional"** (más rápido y gratuito)
   - **Region**: Selecciona la más cercana a tu servidor (ej: `us-east-1` si usas Vercel)
   - **TLS**: Habilitado (recomendado)
   - **Eviction**: Sin eviction (los datos de rate limiting son temporales)
3. Click en **"Create"**

## Paso 3: Obtener Credenciales

1. Una vez creada la base de datos, verás el dashboard de Redis
2. Ve a la pestaña **"REST API"** (no "Redis Clients")
3. Copia las siguientes credenciales:

```
UPSTASH_REDIS_REST_URL=https://your-redis-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==
```

## Paso 4: Configurar Variables de Entorno

Agrega las credenciales a tu archivo `.env`:

```env
# ... (tus variables existentes de Supabase y NextAuth)

# ============================================
# REDIS (Upstash - para Rate Limiting)
# ============================================
UPSTASH_REDIS_REST_URL="https://your-redis-xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ=="
```

## Paso 5: Verificación

### En Desarrollo

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Verifica en la consola que no hay errores relacionados con Redis

### Probar Rate Limiting

Crea un script simple para bombardear un endpoint:

```javascript
// test-rate-limit.js
const testRateLimit = async () => {
  console.log('Testing rate limit...')
  
  for (let i = 0; i < 150; i++) {
    const res = await fetch('http://localhost:3000/api/data/candidates')
    console.log(`Request ${i + 1}: ${res.status}`)
    
    if (res.status === 429) {
      console.log('✅ Rate limit funcionando! Bloqueado en request', i + 1)
      break
    }
  }
}

testRateLimit()
```

Ejecuta:
```bash
node test-rate-limit.js
```

Deberías ver que después de ~120 requests (o antes), empieza a retornar `429 Too Many Requests`.

## Paso 6: Monitorear en Upstash Dashboard

Desde el dashboard de Upstash puedes:

- Ver **comandos ejecutados por día**
- Monitorear **latencia**
- Ver **uso de memoria**
- Revisar logs de comandos

## Configuración Avanzada (Opcional)

### Ajustar Límites por Endpoint

Edita `src/lib/rate-limit.ts` para cambiar los límites:

```typescript
// Rate limiter general: 120 requests/minuto
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '1 m'),
  // ...
})

// Rate limiter para autenticación: 10 requests/minuto
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  // ...
})
```

### Estrategias de Limitación

Upstash Ratelimit soporta varias estrategias:

- **`slidingWindow(n, window)`**: Más preciso, usa memoria adicional
- **`fixedWindow(n, window)`**: Más eficiente, menos preciso
- **`tokenBucket()`**: Para ráfagas controladas

## Producción

Al desplegar en Vercel/Netlify:

1. Agrega las variables `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en el dashboard de tu plataforma
2. El middleware automáticamente usará Upstash en producción
3. El fallback en memoria **NO se usará** en producción

## Troubleshooting

### Error: "Cannot connect to Redis"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de usar la URL de **REST API**, no la de Redis Clients

### Rate limit no funciona
- Verifica que las variables de entorno estén cargadas (reinicia el servidor)
- Revisa los logs de Upstash para ver si llegan comandos

### En desarrollo funciona pero en producción no
- Asegúrate de haber configurado las variables de entorno en tu plataforma de despliegue

---

## Próximos Pasos

Una vez verificado que Upstash funciona:
- ✅ Fase 2 completada
- ⏭️ Proceder a **Fase 3**: Refactorizar formularios con Zod + React Hook Form
