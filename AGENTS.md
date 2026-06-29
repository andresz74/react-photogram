# Repository Guidelines

## Project Structure & Module Organization
- `src/components/`: UI modules grouped by feature (`App`, `Gallery`, `Layout`, `Login`, shared `Common`).
- `src/state/`: Redux store setup, action types/creators, and reducers.
- `src/api/`: client calls for images/users APIs.
- `src/utils/` and `src/utillity/`: helpers (logging, idle timer, UUID helpers).
- `public/`: static assets used by CRA.
- `src/assets/`: bundled fonts and CSS icon assets.
- Tests currently live beside components (example: `src/components/App/App.test.tsx`).

## Provider-Backed Frontend Boundary
- Backend access belongs under `src/api/`; React components and Redux thunks should call API helpers rather than building backend URLs.
- The frontend depends on `REACT_APP_API_URL` only for backend access.
- Do not add frontend env vars for `AUTH_PROVIDER`, `DATABASE_PROVIDER`, `STORAGE_PROVIDER`, `SQLITE_PATH`, `LOCAL_STORAGE_ROOT`, or `FIREBASE_SERVICE_ACCOUNT_PATH`.
- Legacy Firebase/Firestore API exports may remain for compatibility, but migrated user-facing gallery/upload/delete/archive/visibility flows should use canonical backend API functions.

## Auth & Image Flow Rules
- Firebase Auth remains for login/bootstrap and ID token retrieval; authenticated backend calls use `auth.currentUser.getIdToken()`.
- Do not store ID tokens in Redux, `localStorage`, or `sessionStorage`, and do not send UID as the ownership source of truth.
- Current migrated flows: `/` -> `Api.listPublicImages()`, `/mygallery` -> `Api.listMyImages({ idToken })`, archived `/mygallery` -> `Api.listMyImages({ idToken, archived: true })`.
- Mutations use: `/upload` -> `Api.uploadImage({ file, idToken, description, isPublic })`, delete -> `Api.deleteImage({ imageId, idToken })`, hide/show -> `Api.updateImageVisibility({ imageId, idToken, isPublic })`, archive/unarchive -> `Api.archiveImageById({ imageId, idToken })` / `Api.unarchiveImageById({ imageId, idToken })`.
- Use backend image IDs for delete/archive/hide/show; do not derive IDs from `imageUrl`, `imgSrc`, filenames, Firebase paths, or storage paths.
- Do not store `storageKey` or `thumbnailKey` in UI state.

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
- For provider-backed flow changes, update relevant `src/api`, `src/state`, and component tests.

## Commit & Pull Request Guidelines
- Prefer Conventional Commit prefixes used in history: `feat:`, `fix:` (example: `feat: improve modal image loading`).
- Keep commits scoped and atomic; include issue/PR references when relevant (for example `(#26)`).
- PRs should include a concise behavior summary, test evidence (`yarn test` plus manual UI checks), and screenshots/video for UI changes.
- Link issues when available and call out backend/API contract impacts explicitly.

## Security & Configuration Tips
- Keep secrets in `.env`; never hardcode Firebase/API credentials.
- Required env vars are `REACT_APP_*` keys consumed in `src/firebase.configuration.ts` and `src/config.ts`.
