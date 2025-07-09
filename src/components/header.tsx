"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useUser, useClerk, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { FiSun, FiMoon, FiMenu, FiUser, FiSearch, FiSettings, FiLogOut } from "react-icons/fi"

interface HeaderProps {
  onOpenSearch?: () => void
  userTokens?: number
}

export function Header({ onOpenSearch, userTokens = 150 }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useUser()
  const { signOut } = useClerk()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">K</span>
            </div>
            <h1 className="text-lg font-semibold">Karmatic</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSearch}
            className="hidden md:flex"
          >
            <FiSearch className="mr-2 h-4 w-4" />
            Nueva búsqueda
          </Button>

          <Badge variant="secondary" className="hidden sm:flex">
            {userTokens} tokens
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0"
          >
            <FiSun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <FiMoon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <FiUser className="mr-2 h-4 w-4" />
                Iniciar sesión
              </Button>
            </SignInButton>
          </SignedOut>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FiMenu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-6">
                <SignedIn>
                  <div className="flex items-center space-x-2 px-2">
                    <UserButton afterSignOutUrl="/" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user?.firstName || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
                    </div>
                  </div>
                </SignedIn>
                
                <SignedOut>
                  <div className="px-2">
                    <SignInButton mode="modal">
                      <Button variant="default" className="w-full">
                        <FiUser className="mr-2 h-4 w-4" />
                        Iniciar sesión
                      </Button>
                    </SignInButton>
                  </div>
                </SignedOut>
                
                <hr className="my-4" />
                
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    onOpenSearch?.()
                    setIsMenuOpen(false)
                  }}
                >
                  <FiSearch className="mr-2 h-4 w-4" />
                  Nueva búsqueda
                </Button>
                
                <SignedIn>
                  <Button variant="ghost" className="justify-start">
                    <FiSettings className="mr-2 h-4 w-4" />
                    Configuración
                  </Button>
                  
                  <Button variant="ghost" className="justify-start">
                    <FiUser className="mr-2 h-4 w-4" />
                    Mi cuenta
                  </Button>
                  
                  <hr className="my-4" />
                  
                  <Button 
                    variant="ghost" 
                    className="justify-start text-red-600"
                    onClick={() => signOut()}
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </Button>
                </SignedIn>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}