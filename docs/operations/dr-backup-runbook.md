# VASA-EOS-SE-TN Disaster Recovery, Backup and Restore Runbook

## Scope

This runbook is for sovereign government hosting environments such as TN SDC, NIC or MeitY-approved Kubernetes facilities. It intentionally excludes Vercel/demo hosting paths.

## Recovery objectives

- **RPO:** 15 minutes for transactional Postgres/Supabase data.
- **RTO:** 4 hours for the application and critical workers.
- **Critical services:** web app, Postgres, outbox dispatcher, SLA monitor, PFMS reconciliation, Vault/KMS and observability collector.

## Daily backup checks

1. Confirm Postgres continuous archiving is active and the latest WAL segment is less than 15 minutes old.
2. Confirm nightly encrypted base backups are present in sovereign object storage.
3. Confirm Vault/KMS key escrow status and M-of-N recovery key custody.
4. Run a non-production restore drill weekly and record evidence in the operations log.

## Restore procedure

1. Declare an incident and freeze deployments in Argo CD/GitHub environments.
2. Restore the latest encrypted base backup to an isolated Postgres instance in the same sovereign region.
3. Replay WAL to the selected recovery timestamp.
4. Run `npm run deploy:migrate` against the restored database to verify the schema ledger.
5. Rotate runtime secrets in Vault and update the `vasa-runtime-secrets` Kubernetes secret.
6. Deploy the app and workers with `npm run deploy:workers` and the sovereign deployment pipeline.
7. Run `npm run deploy:verify` and confirm the production cutover gate is ready.
8. Re-enable traffic through the ingress controller only after the incident commander signs off.

## Validation checklist

- Cutover API reports `ready: true`.
- Outbox, SLA and reconciliation worker heartbeats are fresher than 2 minutes.
- Audit sink accepts immutable audit writes.
- PFMS/DBT/APAAR/DigiLocker/Bhashini live integration modes are enabled.
- Prometheus alerts and OTLP export are active.

## Post-incident actions

- Export audit evidence for the outage window.
- Compare restored ledger counts against the pre-incident snapshot.
- Document root cause, corrective actions and owner due dates.
- Complete a user communication note for district/block/school operators.
