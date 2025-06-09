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

export function Header() {
  // Placeholder user data - in a real app, this would come from auth context
  const user = {
    name: "VASA Admin",
    email: "admin@vasa.eos.gov.in",
    avatarUrl: "/placeholder.svg?width=40&height=40", // Placeholder avatar
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link
          href="/policies"
          className="flex items-center gap-3 text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors" // Adjusted gap slightly
        >
          <Image
            src="/logos/vasa-logo.png"
            alt="VASA Logo"
            width={40} // Adjust width as needed
            height={40} // Adjust height as needed
            className="h-10 w-10" // You can use Tailwind for sizing too, ensure aspect ratio is maintained or adjust width/height props
          />
          <span>VASA-EOS (SE) Policy Hub</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="#">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="#">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="#">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
