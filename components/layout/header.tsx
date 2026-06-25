import Link from "next/link"
import Image from "next/image"
import { UserCircle, LogOut, SettingsIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { AccessibilityQuickToggle } from "@/components/accessibility-quick-toggle"
import { CommandPaletteTrigger } from "@/components/command-palette"
import { LanguageSwitcher } from "@/components/language-switcher"

interface HeaderUserData {
  name: string
  email: string
  avatarUrl?: string | null
  isDemo?: boolean
}

interface HeaderProps {
  userData?: HeaderUserData | null // Make userData optional for non-dashboard pages
}

const guestNavLinks = [
  { title: "Policies", href: "/policies" },
  { title: "Schemes", href: "/schemes" },
  { title: "NEP Tracker", href: "/tracking/dashboard" },
  { title: "Governance", href: "/governance/organizational-units" },
]

export function Header({ userData }: HeaderProps) {
  const defaultUser = {
    name: "Guest User",
    email: "",
    avatarUrl: "/placeholder.svg?width=40&height=40&text=G",
    isDemo: false,
  }
  const currentUser = userData || defaultUser

  // In a real app, logout would be a server action that calls supabase.auth.signOut()
  // and then redirects. For now, it's a link to /login (which would effectively log out
  // if middleware protects routes).
  const handleLogout = async () => {
    // This should ideally be a server action that calls supabase.auth.signOut()
    // For client-side quick version (not recommended for production without proper handling):
    // const supabase = createClientComponentClient(); // from @supabase/auth-helpers-nextjs
    // await supabase.auth.signOut();
    // window.location.href = '/login'; // Force redirect
    console.log("Logout action should be implemented via Server Action")
  }

  return (
    <header className="bg-background border-b shadow-sm sticky top-0 z-50 h-16">
      <div className="container mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={userData ? "/" : "/login"} // Go to dashboard root if logged in, else login
            className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            <Image src="/logos/vasa-logo.png" alt="VASA Logo" width={36} height={36} className="h-9 w-9" />
            <span className="hidden sm:inline-block">VASA-EOS (SE)</span>
          </Link>

          {/* Guest navigation links — shown only on md+ when no user is logged in */}
          {!userData && (
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {guestNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
                >
                  {link.title}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {userData && (
          <div className="flex items-center gap-2">
          <CommandPaletteTrigger />
          <LanguageSwitcher />
          <AccessibilityQuickToggle />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.avatarUrl || undefined} alt={currentUser.name} />
                  <AvatarFallback>
                    {currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    {currentUser.isDemo && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* This should be a form submitting to a server action for logout */}
              <form action="/auth/logout" method="POST">
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )}
        {!userData && (
          <div className="flex items-center gap-2">
            <CommandPaletteTrigger />
            <LanguageSwitcher />
            <AccessibilityQuickToggle />
            <Button asChild variant="outline">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
