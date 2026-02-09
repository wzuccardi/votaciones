# Resumen: Asignación de Mesas a Testigos Electorales

## 🎯 Situación Actual

### Testigos Registrados

| # | Nombre | Cédula | Puesto | Mesas | Cantidad |
|---|--------|--------|--------|-------|----------|
| 1 | Antonia Marrugo | 33119079 | COLEGIO DE LA ESPERANZA | 1, 2 | 2 mesas |
| 2 | Maralara | 45497932 | BAYUNCA 2 (SEDE LAS LATAS) | 3, 4 | 2 mesas |

### Totales
- **Testigos**: 2
- **Mesas totales asignadas**: 4
- **Promedio por testigo**: 2.0 mesas

## ✅ Estado del Sistema

El sistema está funcionando **CORRECTAMENTE**. La confusión viene de la interpretación:

### Lo que muestra el sistema:
- Cada testigo individual muestra "2 mesas asignadas" (correcto)
- El total del sistema es 4 mesas (2 + 2)

### Lo que se esperaba:
- Posiblemente se esperaba ver "4 mesas asignadas" a UN SOLO testigo

## 🔍 Análisis Técnico

### Verificación de Datos
```bash
npx tsx scripts/check-witness-tables.ts
```

**Resultado**:
```
1. Antonia Marrugo (33119079)
   Puesto: COLEGIO DE LA ESPERANZA
   assignedTables (raw): [1,2]
   Mesas asignadas (parsed): [1,2]
   Número de mesas: 2

2. Maralara (45497932)
   Puesto: BAYUNCA 2 (SEDE LAS LATAS)
   assignedTables (raw): [3,4]
   Mesas asignadas (parsed): [3,4]
   Número de mesas: 2
```

### Validación del Código

El campo `assignedTables` se almacena como JSON string y se parsea correctamente:

```typescript
// En la base de datos
assignedTables: "[1,2]"  // String JSON

// Al leer desde la API
assignedTables: [1,2]    // Array de números
```

## 🛠️ Mejoras Implementadas

### 1. Nuevo StatCard en Dashboard de Testigos

Se agregó una tarjeta de estadísticas que muestra:
- **Total de mesas asignadas** en todo el sistema
- **Promedio de mesas por testigo**

Ubicación: `src/app/dashboard/leader/testigos/page.tsx`

```typescript
<StatCard
  title="Mesas Asignadas"
  value={witnesses.reduce((sum, w) => sum + w.assignedTables.length, 0)}
  icon={UserCheck}
  description={`${(total / witnesses.length).toFixed(1)} promedio por testigo`}
/>
```

### 2. Script de Gestión de Mesas

Nuevo script interactivo: `scripts/manage-witness-tables.ts`

**Funcionalidades**:
- Ver todos los testigos y sus mesas
- Reasignar mesas a cualquier testigo
- Validar que las mesas existan en el puesto
- Confirmar cambios antes de aplicarlos

**Uso**:
```bash
npx tsx scripts/manage-witness-tables.ts
```

**Opciones**:
1. Ver resumen de asignaciones
2. Reasignar mesas a un testigo
3. Salir

### 3. Script de Verificación

Script existente mejorado: `scripts/check-witness-tables.ts`

Muestra información detallada de cada testigo:
- Nombre y documento
- Puesto de votación
- Mesas asignadas (raw y parsed)
- Número de mesas
- Validación del tipo de dato

## 📋 Cómo Reasignar Mesas

### Opción A: Script Interactivo (Recomendado)

```bash
npx tsx scripts/manage-witness-tables.ts
```

1. Selecciona opción 2 (Reasignar mesas)
2. Ingresa el número del testigo
3. Ingresa las nuevas mesas separadas por coma (ej: 1,2,3,4)
4. Confirma el cambio

### Opción B: Interfaz Web

1. Ir a `/dashboard/leader/testigos`
2. Buscar el testigo en la lista
3. Hacer clic en "Editar" (ícono de lápiz)
4. Modificar las mesas seleccionadas
5. Guardar cambios

### Opción C: Script Personalizado

Si necesitas hacer cambios masivos:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Ejemplo: Asignar 4 mesas a Antonia Marrugo
await prisma.electoralWitness.update({
  where: { 
    voter: { 
      document: '33119079' 
    } 
  },
  data: {
    assignedTables: JSON.stringify([1, 2, 3, 4])
  }
});
```

## 📊 Límites y Validaciones

### Límites del Sistema
- **Mínimo**: 1 mesa por testigo
- **Máximo**: 5 mesas por testigo

### Validación en API
```typescript
assignedTables: z.array(z.number()).min(1).max(5)
```

### Recomendaciones Operativas

| Mesas por Testigo | Recomendación | Razón |
|-------------------|---------------|-------|
| 1-2 mesas | ✅ Óptimo | Fácil de manejar, buen control |
| 3 mesas | ✅ Bueno | Manejable con experiencia |
| 4-5 mesas | ⚠️ Cuidado | Mucha carga, riesgo de errores |

## 🎯 Escenarios de Uso

### Escenario 1: Distribución Actual (2+2)
**Estado**: ✅ Implementado
- Antonia: Mesas 1, 2
- Maralara: Mesas 3, 4
- **Ventaja**: Carga balanceada, menor riesgo

### Escenario 2: Concentración (4+0)
**Cómo implementar**:
```bash
npx tsx scripts/manage-witness-tables.ts
# Seleccionar Antonia → Asignar 1,2,3,4
# Seleccionar Maralara → Asignar otras mesas o eliminar
```
- **Ventaja**: Un solo testigo responsable
- **Desventaja**: Mayor carga, riesgo si falta

### Escenario 3: Distribución Desigual (3+1)
**Ejemplo**:
- Antonia (experimentada): Mesas 1, 2, 3
- Maralara (nueva): Mesa 4
- **Ventaja**: Asignar según experiencia

## 🔄 Proceso de Verificación

### Después de Cualquier Cambio

1. **Verificar en base de datos**:
```bash
npx tsx scripts/check-witness-tables.ts
```

2. **Verificar en interfaz web**:
- Ir a `/dashboard/leader/testigos`
- Revisar el StatCard "Mesas Asignadas"
- Verificar cada testigo individualmente

3. **Verificar funcionalidad**:
- Probar el auto-reporte del testigo
- Verificar que las mesas aparezcan correctamente

## 📝 Conclusión

### Estado Actual: ✅ CORRECTO

El sistema está funcionando como se diseñó:
- 2 testigos registrados
- 4 mesas asignadas en total (2 por testigo)
- Datos almacenados y parseados correctamente

### Próximos Pasos

1. **Confirmar intención**: ¿La distribución actual (2+2) es correcta?

2. **Si necesitas cambios**:
   - Usa el script interactivo: `npx tsx scripts/manage-witness-tables.ts`
   - O edita desde la interfaz web

3. **Verificar después**:
   - Ejecuta `npx tsx scripts/check-witness-tables.ts`
   - Revisa el dashboard actualizado

### Mejoras Implementadas

✅ Nuevo StatCard mostrando total de mesas asignadas
✅ Script interactivo para gestión de mesas
✅ Script de verificación mejorado
✅ Documentación completa del sistema

## 📞 Soporte

Si necesitas ayuda adicional:
1. Revisa `ANALISIS-ASIGNACION-MESAS.md` para más detalles técnicos
2. Ejecuta los scripts de verificación
3. Consulta la documentación de la API en `src/app/api/dashboard/leader/witnesses/route.ts`
