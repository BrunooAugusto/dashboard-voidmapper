-- ============================================================
-- Pastas de organização visual para projetos
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- Não altera nenhum dado existente — apenas cria a tabela nova
-- e uma coluna nullable em `projects`.
-- ============================================================

create table if not exists project_folders (
  id         serial      primary key,
  name       text        not null,
  created_by uuid        references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cada projeto pertence a no máximo uma pasta (puramente organizacional).
-- Apagar a pasta apenas desvincula os projetos (on delete set null) — nunca os apaga.
alter table projects
  add column if not exists folder_id integer references project_folders(id) on delete set null;

create index if not exists idx_projects_folder_id on projects(folder_id);

-- ── Row Level Security ────────────────────────────────────────
-- Mesmo modelo já usado em projects/surveys/monitoring: dados
-- compartilhados globalmente entre todos os usuários autenticados.
alter table project_folders enable row level security;

drop policy if exists "project_folders_select" on project_folders;
drop policy if exists "project_folders_insert" on project_folders;
drop policy if exists "project_folders_update" on project_folders;
drop policy if exists "project_folders_delete" on project_folders;

create policy "project_folders_select" on project_folders
  for select using (auth.uid() is not null);

create policy "project_folders_insert" on project_folders
  for insert with check (auth.uid() is not null);

create policy "project_folders_update" on project_folders
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "project_folders_delete" on project_folders
  for delete using (auth.uid() is not null);

-- ── updated_at trigger (reusa a função já existente em schema.sql) ──
drop trigger if exists trg_project_folders_updated_at on project_folders;
create trigger trg_project_folders_updated_at
  before update on project_folders
  for each row execute function update_updated_at();
