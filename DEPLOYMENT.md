# 🚀 Guía de Deployment - Sistema Electoral

## Prerrequisitos

### 1. VPS (DigitalOcean recomendado)
- **Especificaciones mínimas**: 1GB RAM, 25GB SSD, Ubuntu 22.04
- **Costo**: ~$6/mes
- **Acceso**: SSH con clave pública

### 2. Dominio
- Dominio registrado (ej: tu-dominio.com)
- DNS configurado apuntando a la IP del VPS

### 3. Base de Datos
- Supabase configurado y funcionando
- URL de conexión disponible

## 📋 Pasos de Deployment

### Paso 1: Configurar VPS

```bash
# Conectar al VPS
ssh root@tu-ip-del-vps

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Crear usuario para la aplicación
adduser votaciones
usermod -aG docker votaciones
su - votaciones
```

### Paso 2: Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo

# Configurar variables de entorno
cp .env.production.example .env.production
nano .env.production
```

**Configurar .env.production:**
```env
NODE_ENV=production
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-super-seguro-de-32-caracteres-minimo
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### Paso 3: Configurar Dominio

```bash
# Editar Caddyfile
cp Caddyfile.production Caddyfile
nano Caddyfile
# Reemplazar "tu-dominio.com" con tu dominio real
```

### Paso 4: Deploy

```bash
# Hacer ejecutable el script
chmod +x deploy.sh

# Ejecutar deployment
./deploy.sh
```

### Paso 5: Verificar

```bash
# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps

# Test de salud
curl https://tu-dominio.com/api/health
```

## 🔧 Comandos Útiles

### Gestión de Contenedores
```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Reiniciar aplicación
docker-compose restart app

# Actualizar aplicación
git pull
docker-compose build --no-cache
docker-compose up -d

# Backup de base de datos (si usas PostgreSQL local)
docker-compose exec postgres pg_dump -U postgres votaciones > backup.sql
```

### Monitoreo
```bash
# Ver uso de recursos
docker stats

# Ver logs de Caddy (SSL)
docker-compose logs caddy

# Verificar certificados SSL
curl -I https://tu-dominio.com
```

## 🛡️ Seguridad

### Firewall
```bash
# Configurar UFW
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### SSL
- Caddy maneja SSL automáticamente
- Certificados se renuevan automáticamente
- Redirección HTTP → HTTPS automática

### Backups
```bash
# Crear snapshot del VPS (DigitalOcean)
# Desde el panel de control cada semana

# Backup de uploads
tar -czf uploads-backup.tar.gz uploads/
```

## 📊 Monitoreo y Logs

### Logs de Aplicación
```bash
# Logs de Next.js
docker-compose logs app

# Logs de acceso web
docker-compose exec caddy cat /var/log/caddy/access.log
```

### Métricas
- Health check: `https://tu-dominio.com/api/health`
- Uptime monitoring: Configurar con UptimeRobot (gratuito)

## 🚨 Troubleshooting

### Problemas Comunes

**1. Aplicación no inicia**
```bash
docker-compose logs app
# Verificar variables de entorno
# Verificar conexión a Supabase
```

**2. SSL no funciona**
```bash
docker-compose logs caddy
# Verificar DNS del dominio
# Verificar puertos 80/443 abiertos
```

**3. Base de datos no conecta**
```bash
# Verificar DATABASE_URL en .env.production
# Verificar IP whitelist en Supabase
```

## 📈 Escalamiento

### Upgrade de VPS
```bash
# Desde DigitalOcean panel:
# 1. Crear snapshot
# 2. Resize droplet
# 3. Reiniciar
```

### Optimizaciones
- Configurar CDN (Cloudflare gratuito)
- Optimizar imágenes
- Configurar Redis para cache
- Monitoreo con Grafana

## 💰 Costos Estimados

| Usuarios | VPS | Supabase | Total/mes |
|----------|-----|----------|-----------|
| 0-1K     | $6  | $0       | $6        |
| 1K-5K    | $12 | $0       | $12       |
| 5K-20K   | $24 | $25      | $49       |

## 📞 Soporte

Para asistencia con el deployment:
1. Verificar logs: `docker-compose logs`
2. Revisar health check: `/api/health`
3. Consultar esta documentación
4. Contactar soporte técnico