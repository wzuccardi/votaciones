-- ============================================
-- SCRIPT PARA LIMPIAR BASE DE DATOS
-- ============================================
-- ADVERTENCIA: Este script eliminará TODOS los datos
-- Asegúrate de tener un backup antes de ejecutar

-- 1. Eliminar datos en orden (respetando foreign keys)
DELETE FROM "Table";
DELETE FROM "ElectoralWitness";
DELETE FROM "Voter";
DELETE FROM "Leader";
DELETE FROM "Candidate";
DELETE FROM "DocumentIndex";
DELETE FROM "PollingStation";
DELETE FROM "Municipality";
DELETE FROM "Department";

-- 2. Reiniciar secuencias (opcional)
-- Esto reinicia los IDs autoincrementales

-- 3. Verificar que todo esté limpio
SELECT 
    'Department' as tabla, COUNT(*) as registros FROM "Department"
UNION ALL
SELECT 'Municipality', COUNT(*) FROM "Municipality"
UNION ALL
SELECT 'PollingStation', COUNT(*) FROM "PollingStation"
UNION ALL
SELECT 'Candidate', COUNT(*) FROM "Candidate"
UNION ALL
SELECT 'Leader', COUNT(*) FROM "Leader"
UNION ALL
SELECT 'Voter', COUNT(*) FROM "Voter"
UNION ALL
SELECT 'ElectoralWitness', COUNT(*) FROM "ElectoralWitness"
UNION ALL
SELECT 'Table', COUNT(*) FROM "Table";

-- Resultado esperado: todos los conteos deben ser 0
