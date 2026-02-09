#!/bin/bash

# Script de deployment para producción
set -e

echo "🚀 Iniciando deployment de Sistema Electoral..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
fi

# Verificar que existe .env.production
if [ ! -f ".env.production" ]; then
    error "No se encontró .env.production. Crea este archivo antes de continuar."
fi

log "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado"
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado"
fi

# Detener contenedores existentes
log "Deteniendo contenedores existentes..."
docker-compose down || true

# Limpiar imágenes antiguas (opcional)
read -p "¿Deseas limpiar imágenes Docker antiguas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Limpiando imágenes antiguas..."
    docker system prune -f
fi

# Construir imagen
log "Construyendo imagen Docker..."
docker-compose build --no-cache

# Verificar que la imagen se construyó correctamente
if [ $? -ne 0 ]; then
    error "Error al construir la imagen Docker"
fi

# Iniciar servicios
log "Iniciando servicios..."
docker-compose up -d

# Esperar a que la aplicación esté lista
log "Esperando a que la aplicación esté lista..."
sleep 10

# Verificar que los contenedores están corriendo
log "Verificando estado de contenedores..."
docker-compose ps

# Test de salud
log "Realizando test de salud..."
sleep 5

# Intentar conectar a la aplicación
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Aplicación desplegada exitosamente!"
    log "🌐 Accede a: http://$(curl -s ifconfig.me):3000"
else
    warn "La aplicación puede estar iniciando aún. Verifica los logs:"
    echo "docker-compose logs -f app"
fi

# Mostrar logs finales
log "Últimos logs de la aplicación:"
docker-compose logs --tail=20 app

log "🎉 Deployment completado!"
log "📋 Comandos útiles:"
echo "  - Ver logs: docker-compose logs -f app"
echo "  - Reiniciar: docker-compose restart app"
echo "  - Detener: docker-compose down"
echo "  - Estado: docker-compose ps"