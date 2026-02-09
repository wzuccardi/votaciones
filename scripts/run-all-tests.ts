/**
 * Script maestro para ejecutar todas las pruebas
 * Ejecuta todos los scripts de prueba en secuencia
 */

import { spawn } from 'child_process';
import { join } from 'path';

interface TestSuite {
  name: string;
  script: string;
  description: string;
  critical: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'Sistema Completo',
    script: 'test-complete-system.ts',
    description: 'Pruebas de base de datos e integridad',
    critical: true,
  },
  {
    name: 'API Endpoints',
    script: 'test-api-endpoints.ts',
    description: 'Pruebas de todos los endpoints de la API',
    critical: true,
  },
  {
    name: 'Características PWA',
    script: 'test-pwa-features.ts',
    description: 'Pruebas de almacenamiento offline y PWA',
    critical: false,
  },
  {
    name: 'Rate Limiting',
    script: 'test-rate-limiting.ts',
    description: 'Pruebas de límites de tasa',
    critical: false,
  },
  {
    name: 'Tiempo Real (Pusher)',
    script: 'test-realtime-pusher.ts',
    description: 'Pruebas de conectividad en tiempo real',
    critical: false,
  },
];

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
}

const results: TestResult[] = [];

function runScript(scriptPath: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    let output = '';
    
    const child = spawn('npx', ['tsx', scriptPath], {
      cwd: process.cwd(),
      shell: true,
    });
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - start;
      resolve({ exitCode: code || 0, output });
    });
    
    child.on('error', (error) => {
      output += `\nError: ${error.message}`;
      resolve({ exitCode: 1, output });
    });
  });
}

async function main() {
  console.log('🧪 SUITE COMPLETA DE PRUEBAS - AppVotaciones\n');
  console.log('=' .repeat(70));
  console.log('\n📋 Pruebas a ejecutar:\n');
  
  testSuites.forEach((suite, index) => {
    const icon = suite.critical ? '🔴' : '🟡';
    console.log(`${index + 1}. ${icon} ${suite.name}`);
    console.log(`   ${suite.description}`);
  });
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n🚀 Iniciando pruebas...\n');
  
  const startTime = Date.now();
  
  for (const suite of testSuites) {
    console.log('\n' + '='.repeat(70));
    console.log(`\n🧪 ${suite.name.toUpperCase()}`);
    console.log(`📝 ${suite.description}\n`);
    
    const scriptPath = join(process.cwd(), 'scripts', suite.script);
    const suiteStart = Date.now();
    
    const { exitCode, output } = await runScript(scriptPath);
    const duration = Date.now() - suiteStart;
    
    results.push({
      suite: suite.name,
      passed: exitCode === 0,
      duration,
      output,
    });
    
    const icon = exitCode === 0 ? '✅' : '❌';
    console.log(`\n${icon} ${suite.name} completado en ${duration}ms`);
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESUMEN FINAL DE TODAS LAS PRUEBAS\n');
  console.log('=' .repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\n📈 Estadísticas Generales:`);
  console.log(`   Total de suites: ${total}`);
  console.log(`   ✅ Exitosas: ${passed}`);
  console.log(`   ❌ Fallidas: ${failed}`);
  console.log(`   ⏱️  Tiempo total: ${Math.round(totalDuration / 1000)}s`);
  
  console.log(`\n📋 Resultados por Suite:\n`);
  
  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    const time = Math.round(result.duration / 1000);
    console.log(`   ${icon} ${result.suite} (${time}s)`);
  });
  
  if (failed > 0) {
    console.log(`\n❌ SUITES FALLIDAS:\n`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.suite}`);
    });
    
    const criticalFailed = results.filter(
      r => !r.passed && testSuites.find(s => s.name === r.suite)?.critical
    );
    
    if (criticalFailed.length > 0) {
      console.log(`\n🔴 ATENCIÓN: ${criticalFailed.length} prueba(s) crítica(s) fallaron`);
    }
  } else {
    console.log(`\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisa los resultados de cada suite');
  console.log('   2. Corrige cualquier error encontrado');
  console.log('   3. Ejecuta las pruebas individuales si es necesario');
  console.log('   4. Verifica la aplicación en el navegador\n');
  console.log('=' .repeat(70));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
