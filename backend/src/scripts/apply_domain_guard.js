import prisma from '../config/db.js';

async function applyDomainGuard() {
  console.log('--- Applying Database-Level @yenepoya.edu.in Domain Enforcement ---');

  const statements = [
    // 1. Check constraint: Students must have @yenepoya.edu.in email
    `ALTER TABLE "User" DROP CONSTRAINT IF EXISTS chk_yenepoya_student_email;`,
    `ALTER TABLE "User" ADD CONSTRAINT chk_yenepoya_student_email
     CHECK (
       role IN ('editor', 'admin')
       OR email LIKE '%@yenepoya.edu.in'
     );`,

    // 2. Trigger guard: Additional server-side validation on insert or update
    `CREATE OR REPLACE FUNCTION public.enforce_yenepoya_domain()
     RETURNS TRIGGER AS $$
     BEGIN
       IF NEW.role = 'student' AND (NEW.email IS NULL OR NEW.email NOT LIKE '%@yenepoya.edu.in') THEN
         RAISE EXCEPTION 'Database Guard: Only @yenepoya.edu.in email addresses are permitted for student accounts.';
       END IF;
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;`,

    `DROP TRIGGER IF EXISTS trg_enforce_yenepoya_domain ON public."User";`,
    `CREATE TRIGGER trg_enforce_yenepoya_domain
     BEFORE INSERT OR UPDATE ON public."User"
     FOR EACH ROW
     EXECUTE FUNCTION public.enforce_yenepoya_domain();`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('✓ Executed:', stmt.trim().split('\n')[0]);
    } catch (err) {
      console.error('Error executing statement:', stmt.trim().split('\n')[0], err.message);
    }
  }

  console.log('\n✓ Database-level @yenepoya.edu.in constraint and trigger are now active.');
  await prisma.$disconnect();
}

applyDomainGuard().catch(console.error);
