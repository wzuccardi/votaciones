# Solución: Error de Memoria en Deployment

## Problema
El servidor tiene solo 2GB de RAM y Next.js 16 con Turbopack necesita más memoria para compilar. El proceso es "killed" (exit code 137) por falta de memoria.

## Soluciones

### Opción 1: Aumentar Memoria del Servidor (Recomendado)

1. **Ir a DigitalOcean:**
   - https://cloud.digitalocean.com/

2. **Resize el Droplet:**
   - Selecciona el droplet (104.236.99.8)
   - Click en "Resize"
   - Selecciona un plan con 4GB RAM ($24/mes) o más
   - Espera a que se complete el resize

3. **Reintentar el deployment:**
   ```bash
   cd /opt/votaciones
   docker compose down
   git pull origin master
   docker compose build --no-cache
   docker compose up -d
   ```

### Opción 2: Deployment Sin Rebuild (Temporal)

Si no quieres aumentar la RAM ahora, puedes hacer deployment sin reconstruir:

```bash
cd /opt/votaciones
docker compose down
git pull origin master
docker compose up -d
```

**NOTA:** Esto solo funcionará si la imagen ya existe. Para cambios en el código, necesitarás la Opción 1 o 3.

### Opción 3: Agregar Swap (Memoria Virtual)

Agregar swap puede ayudar temporalmente:

```bash
# Crear archivo swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar
free -h
```

Luego reintentar el build:
```bash
cd /opt/votaciones
docker compose build --no-cache
docker compose up -d
```

### Opción 4: Optimizar el Build

Modificar el Dockerfile para usar menos memoria:

```dockerfile
# En Dockerfile, cambiar:
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN npm run build
```

Esto limita Node.js a usar máximo 1.5GB de RAM.

## Recomendación

**La mejor solución es la Opción 1 (aumentar RAM a 4GB)** porque:
- ✅ Solución permanente
- ✅ Mejor performance de la aplicación
- ✅ Permite compilaciones futuras sin problemas
- ✅ Solo $12 más al mes ($24 vs $12)

**Opción 3 (Swap) es buena alternativa temporal** si no quieres aumentar costos ahora.

## Comandos Rápidos

### Ver uso de memoria actual:
```bash
free -h
```

### Ver procesos que usan más memoria:
```bash
top
# Presiona 'M' para ordenar por memoria
# Presiona 'q' para salir
```

### Limpiar cache de Docker:
```bash
docker system prune -a -f
```

---

**Estado Actual:**
- Servidor: 2GB RAM
- Necesario para build: ~3-4GB RAM
- Solución recomendada: Upgrade a 4GB RAM
