-- ═══════════════════════════════════════════════════════════════════════════
--  VoidMapper — Auditoria & Permissões  (execute no Supabase SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Adicionar colunas na tabela profiles ──────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role   TEXT        NOT NULL DEFAULT 'visualizador';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Preencher email para usuários existentes (requer service_role ou acesso a auth.users)
UPDATE profiles p
SET    email = u.email
FROM   auth.users u
WHERE  p.id = u.id
  AND  p.email IS NULL;

-- ── 2. Criar tabela audit_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name   TEXT,
  user_email  TEXT,
  action      TEXT         NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  entity_name TEXT,
  project_id  TEXT,
  old_value   JSONB,
  new_value   JSONB,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_audit_project_id  ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id     ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action      ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON audit_logs(entity_type);

-- ── 3. Row Level Security — audit_logs ──────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_insert"       ON audit_logs;
DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;

-- Qualquer usuário autenticado pode inserir
CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Apenas admin e gestor podem ler
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE  profiles.id       = auth.uid()
        AND  profiles.app_role IN ('admin', 'gestor')
    )
  );

-- ── 4. Row Level Security — profiles ────────────────────────────────────────
-- (Se profiles ainda não tem RLS habilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"    ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update"  ON profiles;
DROP POLICY IF EXISTS "profiles_admin_select"  ON profiles;

-- Todo usuário vê o próprio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admin vê todos
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE  p.id       = auth.uid()
        AND  p.app_role = 'admin'
    )
  );

-- Usuário atualiza o próprio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Admin pode atualizar qualquer perfil (incluindo app_role)
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE  p.id       = auth.uid()
        AND  p.app_role = 'admin'
    )
  );

-- ── 5. Definir o primeiro admin ──────────────────────────────────────────────
-- Execute após criar a conta. Substitua pelo email do administrador:
UPDATE profiles
SET    app_role = 'admin'
WHERE  id = (
  SELECT id FROM auth.users WHERE email = 'brunooaugusto.work@gmail.com'
);

-- ── MANUAL: Para definir qualquer usuário como admin ────────────────────────
-- UPDATE profiles SET app_role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'email@dominio.com');

-- ── Roles disponíveis ────────────────────────────────────────────────────────
-- admin        → acesso total, gerencia usuários
-- gestor       → cria/edita projetos, levantamentos, relatórios, vê histórico
-- editor       → cria/edita levantamentos e imagens
-- visualizador → somente leitura (padrão para novos usuários)