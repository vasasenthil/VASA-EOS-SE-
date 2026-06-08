// Minimal ESM resolution hooks for running the project's TypeScript unit tests
// under Node's built-in test runner + type-stripping. Resolves the "@/" path alias
// to the repo root and fills in ".ts"/"/index.ts" extensions that the source omits.
// No transpilation here — Node's --experimental-strip-types handles the types.

import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = process.cwd()

function addExtension(href) {
  if (/\.[cm]?[jt]s$/.test(href)) return href
  const p = fileURLToPath(href)
  if (existsSync(p + ".ts")) return pathToFileURL(p + ".ts").href
  if (existsSync(path.join(p, "index.ts"))) return pathToFileURL(path.join(p, "index.ts")).href
  if (existsSync(p + ".js")) return pathToFileURL(p + ".js").href
  return href
}

// Server-only modules referenced by the import chain but unused under test.
const STUBS = {
  "next/headers": pathToFileURL(path.join(root, "scripts/test-stubs/next-headers.mjs")).href,
  "server-only": pathToFileURL(path.join(root, "scripts/test-stubs/server-only.mjs")).href,
}

export async function resolve(specifier, context, nextResolve) {
  if (STUBS[specifier]) {
    return nextResolve(STUBS[specifier], context)
  }
  let target = null
  if (specifier.startsWith("@/")) {
    target = pathToFileURL(path.join(root, specifier.slice(2))).href
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    target = new URL(specifier, context.parentURL).href
  }
  if (target) {
    return nextResolve(addExtension(target), context)
  }
  return nextResolve(specifier, context)
}
