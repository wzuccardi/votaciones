const net = require('net');

const host = 'aws-1-sa-east-1.pooler.supabase.com';
const port = 6543;

console.log(`Intentando conectar a ${host}:${port}...`);

const socket = new net.Socket();
const timeout = 5000;

socket.setTimeout(timeout);

socket.on('connect', () => {
    console.log('✅ CONEXIÓN EXITOSA: El puerto está abierto y es accesible.');
    socket.destroy();
    process.exit(0);
});

socket.on('timeout', () => {
    console.log('❌ ERROR: Tiempo de espera agotado (Timeout). El puerto podría estar bloqueado por un firewall.');
    socket.destroy();
    process.exit(1);
});

socket.on('error', (err) => {
    console.log(`❌ ERROR DE RED: ${err.message}`);
    socket.destroy();
    process.exit(1);
});

socket.connect(port, host);
