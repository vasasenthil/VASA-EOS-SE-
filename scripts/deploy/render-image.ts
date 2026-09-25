export function renderImage(manifest: string, image: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/@-]+$/.test(image) || image.endsWith(":latest") || image.includes("CHANGE_ME")) {
    throw new Error("A concrete CI image reference is required")
  }
  const images = manifest.match(/^\s*image:\s*\S+\s*$/gm) ?? []
  if (images.length !== 1) throw new Error("Expected exactly one workload image in this manifest")
  return manifest.replace(/^(\s*image:)\s*\S+\s*$/gm, `$1 ${image}`)
}
