# SyntheQuiz

An AI-powered quiz builder for educators. Generate multiple-choice or true/false quizzes either straight from an LLM's own knowledge, or grounded in a document you upload — lecture notes, a PDF chapter, a DOCX handout — using retrieval-augmented generation.

## How it works

SyntheQuiz supports two quiz generation paths:

- **Standard generation** — give it a topic, difficulty, question type, and count; Gemini 2.5 Flash (`temperature=0.3`, structured output via Pydantic) generates MCQ or true/false questions straight from its own knowledge, each with an explanation.
- **Document-grounded (RAG) generation** — upload a PDF, DOCX, or TXT file. The backend:
  1. Loads it with the appropriate LangChain loader (`PyPDFLoader`, `Docx2txtLoader`, `TextLoader`), enforcing limits upfront — max 10MB, max 100 pages (PDF), max 250,000 characters (DOCX/TXT).
  2. Splits it into overlapping chunks (`RecursiveCharacterTextSplitter`, 500 chars / 50 overlap).
  3. Embeds chunks in batches of 20 with `gemini-embedding-001`, pausing 1s between batches to stay within API rate limits, and stores each vector in Postgres via `pgvector` (all inside one DB transaction, so a failure mid-ingest doesn't leave orphaned rows).
  4. At generation time, embeds the topic as a query and retrieves the top-4 most similar chunks using cosine distance (`<=>`) over an HNSW index on `halfvec(3072)`.
  5. Feeds those chunks to Gemini with a system prompt that explicitly forbids referencing document structure ("According to Step 2...") so questions read like standalone exam questions rather than reading-comprehension prompts. If the topic isn't actually covered by the retrieved context, generation returns an empty set rather than hallucinating.

Once generated, questions go through a curation step where you can pick/unpick individual questions, generate more, and then save the finished quiz — saving runs inside a single DB transaction covering the quiz row and every question row.

## Tech stack

**Backend**
- FastAPI (async), served via `uv`
- PostgreSQL + `pgvector` (single database for relational data and embeddings, no separate vector store)
- `asyncpg` with raw SQL
- LangChain + `langchain-google-genai` for generation and embeddings
- JWT auth (`PyJWT`) with httpOnly cookie-stored access & refresh tokens
- `bcrypt` for password hashing

**Frontend**
- React 19 + Vite
- Tailwind CSS 4
- Zustand for state
- React Router
- Axios (with an interceptor that transparently refreshes expired sessions)

## Authentication & security

- **Passwords** are hashed with `bcrypt` (`bcrypt.hashpw` with a per-password salt via `bcrypt.gensalt()`) before ever touching the database. Hashing and verification run in a background thread (`asyncio.to_thread`) so they never block the event loop. `password_hash` is never selected or returned in any API response.
- **Only educator accounts can self-register** — the `students` user type exists in the schema for future enrollment features, but the `/users/register` endpoint currently rejects `user_type: "student"`.
- **JWT auth** uses two tokens signed with `PyJWT` (`HS256` by default):
  - `access_token` — short-lived (15 min by default), sent on every protected request, decoded and validated in `middleware/authCheck.py`.
  - `refresh_token` — long-lived (7 days by default), only ever read on `POST /users/refreshToken` to mint a new access token.
  - Each token carries a `type` claim (`access` / `refresh`) so one can't be used in place of the other, plus `iat`/`exp` claims.
- **Cookies, not headers.** Both tokens are set as `httpOnly` cookies (`samesite=none`, `secure=True` outside of dev) — JavaScript can never read them, which closes off XSS-based token theft.
- **Silent refresh on the frontend.** The Axios instance (`util/axiosInstance.js`) intercepts any `401`, calls `/users/refreshToken`, and retries the original request once — the user never sees a forced logout just because their access token expired mid-session.
- **Role-gated routes.** `verify_user_token` guards any authenticated route; `verify_educator` layers on top to restrict a route to educator accounts only.

## Project structure

```
SyntheQuiz/
├── backend/
│   ├── controllers/     # business logic per resource
│   ├── routes/           # FastAPI routers
│   ├── middleware/       # auth checks
│   ├── db/                # connection pool + schema.sql
│   ├── util/              # config, document loader, quiz generation
│   └── main.py
└── frontend/
    └── src/
        ├── components/    # CreateQuiz, QuizCuration, Sidebar, etc.
        ├── pages/          # Dashboard, Homepage, Login, Signup
        ├── stores/         # zustand stores
        └── util/
```

## Getting started

### Prerequisites
- Python 3.13+ and [uv](https://docs.astral.sh/uv/)
- Node.js
- PostgreSQL with the `vector` and `pgcrypto` extensions available

### Backend setup

```bash
cd backend
uv sync
```

Create a `.env` file in `backend/` with:

```
DB_URL=postgresql://user:password@localhost:5432/synthequiz
GOOGLE_API_KEY=your_google_generative_ai_key

# JWT / auth
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256                  # optional, defaults to HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15       # optional, defaults to 15
REFRESH_TOKEN_EXPIRE_DAYS=7          # optional, defaults to 7

# NODE_ENV=DEVELOPMENT relaxes cookie `secure` flag for local HTTP dev
NODE_ENV=DEVELOPMENT

# CORS — comma-separated list of allowed frontend origins
FRONTEND_ORIGINS=http://localhost:5173
```

Run the server:

```bash
uv run fastapi dev main.py
```

The schema in `db/schema.sql` is applied automatically on startup.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and expects the backend to be reachable (CORS is configured for this origin by default). By default the frontend calls `http://localhost:8000`; override this with a `VITE_API_URL` env var (e.g. in `frontend/.env`) if your backend runs elsewhere.

## API overview

All routes below except register/login/logout/refresh require a valid `access_token` cookie (`verify_user_token`).

**`/users`** — auth & profile
| Method | Path | Purpose |
|---|---|---|
| POST | `/users/register` | Create an educator account (bcrypt-hashed password); sets auth cookies |
| POST | `/users/login` | Verify credentials; sets auth cookies |
| POST | `/users/logout` | Clear auth cookies |
| POST | `/users/refreshToken` | Exchange a valid refresh token cookie for a new access token |
| GET | `/users/me` | Get the current authenticated user |
| GET | `/users/{user_id}` | Get a user by ID |
| PATCH | `/users/{user_id}` | Partially update first/last name |
| DELETE | `/users/{user_id}` | Delete a user (cascades to their documents/quizzes) |

**`/courses`** — course management
| Method | Path | Purpose |
|---|---|---|
| GET | `/courses/getAllCourses` | List courses for the current coordinator |
| POST | `/courses/` | Create a course |
| GET | `/courses/{course_id}` | Get a course by ID |
| PATCH | `/courses/{course_id}` | Update a course |
| DELETE | `/courses/{course_id}` | Delete a course |

**`/documents`** — uploaded source material
| Method | Path | Purpose |
|---|---|---|
| GET | `/documents/` | List the current user's uploaded documents |
| DELETE | `/documents/{document_id}` | Delete a document (only if owned by the requester) |

**`/quiz`** — generation
| Method | Path | Purpose |
|---|---|---|
| POST | `/quiz/upload_document` | Upload + ingest a PDF/DOCX/TXT file (chunk, embed, store in pgvector) |
| POST | `/quiz/generate/standard` | Generate a quiz from the LLM's own knowledge |
| POST | `/quiz/generate/document` | Generate a quiz grounded in a previously uploaded document |

**`/quizzes`** — saved quizzes
| Method | Path | Purpose |
|---|---|---|
| POST | `/quizzes/` | Save a curated quiz + its questions (atomic transaction) |
| GET | `/quizzes/user/{user_id}` | List quiz summaries for a user |
| GET | `/quizzes/course/{course_id}` | List quiz summaries for a course |
| GET | `/quizzes/{quiz_id}` | Get a quiz with all its questions |
| DELETE | `/quizzes/{quiz_id}` | Delete a quiz (cascades to its questions) |

## Status

Backend is functionally complete (auth, document pipeline, quiz generation, schema). Frontend is under active development — the quiz curation UI is the current focus. This is a portfolio project and still a work in progress.
