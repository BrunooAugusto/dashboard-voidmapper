-- ═══════════════════════════════════════════════════════════════════════════
--  VoidMapper — ADMIN_SETUP.sql
--  Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Garantir colunas necessárias em profiles ──────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role    TEXT        NOT NULL DEFAULT 'visualizador';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status      TEXT        NOT NULL DEFAULT 'ativo';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- ── 2. Sincronizar email de auth.users → profiles ────────────────────────────
UPDATE profiles p
SET    email = u.email
FROM   auth.users u
WHERE  p.id = u.id
  AND  (p.email IS NULL OR p.email = '');

-- ── 3. Criar profiles para usuários que não têm (auth.users sem profile) ─────
INSERT INTO profiles (id, name, email, role, initials, profile_complete, app_role, status)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  'Usuário',
  UPPER(LEFT(COALESCE(u.raw_user_meta_data->>'name', u.email), 2)),
  false,
  'visualizador',
  'ativo'
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ── 4. Habilitar RLS na tabela profiles ──────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ── 5. Remover políticas antigas (evita conflitos) ───────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"       ON profiles;
DROP POLICY IF EXISTS "profiles_admin_select"     ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"       ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update"     ON profiles;
DROP POLICY IF EXISTS "profiles_select_all_auth"  ON profiles;

-- ── 6. Políticas RLS ─────────────────────────────────────────────────────────

-- Qualquer autenticado lê todos os profiles
-- (dados não-sensíveis; necessário para o painel admin funcionar)
CREATE POLICY "profiles_select_all_auth" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Usuário edita apenas o próprio profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Admin edita qualquer profile (para alterar app_role de outros usuários)
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR (
      SELECT app_role FROM profiles
      WHERE  id = auth.uid()
      LIMIT  1
    ) = 'admin'
  );

-- ── 7. Definir Administrador ─────────────────────────────────────────────────

-- Opção A — pelo email na tabela profiles (após sincronização acima):
UPDATE profiles
SET    app_role = 'admin',
       status   = 'ativo'
WHERE  email = 'baoliveira@aga.gold';

-- Opção B — pelo email em auth.users (mais confiável se profiles.email estiver vazio):
UPDATE profiles
SET    app_role = 'admin',
       status   = 'ativo'
WHERE  id = (
  SELECT id FROM auth.users WHERE email = 'baoliveira@aga.gold'
);

-- Para adicionar outros admins:
-- UPDATE profiles SET app_role = 'admin' WHERE email = 'outro@email.com';

-- ── 8. Verificação ───────────────────────────────────────────────────────────
SELECT id, email, app_role, status FROM profiles ORDER BY created_at;

-- ── Roles disponíveis ────────────────────────────────────────────────────────
-- admin        → Administrador — acesso total, gerencia usuários
-- gestor       → Supervisor    — cria/edita projetos, monitoring, relatórios
-- editor       → Operador      — cria levantamentos, imagens, status
-- visualizador → Visualizador  — somente leitura (padrão)