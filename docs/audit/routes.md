# Route Inventory - Salva Plantão

Data: 4 de fevereiro de 2026

## Frontend Routes (React Router)

### Public Routes
| Route | Component | Description | Source |
|-------|-----------|-------------|---------|
| `/` | Landing | Landing page pública | App.tsx:150 |
| `/welcome` | Redirect to `/` | Redirecionamento legacy | App.tsx:151-153 |
| `/login` | Login | Página de login | App.tsx:154 |
| `/plans` | Plans | Seleção de planos | App.tsx:155 |
| `/subscribe` | Subscribe | Processo de assinatura | App.tsx:156 |
| `/auth/magic` | MagicLink | Magic link auth | App.tsx:157 |
| `/auth/callback` | AuthCallback | OAuth callback | App.tsx:158 |
| `/billing/success` | BillingSuccess | Sucesso no pagamento | App.tsx:266 |
| `/billing/cancel` | BillingCancel | Cancelamento de pagamento | App.tsx:267 |
| `/billing/pix` | BillingPix | Pagamento PIX | App.tsx:268 |

### Protected Routes (Require Auth)
| Route | Component | Description | Source |
|-------|-----------|-------------|---------|
| `/dashboard` | Dashboard | Dashboard principal | App.tsx:165 |
| `/atendimento` | AtendimentoHub | Hub de atendimento | App.tsx:170 |
| `/ferramentas` | FerramentasHub | Hub de ferramentas | App.tsx:174 |
| `/financeiro` | FinanceiroHub | Hub financeiro | App.tsx:178 |
| `/perfil` | PerfilHub | Hub do perfil | App.tsx:182 |
| `/prescriptions` | Prescriptions | Prescrições médicas | App.tsx:187 |
| `/protocols` | Protocols | Protocolos médicos | App.tsx:191 |
| `/flashcards` | Flashcards | Flashcards de estudo | App.tsx:195 |
| `/memorize` | Memorize | Memorização | App.tsx:199 |
| `/checklists` | Checklists | Listas de verificação | App.tsx:207 |
| `/shifts` | Shifts | Gestão de plantões | App.tsx:211 |
| `/handovers` | Handovers | Passagem de caso | App.tsx:215 |
| `/notes` | Notes | Anotações | App.tsx:219 |
| `/library` | Library | Biblioteca médica | App.tsx:223 |
| `/finance` | Finance | Controle financeiro | App.tsx:227 |
| `/exams` | Exams | Exames médicos | App.tsx:231 |
| `/ai-chat` | AiInterconsult | Chat com IA | App.tsx:235 |
| `/ai-settings` | AiSettings | Configurações da IA | App.tsx:239 |
| `/profile` | Profile | Perfil do usuário | App.tsx:243 |
| `/settings` | Settings | Configurações | App.tsx:247 |
| `/donate` | Donate | Doações | App.tsx:251 |
| `/drug-interactions` | DrugInteractions | Interações medicamentosas | App.tsx:255 |
| `/ai-assistant` | AiAssistant | Assistente IA | App.tsx:259 |
| `/evolution` | Evolution | Evolução médica | App.tsx:263 |
| `/medical-certificate` | MedicalCertificate | Atestados médicos | App.tsx:271 |
| `/attendance-declaration` | AttendanceDeclaration | Declaração de comparecimento | App.tsx:275 |
| `/referral` | Referral | Encaminhamentos | App.tsx:279 |
| `/ai-webview` | AiWebView | IA WebView | App.tsx:283 |
| `/chat` | Chat | Chat interno | App.tsx:287 |
| `/notificacoes` | Notifications | Notificações | App.tsx:291 |
| `/sobre` | About | Sobre o app | App.tsx:295 |

### Admin Routes (Require Admin Role)
| Route | Component | Description | Source |
|-------|-----------|-------------|---------|
| `/admin` | Admin | Painel administrativo | App.tsx:161 |
| `/import-templates` | ImportTemplates | Importar templates | App.tsx:203 |

## Backend API Routes

### Total Routes Identified: 375 routes

### Authentication Routes
| Method | Path | Handler | Description | Source |
|--------|------|---------|-------------|---------|
| GET | `/health` | - | Health check | server/index.ts:59 |
| GET | `/api/health` | - | API health check | server/index.ts:69 |
| POST | `/api/auth/login` | - | Login | auth/independentAuth.ts |
| POST | `/api/auth/register` | - | Register | auth/independentAuth.ts |
| GET | `/api/auth/google/start` | - | Google OAuth start | auth/googleAuth.ts |
| GET | `/api/auth/google/callback` | - | Google OAuth callback | auth/googleAuth.ts |

### Admin Routes
| Method | Path | Handler | Description | Source |
|--------|------|---------|-------------|---------|
| GET | `/api/admin/users` | authenticate, checkAdmin | Listar usuários | routes.ts:146 |
| PATCH | `/api/admin/users/:id/status` | authenticate, checkAdmin | Alterar status | routes.ts:151 |
| PATCH | `/api/admin/users/:id/role` | authenticate, checkAdmin | Alterar role | routes.ts:157 |
| PATCH | `/api/admin/users/:id/activate` | authenticate, checkAdmin | Ativar usuário | routes.ts:164 |
| GET | `/api/admin/users/:id/details` | authenticate, checkAdmin | Detalhes do usuário | routes.ts:174 |
| PATCH | `/api/admin/users/:id/profile` | authenticate, checkAdmin | Atualizar perfil | routes.ts:196 |

### Chat Routes
| Method | Path | Handler | Description | Source |
|--------|------|---------|-------------|---------|
| GET | `/api/conversations` | authenticate | Listar conversas | replit_integrations/chat/routes.ts:84 |
| GET | `/api/conversations/:id` | authenticate | Obter conversa | replit_integrations/chat/routes.ts:95 |
| POST | `/api/conversations` | authenticate | Criar conversa | replit_integrations/chat/routes.ts:117 |
| DELETE | `/api/conversations/:id` | authenticate | Deletar conversa | replit_integrations/chat/routes.ts:140 |
| POST | `/api/conversations/:id/messages` | authenticate | Enviar mensagem | replit_integrations/chat/routes.ts:157 |
| GET | `/api/chat/health` | - | Chat health check | replit_integrations/chat/routes.ts:317 |

## Route Conflicts and Issues

### 1. Legacy Route Redirects
- `/welcome` → `/` (redirecionamento implementado)

### 2. Duplicate Domain Logic
- **FOUND**: Multiple CORS configurations may exist
- **ACTION NEEDED**: Centralize domain allowlist

### 3. Unused/Dead Routes
- **None identified**: All routes are properly imported and used

## Router Architecture

### Current Structure
- **Frontend**: Single file router in `App.tsx` with Wouter
- **Backend**: Modular route registration in `server/routes.ts`
- **Shared**: Route contracts in `shared/routes.ts`

### Protection Levels
1. **Public**: No authentication required
2. **Protected**: `ProtectedRoute` wrapper with `useAuth`  
3. **Admin**: `AdminRoute` wrapper with `useAuthGuard`

### Guards Implementation
- `ProtectedRoute`: Redirects to `/login` if not authenticated
- `AdminRoute`: Redirects to `/dashboard` if not admin
- Both use centralized auth guards from `hooks/use-auth-guard.ts`