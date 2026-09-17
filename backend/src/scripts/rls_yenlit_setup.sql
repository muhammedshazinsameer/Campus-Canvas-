-- ==============================================================================
-- Yenlit / Campus Canvas: Complete Row Level Security (RLS) & Role Setup Script
-- ==============================================================================

-- 1. Ensure RLS is enabled on all core tables
ALTER TABLE public."Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SubmissionTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if current session belongs to an editor or superuser
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
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
$$;

-- 3. REPORT POLICIES (Only editors can view, insert, update, or delete moderation reports)
DROP POLICY IF EXISTS "Editors can view reports" ON public."Report";
DROP POLICY IF EXISTS "Editors can insert reports" ON public."Report";
DROP POLICY IF EXISTS "Editors can update reports" ON public."Report";
DROP POLICY IF EXISTS "Editors can delete reports" ON public."Report";

CREATE POLICY "Editors can view reports"
  ON public."Report" FOR SELECT
  TO authenticated
  USING (public.is_editor_or_admin());

CREATE POLICY "Editors can insert reports"
  ON public."Report" FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can update reports"
  ON public."Report" FOR UPDATE
  TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can delete reports"
  ON public."Report" FOR DELETE
  TO authenticated
  USING (public.is_editor_or_admin());

-- 4. SUBMISSION POLICIES (Public/authenticated can view published works; only editors can modify)
DROP POLICY IF EXISTS "Public can view approved submissions" ON public."Submission";
DROP POLICY IF EXISTS "Editors can view all submissions" ON public."Submission";
DROP POLICY IF EXISTS "Editors can insert submissions" ON public."Submission";
DROP POLICY IF EXISTS "Editors can update submissions" ON public."Submission";
DROP POLICY IF EXISTS "Editors can delete submissions" ON public."Submission";

CREATE POLICY "Public can view approved submissions"
  ON public."Submission" FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY "Editors can view all submissions"
  ON public."Submission" FOR SELECT
  TO authenticated
  USING (public.is_editor_or_admin());

CREATE POLICY "Editors can insert submissions"
  ON public."Submission" FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can update submissions"
  ON public."Submission" FOR UPDATE
  TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can delete submissions"
  ON public."Submission" FOR DELETE
  TO authenticated
  USING (public.is_editor_or_admin());

-- 5. TAG POLICIES (Public can view tags; only editors can insert, update, delete tags)
DROP POLICY IF EXISTS "Public can view tags" ON public."Tag";
DROP POLICY IF EXISTS "Editors can insert tags" ON public."Tag";
DROP POLICY IF EXISTS "Editors can update tags" ON public."Tag";
DROP POLICY IF EXISTS "Editors can delete tags" ON public."Tag";

CREATE POLICY "Public can view tags"
  ON public."Tag" FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Editors can insert tags"
  ON public."Tag" FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can update tags"
  ON public."Tag" FOR UPDATE
  TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can delete tags"
  ON public."Tag" FOR DELETE
  TO authenticated
  USING (public.is_editor_or_admin());

-- 6. SUBMISSION TAG POLICIES (Public can view; only editors can modify)
DROP POLICY IF EXISTS "Public can view submission tags" ON public."SubmissionTag";
DROP POLICY IF EXISTS "Editors can insert submission tags" ON public."SubmissionTag";
DROP POLICY IF EXISTS "Editors can update submission tags" ON public."SubmissionTag";
DROP POLICY IF EXISTS "Editors can delete submission tags" ON public."SubmissionTag";

CREATE POLICY "Public can view submission tags"
  ON public."SubmissionTag" FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Editors can insert submission tags"
  ON public."SubmissionTag" FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can update submission tags"
  ON public."SubmissionTag" FOR UPDATE
  TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors can delete submission tags"
  ON public."SubmissionTag" FOR DELETE
  TO authenticated
  USING (public.is_editor_or_admin());
