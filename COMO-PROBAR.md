# 🧪 Cómo Probar el Sistema

Guía rápida para ejecutar las pruebas después de implementar todas las mejoras.

---

## ⚡ Opción Rápida (Windows)

### Ejecutar todas las pruebas automáticamente:

```bash
test.bat
```

Este script ejecutará:
1. Pruebas de sistema completo
2. Iniciará el servidor de desarrollo
3. Ejecutará pruebas de API

---

## 🔧 Opción Manual

### 1. Preparación (Solo la primera vez)

```bash
# Instalar dependencias
npm install

# Sincronizar base de datos
npx prisma db push

# Cargar datos iniciales
node prisma/seed.js
```

### 2. Ejecutar Pruebas de Sistema

```bash
npx tsx scripts/test-complete-system.ts
```

**Qué verás**:
```
🧪 Iniciando pruebas del sistema completo...

📦 INFRAESTRUCTURA Y BASE DE DATOS
✅ Conexión a PostgreSQL (Supabase)
✅ Datos de Bolívar cargados
✅ Puestos de votación disponibles

👥 DATOS DEL SISTEMA
✅ Candidatos registrados
✅ Líderes registrados
✅ Votantes registrados

👁️  SISTEMA DE TESTIGOS ELECTORALES
✅ Testigos electorales
✅ Checklists de testigos

🔍 INTEGRIDAD DE DATOS
✅ Integridad referencial
✅ Rendimiento de índices

📊 RESUMEN DE PRUEBAS
Total: 10 pruebas
✅ Exitosas: 10
❌ Fallidas: 0
```

### 3. Iniciar Servidor

```bash
npm run dev
```

Espera a ver:
```
✓ Ready in 6.1s
- Local:   http://localhost:3000
```

### 4. Ejecutar Pruebas de API (en otra terminal)

```bash
npx tsx scripts/test-api-endpoints.ts
```

**Qué verás**:
```
🧪 Iniciando pruebas de API endpoints...

📡 ENDPOINTS PÚBLICOS
✅ GET /api/data/departments
✅ GET /api/data/municipalities

📊 ENDPOINTS DE DASHBOARD
✅ GET /api/dashboard/stats

👁️  ENDPOINTS DE TESTIGOS
✅ POST /api/witness/validate

📊 RESUMEN DE PRUEBAS
Total: 4 endpoints probados
✅ Exitosos: 4
❌ Fallidos: 0
```

---

## 🌐 Pruebas en el Navegador

### 1. Abrir la Aplicación

Navega a: http://localhost:3000

### 2. Probar Registro

1. Haz clic en "Registrarse como Candidato"
2. Completa el formulario:
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Teléfono: 3001234567
   - Departamento: Bolívar
   - Municipio: (selecciona uno)
   - Cargo: Alcalde
   - Contraseña: Test123456
3. Haz clic en "Registrarse"
4. Verifica que se cree correctamente

### 3. Probar Login

1. Usa las credenciales que acabas de crear
2. Verifica que redirija al dashboard
3. Verifica que veas tus datos

### 4. Probar Combobox de Municipios

1. En cualquier formulario con selector de municipio
2. Haz clic en el campo
3. Escribe para buscar (ej: "CARTA")
4. Verifica que filtre correctamente
5. Selecciona un municipio

### 5. Probar Sistema de Testigos

1. Navega a: http://localhost:3000/testigo/TEST123
2. Verifica que cargue (o muestre error si no existe)
3. Si tienes un código válido, marca algunos items
4. Verifica que se guarden

---

## 📱 Pruebas PWA

### 1. Instalar como App

**Chrome/Edge**:
1. Busca el ícono de instalación en la barra de direcciones
2. Haz clic en "Instalar"
3. La app se abrirá en una ventana independiente

**Firefox**:
1. Menú → "Instalar sitio como aplicación"

### 2. Probar Offline

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Activa "Offline"
4. Intenta usar la app
5. Verifica que funcione con datos en caché

---

## ⏱️ Pruebas de Tiempo Real

### 1. Configurar Pusher

Asegúrate de tener en `.env`:
```env
NEXT_PUBLIC_PUSHER_KEY=tu_key
NEXT_PUBLIC_PUSHER_CLUSTER=tu_cluster
PUSHER_APP_ID=tu_app_id
PUSHER_SECRET=tu_secret
```

### 2. Probar Actualizaciones

1. Abre la app en dos navegadores/pestañas
2. Registra un voto en uno
3. Verifica que se actualice en el otro automáticamente

### 3. Ejecutar Prueba Automatizada

```bash
npx tsx scripts/test-realtime-pusher.ts
```

---

## 🔒 Pruebas de Rate Limiting

### Verificar Headers

```bash
npx tsx scripts/test-rate-limiting.ts
```

**Nota**: Las pruebas de límites están deshabilitadas por defecto para no consumir tu cuota.

---

## ❌ Solución de Problemas

### Error: "Cannot connect to database"

```bash
# Verifica tu .env
cat .env | grep DATABASE_URL

# Prueba la conexión
npx prisma db push
```

### Error: "Departamento de Bolívar no encontrado"

```bash
# Carga los datos
node prisma/seed.js
```

### Error: "fetch failed"

```bash
# Asegúrate de que el servidor esté corriendo
npm run dev
```

### Error: "NEXT_PUBLIC_PUSHER_KEY no configurado"

1. Crea cuenta en https://pusher.com
2. Copia las credenciales a `.env`
3. Reinicia el servidor

---

## ✅ Checklist de Pruebas

### Pruebas Automatizadas
- [ ] Pruebas de sistema completo (10/10)
- [ ] Pruebas de API endpoints (4/4)
- [ ] Pruebas de PWA (opcional)
- [ ] Pruebas de Pusher (opcional)

### Pruebas Manuales
- [ ] Registro de usuario
- [ ] Login
- [ ] Formularios con validación
- [ ] Combobox de municipios
- [ ] Sistema de testigos
- [ ] Instalación PWA
- [ ] Funcionamiento offline
- [ ] Actualizaciones en tiempo real

### Verificaciones Finales
- [ ] Sin errores en consola
- [ ] Sin warnings de React
- [ ] Funciona en Chrome
- [ ] Funciona en Firefox
- [ ] Funciona en móvil
- [ ] Rate limiting activo
- [ ] Base de datos con datos

---

## 🎯 Resultado Esperado

Si todo está bien, deberías ver:

✅ **10/10** pruebas de sistema  
✅ **4/4** pruebas de API  
✅ Aplicación funcionando en el navegador  
✅ Formularios con validación en tiempo real  
✅ Combobox de municipios funcional  
✅ PWA instalable  
✅ Sin errores en consola  

---

## 📚 Documentación Adicional

- `GUIA-PRUEBAS.md` - Guía detallada de pruebas
- `RESUMEN-PRUEBAS.md` - Resultados de las pruebas
- `scripts/README.md` - Scripts disponibles
- `README.md` - Información general del proyecto

---

## 🚀 Siguiente Paso

Una vez que todas las pruebas pasen:

```bash
# Ver el resumen
cat RESUMEN-PRUEBAS.md

# Preparar para despliegue
# Ver INSTRUCCIONES-DESPLIEGUE.md
```

---

**¡Buena suerte con las pruebas! 🎉**
