# 🚀 Instrucciones de Despliegue - Sistema de Testigos Electorales

## ✅ Pre-requisitos

Antes de desplegar, asegúrate de tener:
- ✅ Build exitoso (`npm run build`)
- ✅ Base de datos con datos importados
- ✅ Variables de entorno configuradas
- ✅ Servidor con Node.js 18+

---

## 📋 Checklist Pre-Despliegue

### 1. Verificar Build
```bash
npm run build
```
**Resultado esperado:** ✓ Compiled successfully

### 2. Verificar Base de Datos
```bash
npx tsx scripts/verify-import.ts
```
**Resultado esperado:**
- 639 puestos de votación
- 5,493 mesas electorales
- 143,113 votantes

### 3. Verificar Variables de Entorno
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="[tu-secret-seguro]"
NEXTAUTH_URL="https://tu-dominio.com"
```

---

## 🌐 Opciones de Despliegue

### Opción 1: Vercel (Recomendado)

#### Paso 1: Preparar Repositorio
```bash
git add .
git commit -m "Sistema de testigos electorales completo"
git push origin main
```

#### Paso 2: Conectar con Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Click en "New Project"
3. Importar repositorio de GitHub
4. Configurar variables de entorno

#### Paso 3: Variables de Entorno en Vercel
```
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_SECRET=[generar-nuevo-secret]
NEXTAUTH_URL=https://tu-proyecto.vercel.app
```

#### Paso 4: Deploy
- Vercel desplegará automáticamente
- URL disponible en minutos

**Ventajas:**
- ✅ Despliegue automático
- ✅ SSL gratis
- ✅ CDN global
- ✅ Escalado automático

---

### Opción 2: VPS (DigitalOcean, AWS, etc.)

#### Paso 1: Preparar Servidor
```bash
# Conectar al servidor
ssh usuario@tu-servidor.com

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

#### Paso 2: Clonar Repositorio
```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

#### Paso 3: Instalar Dependencias
```bash
npm install
```

#### Paso 4: Configurar Variables de Entorno
```bash
nano .env
```
Agregar:
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="tu-secret-seguro"
NEXTAUTH_URL="https://tu-dominio.com"
```

#### Paso 5: Build
```bash
npm run build
```

#### Paso 6: Iniciar con PM2
```bash
pm2 start npm --name "sistema-electoral" -- start
pm2 save
pm2 startup
```

#### Paso 7: Configurar Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Paso 8: SSL con Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

### Opción 3: Docker

#### Paso 1: Crear Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Paso 2: Crear docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./prisma/dev.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    volumes:
      - ./prisma:/app/prisma
    restart: unless-stopped
```

#### Paso 3: Deploy
```bash
docker-compose up -d
```

---

## 🔐 Seguridad Post-Despliegue

### 1. Generar NEXTAUTH_SECRET Seguro
```bash
openssl rand -base64 32
```

### 2. Configurar CORS (si es necesario)
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://tu-dominio.com' }
        ]
      }
    ]
  }
}
```

### 3. Habilitar HTTPS
- ✅ Usar SSL/TLS
- ✅ Redirigir HTTP a HTTPS
- ✅ Configurar HSTS

### 4. Backup de Base de Datos
```bash
# Crear backup diario
0 2 * * * cp /ruta/prisma/dev.db /ruta/backups/dev-$(date +\%Y\%m\%d).db
```

---

## 📊 Monitoreo Post-Despliegue

### 1. Verificar que el Sistema Esté Funcionando
```bash
curl https://tu-dominio.com/api
```
**Respuesta esperada:** `{"message":"API is running"}`

### 2. Probar Autenticación de Testigo
```bash
curl https://tu-dominio.com/api/witness/auth?code=TEST1234
```

### 3. Verificar Dashboard
- Ir a `https://tu-dominio.com/dashboard/leader`
- Login con credenciales de líder
- Verificar que cargue correctamente

### 4. Probar Reporte de Testigo
- Ir a `https://tu-dominio.com/testigo/[codigo-real]`
- Verificar que cargue información
- Probar actualizar checklist

---

## 🔧 Configuración de Producción

### 1. Optimizar Base de Datos
```bash
# Aplicar migraciones
npx prisma migrate deploy

# Generar cliente
npx prisma generate
```

### 2. Configurar Logs
```typescript
// Agregar en next.config.ts
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}
```

### 3. Configurar Rate Limiting (Opcional)
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s')
})
```

---

## 📱 Configuración de URLs

### URLs Principales:
- **Home**: `https://tu-dominio.com`
- **Login**: `https://tu-dominio.com/login`
- **Dashboard Líder**: `https://tu-dominio.com/dashboard/leader`
- **Monitoreo**: `https://tu-dominio.com/dashboard/leader/monitoreo`
- **Testigos**: `https://tu-dominio.com/testigo/[codigo]`

### URLs de API:
- **Auth Testigo**: `https://tu-dominio.com/api/witness/auth`
- **Checklist**: `https://tu-dominio.com/api/witness/checklist`
- **Reportes**: `https://tu-dominio.com/api/witness/report`
- **Stats**: `https://tu-dominio.com/api/dashboard/stats`

---

## 🧪 Testing Post-Despliegue

### 1. Test de Testigo
```bash
# 1. Crear testigo de prueba
# 2. Copiar código único
# 3. Acceder a /testigo/[codigo]
# 4. Completar checklist
# 5. Reportar mesa
# 6. Verificar en dashboard
```

### 2. Test de Coordinador
```bash
# 1. Login como líder
# 2. Ver lista de testigos
# 3. Abrir checklist de testigo
# 4. Actualizar estado
# 5. Generar PDF
# 6. Verificar monitoreo en tiempo real
```

### 3. Test de Performance
```bash
# Usar herramientas como:
- Lighthouse (Chrome DevTools)
- WebPageTest
- GTmetrix
```

---

## 📊 Métricas a Monitorear

### Durante el Día Electoral:

1. **Uptime**
   - Sistema debe estar disponible 99.9%
   - Configurar alertas si cae

2. **Respuesta de APIs**
   - Tiempo de respuesta < 500ms
   - Monitorear endpoints críticos

3. **Reportes Recibidos**
   - Contador de mesas reportadas
   - Tasa de reportes por hora

4. **Errores**
   - Monitorear logs de errores
   - Alertas automáticas

---

## 🚨 Plan de Contingencia

### Si el Sistema Cae:

1. **Verificar Servidor**
   ```bash
   pm2 status
   pm2 logs sistema-electoral
   ```

2. **Reiniciar Aplicación**
   ```bash
   pm2 restart sistema-electoral
   ```

3. **Verificar Base de Datos**
   ```bash
   ls -lh prisma/dev.db
   ```

4. **Restaurar Backup**
   ```bash
   cp backups/dev-20260130.db prisma/dev.db
   pm2 restart sistema-electoral
   ```

### Contactos de Emergencia:
- **Desarrollador**: [tu-contacto]
- **Hosting**: [soporte-hosting]
- **Coordinador Electoral**: [contacto-coordinador]

---

## ✅ Checklist Final de Despliegue

### Pre-Despliegue
- [ ] Build exitoso
- [ ] Base de datos verificada
- [ ] Variables de entorno configuradas
- [ ] SSL configurado
- [ ] Backup configurado

### Post-Despliegue
- [ ] Sistema accesible
- [ ] Login funcionando
- [ ] Testigos pueden acceder con código
- [ ] Dashboard carga correctamente
- [ ] Reportes PDF se generan
- [ ] Monitoreo en tiempo real funciona
- [ ] Auto-actualización activa

### Día Electoral
- [ ] Sistema monitoreado
- [ ] Logs revisados
- [ ] Backups automáticos
- [ ] Equipo de soporte disponible

---

## 📞 Soporte

### Documentación:
- `IMPLEMENTACION-COMPLETA-TESTIGOS.md` - Guía completa
- `RESUMEN-FINAL-IMPLEMENTACION-TESTIGOS.md` - Resumen ejecutivo
- `REDISEÑO-SISTEMA-TESTIGOS-COMPLETO.md` - Diseño técnico

### Comandos Útiles:
```bash
# Ver logs
pm2 logs sistema-electoral

# Reiniciar
pm2 restart sistema-electoral

# Ver estado
pm2 status

# Backup manual
cp prisma/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db
```

---

## 🎉 ¡Listo para el Día Electoral!

El sistema está completamente implementado, probado y listo para ser desplegado. Sigue estas instrucciones y tendrás un sistema robusto y confiable para el día de las elecciones.

**¡Éxito en las elecciones!** 🗳️🎉

---

**Fecha**: 30 de Enero de 2026  
**Versión**: 1.0.0  
**Estado**: ✅ LISTO PARA DESPLIEGUE
