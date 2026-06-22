
-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'observer');
CREATE TYPE public.task_status AS ENUM ('Pending', 'InProgress', 'Completed', 'Failed');
CREATE TYPE public.task_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE public.hypothesis_status AS ENUM ('Draft', 'Validated', 'Rejected');
CREATE TYPE public.transformation_status AS ENUM ('Pending', 'Signed', 'Committed', 'Reverted');
CREATE TYPE public.log_level AS ENUM ('info', 'warn', 'error', 'success', 'debug');

-- =========== updated_at helper ===========
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operator') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- =========== USER ROLES ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_read_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- new-user trigger (after user_roles exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== TASKS (L6) ===========
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'Pending',
  priority public.task_priority NOT NULL DEFAULT 'Medium',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  federation_node TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_read_all" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert_auth" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "tasks_update_owner_or_admin" ON public.tasks FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tasks_delete_owner_or_admin" ON public.tasks FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tasks_set_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========== HYPOTHESES (L7) ===========
CREATE TABLE public.hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement TEXT NOT NULL,
  context TEXT,
  novelty_score NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (novelty_score >= 0 AND novelty_score <= 1),
  status public.hypothesis_status NOT NULL DEFAULT 'Draft',
  parent_id UUID REFERENCES public.hypotheses(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hypotheses TO authenticated;
GRANT ALL ON public.hypotheses TO service_role;
ALTER TABLE public.hypotheses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hyp_read_all" ON public.hypotheses FOR SELECT TO authenticated USING (true);
CREATE POLICY "hyp_insert_auth" ON public.hypotheses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "hyp_update_owner_or_admin" ON public.hypotheses FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "hyp_delete_owner_or_admin" ON public.hypotheses FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER hyp_set_updated BEFORE UPDATE ON public.hypotheses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========== TRANSFORMATIONS (L8) — RealityBlock ledger ===========
CREATE TABLE public.transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_index BIGSERIAL UNIQUE NOT NULL,
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  proof_artifact TEXT,
  status public.transformation_status NOT NULL DEFAULT 'Pending',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transformations TO authenticated;
GRANT ALL ON public.transformations TO service_role;
ALTER TABLE public.transformations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tr_read_all" ON public.transformations FOR SELECT TO authenticated USING (true);
CREATE POLICY "tr_insert_auth" ON public.transformations FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "tr_update_admin" ON public.transformations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tr_delete_admin" ON public.transformations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========== METRICS (L9) ===========
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cci NUMERIC(5,4) NOT NULL,
  stability NUMERIC(5,4) NOT NULL,
  risk_profile NUMERIC(5,4) NOT NULL,
  black_swan NUMERIC(5,4) NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.metrics TO authenticated;
GRANT ALL ON public.metrics TO service_role;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metrics_read_all" ON public.metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "metrics_insert_auth" ON public.metrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_metrics_recorded_at ON public.metrics (recorded_at DESC);

-- =========== LOGS ===========
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level public.log_level NOT NULL DEFAULT 'info',
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.logs TO authenticated;
GRANT ALL ON public.logs TO service_role;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_read_all" ON public.logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "logs_insert_auth" ON public.logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_logs_created_at ON public.logs (created_at DESC);

-- =========== REALTIME ===========
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hypotheses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transformations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
