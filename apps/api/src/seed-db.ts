import { Pool } from 'pg';
import { demoLead, demoProject, demoStaff, demoUser, venues, catalog } from './seed';
import { RulesService } from './rules.service';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query('SELECT 1');
    const rules = new RulesService();

    for (const v of venues) {
      await pool.query(
        'INSERT INTO venue_types(id,payload,active) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,active=EXCLUDED.active',
        [v.id, v, v.active]
      );
    }
    for (const i of catalog) {
      await pool.query(
        'INSERT INTO catalog_items(id,kind,payload,active) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET kind=EXCLUDED.kind,payload=EXCLUDED.payload,active=EXCLUDED.active',
        [i.id, i.kind, i, i.active]
      );
    }

    await pool.query(
      'INSERT INTO user_accounts(id,phone,payload,created_at) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload',
      [demoUser.id, demoUser.phone, demoUser, demoUser.createdAt]
    );

    const diagnosed = rules.diagnose(demoProject, catalog);
    await pool.query(
      'INSERT INTO projects(id,customer_id,payload,status,consultant_id,version,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,status=EXCLUDED.status,consultant_id=EXCLUDED.consultant_id,version=EXCLUDED.version,updated_at=EXCLUDED.updated_at',
      [diagnosed.id, diagnosed.customerId, diagnosed, diagnosed.status, diagnosed.consultantId || null, diagnosed.version, diagnosed.createdAt, diagnosed.updatedAt]
    );

    await pool.query(
      'INSERT INTO leads(id,user_id,project_id,payload,status,assigned_consultant_id,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,status=EXCLUDED.status,assigned_consultant_id=EXCLUDED.assigned_consultant_id,updated_at=EXCLUDED.updated_at',
      [demoLead.id, demoLead.userId, demoLead.projectId || null, demoLead, demoLead.status, demoLead.assignedConsultantId || null, demoLead.createdAt, demoLead.updatedAt]
    );

    for (const s of demoStaff) {
      await pool.query(
        'INSERT INTO staff_accounts(id,email,password_hash,name,role,title,phone,referral_code,active,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role=EXCLUDED.role,title=EXCLUDED.title,phone=EXCLUDED.phone,referral_code=EXCLUDED.referral_code,active=EXCLUDED.active',
        [s.id, s.email, s.passwordHash, s.name, s.role, s.title, s.phone, s.referralCode || null, s.active, s.createdAt]
      );
    }

    console.log('Seed completed');
  } finally {
    await pool.end();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
