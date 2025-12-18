const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('Legacy user migration: DATABASE_URL not set; skipping');
    return;
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const legacyExists = await client.query('SELECT to_regclass($1) AS reg', ['"User"']);
    const newExists = await client.query('SELECT to_regclass($1) AS reg', ['users']);

    const hasLegacy = Boolean(legacyExists.rows[0] && legacyExists.rows[0].reg);
    const hasNew = Boolean(newExists.rows[0] && newExists.rows[0].reg);

    if (!hasLegacy || !hasNew) {
      console.log('Legacy user migration: required tables not present; skipping', {
        hasLegacy,
        hasNew
      });
      return;
    }

    const legacyCount = await client.query('SELECT COUNT(*)::int AS c FROM "User"');
    const newCount = await client.query('SELECT COUNT(*)::int AS c FROM users');

    const legacyUsers = legacyCount.rows[0]?.c ?? 0;
    const newUsers = newCount.rows[0]?.c ?? 0;

    if (legacyUsers === 0) {
      console.log('Legacy user migration: no legacy users to migrate; skipping');
      return;
    }

    // Only migrate if it looks like the new table is missing data.
    if (newUsers >= legacyUsers) {
      console.log('Legacy user migration: new users table already populated; skipping', {
        legacyUsers,
        newUsers
      });
      return;
    }

    const insert = await client.query(`
      INSERT INTO users (id, email, password, name, role, phone, "isActive", "createdAt", "updatedAt")
      SELECT
        u.id,
        u.email,
        u.password,
        u.name,
        (u.role::text)::"Role" AS role,
        u.phone,
        u."isActive",
        u."createdAt",
        u."updatedAt"
      FROM "User" u
      WHERE NOT EXISTS (SELECT 1 FROM users nu WHERE nu.email = u.email)
    `);

    console.warn('Legacy user migration: completed', {
      legacyUsers,
      newUsers,
      inserted: insert.rowCount
    });
  } catch (error) {
    console.error('Legacy user migration: failed', {
      message: error && error.message,
      stack: error && error.stack
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
