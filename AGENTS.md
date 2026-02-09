# Repository Guidelines

## Project Structure & Module Organization
- `src/components/`: UI modules grouped by feature (`App`, `Gallery`, `Layout`, `Login`, shared `Common`).
- `src/state/`: Redux store setup, action types/creators, and reducers.
- `src/api/`: client calls for images/users APIs.
- `src/utils/` and `src/utillity/`: helpers (logging, idle timer, UUID helpers).
- `public/`: static assets used by CRA.
- `src/assets/`: bundled fonts and CSS icon assets.
- Tests currently live beside components (example: `src/components/App/App.test.tsx`).

## Build, Test, and Development Commands
- `yarn start`: run the app locally on `http://localhost:3000`.
- `yarn build`: generate the production bundle in `build/`.
- `yarn test`: run Jest + React Testing Library in watch mode.
- `npm run <script>` is equivalent, but this repo is Yarn-first (`yarn.lock` is committed).

## Coding Style & Naming Conventions
- Language: TypeScript + React functional components.
- Use PascalCase for components/files (`UploadImage.tsx`), camelCase for functions/variables, and UPPER_SNAKE_CASE for constants (`MAX_UPLOAD_BYTES`).
- Keep feature entrypoints as `index.tsx` re-export files.
- Follow existing formatting in touched files (many `.tsx` files use tabs; keep changes consistent with local style).
- Linting is provided by CRA ESLint config (`react-app`, `react-app/jest`) and enforced during normal `react-scripts` workflows.

## Testing Guidelines
- Frameworks: Jest + React Testing Library (`src/setupTests.ts`).
- Name tests `*.test.tsx` next to the component under test.
- Prefer user-focused assertions (`screen.getBy...`) over implementation details.
- Add or adjust tests for behavior changes in routing, gallery state, and upload flows.

## Commit & Pull Request Guidelines
- Prefer Conventional Commit prefixes used in history: `feat:`, `fix:` (example: `feat: improve modal image loading`).
- Keep commits scoped and atomic; include issue/PR references when relevant (for example `(#26)`).
- PRs should include a concise behavior summary, test evidence (`yarn test` plus manual UI checks), and screenshots/video for UI changes.
- Link issues when available and call out backend/API contract impacts explicitly.

## Security & Configuration Tips
- Keep secrets in `.env`; never hardcode Firebase/API credentials.
- Required env vars are `REACT_APP_*` keys consumed in `src/firebase.configuration.ts` and `src/config.ts`.
