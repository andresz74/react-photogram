# Photogram

Photogram is a React + Redux + Firebase photo gallery frontend. It supports authentication, public/private gallery views, image upload with progress, archive/private toggles, and delete operations.

## Tech Stack
- React 17 + TypeScript
- Redux + redux-thunk
- React Router v6
- Firebase Auth + Firestore
- CRA (`react-scripts`)

## Prerequisites
- Node.js `18` (see `.nvmrc`)
- Yarn 1.x
- Firebase project and API/backend endpoint for image processing/deletion

## Setup
1. Install dependencies:
```bash
yarn install
```
2. Create `.env` in the project root:
```bash
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
REACT_APP_API_URL=http://localhost:3003
```

`REACT_APP_API_URL` is the frontend's backend API boundary. Backend provider settings such as `DATABASE_PROVIDER`, `STORAGE_PROVIDER`, `AUTH_PROVIDER`, `SQLITE_PATH`, and `LOCAL_STORAGE_ROOT` belong only in the backend environment.

## Scripts
- `yarn start`: run local dev server at `http://localhost:3000`
- `yarn test`: run Jest/RTL tests
- `yarn build`: create production build in `build/`
- `yarn eject`: eject CRA config (irreversible)

## Application Routes
- `/`: public gallery
- `/login`: authentication page
- `/upload`: protected upload page (redirects to login when signed out)
- `/mygallery`: protected personal gallery page (redirects to login when signed out)

## Notes
- This repository contains the frontend application.
- The gallery, upload, and delete MVP flows call the backend through `REACT_APP_API_URL`.
- Use Yarn for dependency management (`yarn.lock` is the canonical lockfile).
