# Instrucciones para Ver el Botón de Validación

## El botón está implementado correctamente en el código

El botón de validación de mesas está en el archivo:
- `src/app/dashboard/candidate/resultados/page.tsx` (líneas 765-790)

## Problema: Caché del Navegador

El navegador puede estar mostrando una versión antigua de la página. Necesitas hacer un **hard refresh**.

## Solución: Hard Refresh

### Opción 1: Atajo de Teclado (Recomendado)

**En Windows:**
1. Abre la página de resultados: `http://localhost:3000/dashboard/candidate/resultados`
2. Presiona: **Ctrl + Shift + R** o **Ctrl + F5**
3. Esto forzará al navegador a recargar sin usar caché

**En Mac:**
1. Abre la página de resultados
2. Presiona: **Cmd + Shift + R**

### Opción 2: Limpiar Caché del Navegador

**Chrome/Edge:**
1. Presiona **F12** para abrir DevTools
2. Haz clic derecho en el botón de recargar (junto a la barra de direcciones)
3. Selecciona **"Vaciar caché y volver a cargar de manera forzada"**

**Firefox:**
1. Presiona **Ctrl + Shift + Delete**
2. Selecciona "Caché"
3. Haz clic en "Limpiar ahora"
4. Recarga la página

### Opción 3: Reiniciar el Servidor

Si las opciones anteriores no funcionan:

1. Detén el servidor (Ctrl + C en la terminal donde corre)
2. Ejecuta:
   ```bash
   npm run dev
   ```
3. Espera a que compile
4. Abre la página en el navegador

## Ubicación del Botón

El botón aparece en:

1. **Dashboard de Candidato** → **Resultados Electorales**
2. Pestaña **"Detalle de Mesas"**
3. Al final de cada tarjeta de mesa reportada

## Apariencia del Botón

### Si la mesa NO está validada:
```
┌─────────────────────────┐
│  ✓ Validar Mesa         │  (Botón azul)
└─────────────────────────┘
```

### Si la mesa YA está validada:
```
┌─────────────────────────────────────┐
│  ✕ Marcar como No Validada          │  (Botón outline verde)
└─────────────────────────────────────┘
```

## Verificación

Para confirmar que el botón está visible:

1. Ir a: `http://localhost:3000/dashboard/candidate/resultados`
2. Hacer clic en la pestaña **"Detalle de Mesas"**
3. Si hay mesas reportadas, deberías ver el botón al final de cada tarjeta
4. Si NO hay mesas reportadas, verás el mensaje "No hay mesas reportadas aún"

## Si Aún No Ves el Botón

### Verificar que hay mesas reportadas:

1. Debe haber al menos un testigo que haya reportado una mesa
2. Si no hay reportes, el botón no aparecerá porque no hay mesas que validar

### Verificar en el código del navegador:

1. Presiona **F12** para abrir DevTools
2. Ve a la pestaña **"Console"**
3. Busca errores en rojo
4. Si hay errores, cópialos y compártelos

### Verificar la versión del archivo:

1. Presiona **F12** para abrir DevTools
2. Ve a la pestaña **"Sources"**
3. Busca el archivo: `resultados/page.tsx`
4. Busca la línea que dice: `{/* Botón de Validación */}`
5. Si no está, el navegador tiene una versión antigua

## Comandos Útiles

### Limpiar caché de Next.js:
```bash
Remove-Item -Recurse -Force .next
```

### Reiniciar servidor:
```bash
npm run dev
```

### Verificar que el servidor está corriendo:
```bash
netstat -ano | findstr :3000
```

## Fecha
3 de febrero de 2026
