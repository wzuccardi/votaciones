# Modo Offline para Testigos Electorales

## 📱 Funcionalidad Implementada

El sistema ahora permite que los testigos electorales trabajen **sin conexión a internet** y sincronicen sus reportes cuando recuperen la conectividad.

---

## ✅ Características Implementadas

### 1. **Detección Automática de Conexión**
- El sistema detecta automáticamente si hay o no conexión a internet
- Muestra indicadores visuales del estado de conexión en tiempo real

### 2. **Almacenamiento Local (IndexedDB)**
- Los reportes se guardan en el dispositivo del testigo
- Usa IndexedDB, una base de datos del navegador
- Los datos persisten incluso si se cierra el navegador
- No se pierden datos aunque se reinicie el dispositivo

### 3. **Sincronización Automática**
- Cuando se recupera la conexión, los reportes se sincronizan automáticamente
- El testigo puede también sincronizar manualmente con un botón
- Muestra notificaciones del progreso de sincronización

### 4. **Indicadores Visuales**
- **Badge Verde "En línea"**: Hay conexión a internet
- **Badge Rojo "Sin conexión"**: No hay conexión
- **Badge Gris "X pendientes"**: Reportes guardados esperando sincronización
- **Botón "Sincronizar"**: Aparece cuando hay conexión y reportes pendientes

---

## 🎯 Cómo Funciona

### Escenario 1: Testigo CON Conexión (Normal)
```
1. Testigo ingresa datos de la mesa
2. Click en "Guardar Reporte"
3. Confirma los datos
4. ✅ Reporte se envía inmediatamente al servidor
5. Aparece como "Reportada" en verde
```

### Escenario 2: Testigo SIN Conexión (Offline)
```
1. Testigo ingresa datos de la mesa
2. Sistema detecta que no hay conexión
3. Muestra mensaje: "Modo Sin Conexión"
4. Click en "Guardar Reporte"
5. Confirma los datos
6. 📱 Reporte se guarda en el dispositivo
7. Mensaje: "Reporte guardado offline. Se sincronizará cuando haya conexión"
8. Badge muestra "1 pendiente"
```

### Escenario 3: Recuperación de Conexión
```
1. Testigo recupera conexión a internet
2. Badge cambia a "En línea" (verde)
3. Sistema detecta reportes pendientes
4. 🔄 Sincronización automática comienza
5. Mensaje: "Sincronizando reportes pendientes..."
6. ✅ "X reportes sincronizados"
7. Reportes aparecen en el servidor
```

### Escenario 4: Sincronización Manual
```
1. Testigo tiene reportes pendientes
2. Recupera conexión
3. Click en botón "Sincronizar"
4. Sistema envía todos los reportes pendientes
5. Muestra resultado de la sincronización
```

---

## 🔧 Implementación Técnica

### Archivos Modificados/Creados:

1. **`src/lib/offline-storage.ts`** (Ya existía)
   - Manejo de IndexedDB
   - Funciones para guardar/recuperar/sincronizar reportes

2. **`src/hooks/useOnlineStatus.ts`** (Ya existía)
   - Hook para detectar estado de conexión
   - Listeners de eventos online/offline

3. **`src/app/testigo/[code]/reportar/page.tsx`** (Actualizado)
   - Integración de almacenamiento offline
   - Indicadores visuales de conexión
   - Lógica de sincronización automática

### Tecnologías Usadas:

- **IndexedDB**: Base de datos del navegador (almacenamiento local)
- **Navigator.onLine**: API del navegador para detectar conexión
- **Service Workers**: Ya configurado en el proyecto (PWA)

---

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTIGO ELECTORAL                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  ¿Hay Conexión?       │
                └───────────────────────┘
                    │              │
            SÍ ─────┘              └───── NO
            │                              │
            ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│  Enviar al Servidor  │      │  Guardar en          │
│  Inmediatamente      │      │  IndexedDB Local     │
└──────────────────────┘      └──────────────────────┘
            │                              │
            ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│  ✅ Guardado         │      │  📱 Guardado Offline │
│  en Base de Datos    │      │  Pendiente Sync      │
└──────────────────────┘      └──────────────────────┘
                                          │
                                          │ (Cuando hay conexión)
                                          ▼
                              ┌──────────────────────┐
                              │  🔄 Sincronización   │
                              │  Automática          │
                              └──────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │  ✅ Guardado en      │
                              │  Base de Datos       │
                              └──────────────────────┘
```

---

## 🧪 Cómo Probar el Modo Offline

### Opción 1: Modo Avión
1. Activa el modo avión en tu dispositivo
2. Intenta reportar una mesa
3. Verás el mensaje "Sin conexión"
4. El reporte se guardará localmente
5. Desactiva el modo avión
6. El reporte se sincronizará automáticamente

### Opción 2: DevTools (Chrome/Edge)
1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Selecciona "Offline" en el dropdown
4. Intenta reportar una mesa
5. Cambia a "Online"
6. Observa la sincronización

### Opción 3: Desconectar WiFi
1. Desconecta el WiFi de tu dispositivo
2. Reporta varias mesas
3. Reconecta el WiFi
4. Los reportes se sincronizarán

---

## 💡 Ventajas del Modo Offline

### Para Testigos:
✅ **No pierden datos** si se cae la conexión
✅ **Pueden trabajar en zonas sin señal**
✅ **No necesitan preocuparse por la conectividad**
✅ **Los datos se sincronizan automáticamente**

### Para la Campaña:
✅ **Mayor cobertura** en zonas rurales o con mala señal
✅ **Menos reportes perdidos**
✅ **Datos más confiables**
✅ **Testigos más tranquilos**

---

## ⚠️ Consideraciones Importantes

### Limitaciones:
1. **Almacenamiento Local**: Los datos solo están en el dispositivo del testigo hasta que se sincronicen
2. **Navegador**: El testigo debe usar el mismo navegador y dispositivo para sincronizar
3. **Caché del Navegador**: Si se borran los datos del navegador, se pierden los reportes pendientes

### Recomendaciones:
1. **Sincronizar lo antes posible**: Buscar conexión para sincronizar
2. **No borrar datos del navegador**: Hasta que se sincronicen los reportes
3. **Verificar sincronización**: Revisar que el badge de "pendientes" llegue a 0
4. **Usar WiFi cuando sea posible**: Para sincronización más rápida

---

## 🔐 Seguridad

- Los datos en IndexedDB están **aislados por dominio**
- Solo el sitio web puede acceder a sus propios datos
- Los datos se envían con las mismas validaciones que en modo online
- La contraseña del testigo sigue siendo requerida para acceder

---

## 📱 Compatibilidad

### Navegadores Soportados:
✅ Chrome/Edge (Desktop y Mobile)
✅ Firefox (Desktop y Mobile)
✅ Safari (Desktop y Mobile)
✅ Opera
✅ Samsung Internet

### Requisitos:
- Navegador moderno con soporte para IndexedDB
- JavaScript habilitado
- Service Workers habilitado (para PWA)

---

## 🎉 Resultado Final

Los testigos ahora pueden:
1. ✅ Trabajar sin conexión a internet
2. ✅ Guardar reportes en su dispositivo
3. ✅ Sincronizar automáticamente cuando haya conexión
4. ✅ Ver el estado de conexión en tiempo real
5. ✅ Saber cuántos reportes están pendientes de sincronizar
6. ✅ Sincronizar manualmente si lo desean

**El sistema es ahora completamente funcional en modo offline, ideal para zonas rurales o con conectividad intermitente.**

---

**Fecha de Implementación:** 31 de Enero de 2026
**Estado:** ✅ COMPLETADO Y FUNCIONAL
