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
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // For mobile sidebar if needed
// import { Sidebar } from "./sidebar" // If using Sheet for mobile

interface HeaderUserData {
  name: string
  email: string
  avatarUrl?: string | null
}

interface HeaderProps {
  userData?: HeaderUserData | null // Make userData optional for non-dashboard pages
}

export function Header({ userData }: HeaderProps) {
  const defaultUser = {
    name: "Guest User",
    email: "",
    avatarUrl: "/placeholder.svg?width=40&height=40&text=G",
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
          {/* Mobile Menu Trigger - if you implement a collapsible sidebar for mobile */}
          {/* <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {userData && <Sidebar userRole={"STUDENT"} isCollapsed={false} />} {}
            </SheetContent>
          </Sheet> */}

          <Link
            href={userData ? "/" : "/login"} // Go to dashboard root if logged in, else login
            className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            <Image src="/logos/vasa-logo.png" alt="VASA Logo" width={36} height={36} className="h-9 w-9" />
            <span className="hidden sm:inline-block">VASA-EOS (SE)</span>
          </Link>
        </div>

        {userData && (
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
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild disabled>
                <Link href="#">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled>
                <Link href="#">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* This should be a form submitting to a server action for logout */}
              <form action="/auth/logout" method="POST">
                {" "}
                {/* Create this server action */}
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!userData && (
          <Button asChild variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
