#!/bin/bash

echo "🔧 Agregando 2GB de Swap para solucionar problema de memoria..."

# Verificar si ya existe swap
if swapon --show | grep -q '/swapfile'; then
    echo "⚠️  Ya existe un archivo swap. Eliminando el anterior..."
    sudo swapoff /swapfile
    sudo rm /swapfile
fi

# Crear archivo swap de 2GB
echo "📝 Creando archivo swap de 2GB..."
sudo fallocate -l 2G /swapfile

# Establecer permisos correctos
echo "🔒 Estableciendo permisos..."
sudo chmod 600 /swapfile

# Configurar como swap
echo "⚙️  Configurando swap..."
sudo mkswap /swapfile

# Activar swap
echo "✅ Activando swap..."
sudo swapon /swapfile

# Hacer permanente
echo "💾 Haciendo swap permanente..."
if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Verificar
echo ""
echo "📊 Estado de la memoria:"
free -h

echo ""
echo "✅ Swap agregado exitosamente!"
echo ""
echo "Ahora puedes reintentar el build:"
echo "cd /opt/votaciones && docker compose build --no-cache && docker compose up -d"
