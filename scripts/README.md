# 📚 Scripts de Gestión y Pruebas

Este directorio contiene scripts para gestionar la base de datos y probar el sistema electoral.

---

## 🧪 Scripts de Prueba

### Ejecutar Todas las Pruebas
```bash
npx tsx scripts/run-all-tests.ts
```

Este script ejecuta todas las suites de prueba en secuencia y genera un reporte completo.

### Pruebas Individuales

#### 1. Sistema Completo (Base de Datos)
```bash
npx tsx scripts/test-complete-system.ts
```
Valida:
- Conexión a PostgreSQL/Supabase
- Datos de Bolívar cargados
- Puestos de votación
- Candidatos, líderes y votantes
- Sistema de testigos electorales
- Integridad referencial
- Rendimiento de índices

#### 2. API Endpoints
```bash
npx tsx scripts/test-api-endpoints.ts
```
Valida:
- Endpoints públicos
- Autenticación
- Registro de usuarios
- Dashboard
- Sistema de testigos
- Validaciones

#### 3. Características PWA
```bash
npx tsx scripts/test-pwa-features.ts
```
Valida:
- IndexedDB
- Almacenamiento offline
- Manifest.json
- Service Worker API

#### 4. Rate Limiting
```bash
npx tsx scripts/test-rate-limiting.ts
```
Valida:
- Headers de rate limit
- Límites por endpoint
- Integración con Upstash Redis

#### 5. Tiempo Real (Pusher)
```bash
npx tsx scripts/test-realtime-pusher.ts
```
Valida:
- Configuración de Pusher
- Conectividad
- Suscripción a canales
- Eventos en tiempo real

---

## 🔧 Scripts de Gestión de Base de Datos

### 1. `update-bolivar-data.ts`
**Propósito**: Importar o actualizar datos geográficos desde CSV

**Uso**:
```bash
npx tsx scripts/update-bolivar-data.ts
```

**Funcionalidad**:
- Lee el archivo CSV con datos de puestos de votación
- Crea departamento de Bolívar si no existe
- Crea/actualiza municipios
- Crea/actualiza puestos de votación
- Genera reporte JSON con resultados

**Archivo de entrada**:
```
Genio/Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20260119 (1).csv
```

**Archivo de salida**:
```
update-bolivar-report.json
```

---

### 2. `verify-data.ts`
**Propósito**: Verificar integridad de datos en la base de datos

**Uso**:
```bash
npx tsx scripts/verify-data.ts
```

**Funcionalidad**:
- Cuenta registros en todas las tablas
- Muestra distribución geográfica
- Lista ejemplos de datos
- Valida relaciones entre tablas

---

### 3. `test-api-data.ts`
**Propósito**: Probar disponibilidad de datos para la API

**Uso**:
```bash
npx tsx scripts/test-api-data.ts
```

**Funcionalidad**:
- Verifica que los datos estén disponibles
- Prueba consultas típicas de la API
- Muestra ejemplos de datos por municipio

---

### 4. `analyze-db.ts`
**Propósito**: Analizar estructura y contenido de la base de datos

**Uso**:
```bash
npx tsx scripts/analyze-db.ts
```

**Funcionalidad**:
- Analiza todas las tablas
- Muestra estadísticas detalladas
- Identifica posibles problemas

---

### 5. `update-passwords.ts`
**Propósito**: Actualizar contraseñas de usuarios

**Uso**:
```bash
npx tsx scripts/update-passwords.ts
```

**Funcionalidad**:
- Actualiza contraseñas de candidatos, líderes y votantes
- Usa hash pbkdf2 con contraseña "731026"

---

### 6. `check-voter-details.ts`
**Propósito**: Verificar detalles de votantes específicos

**Uso**:
```bash
npx tsx scripts/check-voter-details.ts
```

**Funcionalidad**:
- Busca votantes por documento
- Muestra información completa
- Verifica relaciones

---

## 📋 Flujo de Trabajo Típico

### Importación Inicial:

```bash
# 1. Importar datos geográficos
npx tsx scripts/update-bolivar-data.ts

# 2. Verificar importación
npx tsx scripts/verify-data.ts

# 3. Probar API
npx tsx scripts/test-api-data.ts
```

### Actualización de Datos:

```bash
# 1. Actualizar desde nuevo CSV
npx tsx scripts/update-bolivar-data.ts

# 2. Verificar cambios
npx tsx scripts/verify-data.ts
```

### Mantenimiento:

```bash
# Analizar base de datos
npx tsx scripts/analyze-db.ts

# Actualizar contraseñas si es necesario
npx tsx scripts/update-passwords.ts
```

---

## 🗂️ Estructura de Archivos

```
scripts/
├── README.md                    # Este archivo
├── update-bolivar-data.ts       # Importación de datos
├── verify-data.ts               # Verificación
├── test-api-data.ts             # Pruebas de API
├── analyze-db.ts                # Análisis
├── update-passwords.ts          # Actualización de contraseñas
├── check-voter-details.ts       # Verificación de votantes
└── [otros scripts...]

Genio/
└── Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20260119 (1).csv

Reportes generados:
├── update-bolivar-report.json   # Reporte de importación
└── [otros reportes...]
```

---

## ⚠️ Notas Importantes

### Formato del CSV:
- **Delimitador**: Punto y coma (`;`)
- **Encoding**: UTF-8
- **Primera línea**: Header (se omite)

### Códigos DANE:
- **Departamento Bolívar**: 13
- **Municipios**: 13001, 13002, ..., 13046
- **Puestos**: 13-0001, 13-0002, ..., 13-XXXX

### Seguridad:
- Los scripts NO eliminan datos existentes por defecto
- Siempre hacen backup antes de operaciones destructivas
- Generan reportes detallados de todas las operaciones

---

## 🔄 Re-ejecución Segura

Todos los scripts están diseñados para ser re-ejecutados de forma segura:

- **update-bolivar-data.ts**: Actualiza registros existentes, no duplica
- **verify-data.ts**: Solo lectura, no modifica datos
- **test-api-data.ts**: Solo lectura, no modifica datos
- **analyze-db.ts**: Solo lectura, no modifica datos

---

## 📊 Reportes Generados

### `update-bolivar-report.json`
```json
{
  "departmentCreated": true,
  "municipalitiesCreated": 46,
  "municipalitiesUpdated": 0,
  "pollingStationsCreated": 622,
  "pollingStationsUpdated": 0,
  "pollingStationsDeleted": 0,
  "errors": []
}
```

---

## 🆘 Solución de Problemas

### Error: "Archivo CSV no encontrado"
**Solución**: Verifica que el archivo CSV esté en `Genio/` con el nombre correcto

### Error: "Cannot connect to database"
**Solución**: Verifica que `prisma/dev.db` exista y sea accesible

### Error: "Unique constraint failed"
**Solución**: Puede haber datos duplicados, revisa el reporte de errores

---

## 📞 Soporte

Para más información, consulta:
- `ACTUALIZACION-BASE-DATOS.md` - Documentación detallada
- `RESUMEN-ACTUALIZACION-BD.md` - Resumen ejecutivo
- `prisma/schema.prisma` - Esquema de base de datos
