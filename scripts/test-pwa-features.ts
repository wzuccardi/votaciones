/**
 * Script de prueba de características PWA
 * Valida offline storage y service worker
 */

import { openDB, IDBPDatabase } from 'idb';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    results.push({ name, passed: true, message: 'OK' });
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, message });
    console.error(`❌ ${name}: ${message}`);
  }
}

async function testIndexedDB() {
  const db = await openDB('AppVotaciones', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('votes')) {
        db.createObjectStore('votes', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('witnesses')) {
        db.createObjectStore('witnesses', { keyPath: 'code' });
      }
    },
  });
  
  if (!db.objectStoreNames.contains('votes')) {
    throw new Error('Object store "votes" no existe');
  }
  
  if (!db.objectStoreNames.contains('witnesses')) {
    throw new Error('Object store "witnesses" no existe');
  }
  
  db.close();
}

async function testOfflineStorage() {
  const db = await openDB('AppVotaciones', 1);
  
  // Probar escritura
  const testData = {
    voterId: 'test-' + Date.now(),
    timestamp: new Date().toISOString(),
    synced: false,
  };
  
  const tx = db.transaction('votes', 'readwrite');
  const id = await tx.store.add(testData);
  await tx.done;
  
  // Probar lectura
  const stored = await db.get('votes', id);
  
  if (!stored) {
    throw new Error('No se pudo leer el dato almacenado');
  }
  
  if (stored.voterId !== testData.voterId) {
    throw new Error('Los datos no coinciden');
  }
  
  // Limpiar
  await db.delete('votes', id);
  db.close();
  
  console.log('   💾 Almacenamiento offline funcional');
}

async function testWitnessOfflineStorage() {
  const db = await openDB('AppVotaciones', 1);
  
  const testWitness = {
    code: 'TEST-' + Date.now(),
    name: 'Test Witness',
    pollingStation: 'Test Station',
    checklist: [],
    lastSync: new Date().toISOString(),
  };
  
  // Guardar testigo
  await db.put('witnesses', testWitness);
  
  // Recuperar testigo
  const stored = await db.get('witnesses', testWitness.code);
  
  if (!stored) {
    throw new Error('No se pudo recuperar el testigo');
  }
  
  if (stored.name !== testWitness.name) {
    throw new Error('Los datos del testigo no coinciden');
  }
  
  // Limpiar
  await db.delete('witnesses', testWitness.code);
  db.close();
  
  console.log('   👁️  Almacenamiento de testigos funcional');
}

async function testManifest() {
  const response = await fetch('/manifest.json');
  
  if (!response.ok) {
    throw new Error(`manifest.json no encontrado: ${response.status}`);
  }
  
  const manifest = await response.json();
  
  if (!manifest.name) {
    throw new Error('manifest.json no tiene nombre');
  }
  
  if (!manifest.icons || manifest.icons.length === 0) {
    throw new Error('manifest.json no tiene iconos');
  }
  
  console.log(`   📱 Manifest: ${manifest.name}`);
}

async function testServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker no soportado en este navegador');
  }
  
  console.log('   🔧 Service Worker API disponible');
}

async function main() {
  console.log('🧪 Iniciando pruebas de características PWA...\n');
  console.log('=' .repeat(60));
  
  console.log('\n💾 ALMACENAMIENTO OFFLINE (IndexedDB)');
  await runTest('IndexedDB disponible', testIndexedDB);
  await runTest('Almacenamiento de votos offline', testOfflineStorage);
  await runTest('Almacenamiento de testigos offline', testWitnessOfflineStorage);
  
  console.log('\n📱 CARACTERÍSTICAS PWA');
  await runTest('Manifest.json válido', testManifest);
  await runTest('Service Worker API', testServiceWorkerRegistration);
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN DE PRUEBAS\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total: ${total} pruebas`);
  console.log(`✅ Exitosas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ PRUEBAS FALLIDAS:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  • ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
