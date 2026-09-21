<<<<<<< HEAD
# Trivium
.
=======
# Trivium — Plataforma de Estudo Inteligente e Simplificada

Boilerplate funcional em **React + Vite (JavaScript) + Supabase**, com suporte a **PWA instalável**
(mobile e desktop), inspirado na proposta do TCC/projeto de extensão e no protótipo do Figma.

## Stack
- React 18 + React Router (Vite como bundler)
- Tailwind CSS (design system próprio — ver `tailwind.config.js`)
- Supabase (`@supabase/supabase-js`): Auth (sessão anônima), Database (Postgres), Edge Functions
- `vite-plugin-pwa`: manifest + service worker gerados automaticamente (instalável, cache offline básico)
- Curadoria de vídeos: Google Gemini API + YouTube Data API v3, executadas em uma Edge Function

## Rodando localmente
```
npm install
npm run dev      # (ou: npm start)
```
Acesse `http://localhost:5173`.

---

# PASSO A PASSO PÓS-EXECUÇÃO

## 1) Configurar o `.env`
Duplique `.env.example` e renomeie para `.env`. No painel do Supabase, vá em
**Project Settings → API** e copie:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public
```

## 2) Habilitar login anônimo no Supabase
O Trivium usa **Supabase Auth com sessões anônimas** para permitir o "login sem atrito por
código de turma" (sem e-mail/senha) e, ao mesmo tempo, ter um `auth.uid()` real para RLS.

No painel: **Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable**.

## 3) Rodar o script SQL
Abra **SQL Editor** no painel do Supabase, cole o conteúdo do arquivo `supabase/schema.sql`
(incluído neste projeto) e clique em **Run**. Ele cria:
- Tabelas `turmas`, `alunos`, `materias`, `topicos`, `cache_buscas`
- Relacionamentos com `ON DELETE CASCADE` (RN04)
- Todas as políticas de RLS (isolamento por aluno — RN07)
- Duas turmas de exemplo: `TURMA8A` e `TURMA9B`

## 4) Publicar a Edge Function de curadoria
Requer a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada.

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy curadoria-videos
```

Configure as chaves de API que a função usa (nunca ficam expostas no front-end — RNF05):
```bash
supabase secrets set GEMINI_API_KEY=sua-chave-gemini
supabase secrets set YOUTUBE_API_KEY=sua-chave-youtube
```
- Gemini (free tier): https://aistudio.google.com/apikey
- YouTube Data API v3: ative no [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com) e gere uma chave de API.

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas automaticamente pelo ambiente de
> Edge Functions — não é preciso configurá-las manualmente.

## 5) Testar autenticação e sincronização
1. Rode `npm run dev` e abra `http://localhost:5173`.
2. Na tela de login, use o código **TURMA8A** (ou TURMA9B) e um nome qualquer.
3. Confirme, no painel do Supabase → **Table Editor → alunos**, que um novo registro apareceu
   vinculado a um `auth_user_id`.
4. Crie um caderno (matéria) → confirme em **materias**.
5. Dentro do caderno, crie um tópico → confirme em **topicos**.
6. Clique em **"Buscar aulas"** no card do tópico. Se as secrets da Edge Function estiverem
   corretas, em alguns segundos os vídeos aparecem embutidos no card (`videos_recomendados`
   preenchido na tabela). Se der erro, veja os logs em **Edge Functions → curadoria-videos → Logs**.
7. Abra o tópico (clique no título) e escreva algo no editor de notas — o rodapé mostra
   "Salvando…" e depois "Salvo ✓" (autosave), e o conteúdo persiste ao recarregar a página.

## 6) Testar a instalação como PWA
- **Desktop (Chrome/Edge):** ícone de instalação na barra de endereço, ou o banner customizado
  que aparece no rodapé da tela.
- **Android (Chrome):** menu "⋮" → "Instalar app" (ou aceite o banner).
- **iOS (Safari):** Compartilhar → "Adicionar à Tela de Início" (o iOS não expõe o evento
  `beforeinstallprompt`, então o banner customizado não aparece lá — esse é o fluxo nativo do
  Safari, mesmo assim funcional graças às meta tags `apple-mobile-web-app-*` no `index.html`).

## 7) Build de produção
```
npm run build
npm run preview   # testa o build localmente
```
Publique a pasta `dist/` em qualquer hospedagem estática com HTTPS (Vercel, Netlify, Cloudflare
Pages etc.) — HTTPS é obrigatório para o service worker/instalação da PWA funcionar fora do
`localhost`.

---

## Observações de segurança e escopo (transparência)
- Como não há senha, a "conta" do aluno vive na sessão anônima do Supabase Auth. Se o aluno
  limpar os dados do navegador/trocar de dispositivo, perde o vínculo com os dados antigos
  (mesma limitação descrita na documentação original, seção RN10).
- As chaves de IA/YouTube só existem nas secrets da Edge Function — nunca no bundle do front-end.
- Este é um **boilerplate funcional completo**, mas antes de uso real com menores de idade,
  revise políticas de privacidade/LGPD, termos de uso e, se necessário, adicione um fluxo de
  consentimento dos responsáveis.
>>>>>>> gabriel_branch
