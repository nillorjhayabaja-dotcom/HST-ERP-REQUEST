
-- ============================================================
-- HST ENTERPRISE PORTAL - FOUNDATION SCHEMA
-- ============================================================

-- Enums
CREATE TYPE public.app_role AS ENUM (
  'administrator', 'hr', 'security', 'engineering', 'qa', 'production',
  'warehouse', 'purchasing', 'accounting', 'maintenance',
  'department_head', 'employee', 'executive', 'it_administrator'
);

CREATE TYPE public.approval_status AS ENUM (
  'draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed'
);

CREATE TYPE public.notification_type AS ENUM (
  'info', 'success', 'warning', 'error', 'approval', 'system'
);

-- Reusable updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_departments_updated BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- POSITIONS
-- ============================================================
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_positions_updated BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- PROFILES  (1:1 with auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_no TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''))
  ) STORED,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employment_status TEXT NOT NULL DEFAULT 'active',
  date_hired DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- USER ROLES (separate table — never on profiles)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security-definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('administrator','it_administrator')
  );
$$;

-- ============================================================
-- PERMISSIONS  (module + action, e.g. gate_pass.approve)
-- ============================================================
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module, action)
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE (role, permission_id)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _module TEXT, _action TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.module = _module AND p.action = _action
  ) OR public.is_admin(_user_id);
$$;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  module TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUDIT LOGS (append only)
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX ix_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX ix_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- APPROVAL ENGINE
-- ============================================================
CREATE TABLE public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_workflows TO authenticated;
GRANT ALL ON public.approval_workflows TO service_role;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_workflows_updated BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.approval_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  name TEXT NOT NULL,
  approver_role public.app_role,
  approver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (workflow_id, step_order)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_workflow_steps TO authenticated;
GRANT ALL ON public.approval_workflow_steps TO service_role;
ALTER TABLE public.approval_workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE SET NULL,
  current_step INT NOT NULL DEFAULT 1,
  status public.approval_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX ix_approval_requests_status ON public.approval_requests(status, module);
CREATE INDEX ix_approval_requests_entity ON public.approval_requests(entity_type, entity_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_appreq_updated BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  action TEXT NOT NULL, -- approved | rejected | commented
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.approval_actions TO authenticated;
GRANT ALL ON public.approval_actions TO service_role;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CONTROL NUMBER SETTINGS
-- ============================================================
CREATE TABLE public.control_number_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM now())::INT,
  padding INT NOT NULL DEFAULT 6,
  next_sequence BIGINT NOT NULL DEFAULT 1,
  format_template TEXT NOT NULL DEFAULT '{PREFIX}-{YEAR}-{SEQ}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT ON public.control_number_settings TO authenticated;
GRANT ALL ON public.control_number_settings TO service_role;
ALTER TABLE public.control_number_settings ENABLE ROW LEVEL SECURITY;

-- Atomic control number generator
CREATE OR REPLACE FUNCTION public.next_control_number(_module TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.control_number_settings%ROWTYPE;
  current_year INT := EXTRACT(YEAR FROM now())::INT;
BEGIN
  SELECT * INTO s FROM public.control_number_settings WHERE module = _module FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No control number configured for module %', _module;
  END IF;
  IF s.year <> current_year THEN
    UPDATE public.control_number_settings SET year = current_year, next_sequence = 2, updated_at = now()
      WHERE module = _module
      RETURNING * INTO s;
    RETURN replace(replace(replace(s.format_template,'{PREFIX}',s.prefix),'{YEAR}',current_year::text),'{SEQ}', lpad('1', s.padding, '0'));
  END IF;
  UPDATE public.control_number_settings SET next_sequence = next_sequence + 1, updated_at = now()
    WHERE module = _module
    RETURNING * INTO s;
  RETURN replace(replace(replace(s.format_template,'{PREFIX}',s.prefix),'{YEAR}',s.year::text),'{SEQ}', lpad((s.next_sequence-1)::text, s.padding, '0'));
END; $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- departments / positions: read for authenticated, write for admin
CREATE POLICY "read departments" ON public.departments FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin write departments" ON public.departments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "read positions" ON public.positions FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin write positions" ON public.positions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- profiles: read all, self-update, admin/HR update all
CREATE POLICY "read profiles" ON public.profiles FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "admin delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- user_roles: read own, admin manage
CREATE POLICY "read own roles or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- permissions / role_permissions: read for all authed
CREATE POLICY "read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- notifications: user owns
CREATE POLICY "read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- audit_logs: read all authed, append only (no update/delete policies)
CREATE POLICY "read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- approval_workflows / steps: read all, admin write
CREATE POLICY "read workflows" ON public.approval_workflows FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin write workflows" ON public.approval_workflows FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read workflow_steps" ON public.approval_workflow_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write workflow_steps" ON public.approval_workflow_steps FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- approval_requests: read if involved, insert own, update via server functions (admin covers manual overrides)
CREATE POLICY "read approval_requests" ON public.approval_requests FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (requested_by = auth.uid() OR public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.approval_workflow_steps s
    WHERE s.workflow_id = approval_requests.workflow_id
      AND (s.approver_user_id = auth.uid() OR public.has_role(auth.uid(), s.approver_role))
  )));
CREATE POLICY "insert own approval_requests" ON public.approval_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "admin update approval_requests" ON public.approval_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "read approval_actions" ON public.approval_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert approval_actions" ON public.approval_actions FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- control_number_settings: read for all, admin write
CREATE POLICY "read control_numbers" ON public.control_number_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write control_numbers" ON public.control_number_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- AUTO PROFILE + FIRST-USER ADMIN
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) = 0 INTO is_first FROM public.user_roles;
  IF is_first THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'administrator');
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'it_administrator');
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'employee')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED: default departments, control numbers, workflow
-- ============================================================
INSERT INTO public.departments (code, name) VALUES
  ('EXEC','Executive'),('HR','Human Resources'),('IT','Information Technology'),
  ('PROD','Production'),('QA','Quality Assurance'),('ENG','Engineering'),
  ('WHS','Warehouse'),('PUR','Purchasing'),('ACCT','Accounting'),
  ('MAINT','Maintenance'),('SEC','Security')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.control_number_settings (module, prefix, padding) VALUES
  ('gate_pass','GP',6),
  ('mrf','MRF',6),
  ('purchase_request','PR',6),
  ('visitor','VIS',6),
  ('leave','LV',6),
  ('asset_borrow','AB',6),
  ('vehicle_trip','VT',6)
ON CONFLICT (module) DO NOTHING;
