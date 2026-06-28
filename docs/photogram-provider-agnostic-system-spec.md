# Photogram Provider-Agnostic System Specification

Status: Draft v1
Audience: Codex, project maintainers, future contributors
Primary goal: Make Photogram work the same way regardless of whether data and files come from Firebase or self-hosted services.

---

## 1. Purpose

Photogram started as a Firebase-backed personal photo gallery. Firebase solved authentication, metadata storage, and image storage quickly, but it should no longer be treated as the only foundation of the app.

This specification defines a provider-agnostic architecture where:

- The React frontend talks to a stable Photogram API.
- The Express backend owns all provider selection and heavy operations.
- `.env` decides which providers are active.
- Backend config validates provider choices.
- Backend composition creates concrete provider instances.
- Controllers and services receive already-created dependencies.
- Firebase remains available as an optional provider, not the default assumption.

The intended default deployment is self-hosted on the Samsung NC110 Ubuntu Server using lightweight local services.

---

## 2. Current Project Context

### Frontend

The frontend is a React 17 + TypeScript CRA app in `src/`.

Relevant conventions:

- Components live under `src/components/`.
- Redux state lives under `src/state/`.
- API clients live under `src/api/`.
- Configuration comes from `REACT_APP_*` variables.
- Tests are colocated as `*.test.tsx` files.
- The project is Yarn-first.

Current major flows:

- Public gallery: `/`
- Login: `/login`
- Protected upload page: `/upload`
- Protected user gallery: `/mygallery`

Important current files:

- `src/components/App/App.tsx`
- `src/components/App/AppInitializer.tsx`
- `src/components/App/ProtectedRoute.tsx`
- `src/api/images.ts`
- `src/firebase.configuration.ts`

### Backend

The backend is a separate Express/Firebase service.

Relevant conventions:

- CommonJS JavaScript.
- 4-space indentation.
- Semicolons.
- Single quotes.
- Lowercase hyphenated endpoint paths.
- `index.js` should stay a thin startup entrypoint.
- `app.js` should compose middleware, routes, and error handlers.
- `config/` owns environment parsing and provider initialization.
- `controllers/` own request handlers.
- `routes/` own route wiring.
- `middleware/` owns upload, CORS, size guards, rate limits, and error handling.
- `utils/` owns shared helpers such as logging and semaphores.
- Tests live under `tests/` and use `node:test` plus `node:assert/strict`.

Deployment target:

- Samsung Netbook NC110
- Ubuntu Server 24.04.3 LTS
- Intel Atom CPU
- 2GB RAM
- 250GB SSD
- PM2-managed process

Operational constraints:

- Prefer low-memory and low-CPU changes.
- Stream I/O where practical.
- Avoid loading large buffers unnecessarily.
- Keep dependencies lightweight.
- Validate `sharp` versus `jimp` on target hardware.
- Keep upload concurrency low.

---

## 3. Goals

1. Make Firebase optional.
2. Make local self-hosted services the default direction.
3. Keep the frontend source-agnostic.
4. Move gallery metadata access behind backend APIs.
5. Move image storage, deletion, URL resolution, resizing, compression, and safety controls behind backend providers.
6. Allow provider switching through `.env` without changing controllers, services, or frontend feature code.
7. Preserve the current user-facing functionality.
8. Preserve compatibility with existing endpoints during migration where practical.
9. Keep the system small enough to run reliably on the NC110.

---

## 4. Non-Goals

1. Do not build a generic Firebase clone.
2. Do not introduce Docker, MinIO, PostgreSQL, Redis, or background workers as first-step requirements.
3. Do not rewrite the entire frontend at once.
4. Do not remove Firebase Auth immediately unless local auth is explicitly implemented in that phase.
5. Do not expose local filesystem layout or provider internals to the frontend.
6. Do not make `.env` able to load arbitrary JavaScript modules.
7. Do not store provider-specific URLs as the permanent source of truth.

---

## 5. Core Architecture Rule

The architectural rule is:

```text
.env chooses providers.
config validates providers.
container creates providers.
services use provider interfaces.
controllers call services.
routes wire controllers.
frontend calls the Photogram API.
```

The frontend must not care whether Photogram uses:

- Firebase Auth
- local auth
- Firestore
- SQLite
- Firebase Storage
- local filesystem storage
- a future provider

Controllers and services must not branch on provider names.

Forbidden outside `config/` or composition code:

```js
if (process.env.DATABASE_PROVIDER === 'firebase') {
    // ...
}
```

Forbidden everywhere:

```js
require(process.env.IMAGE_REPOSITORY_MODULE);
```

Allowed pattern:

```js
const imageRepository = resolveProvider(
    imageRepositories,
    config.databaseProvider,
    'database'
).createImageRepository(config);
```

The selected implementation should be resolved once at startup and then injected.

---

## 6. Target Runtime Architecture

```text
React frontend
  |
  | Stable Photogram HTTP API
  v
Express backend
  |
  |-- AuthProvider
  |-- ImageRepository
  |-- StorageProvider
  |-- ImageProcessor
  |
  v
Provider implementations
  |
  |-- Firebase Auth, Firestore, Firebase Storage
  |-- local auth, SQLite, local filesystem
  |-- future providers
```

The backend owns:

- authentication verification
- authorization decisions
- image upload validation
- image resize/compression
- thumbnail generation
- storage writes/deletes
- metadata writes/deletes
- provider-specific URL generation
- rate limits
- file-size limits
- low-memory safeguards

The frontend owns:

- UI composition
- route rendering
- form state
- gallery rendering
- upload user experience
- Redux state
- calls to `src/api/*`

---

## 7. Provider Types

Photogram has three major provider categories.

### 7.1 AuthProvider

Responsible for identifying the current user and enforcing authenticated routes.

Initial provider options:

- `firebase`
- `local` later

### 7.2 ImageRepository

Responsible for image metadata.

Initial provider options:

- `firebase`
- `sqlite`

### 7.3 StorageProvider

Responsible for image files and URL resolution.

Initial provider options:

- `firebase`
- `local`

---

## 8. Default Provider Direction

The desired long-term default is:

```env
AUTH_PROVIDER=local
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local
```

The practical migration default may initially be:

```env
AUTH_PROVIDER=firebase
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local
```

Firebase-compatible mode remains:

```env
AUTH_PROVIDER=firebase
DATABASE_PROVIDER=firebase
STORAGE_PROVIDER=firebase
```

---

## 9. Provider Configuration

### 9.1 Local/SQLite Default

```env
NODE_ENV=production
PORT=3000

AUTH_PROVIDER=local
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local

SQLITE_PATH=/var/lib/photogram/photogram.sqlite
LOCAL_STORAGE_ROOT=/var/lib/photogram/images
PUBLIC_MEDIA_BASE_URL=https://photos.example.com/media

LOW_MEMORY_MODE=true
MAX_FILE_SIZE_MB=5
RESIZE_CONCURRENCY=1
HEAVY_RATE_LIMIT_MAX=8
ENABLE_DEBUG_ENDPOINT=false
IMAGE_PROCESSOR=sharp
```

### 9.2 Transitional Mode: Firebase Auth + Local Data/Storage

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

### 9.3 Firebase Mode

```env
NODE_ENV=production
PORT=3000

AUTH_PROVIDER=firebase
DATABASE_PROVIDER=firebase
STORAGE_PROVIDER=firebase

FIREBASE_SERVICE_ACCOUNT_PATH=/secure/photogram/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
FIREBASE_URL_MODE=signed
FIREBASE_SIGNED_URL_EXPIRES_SECONDS=300

LOW_MEMORY_MODE=true
MAX_FILE_SIZE_MB=5
RESIZE_CONCURRENCY=1
HEAVY_RATE_LIMIT_MAX=8
ENABLE_DEBUG_ENDPOINT=false
IMAGE_PROCESSOR=sharp
```

---

## 10. Configuration Validation Rules

`config/env.js` should parse and normalize all env values.

`config/container.js` or equivalent composition code should validate provider combinations.

Required validation:

1. `AUTH_PROVIDER` must be one of the supported auth provider keys.
2. `DATABASE_PROVIDER` must be one of the supported repository provider keys.
3. `STORAGE_PROVIDER` must be one of the supported storage provider keys.
4. `DATABASE_PROVIDER=sqlite` requires `SQLITE_PATH`.
5. `STORAGE_PROVIDER=local` requires `LOCAL_STORAGE_ROOT`.
6. `STORAGE_PROVIDER=local` requires either `PUBLIC_MEDIA_BASE_URL` for public media URLs or a backend media route.
7. Any Firebase provider requires `FIREBASE_SERVICE_ACCOUNT_PATH`.
8. `STORAGE_PROVIDER=firebase` requires `FIREBASE_STORAGE_BUCKET`.
9. `FIREBASE_URL_MODE` must be `public` or `signed`.
10. Numeric env values must be parsed once and validated as safe integers.
11. Provider names must not be used as raw module paths.

Invalid config should fail fast during startup.

---

## 11. Backend Composition Pattern

### 11.1 Startup

`index.js` remains thin:

```js
require('dotenv').config();

const { readEnv } = require('./config/env');
const { createContainer } = require('./config/container');
const createApp = require('./app');

const config = readEnv();
const container = createContainer(config);
const app = createApp(container);

app.listen(config.port, () => {
    console.log(`Photogram backend listening on port ${config.port}`);
});
```

### 11.2 App Composition

`app.js` receives dependencies:

```js
const express = require('express');
const createImageRoutes = require('./routes/imageRoutes');
const createAuthRoutes = require('./routes/authRoutes');
const createSystemRoutes = require('./routes/systemRoutes');

function createApp(container) {
    const app = express();

    app.use('/health', createSystemRoutes(container));
    app.use('/auth', createAuthRoutes(container));
    app.use('/images', createImageRoutes(container));

    return app;
}

module.exports = createApp;
```

### 11.3 Container

Provider resolution belongs in one composition layer:

```js
const sqliteImageRepository = require('../repositories/sqliteImageRepository');
const firebaseImageRepository = require('../repositories/firebaseImageRepository');
const localStorageProvider = require('../storage/localStorageProvider');
const firebaseStorageProvider = require('../storage/firebaseStorageProvider');
const localAuthProvider = require('../auth/localAuthProvider');
const firebaseAuthProvider = require('../auth/firebaseAuthProvider');
const imageService = require('../services/imageService');

const imageRepositories = {
    sqlite: sqliteImageRepository,
    firebase: firebaseImageRepository
};

const storageProviders = {
    local: localStorageProvider,
    firebase: firebaseStorageProvider
};

const authProviders = {
    local: localAuthProvider,
    firebase: firebaseAuthProvider
};

function resolveProvider(registry, providerName, providerType) {
    const provider = registry[providerName];

    if (!provider) {
        throw new Error(`Unsupported ${providerType} provider: ${providerName}`);
    }

    return provider;
}

function createContainer(config) {
    const imageRepository = resolveProvider(
        imageRepositories,
        config.databaseProvider,
        'database'
    ).createImageRepository(config);

    const storageProvider = resolveProvider(
        storageProviders,
        config.storageProvider,
        'storage'
    ).createStorageProvider(config);

    const authProvider = resolveProvider(
        authProviders,
        config.authProvider,
        'auth'
    ).createAuthProvider(config);

    const images = imageService.createImageService({
        imageRepository,
        storageProvider,
        authProvider,
        config
    });

    return {
        config,
        authProvider,
        imageRepository,
        storageProvider,
        imageService: images
    };
}

module.exports = {
    createContainer
};
```

The exact file names can change, but the rule should not: provider choice is resolved once and injected.

---

## 12. Provider Contracts

Provider contracts should be small and explicit.

### 12.1 ImageRepository Contract

```js
function createImageRepository(config) {
    async function listPublicImages(options) {}
    async function listImagesByOwner(ownerId, options) {}
    async function findImageById(imageId) {}
    async function createImage(imageRecord) {}
    async function updateImage(imageId, updates) {}
    async function deleteImageById(imageId, ownerId) {}

    return {
        listPublicImages,
        listImagesByOwner,
        findImageById,
        createImage,
        updateImage,
        deleteImageById
    };
}
```

Repository methods return internal image records, not frontend DTOs.

### 12.2 StorageProvider Contract

```js
function createStorageProvider(config) {
    async function saveObject(input) {}
    async function deleteObject(storageKey) {}
    async function getUrl(storageKey, options) {}
    async function exists(storageKey) {}

    return {
        saveObject,
        deleteObject,
        getUrl,
        exists
    };
}
```

`saveObject(input)` should accept a normalized object such as:

```js
{
    storageKey: 'users/user_123/images/img_abc.webp',
    buffer,
    readableStream,
    contentType: 'image/webp',
    sizeBytes: 12345
}
```

The implementation may accept either `buffer` or `readableStream`, but it should prefer streaming where practical.

### 12.3 AuthProvider Contract

```js
function createAuthProvider(config) {
    async function getCurrentUser(req) {}
    async function requireUser(req) {}
    async function login(credentials, res) {}
    async function logout(req, res) {}

    return {
        getCurrentUser,
        requireUser,
        login,
        logout
    };
}
```

For Firebase Auth, `login` may be unsupported by the backend during the transition because the frontend still signs in with Firebase. In that case, the provider should implement `getCurrentUser` and `requireUser` by validating an ID token sent by the frontend.

For local auth, `login` and `logout` should use secure HTTP-only cookies.

---

## 13. Internal Image Record

The backend database should store provider-neutral metadata.

Internal record shape:

```js
{
    id: 'img_abc',
    ownerId: 'user_123',
    title: 'Optional title',
    description: 'Optional description',
    storageKey: 'users/user_123/images/img_abc.webp',
    thumbnailKey: 'users/user_123/thumbnails/img_abc.webp',
    originalStorageKey: 'users/user_123/originals/img_abc.jpg',
    mimeType: 'image/webp',
    originalMimeType: 'image/jpeg',
    width: 1600,
    height: 1200,
    thumbnailWidth: 400,
    thumbnailHeight: 300,
    sizeBytes: 234567,
    originalSizeBytes: 3456789,
    isPublic: true,
    createdAt: '2026-06-22T12:00:00.000Z',
    updatedAt: '2026-06-22T12:00:00.000Z',
    deletedAt: null
}
```

Important rule:

```text
Database stores storage keys.
Backend generates URLs.
Frontend receives URLs.
```

Do not treat Firebase Storage URLs, signed URLs, or local `/media/*` URLs as the permanent database source of truth.

---

## 14. Frontend Image DTO

The frontend should receive a normalized provider-neutral DTO.

```ts
export type PhotogramImage = {
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

Do not expose `storageKey` or `thumbnailKey` to the frontend unless there is a specific administrative/debug reason.

The DTO should be created by a backend presenter/mapper, for example:

```js
async function toImageDto(imageRecord, storageProvider) {
    return {
        id: imageRecord.id,
        ownerId: imageRecord.ownerId,
        title: imageRecord.title,
        description: imageRecord.description,
        imageUrl: await storageProvider.getUrl(imageRecord.storageKey, {
            visibility: imageRecord.isPublic ? 'public' : 'private'
        }),
        thumbnailUrl: imageRecord.thumbnailKey
            ? await storageProvider.getUrl(imageRecord.thumbnailKey, {
                visibility: imageRecord.isPublic ? 'public' : 'private'
            })
            : undefined,
        width: imageRecord.width,
        height: imageRecord.height,
        sizeBytes: imageRecord.sizeBytes,
        mimeType: imageRecord.mimeType,
        isPublic: imageRecord.isPublic,
        createdAt: imageRecord.createdAt,
        updatedAt: imageRecord.updatedAt
    };
}
```

---

## 15. Canonical Backend API

Canonical endpoints should be provider-neutral.

```text
GET    /health

GET    /auth/me
POST   /auth/login
POST   /auth/logout

GET    /images/public
GET    /images/me
POST   /images
DELETE /images/:imageId
GET    /images/:imageId/file
GET    /images/:imageId/thumbnail
```

### 15.1 Compatibility Endpoints

Preserve current endpoints during migration where practical:

```text
POST   /resize-upload
POST   /delete-image
```

These can internally call the same service methods as the canonical routes.

Existing test/manual validation targets should remain valid during migration:

```text
GET/POST as applicable:
/health
/resize
/upload
/resize-upload
/delete-image
```

---

## 16. API Response Shapes

### 16.1 List Public Images

Request:

```text
GET /images/public
```

Response:

```json
{
    "images": [
        {
            "id": "img_abc",
            "ownerId": "user_123",
            "title": "Photo title",
            "description": "Photo description",
            "imageUrl": "https://photos.example.com/media/users/user_123/images/img_abc.webp",
            "thumbnailUrl": "https://photos.example.com/media/users/user_123/thumbnails/img_abc.webp",
            "width": 1600,
            "height": 1200,
            "sizeBytes": 234567,
            "mimeType": "image/webp",
            "isPublic": true,
            "createdAt": "2026-06-22T12:00:00.000Z",
            "updatedAt": "2026-06-22T12:00:00.000Z"
        }
    ]
}
```

### 16.2 List Current User Images

Request:

```text
GET /images/me
```

Response:

```json
{
    "images": []
}
```

### 16.3 Upload Image

Request:

```text
POST /images
Content-Type: multipart/form-data
```

Fields:

```text
image: file
isPublic: true|false
 title: optional string
 description: optional string
```

Response:

```json
{
    "image": {
        "id": "img_abc",
        "ownerId": "user_123",
        "title": "Photo title",
        "description": "Photo description",
        "imageUrl": "https://photos.example.com/media/users/user_123/images/img_abc.webp",
        "thumbnailUrl": "https://photos.example.com/media/users/user_123/thumbnails/img_abc.webp",
        "width": 1600,
        "height": 1200,
        "sizeBytes": 234567,
        "mimeType": "image/webp",
        "isPublic": true,
        "createdAt": "2026-06-22T12:00:00.000Z",
        "updatedAt": "2026-06-22T12:00:00.000Z"
    }
}
```

### 16.4 Delete Image

Request:

```text
DELETE /images/img_abc
```

Response:

```json
{
    "ok": true
}
```

---

## 17. Upload Flow

The upload flow is owned by the backend.

```text
1. Route receives multipart upload.
2. Middleware applies size limits and rate limits.
3. AuthProvider identifies the current user.
4. Controller calls imageService.uploadImage().
5. Service validates file presence, MIME type, and size.
6. Service calls image processor to resize/compress.
7. Service creates storage keys.
8. StorageProvider saves processed image.
9. StorageProvider saves thumbnail.
10. ImageRepository saves metadata.
11. Service maps internal record to frontend DTO.
12. Controller returns JSON.
```

Required safeguards:

- Reject empty payloads.
- Reject non-image files.
- Reject oversized payloads based on `MAX_FILE_SIZE_MB`.
- Apply upload/heavy endpoint rate limiting.
- Limit resize concurrency using `RESIZE_CONCURRENCY`.
- Avoid path traversal in generated storage keys.
- Clean up partially written files if repository save fails.
- Clean up repository record if storage save fails after partial metadata creation.

---

## 18. Delete Flow

The delete flow is owned by the backend.

```text
1. AuthProvider identifies the current user.
2. Controller calls imageService.deleteImage(imageId, user).
3. Service loads image metadata.
4. Service confirms ownership or authorization.
5. Service deletes image and thumbnail from StorageProvider.
6. Service deletes or soft-deletes metadata from ImageRepository.
7. Controller returns `{ ok: true }`.
```

Default behavior should be hard delete for personal deployments unless soft delete is intentionally added.

If soft delete is used, set `deletedAt` and exclude deleted rows/documents from normal list queries.

Delete must be idempotent where practical. Deleting an already-missing storage object should not leave the system broken.

---

## 19. Local Storage Provider

The local storage provider should write files under:

```text
/var/lib/photogram/images
```

Suggested layout:

```text
/var/lib/photogram/images/
  users/
    <ownerId>/
      originals/
      images/
      thumbnails/
  public/
```

Recommended storage keys:

```text
users/<ownerId>/images/<imageId>.webp
users/<ownerId>/thumbnails/<imageId>.webp
users/<ownerId>/originals/<imageId>.<ext>
```

Rules:

1. Storage keys are logical keys, not arbitrary user-supplied paths.
2. Never concatenate unchecked user input into filesystem paths.
3. Resolve paths and verify they remain inside `LOCAL_STORAGE_ROOT`.
4. Use atomic writes where practical.
5. Delete derived files on failed upload.
6. Use restrictive filesystem permissions.
7. Do not serve private files directly from a public static route.

### 19.1 Public File Serving

For public images, either:

1. Serve `/media/*` through Nginx/Caddy from `LOCAL_STORAGE_ROOT`; or
2. Serve files through Express if traffic is very low.

For the NC110, static serving through Nginx/Caddy is preferred for public images.

### 19.2 Private File Serving

Private user gallery files should not be exposed as direct public files.

Acceptable options:

1. Backend checks auth and streams the file.
2. Backend checks auth and delegates with `X-Accel-Redirect` to Nginx.
3. Backend returns short-lived signed local URLs if implemented later.

Start simple: backend-authenticated streaming is acceptable for a personal deployment.

---

## 20. SQLite Image Repository

SQLite is the preferred first local database because it is lightweight and simple to back up.

Suggested table:

```sql
CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    storage_key TEXT NOT NULL,
    thumbnail_key TEXT,
    original_storage_key TEXT,
    mime_type TEXT,
    original_mime_type TEXT,
    width INTEGER,
    height INTEGER,
    thumbnail_width INTEGER,
    thumbnail_height INTEGER,
    size_bytes INTEGER,
    original_size_bytes INTEGER,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_images_public_created_at
ON images (is_public, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_images_owner_created_at
ON images (owner_id, created_at DESC)
WHERE deleted_at IS NULL;
```

Potential future local-auth tables:

```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

SQLite implementation rules:

- Initialize schema at startup or through an explicit migration command.
- Use parameterized queries.
- Keep queries simple.
- Do not add an ORM unless there is a clear benefit.
- Enable WAL mode if it works reliably on the deployment filesystem.
- Back up the SQLite file together with the image folder.

---

## 21. Firebase Providers

Firebase provider implementations should remain available but isolated.

### 21.1 Firebase Auth Provider

Responsibilities:

- Validate Firebase ID tokens.
- Return a normalized user object.

Normalized user shape:

```js
{
    id: 'firebase-uid',
    email: 'person@example.com',
    displayName: 'Optional Name',
    provider: 'firebase'
}
```

### 21.2 Firebase Image Repository

Responsibilities:

- Read/write image metadata from Firestore.
- Map Firestore documents to internal image records.
- Map internal image records back to Firestore-safe data.

Firestore document shape should align with the internal image record as much as possible.

### 21.3 Firebase Storage Provider

Responsibilities:

- Save objects to Firebase Storage.
- Delete Firebase Storage objects.
- Generate public or signed URLs depending on config.

Provider-specific URLs should still be generated at response time, not treated as permanent database truth.

---

## 22. Frontend API Boundary

Frontend feature code should call local API wrappers only.

Recommended files:

```text
src/api/images.ts
src/api/auth.ts
src/config.ts
```

`src/api/images.ts` should expose provider-neutral functions:

```ts
export async function getPublicImages(): Promise<PhotogramImage[]> {}
export async function getMyImages(): Promise<PhotogramImage[]> {}
export async function uploadImage(input: UploadImageInput): Promise<PhotogramImage> {}
export async function deleteImage(imageId: string): Promise<void> {}
```

Components and Redux thunks should not directly import Firestore or Firebase Storage.

Allowed during transition:

- Firebase Auth usage in app initialization/login while `AUTH_PROVIDER=firebase` remains active.

Not allowed after migration of gallery/upload/delete:

- Gallery components reading directly from Firestore.
- Upload components writing directly to Firebase Storage.
- Delete flows deleting directly from Firebase Storage.
- Frontend storing provider-specific object paths as business logic.

Frontend environment:

```env
REACT_APP_API_URL=https://photos.example.com
```

Later local-auth mode:

```env
REACT_APP_API_URL=https://photos.example.com
```

During the Firebase Auth MVP, login/bootstrap continues to use the existing Firebase `REACT_APP_*` configuration. Frontend gallery/upload/delete code should not receive backend provider-selection env vars; database, storage, and auth provider settings belong to the backend.

---

## 23. Auth Migration Strategy

### Phase A: Keep Firebase Auth

Frontend signs users in with Firebase.

For authenticated backend requests, frontend sends Firebase ID token:

```text
Authorization: Bearer <firebase-id-token>
```

Backend validates the token through `AuthProvider=firebase`.

This allows local database/storage migration without immediately rewriting login.

### Phase B: Add Local Auth

Backend implements:

```text
POST /auth/login
POST /auth/logout
GET  /auth/me
```

Local auth should use:

- password hashing with a safe library
- HTTP-only cookies
- `SameSite` cookie settings
- secure cookies in production behind HTTPS
- login rate limiting
- session expiration

Future local-auth login/bootstrap migration should be specified separately. Do not introduce frontend backend-provider env vars for the current Firebase Auth MVP.

---

## 24. Migration Phases

### Phase 1: Backend Composition Layer

Add:

```text
config/env.js
config/container.js
repositories/
storage/
auth/
services/
```

Goal:

- Existing backend behavior still works.
- Provider selection is centralized.
- Controllers/services do not branch on provider names.

### Phase 2: Local Storage Provider

Add `STORAGE_PROVIDER=local`.

Goal:

- `/resize-upload` can save processed images to local filesystem.
- `/delete-image` can delete local files.
- Firebase Storage is no longer required for upload/delete in local mode.

### Phase 3: SQLite Image Repository

Add `DATABASE_PROVIDER=sqlite`.

Goal:

- Upload creates SQLite metadata.
- Delete removes or soft-deletes SQLite metadata.
- `GET /images/public` and `GET /images/me` return SQLite-backed data.

### Phase 4: Frontend Gallery API Migration

Update frontend gallery flows to use backend API.

Goal:

- Public gallery uses `GET /images/public`.
- User gallery uses `GET /images/me`.
- Gallery state no longer depends on Firestore directly.

### Phase 5: Frontend Upload/Delete API Migration

Update frontend upload/delete flows to use canonical backend API.

Goal:

- Upload uses `POST /images` or compatibility `POST /resize-upload`.
- Delete uses `DELETE /images/:imageId` or compatibility `POST /delete-image`.
- Components remain provider-agnostic.

### Phase 6: Local Auth

Add `AUTH_PROVIDER=local`.

Goal:

- Firebase is fully optional.
- Default deployment can be local auth + SQLite + local filesystem.

---

## 25. Testing Requirements

### 25.1 Backend Unit Tests

Use `node:test` and `node:assert/strict`.

Required tests:

- env parsing and defaults
- invalid provider names fail startup validation
- missing required env for selected provider fails startup validation
- provider registry resolves allowed providers only
- container injects expected service dependencies
- image DTO mapping calls `storageProvider.getUrl()`
- SQLite repository creates/list/find/delete image metadata
- local storage provider rejects path traversal
- local storage provider saves and deletes objects
- upload service handles storage failure cleanup
- delete service handles missing file idempotently where practical

### 25.2 Backend Manual Validation

Validate with `curl` or Postman:

```text
/health
/resize
/upload
/resize-upload
/delete-image
/images/public
/images/me
/images/:imageId
```

For upload endpoints, test:

- valid image
- non-image file
- empty payload
- oversize payload based on `MAX_FILE_SIZE_MB`
- authenticated request
- unauthenticated request

### 25.3 Frontend Tests

Use Jest + React Testing Library.

Required tests:

- public gallery renders images from backend API response
- user gallery renders images from backend API response
- upload flow calls backend API wrapper
- delete flow calls backend API wrapper
- protected route behavior remains correct
- Firebase-specific gallery/upload behavior is removed or isolated

---

## 26. Security Requirements

1. Do not commit secrets.
2. Keep Firebase service account JSON outside the repository.
3. Validate upload MIME type and file extension.
4. Reject non-image uploads.
5. Reject oversized uploads.
6. Prevent path traversal in local storage.
7. Do not expose private files through public static routes.
8. Use authorization checks before serving private images.
9. Use short TTLs for signed URLs when using signed URL mode.
10. Keep CORS allowlists explicit.
11. Use rate limits on heavy endpoints.
12. Avoid debug endpoints in production unless explicitly enabled.
13. Do not expose raw stack traces to clients in production.

---

## 27. NC110 Operational Requirements

The default local deployment must be realistic for the Samsung NC110.

Requirements:

- Keep image processing concurrency low.
- Keep memory usage low.
- Avoid unnecessary daemons.
- Prefer SQLite over a separate database server initially.
- Prefer local filesystem over object storage initially.
- Prefer Nginx/Caddy static serving for public media when configured.
- Keep PM2 process configuration documented.
- Validate `sharp` on target hardware; support `jimp` fallback if needed.
- Test PM2 after deployment:

```text
pm2 status
pm2 logs photogram-backend
```

Suggested local paths:

```text
/var/lib/photogram/photogram.sqlite
/var/lib/photogram/images
/var/backups/photogram
```

Backup strategy:

```text
1. Stop or briefly pause writes if necessary.
2. Copy SQLite database.
3. Copy image folder.
4. Store backup outside the application directory.
5. Periodically test restore.
```

---

## 28. Files Likely to Change

### Backend

Likely additions:

```text
config/env.js
config/container.js
auth/firebaseAuthProvider.js
auth/localAuthProvider.js
repositories/firebaseImageRepository.js
repositories/sqliteImageRepository.js
storage/firebaseStorageProvider.js
storage/localStorageProvider.js
services/imageService.js
services/imagePresenter.js
services/imageProcessor.js
routes/authRoutes.js
routes/imageRoutes.js
controllers/authController.js
controllers/imageController.js
tests/config.test.js
tests/container.test.js
tests/sqliteImageRepository.test.js
tests/localStorageProvider.test.js
tests/imageService.test.js
```

Likely updates:

```text
index.js
app.js
config/firebase.js
middleware/upload.js
middleware/rateLimit.js
controllers/*
routes/*
package.json
```

### Frontend

Likely additions/updates:

```text
src/api/images.ts
src/api/auth.ts
src/config.ts
src/state/*
src/components/Gallery/*
src/components/Login/*
src/components/App/AppInitializer.tsx
src/components/App/ProtectedRoute.tsx
```

Firebase-specific frontend code should remain only where needed for Firebase Auth during the transition.

---

## 29. Definition of Done

The provider-agnostic migration is done when:

1. Frontend gallery/upload/delete flows call only the Photogram API.
2. Frontend gallery/upload/delete flows do not directly use Firestore or Firebase Storage.
3. Backend provider selection happens only in config/composition.
4. Controllers and services do not branch on provider names.
5. `DATABASE_PROVIDER=sqlite` works for gallery metadata.
6. `STORAGE_PROVIDER=local` works for image upload/delete/URL generation.
7. Firebase mode still works or is intentionally documented as pending.
8. Tests cover config validation, provider resolution, upload, delete, and gallery list behavior.
9. Manual validation confirms key endpoints.
10. Deployment notes confirm NC110-safe runtime settings.

---

## 30. Codex Implementation Guidance

When using Codex, prefer small, focused tasks.

Suggested task order:

1. Add `config/env.js` provider parsing and validation tests.
2. Add `config/container.js` with provider registries and tests.
3. Extract current Firebase storage logic into `storage/firebaseStorageProvider.js`.
4. Add `storage/localStorageProvider.js` and tests.
5. Extract current Firestore logic into `repositories/firebaseImageRepository.js`.
6. Add `repositories/sqliteImageRepository.js` and tests.
7. Add `services/imageService.js` and `services/imagePresenter.js`.
8. Wire existing upload/delete routes through `imageService`.
9. Add canonical `/images` routes while preserving compatibility endpoints.
10. Update frontend `src/api/images.ts` to call backend APIs.
11. Update gallery state to consume backend image DTOs.
12. Update upload/delete UI to use backend API wrappers.
13. Add local auth only after local database and storage are stable.

Each Codex change should include:

- files changed
- env/config changes
- tests added or updated
- manual validation command when endpoint behavior changes

---

## 31. Open Questions

These do not block Phase 1, but should be decided before final local-only mode.

1. Should local delete be hard delete or soft delete by default?
2. Should original uploads be retained, or only processed images and thumbnails?
3. Should private images be streamed by Express or served through Nginx `X-Accel-Redirect`?
4. Should local auth use username/password only, or support passwordless links later?
5. Should public media URLs include cache-busting versions?
6. Should image visibility be editable after upload?
7. Should SQLite migrations be automatic on startup or explicit commands?
8. Should EXIF metadata be stripped by default?
9. Should generated files use `.webp` by default, with fallback to `.jpg`?
10. Should the backend expose paginated image listing in the first migration?

Recommended initial answers:

1. Hard delete for personal deployment.
2. Do not retain originals unless explicitly enabled.
3. Stream private files through Express first; optimize later.
4. Username/password local auth later.
5. Add `updatedAt` or version query only if caching issues appear.
6. Not required for first migration.
7. Automatic lightweight schema initialization is acceptable early.
8. Strip EXIF by default for privacy.
9. Prefer `.webp` when supported by processor; fallback to `.jpg` if needed.
10. Add simple limit/offset or cursor before galleries grow large.

---

## 32. Summary

Photogram should become provider-agnostic by moving all source-specific behavior into backend providers selected at startup.

The frontend should call stable API functions and render normalized DTOs.

The backend should own provider selection, image processing, metadata, storage, URL resolution, authorization, and safety controls.

Firebase remains an available provider, but the intended default path is local services:

```env
AUTH_PROVIDER=local
DATABASE_PROVIDER=sqlite
STORAGE_PROVIDER=local
```

The safest migration path is:

```text
Firebase Auth first,
SQLite metadata next,
local filesystem storage next,
frontend API migration next,
local auth last.
```
