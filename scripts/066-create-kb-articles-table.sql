-- VASA-EOS(SE) — durable table for the grounded knowledge base (full-CRUD module).
--
-- Each row is one curated knowledge article (the Tamil Nadu policy/scheme/pedagogy canon): title,
-- category, the grounded content the assistant may quote, and a citable source, keyed by the
-- school's tenant node. The Conversational Engine answers questions ONLY from these articles and
-- cites the source — it never invents. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.kb_articles (
  id          text primary key,
  title       text not null,
  category    text not null default 'General',
  content     text not null,
  source      text not null default '',
  tenant_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists kb_articles_category_idx on public.kb_articles (category);

alter table public.kb_articles enable row level security;
