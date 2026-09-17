# Campus Canvas — A Canvas for Every Creative Mind

**Campus Canvas** is a curated digital literary and visual arts revue where students can submit creative work (poems, short stories, essays, fine art, photography, and poster designs) under their own names or pen names, with an editorial review step before anything goes live.

Modeled in the classic tradition of curated literary journals and revues, the site features an editorial serif typeface, warm off-white palette, and custom "Editor's Notes" providing constructive feedback on published pieces.

---

## Architecture & Project Structure

The project is structured into three independent applications:

```
campus-canvas/
├── frontend/   → Public-facing literary journal (React + Vite + Tailwind CSS)
├── admin/      → Editor review dashboard (React + Vite + Tailwind CSS)
├── backend/    → REST API server (Node.js + Express + Prisma + PostgreSQL / SQLite)
└── README.md
```

### Tech Stack
- **Frontend & Admin**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide Icons.
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM, JSON Web Tokens (JWT), Bcrypt, Multer, Cloudinary (with automatic local storage fallback).

---

## Quick Start Guide

### 1. Backend Setup

```bash
cd backend
npm install
```

#### Database Configuration (PostgreSQL / SQLite)
The project is built for **PostgreSQL** with Prisma. 
Copy the environment file:
```bash
cp .env.example .env
```

Set your `DATABASE_URL` in `.env`:
```env
# PostgreSQL connection string:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campuscanvas?schema=public"
```

> **Zero-Config Local Development**:
> If you do not have PostgreSQL running locally yet, run:
> ```bash
> npm run use:sqlite
> ```
> This automatically configures SQLite (`file:./dev.db`) for immediate offline testing. To switch back to PostgreSQL at any time, run:
> ```bash
> npm run use:postgres
> ```

#### Generate Prisma Client, Sync DB, & Seed
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

The seed script creates:
- Default Editor account:
  - **Email**: `editor@campuscanvas.org`
  - **Password**: `editor123`
- Curated approved literary works across Poetry, Fiction, Essays, Fine Art, Photography, and Posters with Polyphony Lit-style Editor's Notes.
- Sample pending submissions ready to review in the Admin dashboard.

#### Start Backend Server
```bash
npm run dev
# Server will run at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

---

### 2. Frontend Setup (Public Literary Journal)

```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
# Public site will run at http://localhost:5173
```

#### Features:
1. **Explore (Home)**: Wandering masonry feed mixing poetry excerpts, essays, and visual art together without rigid filters (inspired by Storybird's browse experience).
2. **Browse & Search**: Structured catalog: filter by medium, category, tags, keyword search by title/author pseudonym, and sorting (newest, oldest, title).
3. **Piece Detail Page**: Focused single-column reader with drop-caps for prose, stanza spacing for poetry, high-res artwork preview, and a highlighted **"Editor's Note"** box.
4. **Submit Work**: Welcoming submission portal with live line/word counters, drag-and-drop media uploads, and clear notice of editorial peer review.

---

### 3. Admin Setup (Editorial Board Dashboard)

```bash
cd ../admin
npm install
cp .env.example .env
npm run dev
# Admin dashboard will run at http://localhost:5174
```

#### Features:
1. **Editor Authentication**: Secure JWT login with role checks.
2. **Pending Review Queue**: Real-time queue of all pending submissions (`status = 'pending'`).
3. **Manuscript Inspector**: Full modal view to inspect the poem/essay text or visual artwork/PDF.
4. **Editor's Note**: Textarea to compose thoughtful feedback and craft praise.
5. **Approve / Reject Controls**: Updates submission status server-side.
6. **Review Archive**: Complete log of past approved and rejected manuscripts.

---

## How the Approval Flow Works

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student / Author
    participant Frontend as Frontend (:5173)
    participant Backend as Backend (:5000)
    participant DB as Prisma / Postgres
    actor Editor as Editorial Board
    participant Admin as Admin Dashboard (:5174)

    Student->>Frontend: Fills out Submit Form (Poem, Art, or Essay)
    Frontend->>Backend: POST /api/submissions (multipart/form-data)
    Note over Backend: Server strictly sets status = 'pending'<br/>Ignores any client override attempt
    Backend->>DB: Stores submission with status='pending'
    Backend-->>Frontend: HTTP 201 (Queued for Editorial Review)
    Frontend-->>Student: Displays Confirmation & Reference ID

    Note over Backend: Security Rule Enforced:<br/>GET /api/submissions & /api/submissions/:id<br/>NEVER return pending items to public!

    Editor->>Admin: Logs in as editor@campuscanvas.org
    Admin->>Backend: POST /api/auth/login
    Backend-->>Admin: Returns JWT (role: 'editor')
    Admin->>Backend: GET /api/submissions?status=pending (Bearer Token)
    Backend-->>Admin: Returns list of pending submissions
    Editor->>Admin: Inspects piece & writes "Editor's Note"
    Editor->>Admin: Clicks "Approve for Publication"
    Admin->>Backend: PATCH /api/submissions/:id/review { status: 'approved', editorComment: '...' }
    Note over Backend: Middleware verifies editor role<br/>Sets status='approved', reviewedAt=now()
    Backend->>DB: Updates submission status & comment
    Backend-->>Admin: Success confirmation

    Note over Frontend: Piece is now live!
    Frontend->>Backend: GET /api/submissions
    Backend-->>Frontend: Includes newly approved piece
    Frontend-->>Student: Piece appears on Explore Feed with highlighted Editor's Note
```

---

## Server-Side Security Rules

These rules are enforced at the API controller level and cannot be bypassed via query manipulation:

| Endpoint | Method | Rule Enforced |
|---|---|---|
| `/api/submissions` | `GET` | **Approved-only for public**: If user is not an authenticated editor, query strictly forces `where: { status: 'approved' }`, ignoring any `?status=pending` query parameter. |
| `/api/submissions/:id` | `GET` | **Approved-only for public**: If requested piece status is not `'approved'`, returns `HTTP 404` to non-editors. |
| `/api/submissions` | `POST` | **Pending-only on creation**: Always sets `status = 'pending'`, `editorComment = null`, `reviewedAt = null`, regardless of request payload. |
| `/api/submissions/:id/review` | `PATCH` | **Editor-only**: Protected by `requireEditor` middleware. Only authenticated editors can change status to `'approved'` or `'rejected'`. |
| `/api/auth/login` | `POST` | Verifies editor credentials with `bcrypt.compare` and issues signed JWT. |

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | API Server port | `5000` |
| `DATABASE_URL` | PostgreSQL or SQLite connection URL | `"file:./dev.db"` or PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing editor tokens | `campus_canvas_super_secret_jwt_key_2026_literary` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional) | `""` (falls back to local `/uploads`) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (optional) | `""` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (optional) | `""` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `ADMIN_URL` | Allowed admin origin for CORS | `http://localhost:5174` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

### Admin (`admin/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## Automated Verification

To run the backend API security test suite:
```bash
cd backend
node verify-api.js
```
This tests all 8 core security and business rules automatically.
