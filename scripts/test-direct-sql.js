const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

console.log('Intentando conectar directamente con pg...');
const client = new Client({
    connectionString: connectionString,
});

async function test() {
    try {
        await client.connect();
        console.log('✅ Conexión exitosa a PostgreSQL');

        console.log('Intentando crear tabla de prueba...');
        await client.query('CREATE TABLE IF NOT EXISTS _prisma_test (id SERIAL PRIMARY KEY, name TEXT)');
        console.log('✅ Tabla de prueba creada exitosamente');

        console.log('Intentando eliminar tabla de prueba...');
        await client.query('DROP TABLE _prisma_test');
        console.log('✅ Tabla de prueba eliminada exitosamente');

        await client.end();
        console.log('Test completado con éxito.');
    } catch (err) {
        console.error('❌ Error durante el test:', err.message);
        process.exit(1);
    }
}

test();
