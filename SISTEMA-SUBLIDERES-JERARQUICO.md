# Sistema de Sublíderes Jerárquico - Implementación Completa

## ✅ Implementado

Se ha implementado un sistema completo de sublíderes jerárquicos que permite a los líderes crear y gestionar sublíderes, quienes a su vez pueden registrar sus propios votantes.

## 🏗️ Estructura Jerárquica

```
Candidato
  └── Líder Principal
        ├── Votantes directos
        └── Sublíder 1
              ├── Votantes del sublíder 1
              └── Sublíder 1.1
                    └── Votantes del sublíder 1.1
        └── Sublíder 2
              └── Votantes del sublíder 2
```

## 📊 Características Implementadas

### 1. Base de Datos (Prisma Schema)

**Modelo Leader actualizado:**
```prisma
model Leader {
  // Jerarquía de sublíderes (auto-relación)
  parentLeaderId String? // ID del líder superior (null si es líder principal)
  parentLeader   Leader?  @relation("LeaderHierarchy", fields: [parentLeaderId], references: [id])
  subLeaders     Leader[] @relation("LeaderHierarchy")
  
  // ... otros campos
}
```

**Características:**
- ✅ Auto-relación para jerarquía infinita
- ✅ `parentLeaderId` null = líder principal
- ✅ Cascada de eliminación controlada
- ✅ Los votantes se mantienen si se elimina un líder

### 2. APIs Implementadas

#### `/api/dashboard/leader/subleaders`

**GET** - Obtener sublíderes directos
```typescript
GET /api/dashboard/leader/subleaders?leaderId=xxx
Response: {
  success: true,
  data: [
    {
      id: "...",
      name: "...",
      document: "...",
      _count: {
        voters: 10,
        subLeaders: 2
      }
    }
  ]
}
```

**POST** - Crear sublíder
```typescript
POST /api/dashboard/leader/subleaders
Body: {
  document: "1234567890",
  name: "Juan Pérez",
  password: "password123",
  parentLeaderId: "xxx"
}
```

**DELETE** - Eliminar sublíder
```typescript
DELETE /api/dashboard/leader/subleaders?subLeaderId=xxx
```

**Validaciones:**
- ✅ Solo el líder padre puede crear sublíderes bajo él
- ✅ El candidato puede crear sublíderes en cualquier nivel
- ✅ No se puede eliminar un líder con sublíderes activos
- ✅ Documento único en todo el sistema

#### `/api/dashboard/leader/hierarchy`

**GET** - Obtener jerarquía completa (recursiva)
```typescript
GET /api/dashboard/leader/hierarchy?leaderId=xxx
Response: {
  success: true,
  data: {
    id: "...",
    name: "Líder Principal",
    voters: [...],
    votersCount: 10,
    subLeaders: [
      {
        id: "...",
        name: "Sublíder 1",
        voters: [...],
        votersCount: 5,
        subLeaders: [...],
        totalVoters: 15,
        totalSubLeaders: 3
      }
    ],
    totalVoters: 25,
    totalSubLeaders: 5
  }
}
```

**Características:**
- ✅ Recursivo: obtiene toda la estructura
- ✅ Incluye votantes de cada nivel
- ✅ Calcula totales acumulados
- ✅ Información completa de puestos de votación

### 3. Componente de Gestión (`SubLeadersManager`)

**Ubicación:** Dashboard del Líder

**Funcionalidades:**
- ✅ Ver lista de sublíderes directos
- ✅ Crear nuevos sublíderes
- ✅ Eliminar sublíderes (si no tienen sublíderes)
- ✅ Ver contadores de votantes y sublíderes
- ✅ Generar reporte PDF jerárquico

**Interfaz:**
```
┌─────────────────────────────────────────────────┐
│ Sublíderes                    [Reporte PDF] [+] │
├─────────────────────────────────────────────────┤
│ ➤ Juan Pérez                    [Sublíder]      │
│   CC: 1234567890                                │
│   Votantes: 10 | Sublíderes: 2                  │
├─────────────────────────────────────────────────┤
│ ➤ María García                  [Sublíder]      │
│   CC: 9876543210                                │
│   Votantes: 5 | Sublíderes: 0                   │
└─────────────────────────────────────────────────┘
```

### 4. Generador de PDF Jerárquico

**Archivo:** `src/lib/pdf-generator-hierarchy.ts`

**Estructura del PDF:**

```
┌─────────────────────────────────────────────────┐
│ Reporte Jerárquico de Líderes y Votantes       │
│ Candidato: Alonso del Río                       │
│ Fecha: 03/02/2026                               │
├─────────────────────────────────────────────────┤
│ RESUMEN GENERAL                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Líder Principal: Juan Pérez                 │ │
│ │ Cédula: 1234567890                          │ │
│ │ Total Votantes Directos: 10                 │ │
│ │ Total Sublíderes: 5                         │ │
│ │ Total Votantes (con sublíderes): 45         │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ESTRUCTURA JERÁRQUICA DETALLADA                 │
│                                                 │
│ █ Líder: Juan Pérez                             │
│   CC: 1234567890 | Votantes directos: 10       │
│   ┌───────────────────────────────────────────┐ │
│   │ Cédula │ Nombre │ Celular │ Municipio ... │ │
│   ├───────────────────────────────────────────┤ │
│   │ 111... │ Ana... │ 300...  │ Cartagena ... │ │
│   └───────────────────────────────────────────┘ │
│                                                 │
│   ➤ Sublíder: María García                     │
│     CC: 9876543210 | Votantes directos: 5      │
│     ┌─────────────────────────────────────────┐ │
│     │ Cédula │ Nombre │ Celular │ Municipio...│ │
│     ├─────────────────────────────────────────┤ │
│     │ 222... │ Luis...│ 301...  │ Turbaco ... │ │
│     └─────────────────────────────────────────┘ │
│                                                 │
│       ➤ Sublíder: Pedro López (nivel 3)        │
│         CC: 5555555555 | Votantes: 3           │
│         ┌───────────────────────────────────┐   │
│         │ Tabla de votantes...              │   │
│         └───────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Características del PDF:**
- ✅ Indentación visual por nivel
- ✅ Colores diferentes por nivel jerárquico
- ✅ Tablas con información completa de votantes
- ✅ Paginación automática
- ✅ Pie de página con número de página
- ✅ Marca de confidencialidad

## 🔐 Permisos y Seguridad

### Quién puede crear sublíderes:
- ✅ **Candidato**: Puede crear sublíderes en cualquier nivel
- ✅ **Líder**: Solo puede crear sublíderes bajo su propia estructura
- ❌ **Sublíder**: Puede crear sublíderes bajo él (hereda permisos de líder)

### Quién puede eliminar sublíderes:
- ✅ **Candidato**: Puede eliminar cualquier sublíder
- ✅ **Líder**: Solo puede eliminar sus sublíderes directos
- ⚠️ **Restricción**: No se puede eliminar un líder con sublíderes activos

### Quién puede registrar votantes:
- ✅ **Líder Principal**: Sí
- ✅ **Sublíder**: Sí (mismos permisos que líder principal)
- ✅ **Sublíder de sublíder**: Sí (todos los niveles)

## 📱 Flujo de Uso

### Para el Líder Principal:

1. **Crear Sublíder**
   - Ir a Dashboard
   - Sección "Sublíderes"
   - Clic en "Agregar Sublíder"
   - Ingresar: Cédula, Nombre, Contraseña
   - El sublíder puede iniciar sesión inmediatamente

2. **Ver Sublíderes**
   - Lista de sublíderes directos
   - Contador de votantes por sublíder
   - Contador de sublíderes de cada sublíder

3. **Generar Reporte**
   - Clic en "Reporte PDF"
   - Se genera PDF con toda la jerarquía
   - Incluye todos los niveles y votantes

### Para el Sublíder:

1. **Iniciar Sesión**
   - Usar cédula y contraseña asignada
   - Rol: "Líder" (mismo dashboard)

2. **Registrar Votantes**
   - Misma funcionalidad que líder principal
   - Los votantes quedan bajo su nombre

3. **Crear Sublíderes** (opcional)
   - Puede crear sublíderes bajo él
   - Estructura jerárquica infinita

## 🎯 Casos de Uso

### Caso 1: Estructura Simple
```
Líder Principal (Juan)
  ├── 20 votantes directos
  ├── Sublíder 1 (María) → 15 votantes
  └── Sublíder 2 (Pedro) → 10 votantes

Total: 45 votantes
```

### Caso 2: Estructura Compleja
```
Líder Principal (Juan)
  ├── 10 votantes directos
  ├── Sublíder 1 (María)
  │     ├── 5 votantes
  │     └── Sublíder 1.1 (Ana) → 8 votantes
  └── Sublíder 2 (Pedro)
        ├── 12 votantes
        ├── Sublíder 2.1 (Luis) → 6 votantes
        └── Sublíder 2.2 (Carmen) → 9 votantes

Total: 50 votantes en 3 niveles
```

### Caso 3: Delegación por Zona
```
Líder Principal (Coordinador General)
  ├── Sublíder Zona Norte → votantes del norte
  ├── Sublíder Zona Sur → votantes del sur
  ├── Sublíder Zona Este → votantes del este
  └── Sublíder Zona Oeste → votantes del oeste
```

## 📊 Reportes

### Información en el PDF:

**Por cada líder/sublíder:**
- Nombre y cédula
- Votantes directos (tabla completa)
- Información de cada votante:
  - Cédula
  - Nombre
  - Celular
  - Municipio
  - Puesto de votación

**Totales:**
- Votantes directos del líder
- Total de sublíderes
- Total de votantes (incluyendo todos los niveles)

## 🔄 Actualización de Datos

- ✅ Los sublíderes se cargan automáticamente
- ✅ Los contadores se actualizan en tiempo real
- ✅ El PDF siempre genera datos actualizados
- ✅ La jerarquía se recalcula dinámicamente

## 📁 Archivos Creados/Modificados

1. ✅ `prisma/schema.prisma` - Modelo Leader con jerarquía
2. ✅ `src/app/api/dashboard/leader/subleaders/route.ts` - CRUD sublíderes
3. ✅ `src/app/api/dashboard/leader/hierarchy/route.ts` - Jerarquía completa
4. ✅ `src/lib/pdf-generator-hierarchy.ts` - Generador PDF
5. ✅ `src/components/SubLeadersManager.tsx` - Componente UI
6. ✅ `src/app/dashboard/leader/page.tsx` - Integración en dashboard

## 🚀 Próximas Mejoras Sugeridas

- 📊 Gráfica visual de la jerarquía (árbol)
- 📱 Vista móvil optimizada
- 🔔 Notificaciones cuando un sublíder registra votantes
- 📈 Estadísticas por nivel jerárquico
- 🎯 Metas y objetivos por sublíder
- 📧 Envío automático de credenciales por email
- 🔐 Permisos granulares personalizables

## Fecha de Implementación
3 de febrero de 2026
