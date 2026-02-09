# Modernization RFC (TD-011)

## Objective
Reduce platform risk and maintenance drag by modernizing the frontend stack while preserving behavior and release velocity.

## Current Baseline
- React 17 + `react-dom` 17
- CRA (`react-scripts` 5)
- Firebase v7 namespaced SDK
- Redux + `redux-thunk`
- TypeScript 4.1
- Runtime workaround: `NODE_OPTIONS=--openssl-legacy-provider`

## Why Modernize
- Security and ecosystem drift (older transitive dependencies and tooling warnings)
- Increased compatibility friction on current Node/toolchains
- Slower onboarding and CI reliability due to legacy stack constraints

## Options Evaluated
1. Keep current stack and patch only
- Pros: low immediate effort
- Cons: debt compounds; compatibility risk increases

2. Incremental modernization in place (recommended)
- Pros: controlled risk, easier rollback, minimal product disruption
- Cons: requires multiple phases and temporary dual patterns

3. Big-bang migration (framework/tooling + runtime in one move)
- Pros: fastest end-state
- Cons: highest risk, larger freeze window, harder debugging

## Recommended Path (Option 2)
### Phase A: Foundation hardening
- Target: Node LTS current, TypeScript 5.x, dependency cleanup
- Remove `openssl-legacy-provider` dependency in scripts
- Keep CRA initially to limit blast radius

### Phase B: Runtime and library upgrades
- React 18 migration (`createRoot`, strict compatibility checks)
- Firebase move from namespaced v7 API to modular API (`firebase/app`, auth/firestore modular imports)
- Validate auth persistence, upload/delete flows, gallery queries

### Phase C: Tooling migration
- Replace CRA with Vite (or equivalent modern bundler)
- Port env conventions, test runner integration, and build output settings
- Keep route/auth behavior and API contracts unchanged

### Phase D: Stabilization and cleanup
- Remove dead shims/polyfills and obsolete dependencies
- Tighten CI gates and dependency update policy
- Document operational runbooks and rollback steps

## Risk Matrix
- High: Firebase modular migration touches auth/firestore APIs across app
- Medium: React 18 behavior differences under Strict Mode
- Medium: CRA -> Vite config parity (env vars, assets, tests)
- Low: TypeScript and lint/tooling upgrades

## Dependency/Compatibility Blockers
- Firebase query and auth API rewrite scope
- Test harness updates for router + modal + auth initialization
- Build pipeline parity in deployment environment

## Success Criteria
- CI green for typecheck, tests, and production build
- No `openssl-legacy-provider` requirement
- No regressions in login, gallery load, upload, archive/private toggle, delete
- Documented upgrade path for future dependency updates

## Estimated Effort
- Phase A: 1-2 days
- Phase B: 3-5 days
- Phase C: 2-4 days
- Phase D: 1-2 days
- Total: ~7-13 engineering days

## Go/No-Go Recommendation
Go, with phased incremental execution.

Rationale:
- Current stack is functional but increasingly costly to maintain.
- Incremental delivery keeps risk manageable and preserves product momentum.
- Existing CI/test gates now provide enough safety to execute upgrades in slices.
