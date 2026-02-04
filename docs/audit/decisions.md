# Cleanup Decisions - Salva Plantão

Data: 4 de fevereiro de 2026

## DECISIONS MADE (Based on Evidence)

### ✅ CORS Configuration - CENTRALIZED (No Action Needed)
**Status**: **GOOD** - Single centralized CORS configuration found
**Location**: `server/index.ts:142-179`
**Evidence**: Only one CORS implementation found in codebase
**Decision**: **KEEP AS IS** - Well implemented with allowlist

```typescript
// CONFIRMED: Single CORS source of truth
const allowedOrigins = [
  process.env.APP_URL, // https://appsalvaplantao.com.br
  process.env.FRONTEND_URL,
  "http://localhost:5000",
  "http://localhost:5173", 
  "http://localhost:3000"
];
```

### ✅ Authentication System - CONSOLIDATED (No Action Needed)  
**Status**: **GOOD** - Modern JWT system is primary
**Primary**: `server/auth/independentAuth.ts` (JWT + Cookies)
**Secondary**: `server/auth/googleAuth.ts` (Google OAuth integration)
**Legacy**: `server/auth/authRoutes.ts` (Session-based, potentially unused)
**Decision**: **INVESTIGATE** legacy auth routes usage

### ✅ Frontend Routes - NO CONFLICTS (No Action Needed)
**Status**: **GOOD** - All routes properly imported and used
**Evidence**: PowerShell analysis showed all 46 pages actively imported  
**Router**: Single file architecture in `App.tsx`
**Decision**: **KEEP ALL** - No dead routes found

### ✅ Backend API - MODULAR (No Action Needed)
**Status**: **GOOD** - 375 routes properly organized in modules
**Evidence**: Clean modular registration in `server/routes.ts`
**Decision**: **KEEP STRUCTURE** - Well organized

## CLEANUP PLAN (APPROVED FOR EXECUTION)

### Phase 1: SAFE DELETIONS - Dead Components  
**Files to Delete (4):**
```
client/src/components/ElectrolyteCalculator.tsx  # 0 imports
client/src/components/GuardExamples.tsx         # 0 imports  
client/src/components/PaymentLock.tsx           # 0 imports
client/src/components/PaywallModal.tsx          # 0 imports
```

### Phase 2: SAFE DELETIONS - Temp Files
**Files to Delete (3):**
```
server_error.log      # Runtime log
server_output.log     # Runtime log  
last-health-check.json # Temp health data
```

### Phase 3: DOCUMENTATION CLEANUP - Obsolete Docs
**Files to Delete (28):** Historical/completed phase documentation
```
# AUTH Documentation (4 files) - Migration completed
AUTH_MIGRATION_COMPLETE.md
AUTH_MODERN_COMPLETE.md  
AUTH_MODERN_PR.md
AUTH_MODERN_SETUP.md

# BLOCO Documentation (4 files) - Implementation phases completed
BLOCO_1_LOGIN_STATUS.md
BLOCO_2_ROTAS_STATUS.md
BLOCO_3_GUARDS_STATUS.md
BLOCO_4_SUBSCRIBE_STATUS.md

# WEBHOOK Documentation (12 files) - Implementation completed
WEBHOOK_ASAAS_ENTREGA_FINAL.md
WEBHOOK_CONCLUSION.md
WEBHOOK_FINAL_DELIVERY.md
WEBHOOK_FINAL_REPORT.md
WEBHOOK_FIX_COMPLETE.md
WEBHOOK_IMPLEMENTATION_FINAL.md
WEBHOOK_IMPLEMENTATION_INDEX.md
WEBHOOK_MASTER.md
WEBHOOK_QUICK_START.md
WEBHOOK_README.md
WEBHOOK_STATUS.md
WEBHOOK_TABLE_REFERENCE.md

# STATUS Documentation (8 files) - Historical status docs
DEPLOY_SUCCESS_BLOCOS.md
FASE_STATUS.md
IMPLEMENTATION_SUMMARY.md
INDEX_WEBHOOK_DOCS.md
MIGRATION_IMPLEMENTATION_REPORT.md
README_IMPLEMENTATION.md
STATUS_FINAL.md
```

### Phase 4: INVESTIGATION REQUIRED

#### Legacy Auth Routes
**File**: `server/auth/authRoutes.ts`
**Action**: Verify if routes are still used in production
**Test**: Check if session-based endpoints receive traffic

#### Import/Database Scripts  
**Files**: 
- `import-medications.mjs` 
- `import-pathologies.mjs`
- `check-all-tables.mjs`
- `check-tables.mjs` 
- `check-users.cjs`

**Action**: Determine if needed for maintenance or one-time use

#### Environment Files
**Files**:
- `.env.local`
- `.env.prod.test` 
- `.env.test`

**Action**: Check if actively used by build/test processes

## WHAT TO PRESERVE (CRITICAL)

### ✅ Production Anchor Domain
**Domain**: `https://appsalvaplantao.com.br` 
**Status**: Hardcoded correctly throughout codebase
**Action**: **NO CHANGES** to domain logic

### ✅ Current Integration Points
**Asaas Billing**: ✅ Working (`/api/webhooks/asaas`)
**Google OAuth**: ✅ Working (`/api/auth/google/*`)
**Cloud Run**: ✅ Working (current deployment)
**Cloud SQL**: ✅ Working (DATABASE_URL configured)
**WebSocket**: ✅ Working (same HTTP server)

### ✅ Authentication Flow
**Primary**: JWT + HTTPOnly cookies
**Secondary**: Google OAuth integration  
**Status**: Production tested, working

### ✅ All Recovery/Emergency Scripts
**Files**: 
- `recovery-data.ts`
- `recovery-simple.js`
- `recovery.mjs` 
- `reset-admin-password.cjs`
- `reset-password.cjs`

**Rationale**: Critical for emergency situations

### ✅ All Test Scripts
**Files**: All `test-*.ps1` and `webhook-test.*` files
**Rationale**: Required for development and deployment verification

## COMMIT STRATEGY

### Commit 1: Remove Dead Components
```bash
git rm client/src/components/ElectrolyteCalculator.tsx
git rm client/src/components/GuardExamples.tsx  
git rm client/src/components/PaymentLock.tsx
git rm client/src/components/PaywallModal.tsx
git commit -m "chore: remove dead frontend components (0 imports found)"
```

### Commit 2: Remove Temp Files
```bash
git rm server_error.log server_output.log last-health-check.json
git commit -m "chore: remove temporary runtime logs"
```

### Commit 3: Remove Obsolete Documentation  
```bash
git rm AUTH_*.md BLOCO_*.md WEBHOOK_*.md DEPLOY_SUCCESS_BLOCOS.md FASE_STATUS.md IMPLEMENTATION_SUMMARY.md INDEX_WEBHOOK_DOCS.md MIGRATION_IMPLEMENTATION_REPORT.md README_IMPLEMENTATION.md STATUS_FINAL.md
git commit -m "chore: remove obsolete documentation from completed implementation phases"
```

### Commit 4: Investigation Results
```bash
# After investigation phase
git commit -m "refactor: consolidate remaining cleanup items"
```

## RISK ASSESSMENT: **LOW RISK**

### Why This Cleanup is Safe:
1. **Evidence-based**: All deletions supported by concrete evidence (import counts, completion status)
2. **Production-preserving**: No changes to active functionality
3. **Rollback-ready**: All changes are in version control
4. **Modular commits**: Each change is atomic and reversible

### Production Protection:  
- ✅ No API route changes
- ✅ No authentication changes
- ✅ No database changes  
- ✅ No CORS/domain changes
- ✅ No build process changes