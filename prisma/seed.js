const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seeding de Bolívar...');

    // 1. Crear Departamento de Bolívar
    const bolivar = await prisma.department.upsert({
        where: { code: '13' },
        update: {},
        create: {
            name: 'BOLÍVAR',
            code: '13',
        },
    });

    console.log('✅ Departamento de Bolívar creado/verificado.');

    // 2. Municipios Principales
    const municipalities = [
        { name: 'CARTAGENA', code: '13001' },
        { name: 'MAGANGUÉ', code: '13430' },
        { name: 'TURBACO', code: '13836' },
        { name: 'ARJONA', code: '13052' },
        { name: 'EL CARMEN DE BOLÍVAR', code: '13244' },
        { name: 'TURBANÁ', code: '13838' },
        { name: 'MAHATES', code: '13433' },
        { name: 'MARÍA LA BAJA', code: '13442' },
        { name: 'SANTA ROSA', code: '13683' },
        { name: 'VILLANUEVA', code: '13873' },
    ];

    for (const muni of municipalities) {
        const createdMuni = await prisma.municipality.upsert({
            where: { code: muni.code },
            update: {},
            create: {
                name: muni.name,
                code: muni.code,
                departmentId: bolivar.id,
            },
        });

        // Crear al menos un puesto de votación por municipio para que el selector funcione
        await prisma.pollingStation.upsert({
            where: {
                // Generar un ID determinístico para evitar duplicados si se corre varias veces
                id: `PS-${muni.code}-001`
            },
            update: {},
            create: {
                id: `PS-${muni.code}-001`,
                name: `COLEGIO PRINCIPAL DE ${muni.name}`,
                code: `${muni.code}01`,
                address: 'PLAZA PRINCIPAL',
                community: 'ZONA 1',
                municipalityId: createdMuni.id,
                totalTables: 20,
                senado: true,
                camara: true
            }
        });
    }

    console.log(`✅ ${municipalities.length} municipios y sus puestos iniciales creados.`);
    console.log('🚀 Seeding completado exitosamente.');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
