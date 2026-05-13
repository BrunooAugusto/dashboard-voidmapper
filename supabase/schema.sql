-- ============================================================
-- VoidMapper — Supabase SQL Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── User profiles (extends Supabase auth.users) ───────────────
create table if not exists profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  name             text        not null default '',
  role             text        not null default 'Usuário',
  initials         text        not null default 'US',
  profile_complete boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Projects ──────────────────────────────────────────────────
create table if not exists projects (
  id                    serial      primary key,
  code                  text        not null unique,
  statuses              jsonb       not null default '[]',
  date                  timestamptz not null default now(),
  survey_count          integer     not null default 0,
  metragem              text,
  file_name             text,
  notes                 text,
  project_url           text,
  project_length        float,
  level                 integer,
  rehabilitation_status text,
  user_id               uuid        references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Project images ────────────────────────────────────────────
create table if not exists project_images (
  id         serial      primary key,
  project_id integer     not null references projects(id) on delete cascade,
  url        text        not null,
  is_main    boolean     not null default false,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

-- ── Surveys (activity log) ────────────────────────────────────
create table if not exists surveys (
  id         serial      primary key,
  project_id integer     references projects(id) on delete cascade,
  local      text        not null,
  file       text        not null default '',
  status     text        not null default 'success',
  date       timestamptz not null,
  count      integer     not null default 1,
  metering   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Monitoring ────────────────────────────────────────────────
create table if not exists monitoring (
  id             serial      primary key,
  area           text        not null,
  project_name   text        not null,
  frequency_days integer     not null,
  last_survey    timestamptz,
  survey_count   integer     not null default 0,
  project_id     integer     references projects(id),
  user_id        uuid        references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Reports ───────────────────────────────────────────────────
create table if not exists reports (
  id             serial      primary key,
  week_start     timestamptz not null,
  week_end       timestamptz not null,
  new_surveys    integer     not null default 0,
  deformations   integer     not null default 0,
  rehabilitation integer     not null default 0,
  errors         integer     not null default 0,
  observations   text,
  conclusion     text,
  user_id        uuid        references auth.users(id),
  created_at     timestamptz not null default now()
);

-- ── updated_at trigger ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger trg_surveys_updated_at
  before update on surveys
  for each row execute function update_updated_at();

create trigger trg_monitoring_updated_at
  before update on monitoring
  for each row execute function update_updated_at();

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ── Auto-create profile on user sign-up ──────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role, initials, profile_complete)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',    ''),
    coalesce(new.raw_user_meta_data->>'role',    'Usuário'),
    coalesce(new.raw_user_meta_data->>'initials','US'),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Row Level Security ────────────────────────────────────────
-- All authenticated users share the same global project data.

alter table profiles       enable row level security;
alter table projects       enable row level security;
alter table project_images enable row level security;
alter table surveys        enable row level security;
alter table monitoring     enable row level security;
alter table reports        enable row level security;

-- profiles: any authenticated user can read; users can only modify their own
create policy "profiles_select"  on profiles for select  using (auth.uid() is not null);
create policy "profiles_insert"  on profiles for insert  with check (auth.uid() = id);
create policy "profiles_update"  on profiles for update  using (auth.uid() = id);
create policy "profiles_delete"  on profiles for delete  using (auth.uid() = id);

-- projects: shared globally — full access for authenticated users
create policy "projects_all"       on projects       for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "project_images_all" on project_images for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "surveys_all"        on surveys        for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "monitoring_all"     on monitoring     for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "reports_all"        on reports        for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── Storage bucket for project images ────────────────────────
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

create policy "storage_project_images_read"
  on storage.objects for select
  using (bucket_id = 'project-images');

create policy "storage_project_images_upload"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and auth.uid() is not null);

create policy "storage_project_images_delete"
  on storage.objects for delete
  using (bucket_id = 'project-images' and auth.uid() is not null);
