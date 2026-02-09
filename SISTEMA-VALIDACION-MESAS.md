# Sistema de Validación de Mesas Electorales

## Implementación

Se ha implementado un sistema completo para que los candidatos y líderes puedan validar las mesas reportadas por los testigos electorales.

## Funcionalidad

### ¿Qué son las Mesas Validadas?

Las **Mesas Validadas** son aquellas cuyos reportes han sido revisados y aprobados por el candidato o un líder. Este proceso permite:

1. **Control de Calidad**: Verificar que los datos reportados sean correctos
2. **Auditoría**: Mantener un registro de quién validó cada mesa
3. **Estadísticas Confiables**: Diferenciar entre mesas reportadas y mesas validadas
4. **Trazabilidad**: Saber cuándo se validó cada mesa

## Archivos Creados/Modificados

### 1. API de Validación
**Archivo**: `src/app/api/dashboard/candidate/validate-table/route.ts`

#### Características:
- ✅ **Autenticación**: Solo usuarios autenticados pueden validar
- ✅ **Autorización**: Solo candidatos y líderes tienen permisos
- ✅ **Validación de Permisos**: Los líderes solo pueden validar mesas de su red
- ✅ **Toggle**: Permite validar y desvalidar mesas
- ✅ **Auditoría**: Registra quién y cuándo validó

#### Endpoint:
```
POST /api/dashboard/candidate/validate-table
```

#### Body:
```json
{
  "tableId": "string",
  "isValidated": boolean
}
```

#### Respuesta:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "isValidated": true,
    "validatedBy": "user-id",
    "validatedAt": "2026-02-03T..."
  }
}
```

### 2. Interfaz de Usuario
**Archivo**: `src/app/dashboard/candidate/resultados/page.tsx`

#### Cambios Realizados:

**1. Imports Agregados**:
```typescript
import { Check, XCircle } from 'lucide-react'
```

**2. Estado Agregado**:
```typescript
const [validatingTables, setValidatingTables] = useState<Set<string>>(new Set())
```

**3. Función de Validación**:
```typescript
const handleValidateTable = async (tableId: string, currentStatus: boolean) => {
  // Llama a la API
  // Actualiza el estado local
  // Refresca las estadísticas
}
```

**4. Botón de Validación**:
- Ubicado al final de cada tarjeta de mesa
- Cambia de apariencia según el estado
- Muestra spinner mientras procesa
- Feedback visual inmediato

## Interfaz de Usuario

### Widget de Estadísticas
En la parte superior del dashboard de resultados:

```
┌─────────────────────┐
│ Mesas Validadas     │
│                     │
│       0             │
│                     │
│ 0% de las reportadas│
└─────────────────────┘
```

### Detalle de Mesas

Cada mesa muestra:

1. **Badge "Validada"** (verde) si está validada
2. **Botón de acción**:
   - Si NO está validada: "✓ Validar Mesa" (botón azul)
   - Si está validada: "✕ Marcar como No Validada" (botón outline verde)

## Flujo de Trabajo

### Para el Candidato:

1. Ir a **Dashboard > Resultados Electorales**
2. Hacer clic en la pestaña **"Detalle de Mesas"**
3. Revisar los datos de cada mesa reportada
4. Hacer clic en **"Validar Mesa"** si los datos son correctos
5. El contador de "Mesas Validadas" se actualiza automáticamente

### Para el Líder:

1. Ir a **Dashboard > Resultados Electorales**
2. Solo puede validar mesas de testigos de su red
3. Mismo proceso que el candidato

## Permisos

| Rol | Puede Validar | Restricciones |
|-----|---------------|---------------|
| **Candidato** | ✅ Todas las mesas | Ninguna |
| **Líder** | ✅ Solo su red | Mesas de sus testigos |
| **Testigo** | ❌ No | - |
| **Votante** | ❌ No | - |

## Base de Datos

### Campos en el Modelo `Table`:

```prisma
model Table {
  // ... otros campos
  
  // Validación
  isValidated Boolean   @default(false)
  validatedBy String?   // ID del líder/candidato que validó
  validatedAt DateTime? // Cuándo se validó
}
```

## Estadísticas

### Cálculo de Mesas Validadas:

```typescript
const tablesValidated = tableResults.filter(t => t.isValidated).length
```

### Porcentaje:

```typescript
const percentage = (tablesValidated / tablesReported) * 100
```

## Beneficios

### Para la Campaña:
- ✅ **Control de Calidad**: Datos verificados antes de usar
- ✅ **Confianza**: Saber qué datos son confiables
- ✅ **Auditoría**: Registro completo de validaciones
- ✅ **Responsabilidad**: Saber quién validó cada mesa

### Para el Análisis:
- ✅ **Filtrado**: Analizar solo mesas validadas
- ✅ **Comparación**: Comparar reportadas vs validadas
- ✅ **Detección de Errores**: Identificar mesas con problemas
- ✅ **Reportes**: Incluir estado de validación en PDFs

## Casos de Uso

### 1. Validación Normal
```
Testigo reporta → Líder revisa → Líder valida → Aparece en estadísticas
```

### 2. Corrección de Errores
```
Mesa validada → Se detecta error → Desvalidar → Testigo corrige → Validar nuevamente
```

### 3. Auditoría
```
Candidato revisa → Ve quién validó → Ve cuándo se validó → Confirma o corrige
```

## Verificación

Para probar la funcionalidad:

1. Ir a `http://localhost:3000/dashboard/candidate/resultados`
2. Hacer clic en la pestaña "Detalle de Mesas"
3. Buscar una mesa reportada
4. Hacer clic en "Validar Mesa"
5. Verificar que:
   - Aparece el badge "Validada" (verde)
   - El botón cambia a "Marcar como No Validada"
   - El contador de "Mesas Validadas" aumenta
6. Hacer clic en "Marcar como No Validada"
7. Verificar que se revierte el cambio

## Seguridad

- ✅ Autenticación requerida
- ✅ Autorización por rol
- ✅ Validación de permisos por red
- ✅ Registro de auditoría
- ✅ Timestamps de validación

## Fecha de Implementación
3 de febrero de 2026
