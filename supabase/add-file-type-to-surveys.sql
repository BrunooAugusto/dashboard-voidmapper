-- ============================================================
-- VoidMapper — Adiciona classificação LEVANTAMENTO/LTC/STC
-- Run this entire file in: Supabase Dashboard → SQL Editor
--
-- Por que rodar: a coluna file_type nunca existiu na tabela
-- "surveys" em produção. Sem ela, o app trata TODOS os surveys
-- como LEVANTAMENTO (fallback de compatibilidade), o que inflava
-- as contagens e metragem nos gráficos e na dashboard mesmo após
-- a separação de lógica no código.
-- ============================================================

-- 1. Adiciona a coluna (idempotente — seguro rodar mais de uma vez)
alter table surveys
  add column if not exists file_type text not null default 'levantamento';

alter table surveys
  drop constraint if exists surveys_file_type_check;

alter table surveys
  add constraint surveys_file_type_check
  check (file_type in ('levantamento', 'ltc', 'stc'));

alter table surveys
  add column if not exists observations text;

-- 2. Backfill — classifica registros existentes pelo nome do arquivo
update surveys set file_type = 'ltc' where file ilike '%ltc%';
update surveys set file_type = 'stc' where file ilike '%stc%' and file_type <> 'ltc';
-- todo o restante permanece 'levantamento' (valor padrão)

-- 3. Recalcula survey_count em projects para excluir LTC/STC da contagem denormalizada
update projects p
set survey_count = coalesce((
  select sum(greatest(coalesce(s.count, 1), 1))
  from surveys s
  where s.project_id = p.id and s.file_type = 'levantamento'
), 0);

-- 4. Conferência — rode manualmente para auditar o resultado
-- select file_type, count(*) from surveys group by file_type;
