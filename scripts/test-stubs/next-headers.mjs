// Test stub for "next/headers" — the audit/persistence import chain references
// cookies()/headers() but never calls them under test (getDb() is null without a
// service-role key, so the in-memory path is used). These throw if actually called,
// which would surface a test that wrongly assumed a request scope.
export function cookies() {
  throw new Error("next/headers cookies() is not available in unit tests")
}
export function headers() {
  throw new Error("next/headers headers() is not available in unit tests")
}
