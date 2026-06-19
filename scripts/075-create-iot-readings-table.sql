-- VASA-EOS(SE) — durable table for the IoT telemetry mesh (ingest + threshold alerting).
--
-- Each row is one device sample: a metric reading from a school environment / nutrition / infrastructure
-- / biometric-attendance sensor, keyed by the school UDISE and the tenant node. Severity (Normal /
-- Warning / Critical) is DERIVED on read from the metric's safe-operating bounds — never stored — so
-- thresholds can be tuned without rewriting history. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.iot_readings (
  id            text primary key,
  device_id     text not null,
  device_label  text not null,
  school_udise  text not null,
  metric_key    text not null,
  value         numeric not null,
  captured_at   timestamptz not null default now(),
  tenant_id     text
);

create index if not exists iot_readings_device_idx on public.iot_readings (device_id);
create index if not exists iot_readings_metric_idx on public.iot_readings (metric_key);
create index if not exists iot_readings_captured_idx on public.iot_readings (captured_at);
create index if not exists iot_readings_school_idx on public.iot_readings (school_udise);

alter table public.iot_readings enable row level security;
