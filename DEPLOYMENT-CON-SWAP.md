# Deployment con Swap - Paso a Paso

## Problema Actual
- Los cambios están en GitHub pero NO en producción
- El dropdown de municipios no funciona porque el servidor tiene código antiguo
- No podemos hacer build porque el servidor tiene solo 2GB RAM

## Solución: Agregar Swap y Hacer Build

### Paso 1: Conectarse al Servidor

```bash
ssh root@104.236.99.8
```

### Paso 2: Ir al Directorio del Proyecto

```bash
cd /opt/votaciones
```

### Paso 3: Agregar Swap (2GB de Memoria Virtual)

```bash
# Ejecutar el script que ya está en el repositorio
bash add-swap.sh
```

Deberías ver algo como:
```
🔧 Agregando 2GB de Swap para solucionar problema de memoria...
📝 Creando archivo swap de 2GB...
🔒 Estableciendo permisos...
⚙️  Configurando swap...
✅ Activando swap...
💾 Haciendo swap permanente...

📊 Estado de la memoria:
              total        used        free      shared  buff/cache   available
Mem:           1.9G        800M        200M         10M        900M        1.0G
Swap:          2.0G          0B        2.0G

✅ Swap agregado exitosamente!
```

### Paso 4: Verificar que el Swap Está Activo

```bash
free -h
```

Deberías ver una línea "Swap:" con ~2.0G total.

### Paso 5: Hacer Pull de los Últimos Cambios

```bash
git pull origin master
```

### Paso 6: Detener los Contenedores

```bash
docker compose down
```

### Paso 7: Limpiar Cache de Docker (Opcional pero Recomendado)

```bash
docker system prune -f
```

### Paso 8: Hacer Build con el Swap Activo

```bash
docker compose build --no-cache
```

⚠️ **IMPORTANTE:** Este proceso puede tomar 5-10 minutos. Verás mensajes como:
- "Creating an optimized production build..."
- "Compiling..."
- "Running TypeScript..."

Si ves "Killed" nuevamente, significa que necesitas más memoria (Opción A: upgrade a 4GB).

### Paso 9: Levantar los Contenedores

```bash
docker compose up -d
```

### Paso 10: Verificar que Todo Está Funcionando

```bash
# Ver los logs
docker compose logs -f --tail=50
```

Presiona `Ctrl+C` para salir de los logs.

### Paso 11: Verificar en el Navegador

Abre https://alonsodelrio.org y verifica:
1. El sitio carga correctamente
2. Puedes iniciar sesión
3. El dropdown de municipios ahora funciona

## Si Algo Sale Mal

### Si el build falla con "Killed":
Necesitas hacer upgrade del servidor a 4GB RAM en DigitalOcean.

### Si hay errores de Docker:
```bash
# Limpiar todo y empezar de nuevo
docker compose down
docker system prune -a -f
docker compose build --no-cache
docker compose up -d
```

### Si el sitio no carga:
```bash
# Ver los logs para identificar el error
docker compose logs app
```

## Comandos Útiles

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar un servicio específico
docker compose restart app

# Ver uso de memoria
free -h
top
```

## Resumen de Comandos (Copiar y Pegar)

```bash
# Conectarse
ssh root@104.236.99.8

# Ir al proyecto
cd /opt/votaciones

# Agregar swap
bash add-swap.sh

# Verificar swap
free -h

# Pull cambios
git pull origin master

# Deployment completo
docker compose down
docker system prune -f
docker compose build --no-cache
docker compose up -d

# Ver logs
docker compose logs -f --tail=50
```

---

**Tiempo estimado:** 10-15 minutos
**Costo:** $0 (solo usa memoria virtual)
**Riesgo:** Bajo (el swap es temporal y no afecta el servidor)
