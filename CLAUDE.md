# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DevWeb** is a full-stack monorepo for an AI-powered career prep platform. Core features: Resume Analyzer (AI interview question generation), CS Study Quiz (Gemini-generated Q&A), and Application Tracker (job application CRUD).

## Commands

### Frontend (`/frontend`)
```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (`/backend`)
```bash
./gradlew bootRun          # Start dev server (http://localhost:8080)
./gradlew build            # Full build + tests
./gradlew test             # Run all tests
./gradlew test --tests "com.devweb.ClassName.methodName"  # Single test
```

### Environment Setup
- Backend env vars: `backend/.env.properties` — requires `GEMINI_API_KEY`
- Frontend API base URL: `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`)
- Node version: 24.2.0 (see `.nvmrc`)
- Java version: 17

## Architecture

### Backend — Hexagonal / Layered Architecture

```
api/        → REST controllers + request/response DTOs
domain/     → Pure business logic (entities, ports, services)
infra/      → Port implementations (JPA, Gemini AI, file storage, text parsing)
common/     → ApiResponse wrapper, shared exceptions
```

All API responses use the `ApiResponse<T>(success, data, error)` wrapper defined in `common/`.

Domain layer defines **port interfaces**; `infra/` provides implementations. Never let `infra/` depend on `api/`.

**Domain modules:** `recruitmenttracker`, `resume`, `studyquiz`, `member`

**Key infra adapters:**
- `infra/ai/` — Google Gemini 2.5-flash integration (90s timeout, 8192 token max)
- `infra/storage/` — Local file storage at `backend/storage/resume/` (dev); S3 planned for prod
- `infra/persistence/` — Spring Data JPA repositories
- `infra/text/` — PDFBox (PDF parsing) + jsoup (HTML parsing)

**Database:** H2 in-memory (`jdbc:h2:mem:devweb`) in dev; PostgreSQL for prod. H2 console available at `/h2-console`.

### Frontend — Feature-Based Structure

```
src/app/          → Next.js App Router pages (routing only)
src/features/     → Business domain modules, each with:
                     api/        API client functions
                     components/ Feature-specific UI
                     hooks/      TanStack Query hooks
src/components/   → Shared layout components (AppFrame, AppShell, AppSidebar…)
src/lib/api.ts    → Base fetch wrapper (sets base URL, handles ApiResponse)
```

**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, TanStack Query 5.

### API Endpoint Map

| Controller | Path prefix | Responsibility |
|---|---|---|
| `RecruitmentEntryController` | `/api/recruitment` | Job application CRUD |
| `RecruitmentEntryNoteController` | `/api/recruitment/.../notes` | Application notes |
| `ResumeSessionController` | `/api/resume/sessions` | Resume upload & analysis sessions |
| `ResumeQuestionController` | `/api/resume/questions` | AI interview question generation |
| `CsQuizQuestionController` | `/api/cs-quiz/questions` | CS problem bank |
| `CsQuizSessionController` | `/api/cs-quiz/sessions` | Quiz session management |
| `MemberController` | `/api/members` | User profile |

## Key Conventions

- **Rich Domain Model**: business logic lives inside domain entities, not in service layer.
- **File upload limits**: 10MB per file, 20MB per multipart request (configured in `application.yml`).
- Path alias `@/*` maps to `frontend/src/*`.
