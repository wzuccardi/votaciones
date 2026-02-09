/**
 * Script de prueba de Pusher (Tiempo Real)
 * Valida la configuración y conectividad con Pusher
 */

import Pusher from 'pusher-js';

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

async function testPusherConfig() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  
  if (!key) {
    throw new Error('NEXT_PUBLIC_PUSHER_KEY no configurado');
  }
  
  if (!cluster) {
    throw new Error('NEXT_PUBLIC_PUSHER_CLUSTER no configurado');
  }
  
  console.log(`   🔑 Key: ${key.substring(0, 10)}...`);
  console.log(`   🌍 Cluster: ${cluster}`);
}

async function testPusherConnection() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  
  if (!key || !cluster) {
    throw new Error('Configuración de Pusher incompleta');
  }
  
  return new Promise<void>((resolve, reject) => {
    const pusher = new Pusher(key, {
      cluster,
    });
    
    const timeout = setTimeout(() => {
      pusher.disconnect();
      reject(new Error('Timeout: No se pudo conectar a Pusher'));
    }, 10000);
    
    pusher.connection.bind('connected', () => {
      clearTimeout(timeout);
      console.log(`   🔌 Conectado a Pusher`);
      pusher.disconnect();
      resolve();
    });
    
    pusher.connection.bind('error', (error: any) => {
      clearTimeout(timeout);
      pusher.disconnect();
      reject(new Error(`Error de conexión: ${error.message || error}`));
    });
  });
}

async function testChannelSubscription() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  
  if (!key || !cluster) {
    throw new Error('Configuración de Pusher incompleta');
  }
  
  return new Promise<void>((resolve, reject) => {
    const pusher = new Pusher(key, {
      cluster,
    });
    
    const timeout = setTimeout(() => {
      pusher.disconnect();
      reject(new Error('Timeout: No se pudo suscribir al canal'));
    }, 10000);
    
    const channel = pusher.subscribe('votes');
    
    channel.bind('pusher:subscription_succeeded', () => {
      clearTimeout(timeout);
      console.log(`   📡 Suscrito al canal "votes"`);
      pusher.unsubscribe('votes');
      pusher.disconnect();
      resolve();
    });
    
    channel.bind('pusher:subscription_error', (error: any) => {
      clearTimeout(timeout);
      pusher.disconnect();
      reject(new Error(`Error de suscripción: ${error.message || error}`));
    });
  });
}

async function testEventReceiving() {
  console.log('   ⚠️  Prueba manual requerida');
  console.log('   💡 Para probar eventos en tiempo real:');
  console.log('      1. Abre la aplicación en el navegador');
  console.log('      2. Registra un voto desde otro dispositivo');
  console.log('      3. Verifica que se actualice en tiempo real');
}

async function main() {
  console.log('🧪 Iniciando pruebas de Pusher (Tiempo Real)...\n');
  console.log('=' .repeat(60));
  
  console.log('\n⚙️  CONFIGURACIÓN');
  await runTest('Variables de entorno de Pusher', testPusherConfig);
  
  console.log('\n🔌 CONECTIVIDAD');
  await runTest('Conexión a Pusher', testPusherConnection);
  await runTest('Suscripción a canal', testChannelSubscription);
  
  console.log('\n📨 EVENTOS EN TIEMPO REAL');
  await runTest('Recepción de eventos', testEventReceiving);
  
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
  
  console.log('\n💡 NOTAS:');
  console.log('   • Asegúrate de tener las variables de entorno configuradas');
  console.log('   • Verifica que tu cuenta de Pusher esté activa');
  console.log('   • Las pruebas de eventos requieren verificación manual\n');
  
  console.log('=' .repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
