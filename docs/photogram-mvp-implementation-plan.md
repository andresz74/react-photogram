# Photogram Provider-Agnostic MVP Implementation Plan

Status: Draft v1
Audience: Codex, project maintainer
Related document: `docs/photogram-provider-agnostic-system-spec.md`

---

## 1. Purpose

This document defines the smallest safe implementation plan for moving Photogram toward a provider-agnostic architecture.

The system specification defines the target architecture. This MVP plan defines the practical order of code changes needed to make the app work with local self-hosted services while preserving existing user-facing behavior.

The MVP is not a full Firebase replacement. It is the first working provider-agnostic slice.

---

## 2. MVP Goal

The MVP goal is:

```text
Photogram can run with Firebase Auth, SQLite metadata, and local filesystem image storage while the frontend remains source-agnostic and talks only to the Photogram backend API for gallery/upload/delete flows.
```

The intended MVP provider configuration is:

```env
AUTH_PROVIDER=firebase
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local
```

This avoids rewriting authentication first. Firebase Auth may remain during the MVP, but Firestore and Firebase Storage should no longer be required for the main gallery/upload/delete flow in local mode.

---

## 3. MVP Non-Goals

The following are intentionally outside the MVP:

1. Local username/password authentication.
2. Full account registration and password reset flows.
3. MinIO, PostgreSQL, Redis, Docker Compose, or background workers.
4. Public/private media optimization through Nginx `X-Accel-Redirect`.
5. Complex pagination, albums, tagging, search, comments, or sharing.
6. Admin dashboards.
7. Full historical data migration from Firestore unless explicitly added later.
8. Removing Firebase SDK usage from login/bootstrap before local auth exists.
9. Perfect Firebase/local feature parity.
10. A generalized plugin system that loads arbitrary provider modules from `.env`.

---

## 4. MVP Success Criteria

The MVP is successful when:

1. Backend provider selection happens once at startup through config/container code.
2. Controllers and services do not branch on provider names.
3. `.env` can select:

    ```env
    AUTH_PROVIDER=firebase
    DATABASE_PROVIDER=sqlite
    STORAGE_PROVIDER=local
    ```

4. Backend upload stores processed images on local disk.
5. Backend upload stores image metadata in SQLite.
6. Backend delete removes local image files and SQLite metadata.
7. Backend gallery endpoints return normalized image DTOs.
8. Frontend public gallery uses backend `GET /images/public`.
9. Frontend user gallery uses backend `GET /images/me`.
10. Frontend upload/delete flows call backend API wrappers only.
11. Frontend gallery/upload/delete flows do not directly use Firestore or Firebase Storage.
12. Existing compatibility endpoints still work where practical:

    ```text
    POST /resize-upload
    POST /delete-image
    ```

13. Automated backend tests cover provider config, local storage, SQLite repository, and image service behavior.
14. Frontend tests cover gallery rendering from backend API responses and upload/delete API calls.
15. The backend remains safe for the Samsung NC110 low-memory deployment profile.

---

## 5. Final MVP Architecture

```text
React frontend
  |
  | Photogram API
  v
Express backend
  |
  |-- AuthProvider=firebase
  |-- ImageRepository=sqlite
  |-- StorageProvider=local
  |-- ImageProcessor=sharp|jimp
  |
  v
Firebase Auth + SQLite DB + local filesystem
```

The frontend should not know whether image metadata comes from Firestore or SQLite. It should not know whether image files come from Firebase Storage or local disk.

---

## 6. Required Environment Variables

### 6.1 Backend Local MVP

```env
NODE_ENV=development
PORT=3000

AUTH_PROVIDER=firebase
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local

SQLITE_PATH=./data/photogram.sqlite
LOCAL_STORAGE_ROOT=./data/images
PUBLIC_MEDIA_BASE_URL=http://localhost:3000/media

FIREBASE_SERVICE_ACCOUNT_PATH=/secure/photogram/firebase-service-account.json

LOW_MEMORY_MODE=true
MAX_FILE_SIZE_MB=5
RESIZE_CONCURRENCY=1
HEAVY_RATE_LIMIT_MAX=8
ENABLE_DEBUG_ENDPOINT=false
IMAGE_PROCESSOR=sharp
```

### 6.2 Backend NC110 Production MVP

```env
NODE_ENV=production
PORT=3000

AUTH_PROVIDER=firebase
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local

SQLITE_PATH=/var/lib/photogram/photogram.sqlite
LOCAL_STORAGE_ROOT=/var/lib/photogram/images
PUBLIC_MEDIA_BASE_URL=https://photos.example.com/media

FIREBASE_SERVICE_ACCOUNT_PATH=/secure/photogram/firebase-service-account.json

LOW_MEMORY_MODE=true
MAX_FILE_SIZE_MB=5
RESIZE_CONCURRENCY=1
HEAVY_RATE_LIMIT_MAX=8
ENABLE_DEBUG_ENDPOINT=false
IMAGE_PROCESSOR=sharp
```

If `sharp` is unstable on the Samsung NC110, switch to:

```env
IMAGE_PROCESSOR=jimp
```

### 6.3 Frontend MVP

```env
REACT_APP_API_URL=http://localhost:3003
```

The frontend can keep Firebase Auth config during the MVP, but gallery/upload/delete should go through backend API clients. Backend provider settings such as `AUTH_PROVIDER`, `DATABASE_PROVIDER`, `STORAGE_PROVIDER`, `SQLITE_PATH`, and `LOCAL_STORAGE_ROOT` are backend-only.

---

## 7. Canonical MVP API Contract

### 7.1 Health

```text
GET /health
```

Response:

```json
{
    "ok": true
}
```

### 7.2 Public Images

```text
GET /images/public
```

Response:

```json
{
    "images": [
        {
            "id": "img_123",
            "ownerId": "uid_123",
            "title": "Example",
            "description": "",
            "imageUrl": "http://localhost:3000/media/users/uid_123/images/img_123.webp",
            "thumbnailUrl": "http://localhost:3000/media/users/uid_123/thumbnails/img_123.webp",
            "width": 1280,
            "height": 720,
            "sizeBytes": 123456,
            "mimeType": "image/webp",
            "isPublic": true,
            "createdAt": "2026-06-22T00:00:00.000Z",
            "updatedAt": "2026-06-22T00:00:00.000Z"
        }
    ]
}
```

### 7.3 My Images

```text
GET /images/me
Authorization: Bearer <firebase-id-token>
```

Response:

```json
{
    "images": []
}
```

### 7.4 Upload Image

```text
POST /images
Authorization: Bearer <firebase-id-token>
Content-Type: multipart/form-data
```

Form fields:

```text
image: File
isPublic: true|false
caption: optional string
```

Response:

```json
{
    "image": {
        "id": "img_123",
        "ownerId": "uid_123",
        "imageUrl": "http://localhost:3000/media/users/uid_123/images/img_123.webp",
        "thumbnailUrl": "http://localhost:3000/media/users/uid_123/thumbnails/img_123.webp",
        "isPublic": true,
        "createdAt": "2026-06-22T00:00:00.000Z"
    }
}
```

### 7.5 Delete Image

```text
DELETE /images/:imageId
Authorization: Bearer <firebase-id-token>
```

Response:

```json
{
    "ok": true
}
```

### 7.6 Compatibility Endpoint: Upload

```text
POST /resize-upload
Authorization: Bearer <firebase-id-token>
Content-Type: multipart/form-data
```

This should call the same backend service used by `POST /images`.

### 7.7 Compatibility Endpoint: Delete

```text
POST /delete-image
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Request:

```json
{
    "imageId": "img_123"
}
```

This should call the same backend service used by `DELETE /images/:imageId`.

---

## 8. Normalized Image DTO

The backend should return this frontend-facing shape regardless of provider:

```ts
type PhotogramImage = {
    id: string;
    ownerId?: string;
    title?: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
    mimeType?: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt?: string;
};
```

Provider-specific fields such as `storageKey`, `thumbnailKey`, Firebase bucket names, filesystem paths, and signed URL internals must not be required by frontend components.

The database should store storage keys, not provider-specific permanent URLs.

---

## 9. SQLite MVP Schema

Use a small SQLite schema first.

```sql
CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    storage_key TEXT NOT NULL,
    thumbnail_key TEXT,
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    mime_type TEXT,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_images_public_created_at
ON images (is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_images_owner_created_at
ON images (owner_id, created_at DESC);
```

MVP delete behavior:

```text
Hard delete files from local storage.
Hard delete or soft delete DB row based on easiest compatibility with current UI.
Preferred initial implementation: soft delete DB row using deleted_at, then exclude deleted rows from list queries.
```

---

## 10. Local Storage Layout

Suggested local development layout:

```text
./data/
  photogram.sqlite
  images/
    users/
      <ownerId>/
        images/
          <imageId>.webp
        thumbnails/
          <imageId>.webp
```

Suggested production layout:

```text
/var/lib/photogram/
  photogram.sqlite
  images/
    users/
      <ownerId>/
        images/
          <imageId>.webp
        thumbnails/
          <imageId>.webp
```

Storage keys should be relative paths such as:

```text
users/<ownerId>/images/<imageId>.webp
users/<ownerId>/thumbnails/<imageId>.webp
```

The local storage provider must reject path traversal attempts such as:

```text
../secret.txt
users/../../secret.txt
/path/outside/root.jpg
```

---

## 11. Implementation Slices

Each slice should be small enough for one Codex task or one focused commit.

---

### Slice 0: Baseline Audit

Goal: establish the current behavior before refactoring.

Tasks:

1. Identify current backend upload/delete routes and Firebase calls.
2. Identify current frontend Firestore and Firebase Storage usage in gallery/upload/delete flows.
3. Record current manual test commands.
4. Record current env variables.

Expected output:

```text
A short note in the PR or commit message listing current files touched by Firebase gallery/storage logic.
```

Acceptance checks:

```bash
# Backend
npm test
npm start

# Frontend
yarn test
yarn build
```

Manual checks:

```text
/login works.
/ public gallery still renders with current provider.
/upload still submits with current provider.
/mygallery still renders with current provider.
```

---

### Slice 1: Backend Env Parsing

Goal: parse and validate provider-related env values in one place.

Files likely added/changed:

```text
config/env.js
tests/env.test.js
index.js
```

Tasks:

1. Add `readEnv()`.
2. Parse provider values:

    ```text
    AUTH_PROVIDER
    DATABASE_PROVIDER
    STORAGE_PROVIDER
    ```

3. Parse local provider values:

    ```text
    SQLITE_PATH
    LOCAL_STORAGE_ROOT
    PUBLIC_MEDIA_BASE_URL
    ```

4. Parse Firebase values:

    ```text
    FIREBASE_SERVICE_ACCOUNT_PATH
    FIREBASE_STORAGE_BUCKET
    FIREBASE_URL_MODE
    FIREBASE_SIGNED_URL_EXPIRES_SECONDS
    ```

5. Parse low-memory values:

    ```text
    LOW_MEMORY_MODE
    MAX_FILE_SIZE_MB
    RESIZE_CONCURRENCY
    HEAVY_RATE_LIMIT_MAX
    ENABLE_DEBUG_ENDPOINT
    IMAGE_PROCESSOR
    ```

6. Validate allowed provider names.
7. Fail fast on invalid provider combinations or missing required values.
8. Add unit tests.

Acceptance checks:

```bash
npm test -- tests/env.test.js
```

Required tests:

```text
- defaults to firebase/sqlite/local only if intentionally configured that way
- invalid AUTH_PROVIDER fails
- invalid DATABASE_PROVIDER fails
- invalid STORAGE_PROVIDER fails
- sqlite requires SQLITE_PATH
- local storage requires LOCAL_STORAGE_ROOT
- firebase provider requires FIREBASE_SERVICE_ACCOUNT_PATH
- numeric values are parsed once and validated
```

---

### Slice 2: Backend Provider Container

Goal: centralize provider creation and dependency injection.

Files likely added/changed:

```text
config/container.js
app.js
index.js
tests/container.test.js
```

Tasks:

1. Add provider registries:

    ```js
    const authProviders = {};
    const imageRepositories = {};
    const storageProviders = {};
    ```

2. Add `resolveProvider(registry, providerName, providerType)`.
3. Add `createContainer(config)`.
4. Update `index.js` so startup becomes:

    ```js
    const config = readEnv();
    const container = createContainer(config);
    const app = createApp(container);
    ```

5. Update `app.js` so it receives `container`.
6. Add tests with fake providers to prove injection works.

Acceptance checks:

```bash
npm test -- tests/container.test.js
npm start
```

Required tests:

```text
- resolves known provider names
- rejects unsupported provider names
- creates auth provider
- creates image repository
- creates storage provider
- passes dependencies into image service factory
```

Important rule:

```text
No controller or service should read process.env directly for provider selection.
```

---

### Slice 3: Local Storage Provider

Goal: save, URL-resolve, and delete processed image files on local disk.

Files likely added/changed:

```text
storage/localStorageProvider.js
tests/localStorageProvider.test.js
```

Provider contract:

```js
function createStorageProvider(config) {
    async function saveObject(input) {}
    async function deleteObject(storageKey) {}
    async function getUrl(storageKey, options) {}

    return {
        saveObject,
        deleteObject,
        getUrl
    };
}
```

Tasks:

1. Create directories as needed.
2. Save processed image files under `LOCAL_STORAGE_ROOT`.
3. Return public URLs using `PUBLIC_MEDIA_BASE_URL`.
4. Reject path traversal.
5. Make delete idempotent where practical.
6. Avoid unnecessary large buffers where current image processor allows.
7. Add tests using temporary directories.

Acceptance checks:

```bash
npm test -- tests/localStorageProvider.test.js
```

Required tests:

```text
- saves object under root
- returns URL based on PUBLIC_MEDIA_BASE_URL
- deletes object
- deleting missing object does not crash, if selected behavior is idempotent
- rejects ../ traversal
- rejects absolute paths outside root
```

---

### Slice 4: SQLite Image Repository

Goal: store and query image metadata locally.

Files likely added/changed:

```text
repositories/sqliteImageRepository.js
tests/sqliteImageRepository.test.js
package.json
package-lock.json
```

Tasks:

1. Choose lightweight SQLite dependency.
2. Initialize schema on repository creation or with an explicit `init()` called at startup.
3. Implement:

    ```js
    listPublicImages(options)
    listImagesByOwner(ownerId, options)
    findImageById(imageId)
    createImage(imageData)
    markImageDeleted(imageId, ownerId)
    deleteImageById(imageId, ownerId)
    ```

4. Exclude soft-deleted rows from list queries.
5. Order gallery queries by newest first.
6. Add tests using temporary SQLite DB files or in-memory DB where supported.

Acceptance checks:

```bash
npm test -- tests/sqliteImageRepository.test.js
```

Required tests:

```text
- creates schema
- inserts image metadata
- lists public images newest first
- lists images by owner newest first
- finds image by id
- excludes deleted images
- delete is owner-scoped
```

NC110 note:

```text
Prefer a dependency and access pattern that does not add a long-running database daemon.
```

---

### Slice 5: Image Presenter / DTO Mapper

Goal: convert repository records into frontend-safe `PhotogramImage` DTOs.

Files likely added/changed:

```text
services/imagePresenter.js
tests/imagePresenter.test.js
```

Tasks:

1. Map database snake_case fields to frontend camelCase fields.
2. Call `storageProvider.getUrl(storageKey)` for `imageUrl`.
3. Call `storageProvider.getUrl(thumbnailKey)` for `thumbnailUrl` when present.
4. Hide provider internals from frontend DTOs.
5. Add tests with fake storage provider.

Acceptance checks:

```bash
npm test -- tests/imagePresenter.test.js
```

Required tests:

```text
- maps image row to PhotogramImage DTO
- generates imageUrl from storage provider
- generates thumbnailUrl from storage provider
- does not expose storageKey by default
```

---

### Slice 6: Image Service

Goal: centralize upload/list/delete business logic behind provider contracts.

Files likely added/changed:

```text
services/imageService.js
tests/imageService.test.js
```

Tasks:

1. Implement public list flow:

    ```js
    listPublicImages(options)
    ```

2. Implement user list flow:

    ```js
    listImagesForUser(userId, options)
    ```

3. Implement upload flow:

    ```js
    createImageForUser(user, uploadInput)
    ```

4. Implement delete flow:

    ```js
    deleteImageForUser(user, imageId)
    ```

5. Ensure upload sequence is safe:

    ```text
    validate input
    process image
    save image file
    save thumbnail file
    create metadata
    return DTO
    ```

6. Ensure delete sequence is safe:

    ```text
    load metadata
    check ownership
    delete image file
    delete thumbnail file
    mark/delete metadata
    return ok
    ```

7. Add cleanup behavior when storage succeeds but metadata fails.
8. Add tests using fake repository/storage/image processor.

Acceptance checks:

```bash
npm test -- tests/imageService.test.js
```

Required tests:

```text
- lists public images
- lists owner images
- creates image metadata after storage save
- returns normalized DTO
- deletes image only for owner
- rejects delete for non-owner
- cleans up storage if metadata creation fails
- handles missing image with clear error
```

---

### Slice 7: Firebase Auth Provider for MVP

Goal: keep existing login behavior but let the backend authorize authenticated routes.

Files likely added/changed:

```text
auth/firebaseAuthProvider.js
config/firebase.js
tests/firebaseAuthProvider.test.js
```

Provider contract:

```js
function createAuthProvider(config) {
    async function getCurrentUser(req) {}
    async function requireUser(req) {}

    return {
        getCurrentUser,
        requireUser
    };
}
```

Tasks:

1. Read Firebase ID token from:

    ```text
    Authorization: Bearer <token>
    ```

2. Validate token with Firebase Admin SDK.
3. Return normalized user shape:

    ```js
    {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        provider: 'firebase'
    }
    ```

4. Return `401` through controller/middleware when auth is required and missing/invalid.
5. Keep service account path outside the repository.
6. Add tests with mocked Firebase Admin verification.

Acceptance checks:

```bash
npm test -- tests/firebaseAuthProvider.test.js
```

Required tests:

```text
- extracts bearer token
- rejects missing token on requireUser
- normalizes decoded Firebase token
- handles Firebase verification failure
```

---

### Slice 8: Backend HTTP Routes

Goal: expose canonical image routes and preserve compatibility endpoints.

Files likely added/changed:

```text
controllers/imageController.js
routes/imageRoutes.js
routes/systemRoutes.js
app.js
tests/imageRoutes.test.js
```

Canonical routes:

```text
GET    /images/public
GET    /images/me
POST   /images
DELETE /images/:imageId
```

Compatibility routes:

```text
POST   /resize-upload
POST   /delete-image
```

Tasks:

1. Wire controllers to `container.imageService`.
2. Use `container.authProvider` for protected routes.
3. Keep endpoint paths lowercase and hyphenated for compatibility endpoints.
4. Return normalized JSON responses.
5. Add route tests with fake service/auth providers.
6. Keep existing upload size/rate-limit middleware.

Acceptance checks:

```bash
npm test -- tests/imageRoutes.test.js
npm test
```

Manual checks:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/images/public
```

Upload/delete manual checks should be completed after frontend token handling is wired.

---

### Slice 9: Static Media Serving for Local Public Files

Goal: allow local public image URLs to resolve in development and simple production deployments.

Files likely added/changed:

```text
app.js
middleware/staticMedia.js
tests/staticMedia.test.js
```

Tasks:

1. Serve `/media/*` from `LOCAL_STORAGE_ROOT` only when `STORAGE_PROVIDER=local`.
2. Ensure path traversal is not possible.
3. Do not expose private files if private visibility is implemented separately.
4. Document that Nginx/Caddy static serving may replace Express static serving later.

Acceptance checks:

```bash
npm test -- tests/staticMedia.test.js
```

Manual checks:

```text
Uploaded public image URL opens in browser.
Thumbnail URL opens in browser.
```

---

### Slice 10: Frontend Image API Wrapper

Goal: make the frontend call the Photogram API instead of Firebase/Firestore for gallery/upload/delete.

Files likely added/changed:

```text
src/api/images.ts
src/config.ts
src/api/images.test.ts
```

Tasks:

1. Ensure `REACT_APP_API_URL` is the only backend URL source.
2. Implement:

    ```ts
    getPublicImages()
    getMyImages(token?: string)
    uploadImage(input)
    deleteImage(imageId, token?: string)
    ```

3. Normalize backend responses.
4. Keep API functions small and testable.
5. Keep Firebase Auth token acquisition outside the image API when practical.

Acceptance checks:

```bash
yarn test src/api/images.test.ts
```

Required tests:

```text
- getPublicImages calls /images/public
- getMyImages calls /images/me with auth header when token provided
- uploadImage posts multipart data
- deleteImage calls DELETE /images/:imageId
- handles non-ok response with useful error
```

---

### Slice 11: Frontend Gallery Migration

Goal: public and user galleries render backend DTOs.

Files likely added/changed:

```text
src/components/Gallery/*
src/state/*
src/api/images.ts
```

Tasks:

1. Replace direct Firestore gallery reads with `getPublicImages()`.
2. Replace direct Firestore user gallery reads with `getMyImages()`.
3. Keep React components rendering `PhotogramImage` DTOs.
4. Ensure loading/error/empty states still work.
5. Add or update colocated tests.

Acceptance checks:

```bash
yarn test
yarn build
```

Manual checks:

```text
/ renders public images from backend API.
/mygallery renders current user's images from backend API.
Empty gallery state still renders correctly.
API error state does not crash app.
```

---

### Slice 12: Frontend Upload/Delete Migration

Goal: upload and delete use backend image API functions only.

Files likely added/changed:

```text
src/components/Upload/*
src/components/Gallery/*
src/state/*
src/api/images.ts
```

Tasks:

1. Change upload flow to call backend API wrapper.
2. Change delete flow to call backend API wrapper.
3. Ensure authenticated requests include Firebase ID token during MVP.
4. Update Redux action creators/thunks if upload/delete logic lives there.
5. Remove or isolate Firebase Storage calls from upload/delete flows.
6. Add/update tests.

Acceptance checks:

```bash
yarn test
yarn build
```

Manual checks:

```text
Login works.
Upload image works.
Uploaded image appears in /mygallery.
Public image appears in / when isPublic=true.
Delete image removes it from /mygallery and backend storage.
Delete failure shows useful UI feedback.
```

---

### Slice 13: End-to-End Local MVP Validation

Goal: prove the local MVP mode works end-to-end.

Backend env:

```env
AUTH_PROVIDER=firebase
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local
```

Validation commands:

```bash
# Backend
npm test
npm start

# Frontend
yarn test
yarn build
yarn start
```

Manual backend checks:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/images/public
```

Manual browser checks:

```text
1. Open frontend.
2. Login with Firebase Auth.
3. Open /upload.
4. Upload valid image.
5. Confirm image file exists under LOCAL_STORAGE_ROOT.
6. Confirm SQLite row exists.
7. Open /mygallery.
8. Confirm uploaded image appears.
9. Open /.
10. Confirm public image appears if public.
11. Delete image.
12. Confirm image is removed from UI.
13. Confirm file is deleted or no longer reachable.
14. Confirm SQLite row is deleted or soft-deleted.
```

Upload safety checks:

```text
- valid image
- non-image file
- empty payload
- oversize payload based on MAX_FILE_SIZE_MB
- unauthenticated upload
- unauthenticated delete
```

---

### Slice 14: NC110 Deployment Check

Goal: verify the MVP mode on the target low-resource server.

Tasks:

1. Create production directories:

    ```bash
    sudo mkdir -p /var/lib/photogram/images
    sudo mkdir -p /var/backups/photogram
    ```

2. Set ownership to the backend process user.
3. Deploy backend `.env` outside source control.
4. Start or reload PM2 process.
5. Validate logs and memory usage.
6. Test upload/delete with small image files first.
7. Validate `sharp`; switch to `jimp` if needed.
8. Document PM2 command and current env assumptions.

Validation commands:

```bash
pm2 status
pm2 logs photogram-backend
curl http://localhost:3000/health
```

Operational checks:

```text
- memory does not grow unexpectedly across repeated uploads
- upload concurrency remains low
- oversized files are rejected early
- debug endpoint remains disabled in production
- SQLite file and image directory are included in backup plan
```

---

## 12. Recommended Commit Order

Use small commits with Conventional Commit-style prefixes.

```text
feat: add provider env parsing
feat: add backend provider container
feat: add local storage provider
feat: add sqlite image repository
feat: add image DTO presenter
feat: add provider-backed image service
feat: add firebase auth provider
feat: add canonical image routes
feat: serve local media files
feat: migrate frontend image API client
feat: migrate gallery reads to backend API
feat: migrate upload delete flows to backend API
fix: validate local MVP mode end to end
```

Prefer one slice per PR or one small group of tightly related slices.

---

## 13. Codex Task Prompts

Use these prompts one at a time.

### Prompt 1

```text
Read docs/photogram-provider-agnostic-system-spec.md and docs/photogram-mvp-implementation-plan.md. Implement Slice 1 only: backend env parsing and validation. Keep CommonJS style, 4-space indentation, semicolons, and add node:test coverage under tests/env.test.js. Do not change controllers or route behavior.
```

### Prompt 2

```text
Implement Slice 2 only: backend provider container. Add config/container.js with safe provider registries and tests. Update index.js/app.js only as needed for dependency injection. Do not implement SQLite or local storage yet; use existing providers or small placeholders where necessary.
```

### Prompt 3

```text
Implement Slice 3 only: local storage provider. Add storage/localStorageProvider.js and tests using temporary directories. It must reject path traversal, save files under LOCAL_STORAGE_ROOT, delete objects, and generate URLs from PUBLIC_MEDIA_BASE_URL.
```

### Prompt 4

```text
Implement Slice 4 only: SQLite image repository. Add schema initialization, list/create/find/delete methods, and node:test coverage. Keep dependencies lightweight for the Samsung NC110.
```

### Prompt 5

```text
Implement Slices 5 and 6 only: image presenter and image service. Use injected repository/storage/auth/image processor dependencies. Add tests with fake providers. Do not make controllers branch on provider names.
```

### Prompt 6

```text
Implement Slices 7 and 8 only: Firebase Auth provider and canonical image routes. Preserve compatibility endpoints /resize-upload and /delete-image by routing them through the same image service. Add route/auth tests.
```

### Prompt 7

```text
Implement Slice 10 only: frontend image API wrapper. Use REACT_APP_API_URL, TypeScript types, and tests. Do not change gallery components yet.
```

### Prompt 8

```text
Implement Slice 11 only: migrate public and user gallery reads to the backend image API. Remove or isolate direct Firestore reads from gallery flows. Add/update React Testing Library tests.
```

### Prompt 9

```text
Implement Slice 12 only: migrate upload and delete flows to backend API wrappers. Authenticated requests should use the current Firebase ID token during the MVP. Add/update tests and keep UI behavior unchanged.
```

### Prompt 10

```text
Run the MVP validation checklist from docs/photogram-mvp-implementation-plan.md. Fix only issues directly required for AUTH_PROVIDER=firebase, DATABASE_PROVIDER=sqlite, STORAGE_PROVIDER=local mode to pass upload, list, and delete.
```

---

## 14. Backend Testing Matrix

| Area | Required command | Required coverage |
|---|---|---|
| Env parsing | `npm test -- tests/env.test.js` | provider names, required env, numeric values |
| Container | `npm test -- tests/container.test.js` | safe registry, provider injection |
| Local storage | `npm test -- tests/localStorageProvider.test.js` | save, delete, URL, traversal rejection |
| SQLite repository | `npm test -- tests/sqliteImageRepository.test.js` | schema, create, list, find, delete |
| DTO presenter | `npm test -- tests/imagePresenter.test.js` | URL generation, provider internals hidden |
| Image service | `npm test -- tests/imageService.test.js` | upload/list/delete, cleanup, ownership |
| Auth provider | `npm test -- tests/firebaseAuthProvider.test.js` | token extraction, normalized user, auth failure |
| Routes | `npm test -- tests/imageRoutes.test.js` | canonical and compatibility endpoints |
| Full backend | `npm test` | all backend tests |

---

## 15. Frontend Testing Matrix

| Area | Required command | Required coverage |
|---|---|---|
| Image API | `yarn test src/api/images.test.ts` | calls backend endpoints, handles errors |
| Public gallery | `yarn test` | renders backend image DTOs |
| User gallery | `yarn test` | authenticated gallery renders backend DTOs |
| Upload | `yarn test` | calls backend upload wrapper |
| Delete | `yarn test` | calls backend delete wrapper |
| Production build | `yarn build` | CRA build succeeds |

---

## 16. Manual Validation Checklist

### Backend

```text
[ ] /health returns ok.
[ ] /images/public returns JSON array.
[ ] /images/me rejects unauthenticated request.
[ ] /images/me accepts valid Firebase token.
[ ] POST /images rejects unauthenticated request.
[ ] POST /images rejects non-image file.
[ ] POST /images rejects empty payload.
[ ] POST /images rejects oversize payload.
[ ] POST /images accepts valid image.
[ ] POST /resize-upload compatibility endpoint still works.
[ ] DELETE /images/:imageId deletes owned image.
[ ] DELETE /images/:imageId rejects non-owner.
[ ] POST /delete-image compatibility endpoint still works.
[ ] Uploaded file exists under LOCAL_STORAGE_ROOT.
[ ] SQLite metadata row is created.
[ ] Deleted file is removed or no longer reachable.
[ ] SQLite metadata is deleted or soft-deleted.
```

### Frontend

```text
[ ] / renders public gallery from backend API.
[ ] /login still works with Firebase Auth.
[ ] /upload remains protected.
[ ] /upload uploads through backend API.
[ ] /mygallery remains protected.
[ ] /mygallery renders current user's backend images.
[ ] Delete removes image from UI and backend.
[ ] Loading state still works.
[ ] Empty state still works.
[ ] API error state does not crash the app.
```

### NC110

```text
[ ] PM2 process starts.
[ ] pm2 status is healthy.
[ ] pm2 logs photogram-backend shows no startup config errors.
[ ] Upload memory usage is acceptable.
[ ] RESIZE_CONCURRENCY=1 is respected.
[ ] MAX_FILE_SIZE_MB=5 is respected.
[ ] ENABLE_DEBUG_ENDPOINT=false in production.
[ ] SQLite path is writable.
[ ] Local image directory is writable.
[ ] Backup path exists or is documented.
```

---

## 17. Risk Register

### Risk: Frontend still depends on Firestore object shapes

Mitigation:

```text
Create and use the normalized PhotogramImage DTO before changing many components.
```

### Risk: Local files are saved outside storage root

Mitigation:

```text
Path traversal tests are required before wiring local storage into upload routes.
```

### Risk: Upload stores files but metadata insert fails

Mitigation:

```text
Image service must clean up saved files if metadata creation fails.
```

### Risk: Delete removes metadata but not files

Mitigation:

```text
Delete service should load metadata first, delete files, then mark/delete metadata.
```

### Risk: SQLite dependency is too heavy or incompatible

Mitigation:

```text
Choose dependency carefully, test on the Samsung NC110, and keep fallback notes.
```

### Risk: Sharp is unstable on Atom-class CPU

Mitigation:

```text
Keep IMAGE_PROCESSOR=sharp|jimp and validate on the target machine.
```

### Risk: Firebase Auth token handling becomes scattered

Mitigation:

```text
Keep Firebase token verification inside AuthProvider only. Frontend only supplies token to API wrapper.
```

---

## 18. Definition of Done for MVP

The MVP is done when all of the following are true:

```text
[ ] Backend starts with AUTH_PROVIDER=firebase, DATABASE_PROVIDER=sqlite, STORAGE_PROVIDER=local.
[ ] Provider selection is centralized in config/container code.
[ ] Controllers and services do not branch on Firebase/sqlite/local provider names.
[ ] Upload saves image files to LOCAL_STORAGE_ROOT.
[ ] Upload writes metadata to SQLite.
[ ] Public gallery reads from backend /images/public.
[ ] User gallery reads from backend /images/me.
[ ] Delete removes or soft-deletes both storage and metadata.
[ ] Frontend gallery/upload/delete code does not directly use Firestore or Firebase Storage.
[ ] Compatibility endpoints /resize-upload and /delete-image still work or are documented if intentionally replaced.
[ ] Backend npm test passes.
[ ] Frontend yarn test passes.
[ ] Frontend yarn build passes.
[ ] Manual upload/list/delete test passes locally.
[ ] NC110 PM2 smoke test passes.
```

---

## 19. Suggested Next Document After MVP

After this MVP is complete, create:

```text
docs/local-auth-implementation-plan.md
```

That document should cover:

```text
AUTH_PROVIDER=local
password hashing
HTTP-only cookies
session table
CSRF considerations
login rate limits
frontend login/bootstrap migration
Firebase Auth removal or optional mode
```

Local auth should not block this MVP.
