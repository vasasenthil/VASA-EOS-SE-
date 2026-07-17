import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VASA-EOS-SE-TN",
    short_name: "VASA-EOS",
    description: "Tamil Nadu school education operations platform with offline read access for critical routes.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
  }
}
