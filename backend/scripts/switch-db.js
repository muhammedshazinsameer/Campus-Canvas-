import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

const target = process.argv[2]?.toLowerCase();

if (target === 'sqlite') {
  const sqliteSchema = path.join(backendDir, 'prisma', 'schema.sqlite.prisma');
  const activeSchema = path.join(backendDir, 'prisma', 'schema.prisma');
  fs.copyFileSync(sqliteSchema, activeSchema);

  const envPath = path.join(backendDir, '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (/^DATABASE_URL=.*$/m.test(envContent)) {
    envContent = envContent.replace(/^DATABASE_URL=.*$/m, 'DATABASE_URL="file:./dev.db"');
  } else {
    envContent += '\nDATABASE_URL="file:./dev.db"\n';
  }
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Switched Prisma to SQLite (file:./dev.db)');
} else if (target === 'postgres' || target === 'postgresql') {
  // Regenerate postgres schema
  const postgresSchemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
  const content = fs.readFileSync(postgresSchemaPath, 'utf8');
  if (content.includes('provider = "sqlite"')) {
    const updated = content.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(postgresSchemaPath, updated, 'utf8');
  }
  console.log('Switched Prisma to PostgreSQL. Ensure DATABASE_URL is set in .env');
} else {
  console.log('Usage: node scripts/switch-db.js [sqlite|postgres]');
}
