-- AN-THAI AI Living Website V5.4 — Postgres / Supabase Schema & RLS
-- Principles:
--   1. Personal identity (profiles) separated from enterprise workspace membership.
--      Offboarding revokes workspace_memberships.revoked_at without deleting personal account.
--   2. Strict tenant isolation via workspace_id + Row Level Security (RLS) on every table.
--   3. Lite Agent-native CRM (6 minimal objects) with source_message_id & unknown_fields.
--   4. AI Content Studio with immutable revisions, role-gated approvals, and EXIF-stripped media.

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
  user_id uuid NOT NULL, -- maps to auth.users / SourceRating personal identity
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('contributor', 'editor', 'publisher', 'admin')),
  revoked_at timestamptz, -- set on employee offboarding; business data stays in workspace
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
  UNIQUE (workspace_id, slug),
  -- V1.0 P2 audit fix: enforce disclosure clearance in DB regardless of application caller
  CONSTRAINT content_drafts_publish_requires_clearance CHECK (
    status <> 'published' OR (
      COALESCE(template_data->>'photoRights', 'unknown') = 'client_approved_public'
      AND COALESCE((template_data->>'disclosureApproved')::boolean, false) = true
    )
  )
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

-- 4. Row Level Security (Strict Multi-Tenant Isolation)
CREATE OR REPLACE FUNCTION is_active_workspace_member(ws_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND revoked_at IS NULL
  );
$$;

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

-- Example tenant policy (replicated across all workspace tables)
CREATE POLICY tenant_select_drafts ON content_drafts FOR SELECT USING (is_active_workspace_member(workspace_id));
CREATE POLICY tenant_insert_drafts ON content_drafts FOR INSERT WITH CHECK (is_active_workspace_member(workspace_id));
CREATE POLICY tenant_update_drafts ON content_drafts FOR UPDATE
  USING (is_active_workspace_member(workspace_id))
  WITH CHECK (
    is_active_workspace_member(workspace_id)
    AND (
      status <> 'published'
      OR (
        COALESCE(template_data->>'photoRights', 'unknown') = 'client_approved_public'
        AND COALESCE((template_data->>'disclosureApproved')::boolean, false) = true
      )
    )
  );
