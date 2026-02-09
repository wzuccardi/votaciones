# 🧪 Guía de Pruebas - AppVotaciones

Esta guía te ayudará a ejecutar y entender las pruebas del sistema después de implementar todas las mejoras.

---

## 📋 Resumen de Mejoras Implementadas

### ✅ 1. Infraestructura y Base de Datos
- **PostgreSQL (Supabase)**: Migración desde SQLite
- **Session Pooler**: Puerto 5432 para IPv4
- **Dato Maestro**: Departamento de Bolívar cargado

### ✅ 2. Seguridad
- **Rate Limiting**: Upstash Redis distribuido
- **Middleware**: Límites específicos por rol/endpoint

### ✅ 3. Experiencia de Usuario
- **Zod + React Hook Form**: Validación en tiempo real
- **Componentización**: Formularios independientes
- **React Query**: Gestión de estado asíncrono

### ✅ 4. Características Modernas
- **PWA**: Instalación y funcionamiento offline
- **Tiempo Real**: Pusher para actualizaciones en vivo

---

## 🚀 Preparación para las Pruebas

### 1. Verificar Variables de Entorno

Asegúrate de tener configurado tu archivo `.env`:

```env
# Base de Datos (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Autenticación
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Tiempo Real (Pusher)
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="..."
PUSHER_APP_ID="..."
PUSHER_SECRET="..."
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Sincronizar Base de Datos

```bash
npx prisma db push
npx prisma db seed
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

---

## 🧪 Ejecutar las Pruebas

### Opción 1: Todas las Pruebas (Recomendado)

```bash
npx tsx scripts/run-all-tests.ts
```

Este comando ejecuta todas las suites de prueba y genera un reporte completo.

**Duración estimada**: 30-60 segundos

**Salida esperada**:
```
🧪 SUITE COMPLETA DE PRUEBAS - AppVotaciones

📋 Pruebas a ejecutar:
1. 🔴 Sistema Completo
2. 🔴 API Endpoints
3. 🟡 Características PWA
4. 🟡 Rate Limiting
5. 🟡 Tiempo Real (Pusher)

...

📊 RESUMEN FINAL
   Total de suites: 5
   ✅ Exitosas: 5
   ❌ Fallidas: 0
   ⏱️  Tiempo total: 45s

🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!
```

### Opción 2: Pruebas Individuales

#### A. Sistema Completo (Base de Datos)

```bash
npx tsx scripts/test-complete-system.ts
```

**Qué prueba**:
- Conexión a PostgreSQL/Supabase
- Datos de Bolívar y municipios
- Puestos de votación
- Candidatos, líderes y votantes
- Sistema de testigos electorales
- Integridad referencial
- Rendimiento de consultas

**Duración**: ~10 segundos

#### B. API Endpoints

```bash
npx tsx scripts/test-api-endpoints.ts
```

**Qué prueba**:
- Endpoints públicos (`/api/route`, `/api/data/*`)
- Autenticación (`/api/auth/*`)
- Registro de usuarios
- Dashboard
- Sistema de testigos
- Validaciones

**Duración**: ~15 segundos

**Nota**: El servidor debe estar corriendo en `http://localhost:3000`

#### C. Características PWA

```bash
npx tsx scripts/test-pwa-features.ts
```

**Qué prueba**:
- IndexedDB disponible
- Almacenamiento offline de votos
- Almacenamiento de testigos
- Manifest.json válido
- Service Worker API

**Duración**: ~5 segundos

#### D. Rate Limiting

```bash
npx tsx scripts/test-rate-limiting.ts
```

**Qué prueba**:
- Headers de rate limit presentes
- Límites por endpoint (deshabilitado por defecto)

**Duración**: ~5 segundos

**Nota**: Las pruebas de límites están deshabilitadas por defecto para no consumir tu cuota. Para habilitarlas, edita el script.

#### E. Tiempo Real (Pusher)

```bash
npx tsx scripts/test-realtime-pusher.ts
```

**Qué prueba**:
- Configuración de Pusher
- Conexión al servicio
- Suscripción a canales
- Recepción de eventos (manual)

**Duración**: ~10 segundos

---

## 📊 Interpretación de Resultados

### ✅ Prueba Exitosa

```
✅ Conexión a PostgreSQL (Supabase) (125ms)
```

Significa que la prueba pasó correctamente.

### ❌ Prueba Fallida

```
❌ Datos de Bolívar cargados (89ms): Departamento de Bolívar no encontrado
```

Significa que la prueba falló. El mensaje indica el problema.

### ⚠️ Advertencia

```
⚠️  Advertencia: 5 votantes sin líder asignado
```

No es un error, pero indica algo que deberías revisar.

---

## 🔍 Solución de Problemas Comunes

### Error: "Cannot connect to database"

**Causa**: La base de datos no está accesible

**Solución**:
1. Verifica que `DATABASE_URL` esté configurado en `.env`
2. Verifica que Supabase esté activo
3. Prueba la conexión: `npx prisma db push`

### Error: "Departamento de Bolívar no encontrado"

**Causa**: Los datos no están cargados

**Solución**:
```bash
npx prisma db seed
```

### Error: "fetch failed" en pruebas de API

**Causa**: El servidor no está corriendo

**Solución**:
```bash
npm run dev
```

### Error: "NEXT_PUBLIC_PUSHER_KEY no configurado"

**Causa**: Variables de entorno de Pusher faltantes

**Solución**:
1. Crea una cuenta en [Pusher](https://pusher.com)
2. Copia las credenciales a `.env`
3. Reinicia el servidor

### Error: "Upstash Redis" en rate limiting

**Causa**: Redis no configurado

**Solución**:
1. Crea una cuenta en [Upstash](https://upstash.com)
2. Crea una base de datos Redis
3. Copia las credenciales a `.env`

---

## 🎯 Pruebas Manuales Recomendadas

Además de las pruebas automatizadas, realiza estas pruebas manuales:

### 1. Registro de Usuario

1. Abre `http://localhost:3000`
2. Haz clic en "Registrarse como Candidato"
3. Completa el formulario
4. Verifica que se cree correctamente

### 2. Login

1. Intenta iniciar sesión con las credenciales creadas
2. Verifica que redirija al dashboard correcto

### 3. Formularios con Validación

1. Intenta enviar un formulario vacío
2. Verifica que aparezcan mensajes de error
3. Completa correctamente y verifica que funcione

### 4. Combobox de Municipios

1. En el formulario de registro
2. Selecciona "Bolívar" como departamento
3. Verifica que se carguen los municipios
4. Busca un municipio escribiendo su nombre

### 5. Sistema de Testigos

1. Navega a `/testigo/[code]` con un código válido
2. Verifica que cargue el checklist
3. Marca algunos items
4. Verifica que se guarden (offline si no hay conexión)

### 6. PWA (Instalación)

1. Abre la app en Chrome/Edge
2. Busca el ícono de instalación en la barra de direcciones
3. Instala la app
4. Verifica que funcione como app independiente

### 7. Offline

1. Abre DevTools → Network
2. Activa "Offline"
3. Intenta usar la app
4. Verifica que funcione con datos en caché

### 8. Tiempo Real

1. Abre la app en dos navegadores/pestañas
2. Registra un voto en uno
3. Verifica que se actualice en el otro en tiempo real

---

## 📈 Métricas de Éxito

### Base de Datos
- ✅ Conexión exitosa a Supabase
- ✅ Datos de Bolívar cargados (46 municipios)
- ✅ Puestos de votación disponibles
- ✅ Consultas < 1000ms

### API
- ✅ Todos los endpoints responden
- ✅ Autenticación funcional
- ✅ Rate limiting activo
- ✅ Validaciones correctas

### Frontend
- ✅ Formularios con validación en tiempo real
- ✅ Combobox de municipios funcional
- ✅ Sin errores en consola
- ✅ Responsive en móvil

### PWA
- ✅ Instalable
- ✅ Funciona offline
- ✅ IndexedDB operativo
- ✅ Service Worker registrado

### Tiempo Real
- ✅ Conexión a Pusher
- ✅ Suscripción a canales
- ✅ Eventos recibidos

---

## 🎉 Checklist Final

Antes de considerar el sistema listo para producción:

- [ ] Todas las pruebas automatizadas pasan
- [ ] Todas las pruebas manuales completadas
- [ ] Sin errores en consola del navegador
- [ ] Sin warnings de React
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Funciona en móvil (iOS y Android)
- [ ] PWA instalable
- [ ] Funciona offline
- [ ] Rate limiting activo
- [ ] Tiempo real funcional
- [ ] Base de datos con datos de producción
- [ ] Variables de entorno de producción configuradas
- [ ] SSL/HTTPS configurado
- [ ] Backups configurados

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de las pruebas
2. Verifica las variables de entorno
3. Consulta la documentación:
   - `README.md` - Información general
   - `scripts/README.md` - Scripts disponibles
   - `INSTRUCCIONES-DESPLIEGUE.md` - Despliegue
   - `SISTEMA-TESTIGOS-ELECTORALES.md` - Sistema de testigos

---

## 🚀 Próximos Pasos

Una vez que todas las pruebas pasen:

1. **Despliegue a Staging**
   ```bash
   # Sigue las instrucciones en INSTRUCCIONES-DESPLIEGUE.md
   ```

2. **Pruebas de Carga**
   - Simula múltiples usuarios concurrentes
   - Verifica el rendimiento bajo carga

3. **Pruebas de Seguridad**
   - Auditoría de seguridad
   - Pruebas de penetración

4. **Despliegue a Producción**
   - Migración de datos
   - Configuración de dominio
   - Monitoreo activo

---

**¡Buena suerte con las pruebas! 🎉**
