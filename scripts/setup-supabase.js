const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n========================================');
console.log('🚀 Configurador de Supabase - AppVotaciones');
console.log('========================================\n');

console.log('📋 PASO 1: Crear Proyecto en Supabase\n');
console.log('1. Abre tu navegador y ve a: https://supabase.com');
console.log('2. Haz clic en "Start your project" o "Sign in"');
console.log('3. Inicia sesión con GitHub (recomendado) o email\n');

console.log('📋 PASO 2: Crear Nuevo Proyecto\n');
console.log('1. En el dashboard, haz clic en "New Project"');
console.log('2. Configura:');
console.log('   - Name: AppVotaciones (o el que prefieras)');
console.log('   - Database Password: Genera una contraseña SEGURA (guárdala!)');
console.log('   - Region: South America (São Paulo) - más cercana a Colombia');
console.log('   - Plan: Free (suficiente para desarrollo)');
console.log('3. Haz clic en "Create new project" y espera 1-2 minutos\n');

console.log('📋 PASO 3: Obtener Cadenas de Conexión\n');
console.log('1. Ve a Settings (⚙️) > Database');
console.log('2. Busca la sección "Connection string"\n');

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('========================================\n');
    console.log('Por favor, ingresa tus credenciales de Supabase:\n');

    // Solicitar connection pooling URL
    const poolingUrl = await question('Connection Pooling URL (con pgbouncer=true):\n> ');

    if (!poolingUrl || !poolingUrl.includes('postgresql://')) {
        console.log('\n❌ Error: La URL debe comenzar con "postgresql://"');
        rl.close();
        return;
    }

    // Solicitar direct URL
    const directUrl = await question('\nDirect Connection URL:\n> ');

    if (!directUrl || !directUrl.includes('postgresql://')) {
        console.log('\n❌ Error: La URL debe comenzar con "postgresql://"');
        rl.close();
        return;
    }

    // Leer .env actual
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Actualizar o agregar variables
    const lines = envContent.split('\n');
    const newLines = [];
    let foundDatabaseUrl = false;
    let foundDirectUrl = false;

    for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
            newLines.push(`DATABASE_URL="${poolingUrl}"`);
            foundDatabaseUrl = true;
        } else if (line.startsWith('DIRECT_URL=')) {
            newLines.push(`DIRECT_URL="${directUrl}"`);
            foundDirectUrl = true;
        } else if (line.trim() !== '') {
            newLines.push(line);
        }
    }

    if (!foundDatabaseUrl) {
        newLines.push(`DATABASE_URL="${poolingUrl}"`);
    }
    if (!foundDirectUrl) {
        newLines.push(`DIRECT_URL="${directUrl}"`);
    }

    // Escribir .env actualizado
    fs.writeFileSync(envPath, newLines.join('\n') + '\n');

    console.log('\n✅ Archivo .env actualizado exitosamente!\n');
    console.log('========================================');
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('1. Ejecuta: npm run db:push');
    console.log('   (Esto creará todas las tablas en Supabase)\n');
    console.log('2. Ejecuta: npm run db:studio');
    console.log('   (Abrirá Prisma Studio para ver las tablas)\n');
    console.log('3. Ejecuta: npm run dev');
    console.log('   (Inicia el servidor de desarrollo)\n');
    console.log('========================================\n');

    rl.close();
}

main().catch(console.error);
