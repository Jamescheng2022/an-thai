-- ==============================================================================
-- AN-THAI AI Living Website V5.4 – Multi-Tenant Postgres / Supabase Schema & RLS
-- ==============================================================================
-- Principles:
--   1. Personal identity (auth.users) separated from enterprise workspace memberships.
--      Offboarding revokes workspace_memberships.revoked_at without deleting the
--      personal account or deleting historical audit & business attribution.
--   2. Strict tenant isolation via workspace_id + Row Level Security (RLS) on ALL tables.
--   3. Lite Agent-Native CRM (6 minimal objects) with source_message_id, unknown_fields,
--      and human confirmation flow (candidate -> confirmed -> dismissed).
--   4. AI Content Studio with EXIF-stripped media, template-locked drafts,
--      role-gated approvals (Contributor cannot publish), and immutable revisions.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Workspaces & Separated Employee Memberships
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  site_domain text,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- references auth.users (personal identity)
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('contributor', 'editor', 'publisher', 'admin')),
  revoked_at timestamptz, -- set on offboarding; business data remains in workspace
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- 2. Lite Agent-Native CRM (6 Minimal Structured Objects)
CREATE TABLE IF NOT EXISTS crm_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  country text NOT NULL DEFAULT 'Unknown',
  industry text NOT NULL DEFAULT 'Unknown',
  confidence_status text NOT NULL CHECK (confidence_status IN ('candidate', 'confirmed', 'dismissed')) DEFAULT 'candidate',
  source_message_id text,
  unknown_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES crm_customers(id) ON DELETE SET NULL,
  full_name text NOT NULL DEFAULT 'Unknown',
  role_title text NOT NULL DEFAULT 'Unknown',
  email text NOT NULL DEFAULT 'Unknown',
  phone text NOT NULL DEFAULT 'Unknown',
  confidence_status text NOT NULL CHECK (confidence_status IN ('candidate', 'confirmed', 'dismissed')) DEFAULT 'candidate',
  source_message_id text,
  unknown_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES crm_customers(id) ON DELETE SET NULL,
  service_unit text NOT NULL DEFAULT 'Unknown',
  location text NOT NULL DEFAULT 'Unknown',
  summary text NOT NULL,
  stage text NOT NULL DEFAULT 'new',
  confidence_status text NOT NULL CHECK (confidence_status IN ('candidate', 'confirmed', 'dismissed')) DEFAULT 'candidate',
  source_message_id text,
  unknown_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES crm_customers(id) ON DELETE SET NULL,
  title text NOT NULL,
  location text NOT NULL DEFAULT 'Unknown',
  service_unit text NOT NULL DEFAULT 'Unknown',
  status text NOT NULL DEFAULT 'active',
  confidence_status text NOT NULL CHECK (confidence_status IN ('candidate', 'confirmed', 'dismissed')) DEFAULT 'candidate',
  source_message_id text,
  unknown_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES crm_projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  assignee_user_id uuid,
  due_date date,
  status text NOT NULL CHECK (status IN ('open', 'done', 'blocked')) DEFAULT 'open',
  confidence_status text NOT NULL CHECK (confidence_status IN ('candidate', 'confirmed', 'dismissed')) DEFAULT 'candidate',
  source_message_id text,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES crm_projects(id) ON DELETE SET NULL,
  channel text NOT NULL,
  summary text NOT NULL,
  source_message_id text NOT NULL,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. AI Content Studio (Media, Structured Drafts, Immutable Revisions, Approvals)
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL,
  exif_stripped boolean NOT NULL DEFAULT false,
  photo_rights text NOT NULL CHECK (photo_rights IN ('unknown', 'internal_only', 'client_approved_public')) DEFAULT 'unknown',
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('field_update', 'case_study', 'technical_insight', 'company_news', 'service_faq_suggestion')),
  slug text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'retracted')) DEFAULT 'draft',
  service_tags text[] NOT NULL DEFAULT '{}',
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  locales jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_message_id text,
  canonical_url text,
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  draft_id uuid NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  snapshot_json jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  draft_id uuid NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submit', 'edit', 'approve', 'publish', 'retract', 'rollback')),
  actor_user_id uuid NOT NULL,
  actor_role text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id uuid,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. Row Level Security (RLS) Helper Functions & Comprehensive Policies
-- ==============================================================================

-- Check if current authenticated user is an active member of the workspace
CREATE OR REPLACE FUNCTION is_active_workspace_member(ws_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND revoked_at IS NULL
  );
$$;

-- Get member role within the workspace
CREATE OR REPLACE FUNCTION get_workspace_member_role(ws_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM workspace_memberships
  WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND revoked_at IS NULL
  LIMIT 1;
$$;

-- Enable RLS across ALL tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 4.1 Workspaces Policies
CREATE POLICY ws_select_policy ON workspaces
  FOR SELECT USING (is_active_workspace_member(id));

-- 4.2 Workspace Memberships Policies
CREATE POLICY mem_select_policy ON workspace_memberships
  FOR SELECT USING (is_active_workspace_member(workspace_id));

CREATE POLICY mem_admin_policy ON workspace_memberships
  FOR ALL USING (get_workspace_member_role(workspace_id) = 'admin');

-- 4.3 CRM Objects Policies (Customers, Contacts, Leads, Projects, Tasks, Interactions)
CREATE POLICY crm_cust_select ON crm_customers FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY crm_cust_insert ON crm_customers FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));
CREATE POLICY crm_cust_update ON crm_customers FOR UPDATE USING (is_active_workspace_member(workspace_id));

CREATE POLICY crm_cont_select ON crm_contacts FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY crm_cont_insert ON crm_contacts FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));
CREATE POLICY crm_cont_update ON crm_contacts FOR UPDATE USING (is_active_workspace_member(workspace_id));

CREATE POLICY crm_lead_select ON crm_leads FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY crm_lead_insert ON crm_leads FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));
CREATE POLICY crm_lead_update ON crm_leads FOR UPDATE USING (is_active_workspace_member(workspace_id));

CREATE POLICY crm_proj_select ON crm_projects FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY crm_proj_insert ON crm_projects FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));
CREATE POLICY crm_proj_update ON crm_projects FOR UPDATE USING (is_active_workspace_member(workspace_id));

CREATE POLICY crm_task_select ON crm_tasks FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY crm_task_insert ON crm_tasks FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));
CREATE POLICY crm_task_update ON crm_tasks FOR UPDATE USING (is_active_workspace_member(workspace_id));

CREATE POLICY crm_intr_select ON crm_interactions FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY crm_intr_insert ON crm_interactions FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));

-- 4.4 Media Assets Policies
-- Internal members can view all workspace media; public can view cleared photos
CREATE POLICY media_select ON media_assets
  FOR SELECT USING (is_active_workspace_member(workspace_id) OR photo_rights = 'client_approved_public');

CREATE POLICY media_insert ON media_assets
  FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id) AND exif_stripped = true);

-- 4.5 Content Drafts Policies
-- Public can view published content; members can view all workspace drafts
CREATE POLICY draft_select ON content_drafts
  FOR SELECT USING (is_active_workspace_member(workspace_id) OR status = 'published');

-- Any active member (contributor/editor/publisher) can create a draft
CREATE POLICY draft_insert ON content_drafts
  FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id) AND status = 'draft');

-- Contributors can edit drafts in draft/in_review; ONLY Editor/Publisher/Admin can publish or retract
CREATE POLICY draft_update ON content_drafts
  FOR UPDATE USING (
    is_active_workspace_member(workspace_id) AND (
      (get_workspace_member_role(workspace_id) = 'contributor' AND status IN ('draft', 'in_review')) OR
      (get_workspace_member_role(workspace_id) IN ('editor', 'publisher', 'admin'))
    )
  );

-- 4.6 Content Revisions & Approvals (Immutable Append-Only Audit Trail)
CREATE POLICY rev_select ON content_revisions FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY rev_insert ON content_revisions FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));

CREATE POLICY app_select ON content_approvals FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY app_insert ON content_approvals FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));

-- 4.7 Audit Events Policies (Append-Only)
CREATE POLICY audit_select ON audit_events FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY audit_insert ON audit_events FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));
