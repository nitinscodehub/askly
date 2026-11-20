-- Askly — optional Neon Postgres + pgvector schema.
-- Run with: psql "$DATABASE_URL" -f scripts/seed.sql
-- The app works without it using an in-process vector store.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id text primary key,
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector
);

create index if not exists knowledge_chunks_document_idx
  on knowledge_chunks (document_id);

create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- Retrieval example (replace $1 with the query embedding returned by the gateway):
-- select content, 1 - (embedding <=> $1::vector) as similarity
-- from knowledge_chunks
-- order by embedding <=> $1::vector
-- limit 4;
