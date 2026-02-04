# API Inventory - Salva Plantão

Data: 4 de fevereiro de 2026

## Backend Route Files Analysis

### Main Route File: `server/routes.ts`
- **Total routes**: 375 (confirmed via PowerShell count)
- **Registration modules**: 10 registered module types
- **Auth middleware**: Independent auth system

### Route Registration Modules
1. `setupAuthMiddleware(app)` - Auth middleware setup
2. `registerIndependentAuthRoutes(app)` - Independent auth routes  
3. `registerAuthRoutes(app)` - Legacy auth routes
4. `registerGoogleAuthRoutes(app)` - Google OAuth
5. `registerBillingRoutes(app)` - Billing/Asaas integration
6. `registerChatRoutes(app)` - Chat system
7. `registerImageRoutes(app)` - Image processing
8. `registerAiRoutes(app)` - AI features
9. `registerNewFeaturesRoutes(app)` - New features
10. `registerUserProfileRoutes(app)` - User profile management

## Core API Endpoints

### Health & Status
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/health` | Basic health check | None |
| GET | `/api/health` | API health check | None |
| GET | `/_debug/listen` | Debug endpoint | None |

### Authentication & Authorization  
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | User login | None |
| POST | `/api/auth/register` | User registration | None |
| GET | `/api/auth/me` | Get current user | JWT |
| POST | `/api/auth/logout` | User logout | JWT |
| GET | `/api/auth/google/start` | Start Google OAuth | None |
| GET | `/api/auth/google/callback` | Google OAuth callback | None |

### Subscription & Billing
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/subscription/status` | Get subscription status | JWT |
| GET | `/api/subscription/payments` | Get payment history | JWT |
| POST | `/api/webhooks/asaas` | Asaas webhook handler | Webhook Token |

### Administrative
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/users` | List all users | JWT + Admin |
| GET | `/api/admin/users-enhanced` | Enhanced user list | JWT + Admin |
| PATCH | `/api/admin/users/:id/status` | Update user status | JWT + Admin |
| PATCH | `/api/admin/users/:id/role` | Update user role | JWT + Admin |
| POST | `/api/admin/ai/generate` | AI content generation | JWT + Admin |

### Chat System
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/conversations` | List conversations | JWT |
| POST | `/api/conversations` | Create conversation | JWT |
| GET | `/api/conversations/:id` | Get conversation | JWT |
| DELETE | `/api/conversations/:id` | Delete conversation | JWT |
| POST | `/api/conversations/:id/messages` | Send message | JWT |

### Content Management
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/calculator-allowed-meds` | Get allowed medications | JWT |
| POST | `/api/admin/calculator-allowed-meds` | Add allowed medication | JWT + Admin |
| DELETE | `/api/admin/calculator-allowed-meds/:id` | Remove medication | JWT + Admin |

## Authentication Flow Analysis

### Current Active Auth System: **Independent JWT**
- **Primary**: `server/auth/independentAuth.ts`
- **JWT Tokens**: Access + Refresh token pattern
- **Cookie-based**: HTTPOnly cookies for security
- **Google OAuth**: Integrated via `server/auth/googleAuth.ts`

### Legacy Auth Systems (May be redundant)
- `server/auth/authRoutes.ts` - Session-based auth routes
- `server/replit_integrations/` - Replit-specific auth

### Billing Integration: **Asaas**
- **Active**: `server/auth/billingRoutes.ts`
- **Webhook**: `/api/webhooks/asaas` (fully functional)
- **Status**: Production ready, tested

## WebSocket Integration
- **File**: `server/websocket.ts`
- **Auth**: Token-based via message payload
- **Events**: `notification`, `new_message`, `new_support_message`
- **Production**: Active on same HTTP server

## Domain & CORS Configuration

### Production Domain
- **Primary**: `https://appsalvaplantao.com.br`
- **Status**: Active and verified

### CORS Analysis Needed
- **Action Required**: Audit for duplicate CORS configurations
- **Goal**: Single centralized CORS allowlist

## API Client Integration

### Frontend API Client
- **File**: `client/src/lib/queryClient.ts`
- **Pattern**: `apiRequest()` function with `credentials: "include"`
- **Contracts**: Shared types via `@shared/routes`

### Shared Contracts
- **File**: `shared/routes.ts`
- **Purpose**: Type-safe API contracts
- **Usage**: Both frontend and backend import these

## Route Registration Order
```
1. setupAuthMiddleware
2. registerIndependentAuthRoutes  
3. registerAuthRoutes (legacy)
4. registerGoogleAuthRoutes
5. registerBillingRoutes
6. registerChatRoutes
7. registerImageRoutes 
8. registerAiRoutes
9. registerNewFeaturesRoutes
10. registerUserProfileRoutes
```

## Security Middleware Chain
- `authenticate` - JWT token validation
- `checkAdmin` - Admin role verification  
- `checkActive` - Active subscription check
- `trackUserActivity` - Activity tracking