import prisma from '../config/db.js';

async function applyRls() {
  console.log('Applying Supabase Row Level Security (RLS) policies...');

  const sqlStatements = [
    // 1. Enable RLS on tables
    `ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;`,

    // 2. Drop existing policies for clean idempotency
    `DROP POLICY IF EXISTS "Public users can view profiles" ON "User";`,
    `DROP POLICY IF EXISTS "Users can update own profile" ON "User";`,
    `DROP POLICY IF EXISTS "Users can insert own profile" ON "User";`,

    `DROP POLICY IF EXISTS "Public can view approved submissions" ON "Submission";`,
    `DROP POLICY IF EXISTS "Students can view own submissions" ON "Submission";`,
    `DROP POLICY IF EXISTS "Students can create own submissions" ON "Submission";`,
    `DROP POLICY IF EXISTS "Editors can manage all submissions" ON "Submission";`,

    // 3. User Table Policies:
    // Allow public reading of user profiles
    `CREATE POLICY "Public users can view profiles"
     ON "User"
     FOR SELECT
     TO public
     USING (true);`,

    // Allow user to insert their own profile matching Supabase auth.uid()
    `CREATE POLICY "Users can insert own profile"
     ON "User"
     FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid()::text = id::text);`,

    // Allow user to update their own profile matching Supabase auth.uid()
    `CREATE POLICY "Users can update own profile"
     ON "User"
     FOR UPDATE
     TO authenticated
     USING (auth.uid()::text = id::text)
     WITH CHECK (auth.uid()::text = id::text);`,

    // 4. Submission Table Policies:
    // Anyone can view approved submissions
    `CREATE POLICY "Public can view approved submissions"
     ON "Submission"
     FOR SELECT
     TO public
     USING (status = 'approved');`,

    // Students can view their own submissions (even if pending or rejected)
    `CREATE POLICY "Students can view own submissions"
     ON "Submission"
     FOR SELECT
     TO authenticated
     USING (auth.uid()::text = "authorId"::text);`,

    // Authenticated students can create submissions under their own auth.uid()
    `CREATE POLICY "Students can create own submissions"
     ON "Submission"
     FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid()::text = "authorId"::text);`,

    // Editors can view, review, and manage all submissions
    `CREATE POLICY "Editors can manage all submissions"
     ON "Submission"
     FOR ALL
     TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM "User"
         WHERE "User".id::text = auth.uid()::text
           AND "User".role = 'editor'
       )
     );`
  ];

  for (const sql of sqlStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✓ Executed:', sql.split('\n')[0]);
    } catch (err) {
      console.error('Error executing statement:', sql.split('\n')[0], err.message);
    }
  }

  // Verify RLS status
  const policies = await prisma.$queryRawUnsafe(`
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  console.log('\n--- Active Supabase RLS Policies ---');
  console.table(policies);

  await prisma.$disconnect();
}

applyRls().catch(console.error);
