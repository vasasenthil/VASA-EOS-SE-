// Test stub for the "server-only" guard package. In the Next.js build it errors if a
// server module is pulled into a client bundle; under Node's test runner there is no
// bundler, so importing it is a no-op. This stub lets unit tests exercise server-only
// enforcement seams (e.g. lib/consent/gate-server) directly.
export {}
