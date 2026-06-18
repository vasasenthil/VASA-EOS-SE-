-- VASA-EOS(SE) — durable table for transport routes (full-CRUD module).
--
-- Each row is one school transport route: the route (name/code, shift, status), the vehicle (number,
-- type, capacity), the driver (name, phone), the ordered stops (JSONB array of {name,pickupTime,
-- dropTime}), the number of students assigned and the term fare, keyed by the school's tenant node.
-- Occupancy, free seats and the overloaded flag are derived on read. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.transport_routes (
  id              text primary key,
  route_name      text not null,
  route_code      text not null,
  vehicle_no      text not null,
  vehicle_type    text not null default 'Bus',
  driver_name     text not null,
  driver_phone    text not null,
  capacity        integer not null default 40,
  assigned_count  integer not null default 0,
  stops           jsonb not null default '[]'::jsonb,
  fare_per_term   numeric not null default 0,
  shift           text not null default 'Both',
  status          text not null default 'Active',
  notes           text not null default '',
  tenant_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists transport_routes_code_idx on public.transport_routes (route_code);
create index if not exists transport_routes_status_idx on public.transport_routes (status);

alter table public.transport_routes enable row level security;
