# Copilot instructions (Salva Plantão)

## Visão geral da arquitetura
- Monorepo com React + Vite no frontend (client/) e Express no backend (server/).
- `server/index.ts` cria o HTTP server, ativa WebSocket em `/ws` e, em dev, injeta Vite middleware; em produção serve `dist/public`.
- Tipos/contratos e modelos de dados são compartilhados em `shared/`.

## Estrutura e pontos-chave
- Frontend: `client/src/App.tsx` usa Wouter; rotas protegidas passam por `ProtectedRoute`/`AdminRoute`.
- Backend: rotas principais estão em `server/routes.ts`; acesso a dados via `server/storage.ts` (Drizzle).
- Banco: schema Drizzle + Zod em `shared/schema.ts`; migrations via `drizzle.config.ts`.
- Contratos HTTP: `shared/routes.ts` descreve endpoints (method/path/input/response) e `buildUrl()`.

## Padrões importantes do projeto
- API client: `client/src/lib/queryClient.ts` define `apiRequest()` e o `QueryClient` padrão (sempre `credentials: "include"`).
- Hooks do app geralmente importam `api`/`buildUrl` de `@shared/routes` (ex.: `client/src/hooks/use-prescriptions.ts`).
- Após mutações, use `queryClient.invalidateQueries` para manter cache consistente.

## Autenticação e sessão
- Há dois fluxos de auth: 
  - JWT em cookies (independente) com `authenticate()`/`authenticateAdmin()` em `server/auth/independentAuth.ts`.
  - Sessão baseada em `req.session` (rotas em `server/auth/authRoutes.ts` e `server/replit_integrations/`).
- Muitas rotas em `server/routes.ts` dependem de `authenticate` e usam `req.userId`.

## Tempo real
- WebSocket em `server/websocket.ts`; o cliente se autentica enviando `{ type: "auth", userId }` (ver `client/src/hooks/use-websocket.ts`).
- Mensagens típicas: `notification`, `new_message`, `new_support_message`.

## IA
- Integração OpenAI no backend em `server/ai/routes.ts` e storage em `server/ai/storage.ts`.
- UI relacionada: `client/src/pages/AIChat.tsx` e `AiSettings.tsx`.
- `client/src/hooks/use-assistente-ia.ts` é um placeholder (não chamar API real ali).

## Workflows essenciais
- Dev server: `npm run dev` (Express + Vite middleware).
- Build: `npm run build` (Vite client + esbuild server, ver `script/build.ts`).
- Prod: `npm start` usa `dist/index.cjs`.
- Tipagem: `npm run check`.
- DB: `npm run db:push` (Drizzle, exige `DATABASE_URL`).

## Integrações e variáveis
- `DATABASE_URL` é obrigatório no backend (`server/db.ts`).
- JWTs exigem `JWT_SECRET` e `JWT_REFRESH_SECRET` em produção.
- WebSockets usam o mesmo host/porta do HTTP.

## Convenções rápidas
- Imports com alias: `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets` (ver `vite.config.ts`).
- Sempre respeitar os modelos do `shared/schema.ts` ao criar/alterar rotas e storage.
