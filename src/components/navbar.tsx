"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { User, Settings, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">TakoBin</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
          <Link
            href="/"
            className={`transition-colors hover:text-foreground/80 ${
              pathname === "/" ? "text-foreground" : "text-foreground/60"
            }`}
          >
            Home
          </Link>
          <Link
            href="/pastes"
            className={`transition-colors hover:text-foreground/80 ${
              pathname === "/pastes" || pathname.startsWith("/pastes/")
                ? "text-foreground"
                : "text-foreground/60"
            }`}
          >
            My Pastes
          </Link>
          <Link
            href="/about"
            className={`transition-colors hover:text-foreground/80 ${
              pathname === "/about" ? "text-foreground" : "text-foreground/60"
            }`}
          >
            About
          </Link>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          
          {/* Desktop Only */}
          
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm">
            {session?.user && (
              <Link
                href="/settings"
                className={`flex items-center transition-colors hover:text-foreground/80 ${
                  pathname === "/settings" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <Settings className="h-4 w-4 mr-1" />
                <span>Settings</span>
              </Link>
            )}
            </Button>
            
            <Button asChild variant="default" size="sm">
              <Link href="/new">New Paste</Link>
            </Button>
            
            {session?.user ? (
              <Link href="/settings" className="flex items-center">
                {session.user.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name ?? 'User'} 
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Link>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/api/auth/signin">Login</Link>
              </Button>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
              <SheetTitle className="text-left" aria-describedby="menu">Menu</SheetTitle>
              <div className="flex flex-col h-full py-4">
                <nav className="flex flex-col space-y-6 text-base font-medium mt-6">
                  <Link
                    href="/"
                    className={`transition-colors hover:text-foreground/80 ${
                      pathname === "/" ? "text-foreground" : "text-foreground/60"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/pastes"
                    className={`transition-colors hover:text-foreground/80 ${
                      pathname === "/pastes" || pathname.startsWith("/pastes/")
                        ? "text-foreground"
                        : "text-foreground/60"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    My Pastes
                  </Link>
                  <Link
                    href="/about"
                    className={`transition-colors hover:text-foreground/80 ${
                      pathname === "/about" ? "text-foreground" : "text-foreground/60"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>
                  
                  {session?.user && (
                    <Link
                      href="/settings"
                      className={`flex items-center transition-colors hover:text-foreground/80 ${
                        pathname === "/settings" ? "text-foreground" : "text-foreground/60"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Settings</span>
                    </Link>
                  )}
                </nav>
                
                <div className="mt-auto pt-6 space-y-4">
                  <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
                    <Link href="/new">New Paste</Link>
                  </Button>
                  
                  {!session?.user && (
                    <Button asChild variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                      <Link href="/api/auth/signin">Login</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
