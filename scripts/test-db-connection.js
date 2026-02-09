const { execSync } = require('child_process');

// Load .env manually
require('dotenv').config();

console.log('='.repeat(50));
console.log('Testing Supabase Connection');
console.log('='.repeat(50));
console.log('\n1. Checking environment variables...');
console.log(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
console.log(`DATABASE_URL length: ${process.env.DATABASE_URL?.length || 0}`);

if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    const masked = url.replace(/:([^:@]+)@/, ':****@');
    console.log(`DATABASE_URL (masked): ${masked}`);
}

console.log('\n2. Running Prisma db push...\n');

try {
    const output = execSync('npx prisma db push --accept-data-loss', {
        encoding: 'utf8',
        stdio: 'pipe',
        env: process.env
    });
    console.log(output);
    console.log('\n✅ SUCCESS! Database schema has been pushed to Supabase!');
} catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stdout) {
        console.log('\nOutput:', error.stdout);
    }
    if (error.stderr) {
        console.error('\nError details:', error.stderr);
    }
    process.exit(1);
}
