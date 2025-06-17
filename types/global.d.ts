// This file is for global type declarations.

// Attempt to provide a correct global PageProps definition
// to override any conflicting types from node_modules.
declare global {
  namespace NextJs {
    // Using a namespace to avoid direct global scope pollution if possible
    interface PageProps<
      P extends Record<string, string> = Record<string, string>, // Params
      S extends Record<string, string | string[]> = Record<string, string | string[]>, // SearchParams
    > {
      params: P
      searchParams?: S
    }
  }
}

// Export an empty object to make this a module file.
// This is important for TypeScript to recognize it as a global augmentation.
export {}
