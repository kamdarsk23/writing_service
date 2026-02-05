# Writing Service - Progress Log

## Phase 1: Project Scaffold

### Status: Complete

### Steps Taken

1. **Initialized Vite project** with `npm create vite@latest . -- --template react-ts`
   - This scaffolded a React + TypeScript project using Vite as the build tool
   - Note: Node v18.12.0 throws engine warnings for many packages (Vite 7, ESLint 9, etc. want Node >=20). Installs succeed despite warnings.

2. **Installed all dependencies**
   - Production: `react-router-dom`, `@supabase/supabase-js`, `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`
   - Dev: `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/typography`, `gh-pages`
   - TipTap resolved to v3.19.0 (latest), not v2.10.0 as originally planned — this is fine, API is compatible

3. **Configured Tailwind CSS v4** via the Vite plugin approach (not PostCSS)
   - Tailwind v4 uses `@tailwindcss/vite` plugin added to `vite.config.ts`
   - CSS entry point (`src/index.css`) uses `@import "tailwindcss"` instead of the old `@tailwind` directives
   - Typography plugin loaded via `@plugin "@tailwindcss/typography"` in CSS

4. **Removed Vite boilerplate** — deleted `App.css`, default `App.tsx` content, `react.svg`, `vite.svg`

5. **Created full directory structure** under `src/`:
   ```
   src/lib/        — Third-party client singletons
   src/types/      — TypeScript interfaces
   src/hooks/      — Custom React hooks for data fetching
   src/contexts/   — React Context providers
   src/components/ — UI components grouped by domain
   src/pages/      — Route-level page components
   supabase/       — Database schema SQL
   ```

6. **Created `.env.example`** and added `.env` to `.gitignore`

7. **Created `PRD.md`** documenting full product requirements

### Issues Encountered

#### Issue 1: RouterProvider + AuthProvider Nesting
- **Problem**: Initially put `<AuthProvider>` wrapping `<RouterProvider>` in `App.tsx`. But `createHashRouter` (data router API) creates its own React tree — components inside the router can't access context providers defined outside of it.
- **Solution**: Created an `AuthLayout` wrapper component inside `router.tsx` that renders `<AuthProvider><Outlet /></AuthProvider>` as the root route element. This way all child routes are inside the AuthProvider.
- **Pattern**:
  ```
  Router root route → AuthLayout (provides AuthContext)
    ├── /auth → AuthPage
    └── / → ProtectedRoute → AppLayout (sidebar + Outlet)
        ├── index → DashboardPage
        ├── folder/:folderId → DashboardPage
        └── work/:workId → EditorPage
  ```

#### Issue 2: Duplicate Editor Instances in EditorPage
- **Problem**: First version of `EditorPage` used both `useEditor()` hook directly AND the `<Editor>` component (which also calls `useEditor()` internally), creating two separate TipTap editor instances.
- **Solution**: Removed the `<Editor>` component from `EditorPage` and used `useEditor()` + `<EditorContent>` directly. The standalone `<Editor>` component remains available for potential reuse elsewhere.

---

## File Explanations

### Root Config Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build configuration. Registers two plugins: `@vitejs/plugin-react` (JSX transform, Fast Refresh) and `@tailwindcss/vite` (processes Tailwind utility classes). Sets `base: '/writing_service/'` so asset paths work when deployed to `github.io/writing_service/`. |
| `index.html` | The single HTML page Vite serves. Contains `<div id="root">` where React mounts, and a `<script>` tag pointing to `src/main.tsx`. |
| `package.json` | Project manifest. Defines scripts: `dev` (local server), `build` (tsc + vite build), `predeploy`/`deploy` (build then push `dist/` to gh-pages branch). |
| `.env.example` | Template showing required env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Prefixed with `VITE_` so Vite exposes them to client code via `import.meta.env`. |
| `PRD.md` | Product requirements document — describes features, schema, routes, and project structure. |
| `supabase/schema.sql` | Full database DDL — creates `folders` and `works` tables, indexes, `updated_at` trigger, and 8 RLS policies (4 per table). Run manually in Supabase SQL Editor. |

### Source Files (`src/`)

#### Entry Point

| File | Purpose |
|------|---------|
| `main.tsx` | React entry point. Calls `createRoot()` on the `#root` DOM element and renders `<App />` inside `<StrictMode>` (enables extra dev-time checks). Imports `index.css` to load Tailwind. |
| `App.tsx` | Top-level component. Simply renders `<RouterProvider>` with the hash router. Kept minimal — auth and layout are handled inside the router tree. |
| `index.css` | CSS entry point. `@import "tailwindcss"` loads all Tailwind layers (base, components, utilities). `@plugin "@tailwindcss/typography"` enables the `prose` class for rich-text styling. Custom rule removes focus outline from TipTap editor. |
| `router.tsx` | Defines all routes using `createHashRouter` (hash-based routing for GitHub Pages compatibility). Wraps entire route tree in `AuthLayout` which provides the `AuthContext`. Protected routes are wrapped in `<ProtectedRoute>`. |

#### Library & Types

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Creates and exports a singleton Supabase client. Reads URL and anon key from `import.meta.env`. All data access goes through this single client instance. |
| `types/database.ts` | TypeScript interfaces matching the DB tables: `Folder` (id, user_id, parent_id, name, timestamps), `Work` (id, user_id, folder_id, title, content as JSON, timestamps), `FolderNode` (extends Folder with `children` array for tree representation). |
| `types/index.ts` | Barrel re-export file so consumers can `import { Folder, Work } from '../types'` without knowing the internal file structure. |

#### Contexts & Hooks

| File | Purpose |
|------|---------|
| `contexts/AuthContext.tsx` | Provides auth state to the entire app. On mount, calls `supabase.auth.getSession()` to restore an existing session, then subscribes to `onAuthStateChange` for real-time auth events (login, logout, token refresh). Exposes `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`. |
| `hooks/useAuth.ts` | Convenience hook that consumes `AuthContext`. Throws if used outside `AuthProvider` (fail-fast for dev errors). |
| `hooks/useFolders.ts` | Folder CRUD hook. `fetchFolders()` loads all user folders in one query, then `buildFolderTree()` transforms the flat array into a nested tree structure (O(n) using a Map). Also provides `createFolder`, `renameFolder`, `deleteFolder` — each re-fetches after mutation to keep state consistent. |
| `hooks/useWorks.ts` | Works CRUD hook. `fetchWorks(folderId?)` loads works optionally filtered by folder. `fetchWork(id)` loads a single work for the editor. `createWork` inserts a new row and returns it (so the UI can navigate to the new work). `updateWork` patches title/content. `deleteWork` removes from DB and optimistically removes from local state. |

#### Auth Components

| File | Purpose |
|------|---------|
| `components/auth/LoginForm.tsx` | Email/password sign-in form. Calls `signIn()` from auth context, displays error messages inline. |
| `components/auth/SignupForm.tsx` | Email/password sign-up form. Calls `signUp()`, shows success message prompting user to check email for confirmation. |
| `components/auth/AuthPage.tsx` | Tab-toggled container showing either LoginForm or SignupForm. Centered card layout. |
| `components/auth/ProtectedRoute.tsx` | Route guard. Shows loading spinner while auth initializes, redirects to `/auth` if no user, renders children if authenticated. |

#### Layout Components

| File | Purpose |
|------|---------|
| `components/layout/AppLayout.tsx` | Shell layout: vertical flex with Header on top, then horizontal flex with Sidebar on left and `<Outlet>` (page content) on right. Full viewport height. |
| `components/layout/Header.tsx` | Top bar showing app name, user email, and sign-out button. |
| `components/layout/Sidebar.tsx` | Left panel. Has "New Work" and "New Folder" buttons at top. Shows "All Works" link and the folder tree below. Uses `useFolders` hook to fetch/manage folders. Clicking "New Work" creates a work via `useWorks` and navigates to the editor. |

#### Folder Components

| File | Purpose |
|------|---------|
| `components/folders/FolderTree.tsx` | Renders a list of `FolderNode` roots. If empty, shows "No folders yet". Delegates each node to `FolderItem`. |
| `components/folders/FolderItem.tsx` | Recursive component for a single folder. Shows expand/collapse toggle (▶/▼) if it has children, folder name (clickable to navigate), and a "..." menu button (revealed on hover) with Rename and Delete options. Renders child `FolderItem`s when expanded. |
| `components/folders/CreateFolderDialog.tsx` | Modal dialog with a text input for naming a new folder. Fixed overlay positioning. |
| `components/folders/RenameFolderDialog.tsx` | Same pattern as CreateFolderDialog but pre-filled with current folder name. |

#### Works Components

| File | Purpose |
|------|---------|
| `components/works/WorksList.tsx` | Renders a list of `WorkCard`s. Shows loading state or `EmptyState` as appropriate. |
| `components/works/WorkCard.tsx` | Single work preview card. Shows title, formatted last-updated date, and a delete button. Clicking the card navigates to the editor (`/work/:id`). Delete button uses `stopPropagation` to avoid triggering navigation. |
| `components/works/EmptyState.tsx` | Placeholder shown when a folder has no works. |

#### Editor Components

| File | Purpose |
|------|---------|
| `components/editor/Editor.tsx` | Standalone TipTap editor wrapper. Creates an editor with StarterKit, calls `onUpdate` with the JSON representation on every change. Has a `useEffect` to sync external content changes (avoiding unnecessary resets by comparing JSON strings). Available for potential reuse. |
| `components/editor/EditorToolbar.tsx` | Toolbar with formatting buttons: Bold, Italic, Strikethrough, H1-H3, Bullet List, Ordered List, Blockquote, Code Block, Horizontal Rule. Each button uses `editor.chain().focus().toggle*().run()` and highlights when active. |
| `components/editor/TitleInput.tsx` | Simple transparent text input styled as a large heading. Used above the editor for the work's title. |

#### Page Components

| File | Purpose |
|------|---------|
| `pages/AuthPage.tsx` | Route-level auth page. Redirects to `/` if already logged in, otherwise renders the auth component. |
| `pages/DashboardPage.tsx` | Route-level dashboard. Reads `folderId` from URL params. Fetches works (all or filtered by folder) on mount/param change. Renders `WorksList` with delete capability. |
| `pages/EditorPage.tsx` | Route-level editor. Uses `useEditor` from TipTap directly (not the `<Editor>` component) to have direct access to the editor instance for the toolbar. Loads work data on mount, stores content in a ref (avoids re-renders on every keystroke). Manual "Save" button persists title + content to Supabase. Shows "Saved" indicator after successful save. |

---

### Build Verification

- **TypeScript**: `npx tsc -b --noEmit` passes with zero errors
- **Vite build**: Succeeds. Output:
  - `dist/index.html` — 0.49 KB
  - `dist/assets/index-*.css` — 24.79 KB (Tailwind utilities)
  - `dist/assets/index-*.js` — 836.92 KB (gzip: 257 KB)
- **Chunk size warning**: 836 KB bundle is expected for MVP (TipTap ~400KB + Supabase ~200KB + React ~150KB). Could code-split later with dynamic imports. Not a priority.
- **Node version warning**: Vite 7 wants Node >=20.19, we're on 18.12.0. Builds and runs fine despite the warning.

---

## Phases 2-6: Code Implementation

### Status: Complete (all code written, TypeScript compiles, build succeeds)

All source files for authentication, layout, folders, works, and editor were created in a single pass alongside Phase 1. The schema SQL is also written. Everything compiles and builds.

---

## Phase 2: Supabase Setup

### Status: Complete

- User created Supabase project and ran `supabase/schema.sql`
- User created `.env` with `VITE_SUPABASE_PROJECT_URL` and `VITE_SUPABASE_ANON_KEY`
- Note: Original plan used `VITE_SUPABASE_URL` but user named it `SUPABASE_PROJECT_URL`, so `src/lib/supabase.ts` and `.env.example` were updated to use `VITE_SUPABASE_PROJECT_URL` to match

---

## Phase 7: Deploy

### Status: Complete

- GitHub repo: `kamdarsk23/writing_service`
- `vite.config.ts` base path: `/writing_service/`
- PR created on branch `feat/mvp-writing-workspace`, merged to `main`
- GitHub Pages deployed by user
- Live at: `https://kamdarsk23.github.io/writing_service/`

### Git Workflow Used
1. Created initial commit on `main` with just `.gitignore` (so there was a base to branch from)
2. Created `feat/mvp-writing-workspace` branch with all 44 project files
3. Pushed branch, created PR, merged to main
4. Set `main` as default branch in GitHub settings

---

## Codebase Cleanup

### Status: Complete

Removed unnecessary files to reduce clutter:

| Removed | Reason |
|---------|--------|
| `.env.example` | User already has `.env` configured; template no longer needed |
| `README.md` (old) | Was Vite's boilerplate about ESLint config, not project docs. Replaced with proper project README |
| `eslint.config.js` | Not using ESLint in current workflow |
| `src/assets/` | Empty directory (Vite boilerplate artifacts were already deleted earlier) |
| `public/` | Empty directory (vite.svg was already deleted earlier) |
| `dist/` | Build output, gitignored, just local clutter |
| `src/components/editor/Editor.tsx` | Unused standalone component — `EditorPage.tsx` uses `useEditor` + `EditorContent` directly, so this was dead code |

Also removed ESLint dev dependencies from `package.json`:
- `@eslint/js`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`
- Removed `"lint": "eslint ."` script

**Build verified after cleanup** — TypeScript compiles, Vite builds successfully

---

## Bug Fix: EditorPage infinite re-render / loading flicker

### Status: Complete

### Symptom
Opening a work in the editor caused rapid flickering between "Loading..." and the editor UI. Typing in the title field also re-triggered the loading flash.

### Root Cause (two bugs)

**Bug 1: `fetchWork` not memoized in `useWorks.ts`**

`fetchWork` was a plain async function (not wrapped in `useCallback`), so it got a new reference on every render. The `useEffect` in `EditorPage` had `fetchWork` in its dependency array, so every re-render triggered the effect, which set `loading = true` (flash), fetched data, set `loading = false` (flash back), causing the next re-render — an infinite loop.

Typing in the title called `setTitle()` → re-render → new `fetchWork` ref → effect re-runs → loading flash on every keystroke.

**Bug 2: `editor` in the useEffect dependency array**

TipTap's `useEditor` returns `null` initially, then the real editor instance once initialized. This change triggered the effect a second time, causing a double-fetch and double loading flash on initial load.

### Fix Applied

1. **`useWorks.ts`**: Wrapped `fetchWork` in `useCallback` with empty dependency array (it only uses `supabase` which is a module-level singleton)

2. **`EditorPage.tsx`**: Split the single `useEffect` into two:
   - **Effect 1** (fetch data): depends on `[workId, fetchWork, navigate]` only — no `editor` dependency. Stores fetched content in `loadedContentRef`
   - **Effect 2** (sync to editor): depends on `[editor, loading]` — once both the editor is ready AND data has loaded, pushes content into TipTap via `setContent()`

### Additional Changes
- Removed `saveStatus` state and "Saved" indicator (unnecessary for MVP)
- Save button now navigates back to dashboard after saving
- Simplified `TitleInput` onChange (no longer tracks save status)
