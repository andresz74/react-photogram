# Photogram

Photogram is a React 17 + TypeScript CRA photo gallery frontend. Firebase Auth remains responsible for login and Firebase ID token retrieval, while image gallery, upload, delete, archive, and visibility flows now call the Photogram backend API.

The frontend is provider-agnostic. It does not know whether the backend stores metadata in Firebase, SQLite, local files, or another provider.

## Tech Stack
- React 17 + TypeScript
- Redux + redux-thunk
- React Router v6
- Firebase Auth
- CRA (`react-scripts`)

## Architecture
```text
React frontend
  -> src/api/images.ts
  -> REACT_APP_API_URL
  -> Photogram backend API
```

Backend provider settings belong to the backend environment only. The frontend should use:

```env
REACT_APP_API_URL=http://localhost:3003
```

The frontend should not use:

```text
AUTH_PROVIDER
DATABASE_PROVIDER
STORAGE_PROVIDER
SQLITE_PATH
LOCAL_STORAGE_ROOT
FIREBASE_SERVICE_ACCOUNT_PATH
```

## Environment Variables
Create `.env` in the project root:

```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
REACT_APP_API_URL=http://localhost:3003
```

`REACT_APP_API_URL` points to the backend base URL. Avoid a trailing slash. Do not put backend secrets, service-account JSON, or provider settings in the frontend `.env`. CRA only exposes variables prefixed with `REACT_APP_`.

## Development Commands
```bash
yarn install
yarn start
yarn test --watchAll=false
yarn build
```

`yarn start` runs the frontend at `http://localhost:3000`.

## Migrated Frontend Flows
```text
/                     -> GET /images/public
/mygallery            -> GET /images/me
/mygallery archived   -> GET /images/me?archived=true
/upload               -> POST /images
delete                -> DELETE /images/:imageId
hide/show             -> PATCH /images/:imageId/visibility
archive               -> POST /images/:imageId/archive
unarchive             -> POST /images/:imageId/unarchive
```

Public gallery does not require auth. Authenticated flows use `auth.currentUser.getIdToken()` and send `Authorization: Bearer <firebase-id-token>`. ID tokens are not stored in Redux, `localStorage`, or `sessionStorage`.

The backend infers ownership from the token. Image IDs must come from backend image metadata IDs; do not derive IDs from image URLs, filenames, Firebase paths, or storage paths.

## Backend API Contract
Required backend routes:

```text
GET    /images/public
GET    /images/me
POST   /images
DELETE /images/:imageId
PATCH  /images/:imageId/visibility
POST   /images/:imageId/archive
POST   /images/:imageId/unarchive
GET    /media/*
```

Expected image DTO shape at a high level:

```ts
{
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt: string;
}
```

Frontend code should not consume provider-specific fields such as:

```text
storageKey
thumbnailKey
filesystem paths
Firebase bucket names
```

## Manual Validation
Run the backend first on `http://localhost:3003`.

Run the frontend with:

```env
REACT_APP_API_URL=http://localhost:3003
```

Browser checklist:

```text
1. Visit /
   Expect GET /images/public without Authorization.

2. Sign in.

3. Visit /mygallery
   Expect GET /images/me with Authorization: Bearer <firebase-id-token>.

4. Visit /upload and upload an image
   Expect POST /images with multipart field image.

5. Hide the image
   Expect PATCH /images/:imageId/visibility with { "isPublic": false }.
   Refresh / and confirm it disappears from public gallery.

6. Show the image
   Expect PATCH /images/:imageId/visibility with { "isPublic": true }.
   Refresh / and confirm it appears publicly again.

7. Archive the image
   Expect POST /images/:imageId/archive.
   Refresh /mygallery and confirm it disappears from normal view.

8. Open archived view
   Expect GET /images/me?archived=true.

9. Unarchive the image
   Expect POST /images/:imageId/unarchive.

10. Delete the image
    Expect DELETE /images/:imageId.
    Refresh /mygallery and confirm it remains deleted.
```

## Testing
Run the standard checks:

```bash
yarn test --watchAll=false
yarn build
```

Focused examples:

```bash
yarn test --watchAll=false --runTestsByPath src/api/images.test.ts
yarn test --watchAll=false --runTestsByPath src/state/actionCreators/index.test.ts
yarn test --watchAll=false --runTestsByPath src/components/App/App.test.tsx
yarn test --watchAll=false --runTestsByPath src/components/Gallery/UploadImage/UploadImage.test.tsx
yarn test --watchAll=false --runTestsByPath src/components/Gallery/ShowGallery/ShowGallery.test.tsx
```

## Safety
Do not commit:

```text
.env
build/
node_modules/
local logs
secrets
```

Backend service-account JSON must never be added to this frontend repo.

## Docs
- `docs/photogram-provider-agnostic-system-spec.md`
- `docs/photogram-mvp-implementation-plan.md`
