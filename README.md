# SyntheQuiz

An AI-powered quiz builder for educators. Generate multiple-choice or true/false quizzes either straight from an LLM's own knowledge, or grounded in a document you upload — lecture notes, a PDF chapter, a DOCX handout — using retrieval-augmented generation.

## How it works

SyntheQuiz supports two quiz generation paths:

- **Standard generation** — give it a topic, difficulty, question type, and count; the LLM (Gemini 2.5 Flash) generates the quiz from its own knowledge.
- **Document-grounded (RAG) generation** — upload a PDF, DOCX, or TXT file. The backend chunks and embeds it (`gemini-embedding-001`), stores the vectors in Postgres via `pgvector`, and retrieves relevant chunks to ground the generated questions in your material.

Once generated, questions go through a curation step where you can pick/unpick individual questions, generate more, and then save the finished quiz.

## Tech stack

**Backend**
- FastAPI (async), served via `uv`
- PostgreSQL + `pgvector` (single database for relational data and embeddings, no separate vector store)
- `asyncpg` with raw SQL
- LangChain + `langchain-google-genai` for generation and embeddings
- JWT auth with httpOnly cookie-stored access & refresh tokens

**Frontend**
- React 19 + Vite
- Tailwind CSS 4
- Zustand for state
- React Router
- Axios

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
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
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

The dev server runs on `http://localhost:5173` and expects the backend to be reachable (CORS is configured for this origin by default).

## API overview

| Router | Prefix | Purpose |
|---|---|---|
| `user_router` | `/users` | register, login, logout, refresh token, profile |
| `course_router` | `/courses` | course CRUD |
| `document_router` | `/documents` | list/delete uploaded documents |
| `genAI_router` | `/quiz` | upload document, generate standard or document-grounded quiz |
| `quiz_router` | `/quizzes` | save, fetch, and delete quizzes |

## Status

Backend is functionally complete (auth, document pipeline, quiz generation, schema). Frontend is under active development — the quiz curation UI is the current focus. This is a portfolio project and still a work in progress.
