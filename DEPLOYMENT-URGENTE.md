# 🚨 DEPLOYMENT URGENTE - Actualizar Servidor

## El Problema
El sitio web muestra 0 municipios porque el servidor todavía tiene el código antiguo. Los cambios están en GitHub pero no se han desplegado.

## La Solución (5 minutos)

### Paso 1: Conectarse al Servidor
Abre una terminal y ejecuta:
```bash
ssh root@104.236.99.8
```

### Paso 2: Copiar y Pegar Este Comando
Una vez conectado al servidor, copia y pega este comando completo:

```bash
cd /opt/votaciones && docker compose down && git pull origin master && docker compose build --no-cache && docker compose up -d && docker compose logs -f app
```

### Paso 3: Esperar
- Verás mensajes de progreso
- El proceso toma 5-10 minutos
- Cuando veas "ready - started server on 0.0.0.0:3000" está listo
- Presiona `Ctrl+C` para salir de los logs

### Paso 4: Verificar
Abre en tu navegador:
```
https://alonsodelrio.org
```

Debes ver:
- ✅ 46 Municipios (Bolívar)
- ✅ 639 Puestos de Votación

---

## Si Algo Sale Mal

### Error: "Permission denied"
Necesitas la contraseña del servidor. Usa la misma que usaste antes para conectarte.

### Error: "docker: command not found"
El servidor no tiene Docker instalado. Contacta al administrador del servidor.

### El sitio sigue mostrando 0 municipios
1. Espera 2-3 minutos más (Next.js está compilando)
2. Refresca la página con `Ctrl+F5` (limpia el cache)
3. Abre la consola del navegador (F12) y busca errores

### Ver logs si hay problemas:
```bash
ssh root@104.236.99.8
cd /opt/votaciones
docker compose logs app
```

---

## Comando Alternativo (Si el anterior falla)

Si el comando largo falla, ejecuta uno por uno:

```bash
# 1. Ir al directorio
cd /opt/votaciones

# 2. Detener contenedores
docker compose down

# 3. Actualizar código
git pull origin master

# 4. Reconstruir
docker compose build --no-cache

# 5. Iniciar
docker compose up -d

# 6. Ver logs
docker compose logs -f app
```

---

**IMPORTANTE:** No cierres la terminal hasta que veas el mensaje "ready - started server"
