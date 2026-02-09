// test-rate-limit.js
// Script para probar que el rate limiting funciona correctamente

const testRateLimit = async () => {
    console.log('🔄 Iniciando prueba de rate limiting...\n')

    const endpoint = 'http://localhost:3000/api/data/candidates'
    let blockedAt = null

    for (let i = 0; i < 150; i++) {
        try {
            const res = await fetch(endpoint)
            const status = res.status

            if (status === 429) {
                console.log(`❌ Request ${i + 1}: ${status} - Rate limit excedido`)
                blockedAt = i + 1
                break
            } else {
                console.log(`✅ Request ${i + 1}: ${status}`)
            }
        } catch (error) {
            console.error(`❗ Request ${i + 1}: Error -`, error.message)
            break
        }

        // Pequeño delay para evitar saturar instantáneamente
        await new Promise(resolve => setTimeout(resolve, 50))
    }

    if (blockedAt) {
        console.log(`\n✅ ¡Rate limiting funcionando correctamente!`)
        console.log(`   Bloqueado después de ${blockedAt} requests.`)
    } else {
        console.log(`\n⚠️  No se alcanzó el límite de tasa en 150 requests.`)
        console.log(`   Esto podría indicar que el rate limiting no está configurado.`)
    }
}

// Ejecutar test
testRateLimit().catch(console.error)
