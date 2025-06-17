// This file is for global type declarations.

// Attempt to provide a more direct global PageProps definition
// to override any conflicting types from node_modules.
declare global {
  /**
   * Represents the props passed to a Next.js page component.
   * This definition aims to be compatible with Next.js's expectations
   * and override any conflicting global definitions.
   */
  type PageProps<
    P extends Record<string, string> = Record<string, string>, // Route parameters
    S extends Record<string, string | string[]> = Record<string, string | string[]>, // Search parameters
  > = {
    params: P
    searchParams?: S
  }
}

// Export an empty object to make this a module file.
// This is important for TypeScript to recognize it as a global augmentation.
export {}
