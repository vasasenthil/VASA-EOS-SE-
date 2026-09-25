// Production resolution only: never substitute test stubs for real modules.
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
const root = fileURLToPath(new URL("../", import.meta.url))
function resolveSource(href) {
  const file = fileURLToPath(href)
  for (const suffix of ["", ".ts", "/index.ts", ".js", "/index.js"]) {
    if (suffix === "" && !/\.[cm]?[jt]s$/.test(file)) continue
    if (existsSync(file + suffix)) return pathToFileURL(file + suffix).href
  }
  return href
}
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(resolveSource(pathToFileURL(path.join(root, specifier.slice(2))).href), context)
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:") && !context.parentURL.includes("/node_modules/")) {
    return nextResolve(resolveSource(new URL(specifier, context.parentURL).href), context)
  }
  // Next publishes these entry points with .js for native Node resolution.
  if (specifier === "next/headers" || specifier === "next/server") return nextResolve(`${specifier}.js`, context)
  return nextResolve(specifier, context)
}
