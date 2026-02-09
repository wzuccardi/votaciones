# Corrección de Municipios y Puestos de Votación

## Problema Identificado

El usuario reportó que:
- Deberían ser **46 municipios** pero solo se mostraban 44
- Deberían ser **639 puestos** de votación pero había 647

## Análisis Realizado

### 1. Municipios Faltantes
Se identificaron 2 municipios que no estaban en la base de datos:
- **ARROYO HONDO** (6 puestos)
- **RIOVIEJO** (7 puestos)

### 2. Puestos Incorrectos en la Base de Datos
Se encontraron 22 puestos que no deberían estar:

#### Datos de Prueba (10 puestos)
- COLEGIO PRINCIPAL DE CARTAGENA
- COLEGIO PRINCIPAL DE MAGANGUÉ
- COLEGIO PRINCIPAL DE TURBACO
- COLEGIO PRINCIPAL DE ARJONA
- COLEGIO PRINCIPAL DE EL CARMEN DE BOLÍVAR
- COLEGIO PRINCIPAL DE TURBANÁ
- COLEGIO PRINCIPAL DE MAHATES
- COLEGIO PRINCIPAL DE MARÍA LA BAJA
- COLEGIO PRINCIPAL DE SANTA ROSA
- COLEGIO PRINCIPAL DE VILLANUEVA

#### Puestos Mal Asignados (12 puestos)
Los siguientes puestos estaban asignados incorrectamente a **TIQUISIO (PTO. RICO)** cuando deberían estar en **ARROYO HONDO** y **RIOVIEJO**:
- MACHADO
- MONROY
- PILON
- SATO
- SAN FRANCISCO
- PUESTO CABECERA MUNICIPAL
- CAMPO ALEGRE
- COBADILLO
- CAIMITAL
- HATILLO
- BLANCAS PALOMAS
- MACEDONIA

### 3. Puestos Faltantes
Se identificaron 14 puestos que estaban en el CSV pero no en la base de datos:
- 6 puestos de ARROYO HONDO
- 7 puestos de RIOVIEJO
- 1 puesto de MARIA LA BAJA (I.E. RAFAEL URIBE URIBE SEDE 4)

## Solución Implementada

Se creó el script `scripts/fix-municipalities-and-stations.ts` que realizó las siguientes acciones:

### Paso 1: Eliminar Datos de Prueba
✅ Eliminados 10 puestos "COLEGIO PRINCIPAL"

### Paso 2: Eliminar Puestos Mal Asignados
✅ Eliminados 12 puestos incorrectamente asignados a TIQUISIO

### Paso 3: Crear Municipios Faltantes
✅ Creado: ARROYO HONDO (código 13045)
✅ Creado: RIOVIEJO (código 13046)

### Paso 4: Importar Puestos Faltantes
✅ Importados 14 puestos desde el CSV:
- 6 puestos de ARROYO HONDO (33 mesas)
- 7 puestos de RIOVIEJO (24 mesas)
- 1 puesto de MARIA LA BAJA (10 mesas)
- **Total: 67 mesas creadas**

### Paso 5: Verificación Final
✅ Total municipios: **46** (esperado: 46) ✓
✅ Total puestos: **639** (esperado: 639) ✓

## Resultado

La base de datos ahora coincide perfectamente con el archivo CSV:
- ✅ **46 municipios** (todos los municipios de Bolívar)
- ✅ **639 puestos de votación** (todos los puestos del CSV)
- ✅ Todos los puestos están correctamente asignados a sus municipios

## Scripts Creados

1. `scripts/check-csv-municipalities.ts` - Verifica municipios en el CSV
2. `scripts/find-missing-municipalities.ts` - Identifica municipios faltantes
3. `scripts/check-missing-municipalities-data.ts` - Muestra datos de municipios faltantes
4. `scripts/check-duplicate-stations.ts` - Busca puestos duplicados
5. `scripts/compare-db-vs-csv.ts` - Compara base de datos vs CSV
6. `scripts/fix-municipalities-and-stations.ts` - **Script de corrección principal**

## Verificación

Para verificar que todo está correcto:

```bash
# Contar municipios
npx tsx scripts/count-municipalities.ts

# Contar puestos
npx tsx scripts/count-polling-stations.ts

# Comparar DB vs CSV
npx tsx scripts/compare-db-vs-csv.ts
```

## Impacto en la Aplicación

Ahora los usuarios podrán:
- ✅ Ver los **46 municipios** completos en el selector
- ✅ Acceder a todos los **639 puestos de votación**
- ✅ Registrar votantes en ARROYO HONDO y RIOVIEJO
- ✅ Asignar testigos a todos los puestos disponibles

## Fecha de Corrección
3 de febrero de 2026
