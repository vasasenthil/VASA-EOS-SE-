-- VASA-EOS(SE) TN — Citus distribution strategy for the core OLTP schema (CC-SPEC-001 §10.4).
--
-- Runs on a Citus cluster (coordinator + workers, BLOCKERS B-013) AFTER 001_core_oltp.sql. It declares which
-- tables are DISTRIBUTED (sharded by tenant_id, co-located so a tenant's data lives together and joins stay
-- shard-local) and which are REFERENCE tables (replicated to every node for cheap joins).
--
-- This file is Citus-specific and is NOT valid on vanilla PostgreSQL; it is validated in CI against a Citus
-- image. Idempotent where Citus supports it.

SET search_path TO vasa, public;

-- Reference tables: tiny, read-mostly, joined everywhere → replicate to all nodes.
SELECT create_reference_table('vasa.tenant_node');

-- Distributed tables: shard by tenant_id, all co-located in one colocation group so cross-table joins for a
-- tenant execute on a single shard.
SELECT create_distributed_table('vasa.school',         'tenant_id', colocate_with => 'none');
SELECT create_distributed_table('vasa.student',        'tenant_id', colocate_with => 'vasa.school');
SELECT create_distributed_table('vasa.enrolment',      'tenant_id', colocate_with => 'vasa.school');
SELECT create_distributed_table('vasa.assessment',     'tenant_id', colocate_with => 'vasa.school');
SELECT create_distributed_table('vasa.fund_ledger',    'tenant_id', colocate_with => 'vasa.school');
SELECT create_distributed_table('vasa.consent_ledger', 'tenant_id', colocate_with => 'vasa.school');
SELECT create_distributed_table('vasa.grievance',      'tenant_id', colocate_with => 'vasa.school');
SELECT create_distributed_table('vasa.audit_log',      'tenant_id', colocate_with => 'vasa.school');
