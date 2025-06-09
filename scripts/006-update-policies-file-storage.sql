-- No specific ALTER TABLE needed if JSONB columns are already flexible.
-- This script serves as a marker for the change in data structure within these JSONB fields.
-- We are transitioning from storing:
-- draft_policy_document: { name, type, size }
-- annexures: [{ name, type, size }, ...]
--
-- To storing:
-- draft_policy_document: { name, type, size, url, uploadedAt?, isPlaceholder? }
-- annexures: [{ name, type, size, url, uploadedAt?, isPlaceholder? }, ...]
--
-- Since JSONB is flexible, no explicit ALTER column type is strictly necessary
-- unless we want to enforce a new structure with constraints, which we are not doing here.
-- This comment serves as documentation for the schema evolution.

SELECT 'Policy table file storage structure updated (conceptually for JSONB fields to include url and isPlaceholder)';
