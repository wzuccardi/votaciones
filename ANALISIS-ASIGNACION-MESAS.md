# Análisis de Asignación de Mesas a Testigos

## Estado Actual

### Testigos Registrados

1. **Antonia Marrugo** (Cédula: 33119079)
   - Puesto: COLEGIO DE LA ESPERANZA
   - Mesas asignadas: **[1, 2]** → 2 mesas
   - Estado: Funcionando correctamente

2. **Maralara** (Cédula: 45497932)
   - Puesto: BAYUNCA 2 (SEDE LAS LATAS)
   - Mesas asignadas: **[3, 4]** → 2 mesas
   - Estado: Funcionando correctamente

### Resumen
- **Total testigos**: 2
- **Total mesas asignadas**: 4 (2 + 2)
- **Promedio por testigo**: 2 mesas

## Explicación del Sistema

El sistema está funcionando **correctamente**. Cada testigo tiene asignadas 2 mesas:

- Cuando el dashboard muestra "2 mesas asignadas", se refiere a las mesas de **ese testigo específico**
- El total de 4 mesas está distribuido entre 2 testigos diferentes

## Escenarios Posibles

### Escenario 1: Distribución Actual (Correcto)
Si la intención era asignar 2 mesas a cada testigo:
- ✅ **Antonia Marrugo**: Mesas 1 y 2
- ✅ **Maralara**: Mesas 3 y 4
- **Total**: 4 mesas distribuidas correctamente

### Escenario 2: Asignación Concentrada
Si la intención era asignar 4 mesas a UN SOLO testigo:
- Necesitaría reasignar las mesas
- Ejemplo: Antonia Marrugo → Mesas [1, 2, 3, 4]
- Maralara quedaría sin mesas o con otras mesas diferentes

## Límites del Sistema

Según la validación en `src/app/api/dashboard/leader/witnesses/route.ts`:

```typescript
assignedTables: z.array(z.number()).min(1).max(5)
```

- **Mínimo**: 1 mesa por testigo
- **Máximo**: 5 mesas por testigo

## Cómo Reasignar Mesas

### Opción 1: Usar el Script Interactivo

```bash
npx tsx scripts/manage-witness-tables.ts
```

Este script permite:
1. Ver todos los testigos y sus mesas asignadas
2. Reasignar mesas a cualquier testigo
3. Validar que las mesas existan en el puesto

### Opción 2: Usar la Interfaz Web

1. Ir al dashboard del líder
2. Hacer clic en "Testigos" en el header
3. Seleccionar el testigo a editar
4. Modificar las mesas asignadas
5. Guardar cambios

### Opción 3: Actualización Manual con Script

Si necesitas hacer cambios específicos, puedes crear un script como:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateWitnessTables() {
  // Ejemplo: Asignar mesas 1,2,3,4 a Antonia Marrugo
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
}
```

## Verificación

Para verificar el estado actual en cualquier momento:

```bash
npx tsx scripts/check-witness-tables.ts
```

Este script muestra:
- Todos los testigos registrados
- Sus mesas asignadas (raw y parsed)
- Número de mesas por testigo
- Validación del formato JSON

## Recomendaciones

1. **Clarificar la intención**: ¿Quieres 4 mesas para 1 testigo o 2 mesas para cada uno de 2 testigos?

2. **Distribución recomendada**: 
   - Para mejor cobertura: 2-3 mesas por testigo
   - Máximo permitido: 5 mesas por testigo

3. **Consideraciones operativas**:
   - Un testigo con 4-5 mesas tendrá más trabajo
   - Distribuir entre varios testigos reduce riesgo de ausencias
   - Cada puesto puede tener múltiples testigos

## Próximos Pasos

1. **Confirmar la intención**: ¿Cómo quieres que estén distribuidas las mesas?

2. **Si necesitas cambios**:
   - Ejecuta `npx tsx scripts/manage-witness-tables.ts`
   - Selecciona opción 2 (Reasignar mesas)
   - Sigue las instrucciones interactivas

3. **Verificar después del cambio**:
   - Ejecuta `npx tsx scripts/check-witness-tables.ts`
   - Revisa el dashboard web

## Conclusión

El sistema está funcionando correctamente. La confusión puede venir de:
- Ver "2 mesas asignadas" por testigo vs "4 mesas totales"
- No distinguir entre mesas por testigo vs mesas totales del sistema

**Estado actual**: ✅ Correcto - 2 testigos con 2 mesas cada uno = 4 mesas totales
