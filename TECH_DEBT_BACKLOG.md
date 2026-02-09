# Technical Debt Execution Backlog

This backlog operationalizes `CODEBASE_ANALYSIS.md` into implementable work items.

## Milestones
- M1: Restore testability and baseline CI reliability.
- M2: Fix data consistency and error-state architecture.
- M3: Reduce maintenance drag and modernize incrementally.

## Backlog

### TD-001: Make Firebase initialization test-safe
- Priority: P0
- Effort: 0.5-1 day
- Depends on: none
- Scope:
  - Move `auth.setPersistence(...)` out of eager module initialization.
  - Gate persistence behavior by runtime context (browser vs test) or inject Firebase adapter.
- DoD:
  - `CI=true yarn test --watchAll=false` executes test suites without `auth/unsupported-persistence-type`.
  - No Firebase side effects on import in test runtime.

### TD-002: Replace stale app test and add core smoke coverage
- Priority: P0
- Effort: 1-2 days
- Depends on: TD-001
- Scope:
  - Replace `src/components/App/App.test.tsx` legacy assertion.
  - Add smoke tests for route rendering, auth-dependent navigation, and gallery empty state.
- DoD:
  - At least 4 meaningful tests pass locally and in CI.
  - No test depends on external network/Firebase services.

### TD-003: Add CI quality gate
- Priority: P0
- Effort: 0.5 day
- Depends on: TD-001, TD-002
- Scope:
  - Add pipeline jobs for:
    - `npx tsc --noEmit`
    - `CI=true yarn test --watchAll=false`
    - `yarn build`
- DoD:
  - PRs cannot merge when any gate fails.
  - CI status visible on PR.

### TD-004: Make delete workflow consistent/atomic
- Priority: P1
- Effort: 1-2 days
- Depends on: none (can run parallel to TD-002/003)
- Scope:
  - Refactor delete path to avoid Firestore/storage divergence.
  - Preferred: single backend endpoint handles storage + metadata deletion transactionally.
  - Fallback: compensating action + retry queue and failure surfacing.
- DoD:
  - Failure in storage deletion does not silently leave inconsistent state.
  - User receives explicit error status on partial/full failure.

### TD-005: Normalize error handling and user-visible error state
- Priority: P1
- Effort: 1-2 days
- Depends on: none
- Scope:
  - Introduce Redux request state model: `idle | loading | succeeded | failed` + `error` per feature.
  - Replace ad-hoc `console.error` in UI paths with centralized logger + dispatchable errors.
- DoD:
  - Gallery/auth/upload flows expose error state in UI.
  - Reducers persist actionable error messages instead of dropping payloads.

### TD-006: Tighten TypeScript boundaries in state/API layer
- Priority: P1
- Effort: 1 day
- Depends on: TD-005 (recommended)
- Scope:
  - Remove `any` from dispatch/getState/action creators and API promises.
  - Introduce typed API response interfaces and thunk helper types.
- DoD:
  - No `any` remains in `src/state/actionCreators/`, `src/components/App/AppInitializer.tsx`, and key API methods.
  - `npx tsc --noEmit` passes.

### TD-007: Route-level auth guards for protected pages
- Priority: P2
- Effort: 0.5-1 day
- Depends on: none
- Scope:
  - Add protected routing for `/upload` and `/mygallery`.
  - Redirect unauthenticated users to `/login` with optional return path.
- DoD:
  - Direct navigation to protected routes when signed out redirects consistently.

### TD-008: Remove dead/legacy code and naming drift
- Priority: P2
- Effort: 0.5-1 day
- Depends on: TD-002 (to avoid deleting code before test baseline)
- Scope:
  - Remove/justify unused `DeleteImage` export path.
  - Resolve `src/utillity/` legacy module usage and naming typo (`utillity` -> `utility` if retained).
- DoD:
  - No unused exported components/utilities in gallery utility surface.
  - `rg` confirms no dangling imports.

### TD-009: Accessibility and modal interaction hardening
- Priority: P2
- Effort: 0.5 day
- Depends on: none
- Scope:
  - Move `Modal.setAppElement('#root')` to one-time bootstrap.
  - Replace clickable icon-only close control with semantic button + keyboard/focus behavior checks.
- DoD:
  - Modal close controls are keyboard-accessible and screen-reader friendly.

### TD-010: Repository hygiene and docs correction
- Priority: P2
- Effort: 0.5 day
- Depends on: none
- Scope:
  - Fix README inaccuracies and remove conversational artifacts.
  - Standardize package manager and remove extra lockfile.
- DoD:
  - README reflects actual repo layout/runtime.
  - Exactly one lockfile remains.

### TD-011: Dependency modernization spike
- Priority: P3
- Effort: 2-4 days (spike)
- Depends on: TD-001..TD-003 complete
- Scope:
  - Assess migration path from current stack (React 17/Firebase v7/CRA5).
  - Produce upgrade RFC with risk matrix and phased rollout.
- DoD:
  - Written RFC with target versions, blockers, and migration sequence.
  - Go/no-go decision for full modernization.

## Suggested implementation order
1. TD-001
2. TD-002
3. TD-003
4. TD-004 and TD-005 (parallel)
5. TD-006
6. TD-007
7. TD-008, TD-009, TD-010 (parallel)
8. TD-011

## Completion criteria (debt burn-down)
- Green CI gate for typecheck, tests, and build on every PR.
- No P0/P1 backlog items open.
- No known data inconsistency path in delete flow.
- Errors are represented in state and visible in UX for critical flows.
- Clear modernization decision documented (continue maintenance vs upgrade project).
