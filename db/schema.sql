-- db/schema.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS (Using IF NOT EXISTS logic via a DO block to prevent errors on restart)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('educator', 'student');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_type') THEN
        CREATE TYPE quiz_type AS ENUM ('plain_text', 'rag');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_type') THEN
        CREATE TYPE difficulty_type AS ENUM ('easy', 'medium', 'hard');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
        CREATE TYPE question_type AS ENUM ('mcq', 'true_false');
    END IF;
END $$;

-- TABLES
CREATE TABLE IF NOT EXISTS users (
    user_id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name    VARCHAR(100) NOT NULL CHECK (char_length(trim(first_name)) > 0),
    last_name     VARCHAR(100) NOT NULL CHECK (char_length(trim(last_name)) > 0),
    email         VARCHAR(255) UNIQUE NOT NULL CHECK (char_length(trim(email)) > 0),
    password_hash VARCHAR(255) NOT NULL CHECK (char_length(trim(password_hash)) > 0),
    user_type     user_type    NOT NULL,
    created_at    TIMESTAMP    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
    course_id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    course_name        VARCHAR(255) NOT NULL CHECK (char_length(trim(course_name)) > 0),
    course_coordinator UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at         TIMESTAMP    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_list (
    course_id  UUID  NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    user_id    UUID  NOT NULL REFERENCES users(user_id)     ON DELETE CASCADE,
    PRIMARY KEY (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS documents (
    document_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(user_id)     ON DELETE CASCADE,
    course_id    UUID         REFERENCES courses(course_id)          ON DELETE SET NULL,
    filename     VARCHAR(255) NOT NULL CHECK (char_length(trim(filename)) > 0),
    uploaded_at  TIMESTAMP    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID         NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL REFERENCES users(user_id)         ON DELETE CASCADE,
    content      TEXT         NOT NULL CHECK (char_length(trim(content)) > 0),
    embedding    VECTOR(768),
    metadata     JSONB,
    created_at   TIMESTAMP    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID            NOT NULL REFERENCES users(user_id)     ON DELETE CASCADE,
    course_id    UUID            REFERENCES courses(course_id)          ON DELETE SET NULL,
    document_id  UUID            REFERENCES documents(document_id)      ON DELETE SET NULL,
    quiz_type    quiz_type       NOT NULL,
    topic        VARCHAR(255)    NOT NULL CHECK (char_length(trim(topic)) > 0),
    difficulty   difficulty_type NOT NULL,
    created_at   TIMESTAMP       DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id        UUID          NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question       TEXT          NOT NULL CHECK (char_length(trim(question)) > 0),
    question_type  question_type NOT NULL,
    options        JSONB         NOT NULL,
    correct_answer VARCHAR(1)    NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D','T','F')),
    explanation    TEXT          CHECK (explanation IS NULL OR char_length(trim(explanation)) > 0),
    position       SMALLINT      NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS document_chunks_doc_user_idx ON document_chunks (document_id, user_id);
CREATE INDEX IF NOT EXISTS quizzes_user_idx ON quizzes (user_id);
CREATE INDEX IF NOT EXISTS quizzes_course_idx ON quizzes (course_id);
CREATE INDEX IF NOT EXISTS quiz_questions_quiz_pos_idx ON quiz_questions (quiz_id, position);
CREATE INDEX IF NOT EXISTS documents_user_idx ON documents (user_id);