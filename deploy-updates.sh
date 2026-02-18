#!/bin/bash

# Script para desplegar actualizaciones en el servidor de producción

echo "🚀 Desplegando actualizaciones en el servidor..."

# Conectar al servidor y ejecutar comandos
ssh root@104.236.99.8 << 'ENDSSH'
  echo "📂 Navegando al directorio de la aplicación..."
  cd /opt/votaciones

  echo "🔄 Deteniendo contenedores..."
  docker compose down

  echo "📥 Obteniendo últimos cambios de GitHub..."
  git pull origin master

  echo "🏗️  Reconstruyendo la aplicación..."
  docker compose build --no-cache

  echo "🚀 Iniciando contenedores..."
  docker compose up -d

  echo "✅ Deployment completado!"
  
  echo "📊 Estado de los contenedores:"
  docker compose ps
ENDSSH

echo "✅ Proceso de deployment finalizado"
