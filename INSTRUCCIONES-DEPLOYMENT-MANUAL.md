# Instrucciones para Deployment Manual

## Problema Actual
Los cambios están en GitHub pero no se han desplegado en el servidor de producción (104.236.99.8). Por eso el sitio web todavía muestra 0 municipios.

## Solución: Desplegar Actualizaciones

### Opción 1: Usando SSH (Recomendado)

1. **Conectarse al servidor:**
   ```bash
   ssh root@104.236.99.8
   ```

2. **Navegar al directorio de la aplicación:**
   ```bash
   cd /opt/votaciones
   ```

3. **Detener los contenedores:**
   ```bash
   docker compose down
   ```

4. **Obtener los últimos cambios de GitHub:**
   ```bash
   git pull origin master
   ```

5. **Reconstruir la aplicación:**
   ```bash
   docker compose build --no-cache
   ```

6. **Iniciar los contenedores:**
   ```bash
   docker compose up -d
   ```

7. **Verificar que todo esté funcionando:**
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

8. **Salir del servidor:**
   ```bash
   exit
   ```

### Opción 2: Script Automatizado (Una vez configurado SSH)

Si ya tienes configurado el acceso SSH sin contraseña, puedes usar:

**En Windows (PowerShell):**
```powershell
.\deploy-updates.ps1
```

**En Linux/Mac:**
```bash
chmod +x deploy-updates.sh
./deploy-updates.sh
```

## Verificación

Después del deployment, verifica que todo funcione:

1. **Abrir el sitio web:**
   ```
   https://alonsodelrio.org
   ```

2. **Verificar el contador:**
   - Debe mostrar "46 Municipios (Bolívar)"
   - Debe mostrar "639 Puestos de Votación"

3. **Verificar la consola del navegador:**
   - No debe haber errores 404 en `/api/data/municipalities`
   - No debe haber errores 404 en `/api/data/polling-stations`

## Troubleshooting

### Si el deployment falla:

1. **Verificar logs del contenedor:**
   ```bash
   ssh root@104.236.99.8
   cd /opt/votaciones
   docker compose logs app
   ```

2. **Verificar que Git haya actualizado:**
   ```bash
   ssh root@104.236.99.8
   cd /opt/votaciones
   git log -1
   ```
   Debe mostrar el último commit: "fix: Corregir formato de respuesta..."

3. **Verificar que los contenedores estén corriendo:**
   ```bash
   ssh root@104.236.99.8
   docker compose ps
   ```

4. **Reiniciar manualmente si es necesario:**
   ```bash
   ssh root@104.236.99.8
   cd /opt/votaciones
   docker compose restart
   ```

### Si persisten los errores 404:

1. **Verificar que los archivos existan en el servidor:**
   ```bash
   ssh root@104.236.99.8
   cd /opt/votaciones
   ls -la src/app/api/data/municipalities/
   ls -la src/hooks/queries/
   ```

2. **Verificar la build de Next.js:**
   ```bash
   ssh root@104.236.99.8
   cd /opt/votaciones
   docker compose exec app ls -la .next/
   ```

3. **Limpiar cache y rebuild:**
   ```bash
   ssh root@104.236.99.8
   cd /opt/votaciones
   docker compose down
   docker system prune -f
   docker compose build --no-cache
   docker compose up -d
   ```

## Notas Importantes

1. **El deployment toma aproximadamente 5-10 minutos** debido a:
   - Descarga de cambios de GitHub
   - Rebuild de la imagen Docker
   - Instalación de dependencias
   - Build de Next.js

2. **Durante el deployment, el sitio estará temporalmente fuera de línea**

3. **Después del deployment, puede tomar 1-2 minutos** para que Next.js compile todas las rutas

4. **Si ves errores de "Module not found"**, es normal durante los primeros segundos después del deployment

## Comandos Rápidos

### Ver logs en tiempo real:
```bash
ssh root@104.236.99.8 "cd /opt/votaciones && docker compose logs -f app"
```

### Reiniciar rápido (sin rebuild):
```bash
ssh root@104.236.99.8 "cd /opt/votaciones && docker compose restart"
```

### Ver estado:
```bash
ssh root@104.236.99.8 "cd /opt/votaciones && docker compose ps"
```

### Deployment completo (un solo comando):
```bash
ssh root@104.236.99.8 "cd /opt/votaciones && docker compose down && git pull origin master && docker compose build --no-cache && docker compose up -d"
```

---

**Fecha:** 18 de febrero de 2026  
**Servidor:** 104.236.99.8  
**Dominio:** https://alonsodelrio.org  
**Directorio:** /opt/votaciones
