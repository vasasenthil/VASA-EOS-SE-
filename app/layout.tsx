import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { I18nProvider } from "@/components/i18n-provider"
import { AccessibilityProvider } from "@/components/accessibility-provider"

const inter = Inter({ subsets: ["latin"] })

// Applies saved accessibility preferences before first paint (no flash), independent
// of React hydration. Mirrors lib/accessibility (keep the storage key in sync).
const A11Y_BOOT_SCRIPT = `(function(){try{var r=localStorage.getItem("vasa-eos-a11y");if(!r)return;var p=JSON.parse(r);var e=document.documentElement;if(p&&p.highContrast)e.classList.add("a11y-high-contrast");if(p&&p.reduceMotion)e.classList.add("a11y-reduce-motion");var t=p&&p.textScale;e.setAttribute("data-text-scale",t==="large"||t==="xlarge"?t:"normal");}catch(_){}})();`

export const metadata: Metadata = {
  title: "VASA-EOS (SE) Policy Hub",
  description: "A platform for managing National Education Policies for VASA-EOS (SE).",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT_SCRIPT }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AccessibilityProvider>
            <I18nProvider>
              <TooltipProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <div className="flex-grow bg-slate-50">{children}</div>
                  <Footer />
                </div>
                <Toaster />
              </TooltipProvider>
            </I18nProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
