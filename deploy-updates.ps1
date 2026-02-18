# Script para desplegar actualizaciones en el servidor de producción

Write-Host "🚀 Desplegando actualizaciones en el servidor..." -ForegroundColor Green

# Comandos a ejecutar en el servidor
$commands = @"
cd /opt/votaciones
echo '🔄 Deteniendo contenedores...'
docker compose down
echo '📥 Obteniendo últimos cambios de GitHub...'
git pull origin master
echo '🏗️  Reconstruyendo la aplicación...'
docker compose build --no-cache
echo '🚀 Iniciando contenedores...'
docker compose up -d
echo '✅ Deployment completado!'
echo '📊 Estado de los contenedores:'
docker compose ps
"@

# Ejecutar comandos en el servidor
ssh root@104.236.99.8 $commands

Write-Host "✅ Proceso de deployment finalizado" -ForegroundColor Green
