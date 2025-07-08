"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  FiSun, 
  FiMoon, 
  FiMenu, 
  FiUser, 
  FiSearch, 
  FiSettings, 
  FiLogOut, 
  FiHome,
  FiBookmark,
  FiTrendingUp,
  FiX 
} from "react-icons/fi"

interface VerticalSidebarProps {
  onOpenSearch?: () => void
  userTokens?: number
}

interface SidebarContentProps {
  theme: string;
  toggleTheme: () => void;
  navigationItems: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
  }>;
  userTokens: number;
  mounted: boolean;
}

const SidebarContent = React.memo(({ 
  theme, 
  toggleTheme, 
  navigationItems, 
  userTokens, 
  mounted 
}: SidebarContentProps) => (
  <div className="flex flex-col h-full">
    {/* Logo Section */}
    <div className="flex items-center space-x-3 p-6 border-b border-border/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
        <span className="text-lg font-bold">K</span>
      </div>
      <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        Karmatic
      </h1>
    </div>

    {/* Navigation Section */}
    <nav className="flex-1 p-4 space-y-1">
      {navigationItems.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          className="w-full justify-start h-12 px-4 text-sm font-medium hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg group"
          onClick={item.onClick}
        >
          <item.icon className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          {item.label}
        </Button>
      ))}
    </nav>

    {/* User Section */}
    <div className="p-4 border-t border-border/50 space-y-2">
      {/* User Profile */}
      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent/30 transition-all duration-200 cursor-pointer group">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md group-hover:shadow-lg transition-all duration-200">
          <FiUser className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Usuario</p>
          <Badge variant="secondary" className="text-xs mt-1 bg-primary/10 text-primary border-primary/20">
            {userTokens} tokens
          </Badge>
        </div>
      </div>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        className="w-full justify-start h-12 px-4 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg group"
        onClick={toggleTheme}
      >
        <FiSun className="mr-3 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:scale-110" />
        <FiMoon className="absolute mr-3 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:scale-110" />
        <span className="ml-3">
          {mounted ? (theme === "dark" ? "Modo claro" : "Modo oscuro") : 'Modo oscuro'}
        </span>
      </Button>

      {/* Settings */}
      <Button
        variant="ghost"
        className="w-full justify-start h-12 px-4 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg group"
      >
        <FiSettings className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
        Configuración
      </Button>

      {/* Logout */}
      <Button
        variant="ghost"
        className="w-full justify-start h-12 px-4 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg group"
      >
        <FiLogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
        Cerrar sesión
      </Button>
    </div>
  </div>
));

SidebarContent.displayName = 'SidebarContent';

export function VerticalSidebar({ onOpenSearch, userTokens = 150 }: VerticalSidebarProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navigationItems = [
    { icon: FiHome, label: "Inicio", onClick: () => {} },
    { icon: FiSearch, label: "Nueva búsqueda", onClick: onOpenSearch || (() => {}) },
    { icon: FiBookmark, label: "Guardados", onClick: () => {} },
    { icon: FiTrendingUp, label: "Descubrir", onClick: () => {} },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-background/95 backdrop-blur-sm border-r border-border/50 flex-col fixed left-0 top-0 z-40 shadow-lg">
        <SidebarContent 
          theme={theme || 'light'}
          toggleTheme={toggleTheme}
          navigationItems={navigationItems}
          userTokens={userTokens}
          mounted={mounted}
        />
      </aside>

      {/* Mobile Header with Menu Toggle */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">K</span>
            </div>
            <h1 className="text-lg font-semibold">Karmatic</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSearch}
              className="h-8 w-8 p-0"
            >
              <FiSearch className="h-4 w-4" />
              <span className="sr-only">Nueva búsqueda</span>
            </Button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <FiMenu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <span className="text-sm font-bold">K</span>
                    </div>
                    <h1 className="text-lg font-semibold">Karmatic</h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-full overflow-y-auto">
                  <SidebarContent 
                    theme={theme || 'light'}
                    toggleTheme={toggleTheme}
                    navigationItems={navigationItems}
                    userTokens={userTokens}
                    mounted={mounted}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}