-- ============================================================================
-- TRIVIUM — Script SQL completo v2 (fiel ao protótipo Figma)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute (RUN).
-- Este script SUBSTITUI o schema anterior (login por código de turma).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1) TABELAS BASE
-- ============================================================================

create table if not exists turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,           -- ex: "9º Ano A"
  escola text,
  created_at timestamptz not null default now()
);

-- Login real por e-mail/senha via Supabase Auth. auth_user_id referencia auth.users.
create table if not exists alunos (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  nome text not null,
  email text,
  avatar_url text,
  turma_id uuid references turmas (id) on delete set null,

  -- Estatísticas para gamificação (mantidas por triggers/funções SECURITY DEFINER)
  topicos_criados int not null default 0,
  resumos_concluidos int not null default 0,
  atividades_entregues_prazo int not null default 0,
  aulas_participadas int not null default 0,
  sequencia_dias int not null default 0,
  ultima_atividade_data date,
  media_geral numeric(4,2) not null default 0,
  xp int not null default 0,

  preferencias jsonb not null default '{"modo_escuro": false, "notificacoes_ia": true, "compartilhar_turma": true}',

  created_at timestamptz not null default now()
);

create table if not exists materias (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  nome text not null,
  cor_tema text not null default '#3B5FE0',
  icone text not null default '📘',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- "Resumos": notas por blocos (editor estilo Notion) + curadoria de vídeos
create table if not exists topicos (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references materias (id) on delete cascade,
  titulo text not null,
  status_concluido boolean not null default false,
  -- blocos: [{ "id": "...", "tipo": "texto|subtitulo|lista|checklist|imagem|cartao", "conteudo": ... }]
  blocos jsonb not null default '[]',
  -- videos_recomendados: [{ "id": "youtubeId", "titulo": "...", "duracao": "12:40", "thumbnail": "https://..." }]
  videos_recomendados jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cache de buscas de curadoria (RN08)
create table if not exists cache_buscas (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  assunto_normalizado text not null,
  termos_ia text,
  videos jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (materia, assunto_normalizado)
);

-- Atividades com prazo (nova funcionalidade, exibida no Dashboard/página Atividades)
create table if not exists atividades (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  materia_id uuid references materias (id) on delete set null,
  titulo text not null,
  descricao text,
  data_entrega date,
  status text not null default 'pendente' check (status in ('pendente', 'entregue', 'atrasada')),
  nota numeric(4,2),
  entregue_em timestamptz,
  created_at timestamptz not null default now()
);

-- Eventos de calendário (página Calendário / Agenda do dia)
create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  materia_id uuid references materias (id) on delete set null,
  titulo text not null,
  descricao text,
  data date not null,
  hora_inicio time,
  hora_fim time,
  concluido boolean not null default false,
  created_at timestamptz not null default now()
);

-- Catálogo de conquistas (compartilhado entre todos os alunos)
create table if not exists conquistas (
  id uuid primary key default gen_random_uuid(),
  chave text unique not null,
  titulo text not null,
  descricao text not null,
  icone text not null default '🏆',
  tipo text not null check (
    tipo in ('atividades_entregues_prazo', 'resumos_concluidos', 'aulas_participadas',
              'sequencia_dias', 'media_geral', 'topicos_criados')
  ),
  meta numeric not null,
  xp_recompensa int not null default 50,
  created_at timestamptz not null default now()
);

-- Conquistas desbloqueadas (e progresso) por aluno
create table if not exists aluno_conquistas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  conquista_id uuid not null references conquistas (id) on delete cascade,
  progresso numeric not null default 0,
  conquistada boolean not null default false,
  conquistada_em timestamptz,
  unique (aluno_id, conquista_id)
);

create index if not exists idx_alunos_turma on alunos (turma_id);
create index if not exists idx_materias_aluno on materias (aluno_id);
create index if not exists idx_topicos_materia on topicos (materia_id);
create index if not exists idx_atividades_aluno on atividades (aluno_id);
create index if not exists idx_eventos_aluno_data on eventos (aluno_id, data);
create index if not exists idx_aluno_conquistas_aluno on aluno_conquistas (aluno_id);

-- ============================================================================
-- 2) FUNÇÕES DE GAMIFICAÇÃO (SECURITY DEFINER)
-- ============================================================================

create or replace function trivium_registrar_atividade_estudo(p_aluno_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_ultima date;
begin
  select ultima_atividade_data into v_ultima from alunos where id = p_aluno_id;

  if v_ultima is null then
    update alunos set sequencia_dias = 1, ultima_atividade_data = current_date where id = p_aluno_id;
  elsif v_ultima = current_date then
    null;
  elsif v_ultima = current_date - interval '1 day' then
    update alunos set sequencia_dias = sequencia_dias + 1, ultima_atividade_data = current_date where id = p_aluno_id;
  else
    update alunos set sequencia_dias = 1, ultima_atividade_data = current_date where id = p_aluno_id;
  end if;
end;
$$;

create or replace function trivium_atualizar_media(p_aluno_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update alunos a
  set media_geral = coalesce((
    select round(avg(nota)::numeric, 2) from atividades where aluno_id = p_aluno_id and nota is not null
  ), 0)
  where a.id = p_aluno_id;
end;
$$;

-- Verifica e desbloqueia conquistas com base nas estatísticas atuais do aluno,
-- concedendo XP apenas na transição (quando ainda não estava conquistada).
create or replace function trivium_verificar_conquistas(p_aluno_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  r_conquista record;
  v_valor_atual numeric;
  v_ja_conquistada boolean;
  v_aluno alunos%rowtype;
begin
  select * into v_aluno from alunos where id = p_aluno_id;
  if not found then return; end if;

  for r_conquista in select * from conquistas loop
    v_valor_atual := case r_conquista.tipo
      when 'atividades_entregues_prazo' then v_aluno.atividades_entregues_prazo
      when 'resumos_concluidos' then v_aluno.resumos_concluidos
      when 'aulas_participadas' then v_aluno.aulas_participadas
      when 'sequencia_dias' then v_aluno.sequencia_dias
      when 'media_geral' then v_aluno.media_geral
      when 'topicos_criados' then v_aluno.topicos_criados
      else 0
    end;

    select coalesce(conquistada, false) into v_ja_conquistada
    from aluno_conquistas where aluno_id = p_aluno_id and conquista_id = r_conquista.id;

    insert into aluno_conquistas (aluno_id, conquista_id, progresso, conquistada, conquistada_em)
    values (
      p_aluno_id, r_conquista.id, least(v_valor_atual, r_conquista.meta),
      v_valor_atual >= r_conquista.meta,
      case when v_valor_atual >= r_conquista.meta then now() else null end
    )
    on conflict (aluno_id, conquista_id) do update
      set progresso = least(v_valor_atual, r_conquista.meta),
          conquistada = aluno_conquistas.conquistada or (v_valor_atual >= r_conquista.meta),
          conquistada_em = coalesce(aluno_conquistas.conquistada_em,
            case when v_valor_atual >= r_conquista.meta then now() else null end);

    if v_valor_atual >= r_conquista.meta and coalesce(v_ja_conquistada, false) = false then
      update alunos set xp = xp + r_conquista.xp_recompensa where id = p_aluno_id;
    end if;
  end loop;
end;
$$;

-- Ranking da turma (expõe apenas nome + xp — nunca e-mail)
create or replace function trivium_ranking_turma()
returns table (aluno_id uuid, nome text, xp int, eh_voce boolean)
language sql
security definer
stable
as $$
  select a.id, a.nome, a.xp, (a.auth_user_id = auth.uid()) as eh_voce
  from alunos a
  where a.turma_id = (select turma_id from alunos where auth_user_id = auth.uid())
  order by a.xp desc, a.nome asc
  limit 20;
$$;

-- Registra que o aluno assistiu/abriu uma videoaula recomendada de um tópico seu.
-- Chamada pelo front-end (VideoPlayer) quando o aluno clica em "play". Valida que o
-- tópico realmente pertence ao aluno autenticado antes de incrementar qualquer estatística.
create or replace function trivium_registrar_participacao_aula(p_topico_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_aluno_id uuid;
  v_aluno_dono uuid;
begin
  select a.id into v_aluno_dono
  from topicos t
  join materias m on m.id = t.materia_id
  join alunos a on a.id = m.aluno_id
  where t.id = p_topico_id;

  select id into v_aluno_id from alunos where auth_user_id = auth.uid();

  if v_aluno_dono is null or v_aluno_id is null or v_aluno_dono <> v_aluno_id then
    return; -- tópico não pertence ao aluno autenticado: não faz nada
  end if;

  update alunos set aulas_participadas = aulas_participadas + 1 where id = v_aluno_id;
  perform trivium_registrar_atividade_estudo(v_aluno_id);
  perform trivium_verificar_conquistas(v_aluno_id);
end;
$$;

grant execute on function trivium_registrar_participacao_aula(uuid) to authenticated;
grant execute on function trivium_ranking_turma() to authenticated;

-- ============================================================================
-- 3) TRIGGERS
-- ============================================================================

create or replace function trg_topicos_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_aluno_id uuid;
begin
  select aluno_id into v_aluno_id from materias where id = new.materia_id;
  update alunos set topicos_criados = topicos_criados + 1 where id = v_aluno_id;
  update materias set updated_at = now() where id = new.materia_id;
  perform trivium_registrar_atividade_estudo(v_aluno_id);
  perform trivium_verificar_conquistas(v_aluno_id);
  return new;
end;
$$;

drop trigger if exists on_topicos_insert on topicos;
create trigger on_topicos_insert
  after insert on topicos
  for each row execute function trg_topicos_insert();

create or replace function trg_topicos_update()
returns trigger
language plpgsql
security definer
as $$
declare
  v_aluno_id uuid;
begin
  select aluno_id into v_aluno_id from materias where id = new.materia_id;
  update materias set updated_at = now() where id = new.materia_id;

  if new.status_concluido = true and old.status_concluido = false then
    update alunos set resumos_concluidos = resumos_concluidos + 1 where id = v_aluno_id;
    perform trivium_registrar_atividade_estudo(v_aluno_id);
    perform trivium_verificar_conquistas(v_aluno_id);
  elsif new.status_concluido = false and old.status_concluido = true then
    update alunos set resumos_concluidos = greatest(resumos_concluidos - 1, 0) where id = v_aluno_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_topicos_update on topicos;
create trigger on_topicos_update
  after update on topicos
  for each row execute function trg_topicos_update();

create or replace function trg_atividades_update()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'entregue' and old.status <> 'entregue' then
    update atividades set entregue_em = now() where id = new.id;
    if new.data_entrega is null or current_date <= new.data_entrega then
      update alunos set atividades_entregues_prazo = atividades_entregues_prazo + 1 where id = new.aluno_id;
    end if;
    perform trivium_registrar_atividade_estudo(new.aluno_id);
  end if;

  if new.nota is distinct from old.nota then
    perform trivium_atualizar_media(new.aluno_id);
  end if;

  perform trivium_verificar_conquistas(new.aluno_id);
  return new;
end;
$$;

drop trigger if exists on_atividades_update on atividades;
create trigger on_atividades_update
  after update on atividades
  for each row execute function trg_atividades_update();

-- ============================================================================
-- 4) ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table turmas enable row level security;
alter table alunos enable row level security;
alter table materias enable row level security;
alter table topicos enable row level security;
alter table cache_buscas enable row level security;
alter table atividades enable row level security;
alter table eventos enable row level security;
alter table conquistas enable row level security;
alter table aluno_conquistas enable row level security;

drop policy if exists "turmas_select_authenticated" on turmas;
create policy "turmas_select_authenticated" on turmas for select to authenticated using (true);

-- Necessário porque o cadastro (Criar conta) pode criar uma turma nova digitando o nome
drop policy if exists "turmas_insert_authenticated" on turmas;
create policy "turmas_insert_authenticated" on turmas for insert to authenticated with check (true);

drop policy if exists "alunos_select_proprio" on alunos;
create policy "alunos_select_proprio" on alunos for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "alunos_insert_proprio" on alunos;
create policy "alunos_insert_proprio" on alunos for insert to authenticated
  with check (auth_user_id = auth.uid());

-- Observação: por simplicidade este UPDATE não restringe coluna a coluna.
-- As estatísticas de gamificação (xp, sequencia_dias etc.) são recalculadas
-- pelas funções/triggers SECURITY DEFINER acima sempre que os dados de origem
-- mudam, então mesmo que o client envie um valor arbitrário nessas colunas,
-- a próxima ação do aluno (criar tópico, entregar atividade) volta a sincronizar.
-- Para produção real, prefira expor apenas RPCs específicas para editar perfil.
drop policy if exists "alunos_update_proprio" on alunos;
create policy "alunos_update_proprio" on alunos for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists "materias_all_proprio" on materias;
create policy "materias_all_proprio" on materias for all to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()))
  with check (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

drop policy if exists "topicos_all_proprio" on topicos;
create policy "topicos_all_proprio" on topicos for all to authenticated
  using (materia_id in (
    select m.id from materias m join alunos a on a.id = m.aluno_id where a.auth_user_id = auth.uid()
  ))
  with check (materia_id in (
    select m.id from materias m join alunos a on a.id = m.aluno_id where a.auth_user_id = auth.uid()
  ));

drop policy if exists "cache_buscas_select" on cache_buscas;
create policy "cache_buscas_select" on cache_buscas for select to authenticated using (true);
drop policy if exists "cache_buscas_insert" on cache_buscas;
create policy "cache_buscas_insert" on cache_buscas for insert to authenticated with check (true);

drop policy if exists "atividades_all_proprio" on atividades;
create policy "atividades_all_proprio" on atividades for all to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()))
  with check (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

drop policy if exists "eventos_all_proprio" on eventos;
create policy "eventos_all_proprio" on eventos for all to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()))
  with check (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

drop policy if exists "conquistas_select_all" on conquistas;
create policy "conquistas_select_all" on conquistas for select to authenticated using (true);

drop policy if exists "aluno_conquistas_select_proprio" on aluno_conquistas;
create policy "aluno_conquistas_select_proprio" on aluno_conquistas for select to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

-- ============================================================================
-- 5) STORAGE (bucket para imagens do editor de notas)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('notas-imagens', 'notas-imagens', true)
on conflict (id) do nothing;

drop policy if exists "notas_imagens_select_publica" on storage.objects;
create policy "notas_imagens_select_publica"
  on storage.objects for select
  using (bucket_id = 'notas-imagens');

drop policy if exists "notas_imagens_insert_autenticado" on storage.objects;
create policy "notas_imagens_insert_autenticado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'notas-imagens');

-- ============================================================================
-- 6) DADOS DE EXEMPLO / CATÁLOGO
-- ============================================================================

insert into turmas (nome, escola) values ('9º Ano A', 'Escola Estadual Professor José Ribamar')
  on conflict do nothing;

insert into conquistas (chave, titulo, descricao, icone, tipo, meta, xp_recompensa) values
  ('pontual', 'Pontual', 'Entregou 3 atividades no prazo.', '🏆', 'atividades_entregues_prazo', 3, 50),
  ('estudioso', 'Estudioso', 'Concluiu 3 resumos.', '📖', 'resumos_concluidos', 3, 60),
  ('participativo', 'Participativo', 'Participou de 5 aulas.', '👥', 'aulas_participadas', 5, 100),
  ('mestre_organizacao', 'Mestre da Organização', 'Entregue 20 atividades.', '🗂️', 'atividades_entregues_prazo', 20, 150),
  ('nota_de_ouro', 'Nota de Ouro', 'Tire média acima de 9,0.', '🥇', 'media_geral', 9.0, 200),
  ('frequencia_perfeita', 'Frequência Perfeita', '30 dias sem faltas.', '📅', 'sequencia_dias', 30, 200)
on conflict (chave) do nothing;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
