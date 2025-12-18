import { Client } from 'pg';

const FAILED_MIGRATION_NAME = '20251218000000_align_current_schema';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('Migration repair: DATABASE_URL not set; skipping');
    return;
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const exists = await client.query("SELECT to_regclass('_prisma_migrations') AS reg");
    if (!exists.rows[0] || !exists.rows[0].reg) {
      console.log('Migration repair: _prisma_migrations table not found; skipping');
      return;
    }

    const row = await client.query(
      'SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name = $1 ORDER BY started_at DESC LIMIT 1',
      [FAILED_MIGRATION_NAME]
    );

    const migration = row.rows[0] as any;
    if (!migration) {
      console.log('Migration repair: no failed migration record found; skipping');
      return;
    }

    if (migration.finished_at === null && migration.rolled_back_at === null) {
      await client.query(
        'UPDATE _prisma_migrations SET rolled_back_at = NOW() WHERE migration_name = $1 AND finished_at IS NULL AND rolled_back_at IS NULL',
        [FAILED_MIGRATION_NAME]
      );
      console.warn(`Migration repair: marked ${FAILED_MIGRATION_NAME} as rolled back`);
    } else {
      console.log('Migration repair: migration is not in a failed state; skipping');
    }
  } catch (error) {
    console.error('Migration repair: failed', {
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

main();
