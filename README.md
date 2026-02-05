# Writing Service

A personal writing workspace for creating, organizing, and editing written works. React frontend hosted on GitHub Pages, with Supabase for authentication and data storage.

## Features

- **Authentication** — Email/password sign-up and sign-in via Supabase
- **Nested Folders** — Organize works in a folder hierarchy (unlimited depth)
- **Rich Text Editor** — TipTap with bold, italic, headings, lists, blockquotes, code blocks
- **Per-User Isolation** — Row Level Security ensures each user only sees their own data
- **Manual Save** — Save button persists title and content to the database

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | React 19 + TypeScript               |
| Build     | Vite                                |
| Styling   | Tailwind CSS v4                     |
| Routing   | React Router v7 (hash router)       |
| Editor    | TipTap (StarterKit)                 |
| Auth & DB | Supabase                            |
| Deploy    | GitHub Pages via gh-pages            |

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings > API** and copy the Project URL and anon key

### 3. Configure environment

Create a `.env` file in the project root:

```
VITE_SUPABASE_PROJECT_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run locally

```
npm run dev
```

### 5. Deploy to GitHub Pages

```
npm run deploy
```

This builds the app and pushes the `dist/` folder to the `gh-pages` branch. Make sure GitHub Pages is configured to deploy from that branch in your repo settings.

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # RouterProvider
├── index.css             # Tailwind imports
├── router.tsx            # Hash router + route definitions
├── lib/supabase.ts       # Supabase client singleton
├── types/                # TypeScript interfaces (Folder, Work, FolderNode)
├── contexts/             # AuthContext (session state)
├── hooks/                # useAuth, useFolders, useWorks
├── components/
│   ├── auth/             # Login, Signup, ProtectedRoute
│   ├── layout/           # AppLayout, Header, Sidebar
│   ├── folders/          # FolderTree, FolderItem, dialogs
│   ├── works/            # WorksList, WorkCard, EmptyState
│   └── editor/           # EditorToolbar, TitleInput
└── pages/                # AuthPage, DashboardPage, EditorPage
```
