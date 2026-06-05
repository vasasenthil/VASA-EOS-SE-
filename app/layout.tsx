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
import { CommandPaletteProvider } from "@/components/command-palette"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { RouteAnnouncer } from "@/components/route-announcer"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow focus:outline focus:outline-2 focus:outline-ring"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AccessibilityProvider>
            <CommandPaletteProvider>
              <I18nProvider>
                <TooltipProvider>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main id="main-content" tabIndex={-1} className="flex-grow bg-slate-50 outline-none">
                      <Breadcrumbs />
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <RouteAnnouncer />
                  <KeyboardShortcutsHelp />
                  <Toaster />
                </TooltipProvider>
              </I18nProvider>
            </CommandPaletteProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
