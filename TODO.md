# PocketMate - Development TODO

**Last Updated:** February 2026  
**Current Phase:** Phase 1 - Setup & Infrastructure

---

## ✅ Completed Tasks

### Sprint 1.1 (Project Setup & Configuration)
- Next.js 14+ app with TypeScript and App Router
- Folder structure: `/app`, `/components`, `/lib`, `/types`, `/supabase`
- ESLint and Prettier configured; `tsconfig.json` and path alias `@/*`
- `.env.local.example` and `.gitignore` in place; Git initialized
- Tailwind CSS 3.x + shadcn/ui (Button component); global styles and theme tokens

### Sprint 1.2 (Database Setup)
- Supabase client installed; `lib/supabase.ts` and env vars documented
- `supabase/schema.sql` (tables, indexes, triggers, RLS) and `supabase/seed.sql` (default categories) ready to run in Supabase
- `types/database.types.ts` created from schema

---

## 🔄 Phase 1: Setup & Infrastructure (Week 1)

### Sprint 1.1: Project Setup & Configuration

- [x] **Initialize Next.js Project**
  - [x] Create Next.js 14+ app with TypeScript
  - [x] Configure `next.config.js` for optimal settings
  - [x] Set up folder structure (`/app`, `/components`, `/lib`, `/types`)
  - [x] Install core dependencies: `npm install`
  
- [x] **Configure Development Tools**
  - [x] Set up ESLint and Prettier
  - [x] Configure TypeScript (`tsconfig.json`)
  - [x] Add `.env.local` for environment variables
  - [x] Create `.gitignore` and initialize Git
  
- [x] **Install UI Framework**
  - [x] Install Tailwind CSS
  - [x] Install shadcn/ui CLI
  - [x] Initialize shadcn/ui components
  - [x] Set up global styles and theme

### Sprint 1.2: Database Setup

- [x] **Supabase Configuration**
  - [ ] Create Supabase project
  - [ ] Get Supabase URL and anon key
  - [x] Add to `.env.local` file (template: `.env.local.example`)
  - [x] Install Supabase client: `npm install @supabase/supabase-js`
  
- [x] **Run Database Schema** (See `docs/database-schema.md`)
  - [x] Execute main schema SQL (tables, indexes, triggers) — scripts in `supabase/schema.sql`
  - [x] Execute RLS policies SQL — included in `supabase/schema.sql`
  - [x] Execute default categories seed data — script in `supabase/seed.sql`
  - [ ] Verify all tables created successfully (run scripts in Supabase SQL editor or CLI)
  - [ ] Test RLS policies are working

- [x] **Create Database Types**
  - [x] Generate TypeScript types from Supabase schema
  - [x] Create `/types/database.types.ts`
  - [x] Create helper types for common queries

### Sprint 1.3: Authentication Implementation

**Reference:** `docs/requirements.md` sections FR-AUTH-001, FR-AUTH-002, FR-AUTH-003

- [ ] **Set up Supabase Auth**
  - [ ] Configure Supabase Auth settings
  - [ ] Create auth utility functions in `/lib/auth.ts`
  - [ ] Create auth context provider
  
- [ ] **Build Registration Flow** (FR-AUTH-001)
  - [ ] Create `/app/auth/register/page.tsx`
  - [ ] Build registration form with React Hook Form + Zod
  - [ ] Implement username validation
  - [ ] Implement password validation (min 8 chars)
  - [ ] Create API route: `POST /api/auth/register`
  - [ ] Handle successful registration → auto login
  - [ ] Add error handling (duplicate username, etc.)
  
- [ ] **Build Login Flow** (FR-AUTH-002)
  - [ ] Create `/app/auth/login/page.tsx`
  - [ ] Build login form with React Hook Form + Zod
  - [ ] Create API route: `POST /api/auth/login`
  - [ ] Implement session token creation
  - [ ] Redirect to dashboard on success
  - [ ] Handle invalid credentials errors
  
- [ ] **Build Logout Flow** (FR-AUTH-003)
  - [ ] Create logout function in auth utils
  - [ ] Create API route: `POST /api/auth/logout`
  - [ ] Add logout button to navbar/header
  - [ ] Clear session and redirect to login

- [ ] **Protected Routes Middleware**
  - [ ] Create `/middleware.ts` for route protection
  - [ ] Protect all routes except `/auth/*`
  - [ ] Redirect unauthenticated users to login
  - [ ] Create auth state management

### Sprint 1.4: Core Layout & Navigation

- [ ] **Create Main Layout**
  - [ ] Design and build main app layout
  - [ ] Create sidebar/navbar navigation
  - [ ] Add user info display in header
  - [ ] Make responsive for mobile
  
- [ ] **Create Dashboard Skeleton**
  - [ ] Create `/app/dashboard/page.tsx`
  - [ ] Add placeholder cards for summary stats
  - [ ] Add "Quick Actions" section
  - [ ] Add "Recent Transactions" placeholder

---

## 📋 Phase 2: Account Management (Week 2)

**Reference:** `docs/requirements.md` sections FR-ACC-001 through FR-ACC-004

_Will be detailed when Phase 1 is complete_

---

## 📋 Phase 3: Transaction Management (Weeks 3-4)

**Reference:** `docs/requirements.md` sections FR-TXN-001 through FR-TXN-007, FR-CAT-001 through FR-CAT-004

_Will be detailed when Phase 2 is complete_

---

## 📋 Phase 4: Reporting & Analytics (Weeks 5-6)

**Reference:** `docs/requirements.md` sections FR-RPT-001 through FR-RPT-005

_Will be detailed when Phase 3 is complete_

---

## 📋 Phase 5: Testing & Refinement (Week 7)

_Will be detailed when Phase 4 is complete_

---

## 📝 Notes & Decisions

### Tech Stack Confirmations
- ✅ Next.js 14+ with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ shadcn/ui for components
- ✅ Supabase for backend/database
- ✅ React Hook Form + Zod for forms
- ✅ TanStack Query for data fetching (will add in Phase 2)
- ✅ Recharts for visualizations (will add in Phase 4)

### Environment Variables Needed
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Folder Structure
```
pocketmate/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── accounts/
│   ├── transactions/
│   ├── reports/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── forms/
│   ├── layouts/
│   └── shared/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── utils.ts
├── types/
│   └── database.types.ts
├── docs/
│   ├── requirements.md
│   ├── database-schema.md
│   └── api-design.md
└── TODO.md
```

---

## 🐛 Known Issues

_None yet_

---

## 💡 Future Considerations

- Consider adding Sentry for error tracking
- Consider adding analytics (PostHog, Plausible)
- Consider adding tests (Vitest, Playwright)
- Consider adding Storybook for component development

---

## 📚 Reference Documents

- **Requirements:** `docs/requirements.md`
- **Database Schema:** `docs/database-schema.md`
- **API Design:** `docs/api-design.md`
