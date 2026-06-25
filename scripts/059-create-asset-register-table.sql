-- VASA-EOS(SE) — durable table for the asset register & inventory (full-CRUD module).
--
-- Each row is one asset/stock line: identity (tag, name, category), location, quantity + unit,
-- condition and lifecycle status, optional assignment, procurement (purchase date, unit cost, useful
-- life, funding source) and a reorder level, keyed by the school's tenant node. Total value,
-- straight-line book value, accumulated depreciation and the low-stock flag are derived on read.
-- Written through the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.asset_register (
  id                 text primary key,
  asset_tag          text not null,
  name               text not null,
  category           text not null default 'Other',
  location           text not null default '',
  quantity           integer not null default 0,
  unit               text not null default 'Piece',
  condition          text not null default 'Good',
  status             text not null default 'In Stock',
  assigned_to        text not null default '',
  purchase_date      date not null,
  unit_cost          numeric not null default 0,
  useful_life_years  integer not null default 5,
  reorder_level      integer not null default 0,
  funding_source     text not null default 'Other',
  notes              text not null default '',
  tenant_id          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists asset_register_tag_idx on public.asset_register (asset_tag);
create index if not exists asset_register_category_idx on public.asset_register (category);
create index if not exists asset_register_status_idx on public.asset_register (status);

alter table public.asset_register enable row level security;
