ALTER TABLE policies
ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN policies.version_history IS 'Stores an array of policy version snapshots or significant lifecycle events. E.g., [{ "version": "1.0", "status": "Approved", "modified_at": "timestamp", "modified_by": "user_id", "summary": "Initial approval" }]';
