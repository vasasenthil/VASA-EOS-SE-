// Registers the test resolution loader in the main thread for `node --test`.
import { register } from "node:module"
register("./test-loader.mjs", import.meta.url)
