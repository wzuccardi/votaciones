/**
 * Script de prueba de endpoints de la API
 * Valida que todos los endpoints respondan correctamente
 */

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  expectedStatus: number = 200
) {
  const start = Date.now();
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const duration = Date.now() - start;
    const passed = response.status === expectedStatus;
    
    results.push({
      endpoint,
      method,
      status: response.status,
      passed,
      duration,
    });
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${method} ${endpoint} - ${response.status} (${duration}ms)`);
    
    if (!passed) {
      const text = await response.text();
      console.log(`   Error: Esperado ${expectedStatus}, recibido ${response.status}`);
      console.log(`   Respuesta: ${text.substring(0, 200)}`);
    }
    
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    results.push({
      endpoint,
      method,
      status: 0,
      passed: false,
      duration,
      error: errorMsg,
    });
    
    console.log(`❌ ${method} ${endpoint} - Error (${duration}ms)`);
    console.log(`   ${errorMsg}`);
  }
}

async function main() {
  console.log('🧪 Iniciando pruebas de API endpoints...\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);
  console.log('=' .repeat(60));
  
  // Pruebas de endpoints públicos
  console.log('\n📡 ENDPOINTS PÚBLICOS');
  await testEndpoint('/api/data/departments', 'GET');
  await testEndpoint('/api/data/municipalities', 'GET');
  
  // Pruebas de endpoints de autenticación (NextAuth)
  console.log('\n🔐 ENDPOINTS DE AUTENTICACIÓN');
  // NextAuth usa rutas específicas, no podemos probar directamente
  console.log('   ℹ️  NextAuth endpoints requieren pruebas manuales');
  
  // Pruebas de endpoints de dashboard
  console.log('\n📊 ENDPOINTS DE DASHBOARD');
  await testEndpoint('/api/dashboard/stats', 'GET', undefined, 401); // Sin auth debe fallar
  
  // Pruebas de endpoints de testigos
  console.log('\n👁️  ENDPOINTS DE TESTIGOS');
  await testEndpoint('/api/witness/validate', 'POST', {
    code: 'INVALID'
  }, 404);
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN DE PRUEBAS\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const avgDuration = total > 0 ? Math.round(
    results.reduce((sum, r) => sum + r.duration, 0) / total
  ) : 0;
  
  console.log(`Total: ${total} endpoints probados`);
  console.log(`✅ Exitosos: ${passed}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`⏱️  Tiempo promedio: ${avgDuration}ms`);
  
  if (failed > 0) {
    console.log('\n❌ ENDPOINTS FALLIDOS:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  • ${r.method} ${r.endpoint}`);
      if (r.error) {
        console.log(`    Error: ${r.error}`);
      } else {
        console.log(`    Status: ${r.status}`);
      }
    });
  }
  
  console.log('\n💡 NOTAS:');
  console.log('   • Algunos endpoints requieren autenticación');
  console.log('   • NextAuth endpoints no se pueden probar directamente');
  console.log('   • Prueba el login manualmente en el navegador\n');
  
  console.log('=' .repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
