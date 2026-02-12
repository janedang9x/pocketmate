# PocketMate

Personal/family finance MVP built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS + shadcn/ui**, and **Supabase**.

## Stack

- Next.js 14+ (App Router)
- TypeScript, ESLint (flat config)
- Tailwind CSS 3.4 + shadcn/ui
- Supabase (PostgreSQL + Auth)
- React Hook Form + Zod (to be added with auth flows)
- TanStack Query (Phase 2)

## Getting started

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.local.example .env.local
# Fill in Supabase keys from your project
```

3. Run the app

```bash
npm run dev
```

Visit http://localhost:3000

## Supabase setup (Phase 1.2)

1. Create a Supabase project and copy:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

2. Apply schema and RLS policies (see `docs/database-schema.md`):

```bash
# Using Supabase CLI (recommended)
supabase db execute --db-url "$SUPABASE_DB_URL" --file supabase/schema.sql
```

Or paste `supabase/schema.sql` into the Supabase SQL editor.

3. Seed default categories:

```bash
supabase db execute --db-url "$SUPABASE_DB_URL" --file supabase/seed.sql
```

Alternatively, run the seed script in the SQL editor.

4. Generate types (optional, once Supabase CLI is connected):

```bash
supabase gen types typescript --project-id <project-id> --schema public > types/database.types.ts
```

## Project structure

- `app/` – App Router routes, layouts, and pages
- `components/ui/` – shadcn/ui components (Button scaffolded)
- `lib/` – shared utilities (`supabase`, `utils`)
- `types/` – TypeScript types (`database.types.ts`)
- `supabase/` – schema and seed SQL files
- `docs/` – requirements, database schema, API design
- `TODO.md` – sprint plan (Phase 1.1 & 1.2)

## NPM scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run built app
- `npm run lint` – run ESLint

## Next steps (per TODO.md)

- Finish Supabase wiring (envs + schema + seeds)
- Implement auth flows (FR-AUTH-001/002/003)
- Protect routes via middleware
- Build dashboard skeleton (layout, navigation, placeholders)
