# Writing Service - Product Requirements Document

## Overview

A personal writing workspace application for creating, organizing, and editing written works. The app is a static SPA hosted on GitHub Pages with Supabase providing authentication and database services.

## Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Frontend    | React 19 + TypeScript                     |
| Build       | Vite                                      |
| Styling     | Tailwind CSS v4 + @tailwindcss/typography |
| Routing     | React Router v7 (hash router)             |
| Editor      | TipTap (StarterKit)                       |
| Auth & DB   | Supabase (email/password auth, PostgreSQL) |
| Deployment  | GitHub Pages via gh-pages                 |

## Core Features

### Authentication
- Email/password sign-up and sign-in via Supabase Auth
- Session persistence across page reloads
- Protected routes redirect unauthenticated users to login

### Folder Organization
- Nested folder hierarchy (unlimited depth)
- Create, rename, and delete folders
- Collapsible folder tree in sidebar
- Deleting a folder cascades to child folders; works in deleted folders move to root (unfiled)

### Works Management
- Create new works (with optional folder assignment)
- View list of works in selected folder or at root level
- Work cards show title, last updated date
- Delete works

### Editor
- TipTap-based rich text editor with StarterKit extensions:
  - Bold, italic, strikethrough
  - Headings (H1-H3)
  - Bullet lists, ordered lists
  - Blockquotes, code blocks, horizontal rules
- Editable title above editor
- Manual save button (auto-save deferred to post-MVP)
- Content stored as TipTap JSON in Supabase

### Data Isolation
- Row Level Security (RLS) ensures users can only access their own data
- Supabase anon key is safe in the client bundle by design (RLS enforces access control)

## Database Schema

### `folders` table
| Column     | Type        | Constraints                                    |
| ---------- | ----------- | ---------------------------------------------- |
| id         | uuid        | PK, default gen_random_uuid()                  |
| user_id    | uuid        | NOT NULL, FK -> auth.users(id) ON DELETE CASCADE |
| parent_id  | uuid        | FK -> folders(id) ON DELETE CASCADE (nullable)  |
| name       | text        | NOT NULL                                       |
| created_at | timestamptz | NOT NULL, default now()                        |
| updated_at | timestamptz | NOT NULL, default now()                        |

### `works` table
| Column     | Type        | Constraints                                       |
| ---------- | ----------- | ------------------------------------------------- |
| id         | uuid        | PK, default gen_random_uuid()                     |
| user_id    | uuid        | NOT NULL, FK -> auth.users(id) ON DELETE CASCADE  |
| folder_id  | uuid        | FK -> folders(id) ON DELETE SET NULL (nullable)    |
| title      | text        | NOT NULL, default 'Untitled'                      |
| content    | jsonb       | NOT NULL, default '{}'                            |
| created_at | timestamptz | NOT NULL, default now()                           |
| updated_at | timestamptz | NOT NULL, default now()                           |

### RLS Policies
Each table has 4 policies (select, insert, update, delete) enforcing `auth.uid() = user_id`.

## Routes

| Path               | Component      | Description                        |
| ------------------ | -------------- | ---------------------------------- |
| /#/auth            | AuthPage       | Login / signup form                |
| /#/                | DashboardPage  | Root-level works + folder tree     |
| /#/folder/:folderId | DashboardPage | Works within a specific folder     |
| /#/work/:workId    | EditorPage     | Editor for a single work           |

## Project Structure

```
writing_service/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
├── PRD.md
├── supabase/
│   └── schema.sql
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── router.tsx
    ├── lib/
    │   └── supabase.ts
    ├── types/
    │   ├── database.ts
    │   └── index.ts
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useFolders.ts
    │   └── useWorks.ts
    ├── contexts/
    │   └── AuthContext.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── Header.tsx
    │   ├── auth/
    │   │   ├── AuthPage.tsx
    │   │   ├── LoginForm.tsx
    │   │   ├── SignupForm.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── folders/
    │   │   ├── FolderTree.tsx
    │   │   ├── FolderItem.tsx
    │   │   ├── CreateFolderDialog.tsx
    │   │   └── RenameFolderDialog.tsx
    │   ├── works/
    │   │   ├── WorksList.tsx
    │   │   ├── WorkCard.tsx
    │   │   └── EmptyState.tsx
    │   └── editor/
    │       ├── Editor.tsx
    │       ├── EditorToolbar.tsx
    │       └── TitleInput.tsx
    └── pages/
        ├── AuthPage.tsx
        ├── DashboardPage.tsx
        └── EditorPage.tsx
```

## Non-Goals (MVP)
- Auto-save (manual save is sufficient)
- UI polish / aesthetics (functionality first)
- Collaborative editing
- File/image uploads
- Export functionality
- Search
