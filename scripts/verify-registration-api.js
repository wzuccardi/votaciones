const fetch = require('node-fetch');

async function testVotacionesAPI() {
    const baseUrl = 'http://localhost:3000';
    console.log('🧪 Iniciando pruebas de API en AppVotaciones (Supabase)...');

    // 1. Registrar Candidato
    console.log('\n1️⃣ Registrando Candidato...');
    const candidateData = {
        role: 'candidate',
        document: '123456789',
        name: 'Candidato de Prueba Supabase',
        party: 'Partido Digital',
        password: 'password123',
    };

    const candResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData),
    });

    const candResult = await candResponse.json();
    console.log('Resultado Candidato:', candResult);

    if (!candResult.success) {
        console.error('❌ Error registrando candidato. Abortando.');
        return;
    }

    const candidateId = candResult.data.id;

    // 2. Registrar Líder vinculado al candidato
    console.log('\n2️⃣ Registrando Líder vinculado al candidato...');
    const leaderData = {
        role: 'leader',
        document: '987654321',
        name: 'Líder de Prueba Supabase',
        candidateId: candidateId,
        password: 'password123',
    };

    const leadResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaderData),
    });

    const leadResult = await leadResponse.json();
    console.log('Resultado Líder:', leadResult);

    if (!leadResult.success) {
        console.error('❌ Error registrando líder.');
    } else {
        console.log('✅ Pruebas de API completadas con éxito!');
    }
}

testVotacionesAPI().catch(console.error);
