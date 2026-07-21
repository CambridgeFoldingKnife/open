import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const file = process.argv[2];
  if (!file) {
    console.error('usage: tsx run-migration.ts <sql-file>');
    process.exit(1);
  }
  const pool = new Pool({ connectionString });
  const sql = readFileSync(resolve(file), 'utf8');
  await pool.query(sql);
  console.log('migration applied:', file);
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
