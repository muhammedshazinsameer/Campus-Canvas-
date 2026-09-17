import prisma from '../config/db.js';

async function applyCompleteRls() {
  console.log('--- Applying Complete Supabase Row Level Security (RLS) Policies ---');

  const statements = [
    // 1. Enable RLS on all 4 tables
    `ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "SubmissionTag" ENABLE ROW LEVEL SECURITY;`,

    // 2. Helper function
    `CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
     RETURNS boolean
     LANGUAGE sql
     SECURITY DEFINER
     STABLE
     AS $$
       SELECT (
         current_user IN ('postgres', 'service_role')
         OR (auth.uid() IS NOT NULL AND EXISTS (
           SELECT 1 FROM public."User"
           WHERE id::text = auth.uid()::text
             AND role IN ('editor', 'admin')
         ))
       );
     $$;`,

    // 3. User Table Policies
    `DROP POLICY IF EXISTS "Public users can view profiles" ON "User";`,
    `DROP POLICY IF EXISTS "Users can view own profile" ON "User";`,
    `CREATE POLICY "Users can view own profile"
     ON "User"
     FOR SELECT
     TO authenticated
     USING (
       id::text = auth.uid()::text 
       OR public.is_editor_or_admin()
     );`,

    `DROP POLICY IF EXISTS "Users can insert own profile" ON "User";`,
    `CREATE POLICY "Users can insert own profile"
     ON "User"
     FOR INSERT
     TO authenticated
     WITH CHECK (
       id::text = auth.uid()::text
       AND (role = 'student' OR public.is_editor_or_admin())
     );`,

    `DROP POLICY IF EXISTS "Users can update own profile" ON "User";`,
    `CREATE POLICY "Users can update own profile"
     ON "User"
     FOR UPDATE
     TO authenticated
     USING (
       id::text = auth.uid()::text 
       OR public.is_editor_or_admin()
     )
     WITH CHECK (
       (id::text = auth.uid()::text OR public.is_editor_or_admin())
       AND (
         public.is_editor_or_admin()
         OR role = (SELECT u.role FROM public."User" u WHERE u.id::text = auth.uid()::text)
       )
     );`,

    // 4. Role protection trigger on User table
    `CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
     RETURNS TRIGGER AS $$
     BEGIN
       IF NEW.role IS DISTINCT FROM OLD.role THEN
         IF NOT public.is_editor_or_admin() THEN
           RAISE EXCEPTION 'Access Denied: Only editors and administrators can change account roles.';
         END IF;
       END IF;
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    `DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public."User";`,
    `CREATE TRIGGER trg_prevent_role_escalation
     BEFORE UPDATE ON public."User"
     FOR EACH ROW
     EXECUTE FUNCTION public.prevent_self_role_escalation();`,

    // 5. Submission Table Policies
    `DROP POLICY IF EXISTS "Public can view approved submissions" ON "Submission";`,
    `CREATE POLICY "Public can view approved submissions"
     ON "Submission"
     FOR SELECT
     TO public
     USING (status = 'approved');`,

    `DROP POLICY IF EXISTS "Students can view own submissions" ON "Submission";`,
    `DROP POLICY IF EXISTS "Authors can view own submissions" ON "Submission";`,
    `CREATE POLICY "Authors can view own submissions"
     ON "Submission"
     FOR SELECT
     TO authenticated
     USING ("authorId"::text = auth.uid()::text);`,

    `DROP POLICY IF EXISTS "Editors can manage all submissions" ON "Submission";`,
    `DROP POLICY IF EXISTS "Editors can view all submissions" ON "Submission";`,
    `CREATE POLICY "Editors can view all submissions"
     ON "Submission"
     FOR SELECT
     TO authenticated
     USING (public.is_editor_or_admin());`,

    `DROP POLICY IF EXISTS "Students can create own submissions" ON "Submission";`,
    `DROP POLICY IF EXISTS "Authors can insert own submissions" ON "Submission";`,
    `CREATE POLICY "Authors can insert own submissions"
     ON "Submission"
     FOR INSERT
     TO authenticated
     WITH CHECK (
       "authorId"::text = auth.uid()::text
       AND (status = 'pending' OR public.is_editor_or_admin())
     );`,

    `DROP POLICY IF EXISTS "Authors can update own submissions" ON "Submission";`,
    `CREATE POLICY "Authors can update own submissions"
     ON "Submission"
     FOR UPDATE
     TO authenticated
     USING (
       "authorId"::text = auth.uid()::text 
       OR public.is_editor_or_admin()
     )
     WITH CHECK (
       public.is_editor_or_admin()
       OR (
         "authorId"::text = auth.uid()::text
         AND status = (SELECT s.status FROM public."Submission" s WHERE s.id = "Submission".id)
       )
     );`,

    `DROP POLICY IF EXISTS "Authors can delete own submissions" ON "Submission";`,
    `CREATE POLICY "Authors can delete own submissions"
     ON "Submission"
     FOR DELETE
     TO authenticated
     USING (
       "authorId"::text = auth.uid()::text 
       OR public.is_editor_or_admin()
     );`,

    // 6. Submission status & editorComment guard trigger
    `CREATE OR REPLACE FUNCTION public.check_submission_status_change()
     RETURNS TRIGGER AS $$
     BEGIN
       IF (NEW.status IS DISTINCT FROM OLD.status OR NEW."editorComment" IS DISTINCT FROM OLD."editorComment") THEN
         IF NOT public.is_editor_or_admin() THEN
           RAISE EXCEPTION 'Access Denied: Only editors and administrators can approve, reject, or comment on submissions.';
         END IF;
       END IF;
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    `DROP TRIGGER IF EXISTS trg_submission_status_guard ON public."Submission";`,
    `CREATE TRIGGER trg_submission_status_guard
     BEFORE UPDATE ON public."Submission"
     FOR EACH ROW
     EXECUTE FUNCTION public.check_submission_status_change();`,

    // 7. Tag and SubmissionTag Policies
    `DROP POLICY IF EXISTS "Public can view tags" ON "Tag";`,
    `CREATE POLICY "Public can view tags"
     ON "Tag"
     FOR SELECT
     TO public
     USING (true);`,

    `DROP POLICY IF EXISTS "Public can view submission tags" ON "SubmissionTag";`,
    `CREATE POLICY "Public can view submission tags"
     ON "SubmissionTag"
     FOR SELECT
     TO public
     USING (true);`,

    `DROP POLICY IF EXISTS "Authenticated users can create tags" ON "Tag";`,
    `CREATE POLICY "Authenticated users can create tags"
     ON "Tag"
     FOR INSERT
     TO authenticated
     WITH CHECK (true);`,

    `DROP POLICY IF EXISTS "Authors can link tags to own submissions" ON "SubmissionTag";`,
    `CREATE POLICY "Authors can link tags to own submissions"
     ON "SubmissionTag"
     FOR INSERT
     TO authenticated
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM public."Submission" s
         WHERE s.id = "SubmissionTag"."submissionId"
           AND s."authorId"::text = auth.uid()::text
       )
       OR public.is_editor_or_admin()
     );`,

    `DROP POLICY IF EXISTS "Authors can unlink tags from own submissions" ON "SubmissionTag";`,
    `CREATE POLICY "Authors can unlink tags from own submissions"
     ON "SubmissionTag"
     FOR DELETE
     TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public."Submission" s
         WHERE s.id = "SubmissionTag"."submissionId"
           AND s."authorId"::text = auth.uid()::text
       )
       OR public.is_editor_or_admin()
     );`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('✓ Executed:', stmt.trim().split('\n')[0]);
    } catch (err) {
      console.error('Error executing:', stmt.trim().split('\n')[0], err.message);
    }
  }

  // Verify all policies
  const activePolicies = await prisma.$queryRawUnsafe(`
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  console.log('\n--- Active Supabase RLS Policies on Public Tables ---');
  console.table(activePolicies);

  await prisma.$disconnect();
}

applyCompleteRls().catch(console.error);
