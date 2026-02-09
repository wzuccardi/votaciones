/**
 * Script de prueba de Rate Limiting
 * Valida que el sistema de límites funcione correctamente
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface RateLimitTest {
  endpoint: string;
  limit: number;
  window: string;
}

const tests: RateLimitTest[] = [
  { endpoint: '/api/auth/login', limit: 5, window: '15m' },
  { endpoint: '/api/auth/register/candidate', limit: 3, window: '1h' },
  { endpoint: '/api/auth/register/leader', limit: 10, window: '1h' },
  { endpoint: '/api/auth/register/voter', limit: 20, window: '1h' },
];

async function testRateLimit(test: RateLimitTest) {
  console.log(`\n🔒 Probando rate limit: ${test.endpoint}`);
  console.log(`   Límite: ${test.limit} requests por ${test.window}`);
  
  const requests: Promise<Response>[] = [];
  
  // Hacer más requests del límite permitido
  const totalRequests = test.limit + 2;
  
  for (let i = 0; i < totalRequests; i++) {
    const promise = fetch(`${BASE_URL}${test.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test${i}@example.com`,
        password: 'Test123456',
      }),
    });
    
    requests.push(promise);
  }
  
  const responses = await Promise.all(requests);
  
  const successCount = responses.filter(r => r.status !== 429).length;
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  
  console.log(`   ✅ Requests exitosos: ${successCount}`);
  console.log(`   🚫 Requests bloqueados: ${rateLimitedCount}`);
  
  if (rateLimitedCount === 0) {
    console.log(`   ⚠️  ADVERTENCIA: No se activó el rate limiting`);
    return false;
  }
  
  if (successCount > test.limit) {
    console.log(`   ❌ ERROR: Se permitieron más requests del límite`);
    return false;
  }
  
  console.log(`   ✅ Rate limiting funcionando correctamente`);
  return true;
}

async function testRateLimitHeaders() {
  console.log(`\n📊 Verificando headers de rate limit`);
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'test',
    }),
  });
  
  const headers = {
    limit: response.headers.get('X-RateLimit-Limit'),
    remaining: response.headers.get('X-RateLimit-Remaining'),
    reset: response.headers.get('X-RateLimit-Reset'),
  };
  
  console.log(`   Limit: ${headers.limit || 'N/A'}`);
  console.log(`   Remaining: ${headers.remaining || 'N/A'}`);
  console.log(`   Reset: ${headers.reset || 'N/A'}`);
  
  if (!headers.limit || !headers.remaining) {
    console.log(`   ⚠️  Headers de rate limit no encontrados`);
    return false;
  }
  
  console.log(`   ✅ Headers presentes`);
  return true;
}

async function main() {
  console.log('🧪 Iniciando pruebas de Rate Limiting...\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);
  console.log('=' .repeat(60));
  
  console.log('\n⚠️  NOTA: Estas pruebas pueden tardar varios segundos');
  console.log('⚠️  y consumirán parte de tu límite de rate limiting.\n');
  
  // Verificar headers
  const headersOk = await testRateLimitHeaders();
  
  // Probar cada endpoint (comentado por defecto para no consumir límites)
  console.log('\n⚠️  Pruebas de límites deshabilitadas por defecto');
  console.log('⚠️  Descomenta el código para ejecutarlas\n');
  
  /*
  const results: boolean[] = [];
  
  for (const test of tests) {
    const result = await testRateLimit(test);
    results.push(result);
    
    // Esperar un poco entre pruebas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  */
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN\n');
  console.log(`✅ Headers de rate limit: ${headersOk ? 'OK' : 'FALLO'}`);
  console.log(`⚠️  Pruebas de límites: DESHABILITADAS`);
  console.log('\n💡 Para habilitar las pruebas completas:');
  console.log('   1. Descomenta el código en este script');
  console.log('   2. Asegúrate de tener Upstash Redis configurado');
  console.log('   3. Ten en cuenta que consumirá tus límites\n');
  console.log('=' .repeat(60));
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
