-- ============================================================================
-- TRIVIUM — Script SQL v3 (Professor/Aluno, XP em ledger, nível, indicações,
-- cosméticos, atividades com entrega/nota pelo professor)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute (RUN).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1) TABELAS BASE
-- ============================================================================

-- Dono de turmas. Autenticado via Supabase Auth (mesma tabela auth.users dos alunos,
-- mas com um registro próprio em `professores` em vez de `alunos`).
create table if not exists professores (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  nome text not null,
  email text,
  created_at timestamptz not null default now()
);

-- Turma agora só existe se um professor a criar. codigo_acesso é gerado no
-- front-end (aleatório) com retry em caso de colisão de unicidade (RNF12).
create table if not exists turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references professores (id) on delete cascade,
  nome text not null,
  escola text,
  codigo_acesso text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists alunos (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  nome text not null,
  email text,
  avatar_url text,
  turma_id uuid references turmas (id) on delete set null,

  -- Estatísticas de gamificação — escritas exclusivamente por funções/triggers
  -- SECURITY DEFINER (RNF10), nunca por UPDATE direto do client.
  topicos_criados int not null default 0,
  resumos_concluidos int not null default 0,
  atividades_entregues_prazo int not null default 0,
  aulas_participadas int not null default 0,
  sequencia_dias int not null default 0,
  ultima_atividade_data date,
  media_geral numeric(4,2) not null default 0,
  xp int not null default 0,
  nivel int not null default 1,

  -- Indicação de amigos (RN18)
  codigo_indicacao text unique,

  -- Customização de perfil (RN19)
  avatar_ativo text not null default 'avatar_padrao',
  moldura_ativa text not null default 'moldura_padrao',
  capa_ativa text not null default 'capa_padrao',
  titulo_ativo text not null default 'novato_do_saber',
  cor_destaque text not null default '#3B5FE0',

  preferencias jsonb not null default '{"modo_escuro": true, "notificacoes_ia": true, "compartilhar_turma": true}',

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

create table if not exists topicos (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references materias (id) on delete cascade,
  titulo text not null,
  status_concluido boolean not null default false,
  blocos jsonb not null default '[]',
  videos_recomendados jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cache_buscas (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  assunto_normalizado text not null,
  termos_ia text,
  videos jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (materia, assunto_normalizado)
);

-- Itens pessoais do calendário do aluno. NUNCA geram XP/nota (RN14).
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

-- Atividades FORMAIS: só o professor cria, sempre vinculadas a uma turma inteira (RN11).
create table if not exists atividades (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas (id) on delete cascade,
  professor_id uuid not null references professores (id) on delete cascade,
  titulo text not null,
  descricao text,
  materia text,                 -- rótulo livre (ex: "Matemática"), não é FK — turma não tem cadernos próprios
  data_entrega date,
  created_at timestamptz not null default now()
);

-- Uma linha por (atividade × aluno). Nota só é editável pelo professor (RN12,
-- reforçado por trigger abaixo). Criada automaticamente para toda a turma
-- quando uma atividade é cadastrada (trigger trg_atividades_insert).
create table if not exists entregas (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references atividades (id) on delete cascade,
  aluno_id uuid not null references alunos (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'entregue', 'atrasada')),
  nota numeric(4,2),
  entregue_em timestamptz,
  created_at timestamptz not null default now(),
  unique (atividade_id, aluno_id)
);

-- Catálogo de conquistas (compartilhado)
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

create table if not exists aluno_conquistas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  conquista_id uuid not null references conquistas (id) on delete cascade,
  progresso numeric not null default 0,
  conquistada boolean not null default false,
  conquistada_em timestamptz,
  unique (aluno_id, conquista_id)
);

-- RN15 — Ledger de XP: toda concessão de XP é uma linha aqui. alunos.xp e
-- alunos.nivel são recalculados por trigger a partir da soma deste ledger.
-- Também é a fonte do ranking semanal (RN17).
create table if not exists xp_transacoes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  quantidade int not null,
  motivo text not null,
  referencia_tipo text,   -- 'conquista' | 'entrega' | 'indicacao' | etc.
  referencia_id uuid,
  created_at timestamptz not null default now()
);

-- RN18 — Indicação de amigos
create table if not exists indicacoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  indicador_id uuid not null references alunos (id) on delete cascade,
  indicado_id uuid not null references alunos (id) on delete cascade,
  xp_concedido int not null default 0,
  resgatado_em timestamptz not null default now(),
  unique (indicado_id) -- cada aluno só pode resgatar UM código, uma vez na vida
);

-- RN19 — Catálogo de cosméticos (avatar/moldura/capa/título)
create table if not exists cosmeticos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('avatar', 'moldura', 'capa', 'titulo', 'cor')),
  chave text unique not null,
  label text not null,
  valor text not null,          -- emoji (avatar), classe/gradiente (moldura/capa), texto (título), hex (cor)
  nivel_minimo int not null default 1,
  conquista_chave text references conquistas (chave),
  created_at timestamptz not null default now()
);

create table if not exists aluno_cosmeticos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  cosmetico_id uuid not null references cosmeticos (id) on delete cascade,
  desbloqueado_em timestamptz not null default now(),
  unique (aluno_id, cosmetico_id)
);

create index if not exists idx_alunos_turma on alunos (turma_id);
create index if not exists idx_materias_aluno on materias (aluno_id);
create index if not exists idx_topicos_materia on topicos (materia_id);
create index if not exists idx_eventos_aluno_data on eventos (aluno_id, data);
create index if not exists idx_atividades_turma on atividades (turma_id);
create index if not exists idx_entregas_atividade on entregas (atividade_id);
create index if not exists idx_entregas_aluno on entregas (aluno_id);
create index if not exists idx_aluno_conquistas_aluno on aluno_conquistas (aluno_id);
create index if not exists idx_xp_transacoes_aluno_data on xp_transacoes (aluno_id, created_at);
create index if not exists idx_aluno_cosmeticos_aluno on aluno_cosmeticos (aluno_id);
create index if not exists idx_turmas_professor on turmas (professor_id);

-- ============================================================================
-- 2) FUNÇÕES NÚCLEO DE GAMIFICAÇÃO
-- ============================================================================

-- RN16 — Curva de nível: XP para ir do nível N ao N+1 = 100 + 50*(N-1)
create or replace function trivium_calcular_nivel(p_xp_total int)
returns table (nivel int, xp_atual int, xp_necessario int)
language plpgsql
immutable
as $$
declare
  v_nivel int := 1;
  v_restante int := greatest(p_xp_total, 0);
  v_necessario int := 100;
begin
  while v_restante >= v_necessario loop
    v_restante := v_restante - v_necessario;
    v_nivel := v_nivel + 1;
    v_necessario := 100 + 50 * (v_nivel - 1);
  end loop;
  return query select v_nivel, v_restante, v_necessario;
end;
$$;

-- RN19 — Desbloqueia automaticamente cosméticos por nível ou por conquista
create or replace function trivium_desbloquear_cosmeticos(p_aluno_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_nivel int;
begin
  select nivel into v_nivel from alunos where id = p_aluno_id;

  insert into aluno_cosmeticos (aluno_id, cosmetico_id)
  select p_aluno_id, c.id
  from cosmeticos c
  where c.nivel_minimo <= v_nivel
    and c.conquista_chave is null
  on conflict (aluno_id, cosmetico_id) do nothing;

  insert into aluno_cosmeticos (aluno_id, cosmetico_id)
  select p_aluno_id, c.id
  from cosmeticos c
  join aluno_conquistas ac on ac.conquista_id = (select id from conquistas where chave = c.conquista_chave)
  where c.conquista_chave is not null
    and ac.aluno_id = p_aluno_id
    and ac.conquistada = true
  on conflict (aluno_id, cosmetico_id) do nothing;
end;
$$;

-- RN15 — Única porta de entrada para conceder XP. Insere no ledger; o trigger
-- trg_xp_transacoes_insert é quem de fato soma em alunos.xp e recalcula o nível.
create or replace function trivium_conceder_xp(p_aluno_id uuid, p_quantidade int, p_motivo text, p_referencia_tipo text default null, p_referencia_id uuid default null)
returns void
language plpgsql
security definer
as $$
begin
  if p_quantidade = 0 then return; end if;
  insert into xp_transacoes (aluno_id, quantidade, motivo, referencia_tipo, referencia_id)
  values (p_aluno_id, p_quantidade, p_motivo, p_referencia_tipo, p_referencia_id);
end;
$$;

create or replace function trg_xp_transacoes_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_xp_total int;
  v_nivel_calc record;
  v_nivel_anterior int;
begin
  select nivel into v_nivel_anterior from alunos where id = new.aluno_id;

  update alunos set xp = greatest(xp + new.quantidade, 0) where id = new.aluno_id
  returning xp into v_xp_total;

  select * into v_nivel_calc from trivium_calcular_nivel(v_xp_total);
  update alunos set nivel = v_nivel_calc.nivel where id = new.aluno_id;

  if v_nivel_calc.nivel > v_nivel_anterior then
    perform trivium_desbloquear_cosmeticos(new.aluno_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_xp_transacoes_insert on xp_transacoes;
create trigger on_xp_transacoes_insert
  after insert on xp_transacoes
  for each row execute function trg_xp_transacoes_insert();

create or replace function trivium_registrar_atividade_estudo(p_aluno_id uuid)
returns void
language plpgsql
security definer
as $$
declare v_ultima date;
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

-- Média geral agora vem de `entregas.nota` (lançada pelo professor), não mais
-- de um campo editável pelo próprio aluno.
create or replace function trivium_atualizar_media(p_aluno_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update alunos a
  set media_geral = coalesce((select round(avg(nota)::numeric, 2) from entregas where aluno_id = p_aluno_id and nota is not null), 0)
  where a.id = p_aluno_id;
end;
$$;

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
    values (p_aluno_id, r_conquista.id, least(v_valor_atual, r_conquista.meta), v_valor_atual >= r_conquista.meta,
            case when v_valor_atual >= r_conquista.meta then now() else null end)
    on conflict (aluno_id, conquista_id) do update
      set progresso = least(v_valor_atual, r_conquista.meta),
          conquistada = aluno_conquistas.conquistada or (v_valor_atual >= r_conquista.meta),
          conquistada_em = coalesce(aluno_conquistas.conquistada_em, case when v_valor_atual >= r_conquista.meta then now() else null end);

    if v_valor_atual >= r_conquista.meta and coalesce(v_ja_conquistada, false) = false then
      perform trivium_conceder_xp(p_aluno_id, r_conquista.xp_recompensa, 'conquista: ' || r_conquista.titulo, 'conquista', r_conquista.id);
      perform trivium_desbloquear_cosmeticos(p_aluno_id);
    end if;
  end loop;
end;
$$;

-- RN17 — Ranking geral (xp acumulado) e ranking semanal (ledger dos últimos 7 dias)
create or replace function trivium_ranking_turma()
returns table (aluno_id uuid, nome text, xp int, eh_voce boolean)
language sql security definer stable
as $$
  select a.id, a.nome, a.xp, (a.auth_user_id = auth.uid())
  from alunos a
  where a.turma_id = (select turma_id from alunos where auth_user_id = auth.uid())
  order by a.xp desc, a.nome asc
  limit 20;
$$;

create or replace function trivium_ranking_semanal_turma()
returns table (aluno_id uuid, nome text, xp_semana bigint, eh_voce boolean)
language sql security definer stable
as $$
  select a.id, a.nome, coalesce(sum(x.quantidade), 0) as xp_semana, (a.auth_user_id = auth.uid())
  from alunos a
  left join xp_transacoes x on x.aluno_id = a.id and x.created_at >= now() - interval '7 days'
  where a.turma_id = (select turma_id from alunos where auth_user_id = auth.uid())
  group by a.id, a.nome, a.auth_user_id
  order by xp_semana desc, a.nome asc
  limit 20;
$$;

create or replace function trivium_registrar_participacao_aula(p_topico_id uuid)
returns void
language plpgsql security definer
as $$
declare
  v_aluno_id uuid;
  v_aluno_dono uuid;
begin
  select a.id into v_aluno_dono from topicos t join materias m on m.id = t.materia_id join alunos a on a.id = m.aluno_id where t.id = p_topico_id;
  select id into v_aluno_id from alunos where auth_user_id = auth.uid();
  if v_aluno_dono is null or v_aluno_id is null or v_aluno_dono <> v_aluno_id then return; end if;

  update alunos set aulas_participadas = aulas_participadas + 1 where id = v_aluno_id;
  perform trivium_registrar_atividade_estudo(v_aluno_id);
  perform trivium_verificar_conquistas(v_aluno_id);
end;
$$;

-- RN18 — Resgate de código de amigo. XP de recompensa fica isolado nesta
-- constante (dentro da função) para ser fácil de ajustar depois, conforme combinado.
create or replace function trivium_resgatar_indicacao(p_codigo text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_xp_recompensa constant int := 30; -- TODO: ajustar valor de recompensa quando definido
  v_indicado_id uuid;
  v_indicador_id uuid;
begin
  select id into v_indicado_id from alunos where auth_user_id = auth.uid();
  if v_indicado_id is null then
    raise exception 'Apenas alunos autenticados podem resgatar um código.';
  end if;

  select id into v_indicador_id from alunos where codigo_indicacao = upper(trim(p_codigo));
  if v_indicador_id is null then
    raise exception 'Código de amigo inválido.';
  end if;
  if v_indicador_id = v_indicado_id then
    raise exception 'Você não pode resgatar o próprio código.';
  end if;
  if exists (select 1 from indicacoes where indicado_id = v_indicado_id) then
    raise exception 'Você já resgatou um código de amigo antes.';
  end if;

  insert into indicacoes (codigo, indicador_id, indicado_id, xp_concedido)
  values (upper(trim(p_codigo)), v_indicador_id, v_indicado_id, v_xp_recompensa);

  perform trivium_conceder_xp(v_indicador_id, v_xp_recompensa, 'Indicou um amigo', 'indicacao', v_indicado_id);
  perform trivium_conceder_xp(v_indicado_id, v_xp_recompensa, 'Entrou via indicação', 'indicacao', v_indicador_id);
  perform trivium_verificar_conquistas(v_indicador_id);
  perform trivium_verificar_conquistas(v_indicado_id);

  return jsonb_build_object('xp_ganho', v_xp_recompensa);
end;
$$;

grant execute on function trivium_registrar_participacao_aula(uuid) to authenticated;
grant execute on function trivium_ranking_turma() to authenticated;
grant execute on function trivium_ranking_semanal_turma() to authenticated;
grant execute on function trivium_resgatar_indicacao(text) to authenticated;
grant execute on function trivium_calcular_nivel(int) to authenticated;

-- ============================================================================
-- 3) TRIGGERS
-- ============================================================================

create or replace function trg_alunos_insert()
returns trigger
language plpgsql security definer
as $$
begin
  perform trivium_desbloquear_cosmeticos(new.id); -- garante os itens de nível 1 já equipáveis
  return new;
end;
$$;

drop trigger if exists on_alunos_insert on alunos;
create trigger on_alunos_insert after insert on alunos for each row execute function trg_alunos_insert();

-- RN19 reforçada no banco: aluno só pode equipar cosmético já desbloqueado
create or replace function trg_alunos_validar_equipaveis()
returns trigger
language plpgsql security definer
as $$
  declare v_ok boolean;
begin
  if new.avatar_ativo is distinct from old.avatar_ativo then
    select exists(select 1 from cosmeticos c join aluno_cosmeticos ac on ac.cosmetico_id = c.id
                  where ac.aluno_id = new.id and c.tipo = 'avatar' and c.chave = new.avatar_ativo) into v_ok;
    if not v_ok and new.avatar_ativo <> 'avatar_padrao' then
      raise exception 'Avatar ainda não desbloqueado.';
    end if;
  end if;
  if new.moldura_ativa is distinct from old.moldura_ativa then
    select exists(select 1 from cosmeticos c join aluno_cosmeticos ac on ac.cosmetico_id = c.id
                  where ac.aluno_id = new.id and c.tipo = 'moldura' and c.chave = new.moldura_ativa) into v_ok;
    if not v_ok and new.moldura_ativa <> 'moldura_padrao' then
      raise exception 'Moldura ainda não desbloqueada.';
    end if;
  end if;
  if new.capa_ativa is distinct from old.capa_ativa then
    select exists(select 1 from cosmeticos c join aluno_cosmeticos ac on ac.cosmetico_id = c.id
                  where ac.aluno_id = new.id and c.tipo = 'capa' and c.chave = new.capa_ativa) into v_ok;
    if not v_ok and new.capa_ativa <> 'capa_padrao' then
      raise exception 'Capa ainda não desbloqueada.';
    end if;
  end if;
  if new.titulo_ativo is distinct from old.titulo_ativo then
    select exists(select 1 from cosmeticos c join aluno_cosmeticos ac on ac.cosmetico_id = c.id
                  where ac.aluno_id = new.id and c.tipo = 'titulo' and c.chave = new.titulo_ativo) into v_ok;
    if not v_ok and new.titulo_ativo <> 'novato_do_saber' then
      raise exception 'Título ainda não desbloqueado.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_alunos_validar_equipaveis on alunos;
create trigger on_alunos_validar_equipaveis before update on alunos for each row execute function trg_alunos_validar_equipaveis();

create or replace function trg_topicos_insert()
returns trigger
language plpgsql security definer
as $$
declare v_aluno_id uuid;
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
create trigger on_topicos_insert after insert on topicos for each row execute function trg_topicos_insert();

create or replace function trg_topicos_update()
returns trigger
language plpgsql security definer
as $$
declare v_aluno_id uuid;
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
create trigger on_topicos_update after update on topicos for each row execute function trg_topicos_update();

-- RF04 — criar atividade já gera a entrega pendente pra turma inteira
create or replace function trg_atividades_insert()
returns trigger
language plpgsql security definer
as $$
begin
  insert into entregas (atividade_id, aluno_id, status)
  select new.id, a.id, 'pendente' from alunos a where a.turma_id = new.turma_id
  on conflict (atividade_id, aluno_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_atividades_insert on atividades;
create trigger on_atividades_insert after insert on atividades for each row execute function trg_atividades_insert();

-- RN12/RN13 — Reforça no banco que só o professor da turma edita a nota;
-- aluno só move o status. XP de entrega no prazo também concedido aqui.
create or replace function trg_entregas_update()
returns trigger
language plpgsql security definer
as $$
declare
  v_eh_professor boolean;
  v_data_entrega date;
  v_xp_entrega constant int := 20;
begin
  select exists (
    select 1 from atividades at join turmas tu on tu.id = at.turma_id join professores p on p.id = tu.professor_id
    where at.id = new.atividade_id and p.auth_user_id = auth.uid()
  ) into v_eh_professor;

  if not v_eh_professor and new.nota is distinct from old.nota then
    new.nota := old.nota; -- aluno não pode alterar a própria nota (RN12)
  end if;

  if new.status = 'entregue' and old.status <> 'entregue' then
    new.entregue_em := now();
    select data_entrega into v_data_entrega from atividades where id = new.atividade_id;
    if v_data_entrega is null or current_date <= v_data_entrega then
      update alunos set atividades_entregues_prazo = atividades_entregues_prazo + 1 where id = new.aluno_id;
      perform trivium_conceder_xp(new.aluno_id, v_xp_entrega, 'Entrega no prazo', 'entrega', new.id);
    end if;
    perform trivium_registrar_atividade_estudo(new.aluno_id);
    perform trivium_verificar_conquistas(new.aluno_id);
  end if;

  if new.nota is distinct from old.nota then
    perform trivium_atualizar_media(new.aluno_id);
    perform trivium_verificar_conquistas(new.aluno_id);
  end if;

  return new;
end;
$$;
drop trigger if exists on_entregas_update on entregas;
create trigger on_entregas_update before update on entregas for each row execute function trg_entregas_update();

-- ============================================================================
-- 4) ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table professores enable row level security;
alter table turmas enable row level security;
alter table alunos enable row level security;
alter table materias enable row level security;
alter table topicos enable row level security;
alter table cache_buscas enable row level security;
alter table eventos enable row level security;
alter table atividades enable row level security;
alter table entregas enable row level security;
alter table conquistas enable row level security;
alter table aluno_conquistas enable row level security;
alter table xp_transacoes enable row level security;
alter table indicacoes enable row level security;
alter table cosmeticos enable row level security;
alter table aluno_cosmeticos enable row level security;

-- professores
drop policy if exists "professores_select_proprio" on professores;
create policy "professores_select_proprio" on professores for select to authenticated using (auth_user_id = auth.uid());
drop policy if exists "professores_insert_proprio" on professores;
create policy "professores_insert_proprio" on professores for insert to authenticated with check (auth_user_id = auth.uid());
drop policy if exists "professores_update_proprio" on professores;
create policy "professores_update_proprio" on professores for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- turmas — select liberado (necessário pro aluno validar código no cadastro);
-- insert/update/delete só para o professor dono (RN09)
drop policy if exists "turmas_select_authenticated" on turmas;
create policy "turmas_select_authenticated" on turmas for select to authenticated using (true);
drop policy if exists "turmas_insert_authenticated" on turmas;
drop policy if exists "turmas_insert_professor" on turmas;
create policy "turmas_insert_professor" on turmas for insert to authenticated
  with check (professor_id in (select id from professores where auth_user_id = auth.uid()));
drop policy if exists "turmas_update_professor" on turmas;
create policy "turmas_update_professor" on turmas for update to authenticated
  using (professor_id in (select id from professores where auth_user_id = auth.uid()));
drop policy if exists "turmas_delete_professor" on turmas;
create policy "turmas_delete_professor" on turmas for delete to authenticated
  using (professor_id in (select id from professores where auth_user_id = auth.uid()));

-- alunos
drop policy if exists "alunos_select_proprio" on alunos;
create policy "alunos_select_proprio" on alunos for select to authenticated using (auth_user_id = auth.uid());
drop policy if exists "alunos_select_professor_turma" on alunos;
create policy "alunos_select_professor_turma" on alunos for select to authenticated
  using (turma_id in (select id from turmas where professor_id in (select id from professores where auth_user_id = auth.uid())));
drop policy if exists "alunos_insert_proprio" on alunos;
create policy "alunos_insert_proprio" on alunos for insert to authenticated with check (auth_user_id = auth.uid());
drop policy if exists "alunos_update_proprio" on alunos;
create policy "alunos_update_proprio" on alunos for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists "materias_all_proprio" on materias;
create policy "materias_all_proprio" on materias for all to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()))
  with check (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

drop policy if exists "topicos_all_proprio" on topicos;
create policy "topicos_all_proprio" on topicos for all to authenticated
  using (materia_id in (select m.id from materias m join alunos a on a.id = m.aluno_id where a.auth_user_id = auth.uid()))
  with check (materia_id in (select m.id from materias m join alunos a on a.id = m.aluno_id where a.auth_user_id = auth.uid()));

drop policy if exists "cache_buscas_select" on cache_buscas;
create policy "cache_buscas_select" on cache_buscas for select to authenticated using (true);
drop policy if exists "cache_buscas_insert" on cache_buscas;
create policy "cache_buscas_insert" on cache_buscas for insert to authenticated with check (true);

drop policy if exists "eventos_all_proprio" on eventos;
create policy "eventos_all_proprio" on eventos for all to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()))
  with check (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

-- atividades — professor tem CRUD completo na própria turma; aluno só lê as da própria turma
drop policy if exists "atividades_professor_all" on atividades;
create policy "atividades_professor_all" on atividades for all to authenticated
  using (turma_id in (select id from turmas where professor_id in (select id from professores where auth_user_id = auth.uid())))
  with check (turma_id in (select id from turmas where professor_id in (select id from professores where auth_user_id = auth.uid())));
drop policy if exists "atividades_aluno_select" on atividades;
create policy "atividades_aluno_select" on atividades for select to authenticated
  using (turma_id in (select turma_id from alunos where auth_user_id = auth.uid()));

-- entregas — aluno vê/atualiza (status) só as próprias; professor vê/atualiza (nota) as da própria turma
drop policy if exists "entregas_aluno_select" on entregas;
create policy "entregas_aluno_select" on entregas for select to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()));
drop policy if exists "entregas_aluno_update" on entregas;
create policy "entregas_aluno_update" on entregas for update to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()));
drop policy if exists "entregas_professor_select" on entregas;
create policy "entregas_professor_select" on entregas for select to authenticated
  using (atividade_id in (select at.id from atividades at join turmas tu on tu.id = at.turma_id where tu.professor_id in (select id from professores where auth_user_id = auth.uid())));
drop policy if exists "entregas_professor_update" on entregas;
create policy "entregas_professor_update" on entregas for update to authenticated
  using (atividade_id in (select at.id from atividades at join turmas tu on tu.id = at.turma_id where tu.professor_id in (select id from professores where auth_user_id = auth.uid())));

drop policy if exists "conquistas_select_all" on conquistas;
create policy "conquistas_select_all" on conquistas for select to authenticated using (true);
drop policy if exists "aluno_conquistas_select_proprio" on aluno_conquistas;
create policy "aluno_conquistas_select_proprio" on aluno_conquistas for select to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

drop policy if exists "xp_transacoes_select_proprio" on xp_transacoes;
create policy "xp_transacoes_select_proprio" on xp_transacoes for select to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

drop policy if exists "indicacoes_select_proprio" on indicacoes;
create policy "indicacoes_select_proprio" on indicacoes for select to authenticated
  using (indicador_id in (select id from alunos where auth_user_id = auth.uid())
      or indicado_id in (select id from alunos where auth_user_id = auth.uid()));

drop policy if exists "cosmeticos_select_all" on cosmeticos;
create policy "cosmeticos_select_all" on cosmeticos for select to authenticated using (true);
drop policy if exists "aluno_cosmeticos_select_proprio" on aluno_cosmeticos;
create policy "aluno_cosmeticos_select_proprio" on aluno_cosmeticos for select to authenticated
  using (aluno_id in (select id from alunos where auth_user_id = auth.uid()));

-- ============================================================================
-- 5) STORAGE
-- ============================================================================

insert into storage.buckets (id, name, public) values ('notas-imagens', 'notas-imagens', true) on conflict (id) do nothing;
drop policy if exists "notas_imagens_select_publica" on storage.objects;
create policy "notas_imagens_select_publica" on storage.objects for select using (bucket_id = 'notas-imagens');
drop policy if exists "notas_imagens_insert_autenticado" on storage.objects;
create policy "notas_imagens_insert_autenticado" on storage.objects for insert to authenticated with check (bucket_id = 'notas-imagens');

-- ============================================================================
-- 6) CATÁLOGO INICIAL
-- ============================================================================

insert into conquistas (chave, titulo, descricao, icone, tipo, meta, xp_recompensa) values
  ('pontual', 'Pontual', 'Entregou 3 atividades no prazo.', '🏆', 'atividades_entregues_prazo', 3, 50),
  ('estudioso', 'Estudioso', 'Concluiu 3 resumos.', '📖', 'resumos_concluidos', 3, 60),
  ('participativo', 'Participativo', 'Participou de 5 aulas.', '👥', 'aulas_participadas', 5, 100),
  ('mestre_organizacao', 'Mestre da Organização', 'Entregue 20 atividades.', '🗂️', 'atividades_entregues_prazo', 20, 150),
  ('nota_de_ouro', 'Nota de Ouro', 'Tire média acima de 9,0.', '🥇', 'media_geral', 9.0, 200),
  ('frequencia_perfeita', 'Frequência Perfeita', '30 dias sem faltas.', '📅', 'sequencia_dias', 30, 200)
on conflict (chave) do nothing;

-- Cosméticos: avatares (nível 1 = padrão/grátis), molduras e capas desbloqueadas
-- por nível, e títulos desbloqueados por nível OU por conquista específica.
insert into cosmeticos (tipo, chave, label, valor, nivel_minimo, conquista_chave) values
  ('avatar', 'avatar_padrao', 'Padrão', '🙂', 1, null),
  ('avatar', 'avatar_anime_1', 'Anime 1', '🧑‍🎤', 1, null),
  ('avatar', 'avatar_anime_2', 'Anime 2', '👧', 1, null),
  ('avatar', 'avatar_pixel_1', 'Pixel 1', '🧙', 2, null),
  ('avatar', 'avatar_pixel_2', 'Pixel 2', '🧝', 2, null),
  ('avatar', 'avatar_robo_1', 'Robô 1', '🤖', 3, null),
  ('avatar', 'avatar_emoji_1', 'Emoji 1', '😎', 1, null),

  ('moldura', 'moldura_padrao', 'Básica', 'ring-2 ring-border', 1, null),
  ('moldura', 'moldura_neon', 'Neon', 'ring-2 ring-ai', 2, null),
  ('moldura', 'moldura_fogo', 'Fogo', 'ring-2 ring-streak', 4, null),
  ('moldura', 'moldura_cyberpunk', 'Cyberpunk', 'ring-2 ring-accent', 6, null),

  ('capa', 'capa_padrao', 'Padrão', 'from-banner-from to-banner-to', 1, null),
  ('capa', 'capa_synthwave', 'Synthwave', 'from-fuchsia-600 to-indigo-600', 1, null),
  ('capa', 'capa_arcade', 'Arcade', 'from-amber-500 to-pink-600', 3, null),
  ('capa', 'capa_neotoquio', 'Neo Tóquio', 'from-cyan-500 to-blue-700', 5, null),
  ('capa', 'capa_galaxia', 'Galáxia', 'from-indigo-900 to-purple-700', 5, null),

  ('titulo', 'novato_do_saber', 'Novato do Saber', 'Novato do Saber', 1, null),
  ('titulo', 'cacador_de_xp', 'Caçador de XP', 'Caçador de XP', 2, null),
  ('titulo', 'coruja_noturna', 'Coruja Noturna', 'Coruja Noturna', 3, null),
  ('titulo', 'mestre_do_algebra', 'Mestre do Álgebra', 'Mestre do Álgebra', 5, null),
  ('titulo', 'speedrunner_de_prova', 'Speedrunner de Prova', 'Speedrunner de Prova', 7, null),
  ('titulo', 'lenda_da_turma', 'Lenda da Turma', 'Lenda da Turma', 10, null),
  ('titulo', 'titulo_pontual', 'Pontual', 'Pontual', 1, 'pontual'),
  ('titulo', 'titulo_estudioso', 'Estudioso', 'Estudioso', 1, 'estudioso')
on conflict (chave) do nothing;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
