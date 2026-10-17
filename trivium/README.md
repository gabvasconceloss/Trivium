# Trivium — Plataforma de Estudo (v3: Professor/Aluno, gamificação completa)

React + Vite (JavaScript) + Supabase + PWA instalável. Dois papéis de usuário
(Aluno e Professor), XP em ledger com nível calculado, conquistas, ranking
semanal/geral, indicação de amigos, customização de perfil (avatar/moldura/
capa/título), editor de notas por blocos, curadoria de vídeos por IA,
atividades formais criadas pelo professor com entrega/nota por aluno, e
calendário pessoal.

## Rodando localmente
```
npm install
npm run dev
```

## Configuração do Supabase

### 1) `.env`
Duplique `.env.example` → `.env`, preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
(Project Settings → API no painel do Supabase).

### 2) Login por e-mail/senha
Authentication → Providers → Email já vem habilitado por padrão. Para testes,
considere desativar "Confirm email" em Authentication → Settings.

### 3) Banco de dados
Cole o conteúdo de `supabase/schema.sql` inteiro no SQL Editor e rode. Ele cria:
- `professores`, `turmas` (com `codigo_acesso` gerado no cadastro da turma),
  `alunos` (com `nivel`, `codigo_indicacao`, campos de customização de perfil)
- `materias`, `topicos` (editor por blocos), `cache_buscas`
- `atividades` (criadas só pelo professor, por turma) + `entregas` (uma por aluno)
- `eventos` (calendário pessoal do aluno — nunca gera XP/nota)
- `conquistas`, `aluno_conquistas`, `xp_transacoes` (ledger de XP),
  `indicacoes` (amigo), `cosmeticos`, `aluno_cosmeticos`
- Todas as funções/triggers de gamificação (`SECURITY DEFINER`) e as policies de RLS
- Bucket de Storage `notas-imagens`

> Se você já tinha um banco de uma versão anterior deste projeto, **não dá para
> rodar este schema por cima**: as tabelas `turmas` e `atividades` mudaram de
> forma incompatível. Veja `MIGRATION_v3.md` para os comandos de limpeza.

### 4) Edge Function de curadoria
```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy curadoria-videos
supabase secrets set GEMINI_API_KEY=sua-chave-gemini
supabase secrets set YOUTUBE_API_KEY=sua-chave-youtube
```

## Fluxo de teste
1. Cadastre-se como **Professor** → no painel, crie uma turma → copie o código gerado.
2. Cadastre-se como **Aluno** usando esse código.
3. Como professor, crie uma atividade na turma (gera entrega pendente para todos os alunos automaticamente).
4. Como aluno: marque a atividade como entregue (Atividades), crie cadernos/resumos, busque aulas com IA, confira XP/nível/sequência no Dashboard.
5. Como professor, lance a nota da atividade entregue.
6. Como aluno, confira em **Meu Perfil**: XP, nível, ranking semanal da turma, indicação de amigos e personalização (avatar/moldura/capa/título — itens bloqueados mostram o nível necessário).

## Build de produção
```
npm run build && npm run preview
```
Publique `dist/` em qualquer hospedagem estática com HTTPS.

## Pendência registrada
O XP de recompensa da indicação de amigo está fixo em 30 XP (função
`trivium_resgatar_indicacao` em `supabase/schema.sql`) — ajuste quando definir
o valor final.
