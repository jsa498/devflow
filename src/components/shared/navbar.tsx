'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../ui/theme-toggle'; // Adjusted path to use relative import
import { Menu, ShoppingCart, User as UserIcon, LayoutDashboard } from 'lucide-react'; // Removed X, Removed LogOut, Added UserIcon, Added LayoutDashboard
import { Button } from '../ui/button'; // Adjusted path
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'; // Adjusted path
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
import { User } from '@supabase/supabase-js'; // Import User type
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar" // Import Avatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Import DropdownMenu
import { LogoutButton } from '@/components/logout-button'; // Import LogoutButton

export const Navbar = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null); // Add user state
  const [loadingUser, setLoadingUser] = useState(true); // Add loading state

  // Fetch user session
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function getUserSession() {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (isMounted) {
        if (error) {
          console.error("Error fetching user:", error);
          setUser(null);
        } else {
          setUser(data.user);
        }
        setLoadingUser(false);
      }
    }

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        // No need to set loading false here as getUserSession already does
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Close sheet when pathname changes (navigation occurs)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex justify-center sticky top-4 z-50 pointer-events-none">
      <div className="bg-muted backdrop-blur-lg rounded-full px-4 py-2 shadow-lg pointer-events-auto inline-flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg hover:opacity-80 transition-opacity">
            DevFlow
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/" 
              className={`px-4 py-2 transition-colors hover:text-primary ${
                pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={`px-4 py-2 transition-colors hover:text-primary ${
                pathname === '/products' ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              Products
            </Link>
            <Link 
              href="/courses" 
              className={`px-4 py-2 transition-colors hover:text-primary ${
                pathname === '/courses' ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              Courses
            </Link>
            <Link 
              href="/build" 
              className={`px-4 py-2 transition-colors hover:text-primary ${
                pathname === '/build' ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              Build
            </Link>
            <Link 
              href="/programs" 
              className={`px-4 py-2 transition-colors hover:text-primary ${
                pathname === '/programs' ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              Programs
            </Link>
          </div>
        </div>
        
        {/* Right side: theme toggle and cart */}
        <div className="flex items-center gap-4">
          {/* Cart Icon Placeholder */}
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Shopping cart</span>
          </Button>
          
          <ThemeToggle />
          
          {/* Conditional Sign in / User Profile Dropdown */}
          <div className="hidden md:flex items-center">
            {loadingUser ? (
              // Optional: Show a skeleton or loading indicator
              <div className="h-8 w-20 animate-pulse rounded-full bg-muted-foreground/20"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      {/* TODO: Add user avatar URL if available in profile */}
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() ?? <UserIcon className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      {/* TODO: Add user name if available */}
                      {/* <p className="text-sm font-medium leading-none">{user.user_metadata?.name ?? 'User'}</p> */}
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* <DropdownMenuItem>Profile</DropdownMenuItem> */}
                  {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
                  {/* Add Dashboard Link */}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <LogoutButton variant="ghost" className="w-full justify-start cursor-pointer font-normal h-auto py-1.5 px-2" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="secondary" size="sm" className="rounded-full px-4 py-1.5 text-sm">
                {/* Add redirect_to parameter */}
                <Link href={`/auth/login?redirect_to=${encodeURIComponent(pathname)}`}>Sign in</Link>
              </Button>
            )}
          </div>
          
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  size="icon" 
                  className="rounded-full relative h-9 w-9 bg-foreground text-background dark:bg-foreground dark:text-background transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="absolute inset-0" />
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right"
                className="w-full sm:w-80 p-0"
              >
                <div className="flex flex-col h-full">
                  {/* Navigation links with larger touch targets */}
                  <div className="flex-1 overflow-auto px-4 pb-6 pt-6">
                    <nav className="space-y-1">
                      <Link 
                        href="/"
                        className={`flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium transition-all hover:bg-muted/50 active:bg-muted/80 ${
                          pathname === '/' ? 'bg-muted text-primary' : 'text-foreground'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        Home
                      </Link>
                      <Link 
                        href="/products"
                        className={`flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium transition-all hover:bg-muted/50 active:bg-muted/80 ${
                          pathname === '/products' ? 'bg-muted text-primary' : 'text-foreground'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        Products
                      </Link>
                      <Link 
                        href="/courses"
                        className={`flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium transition-all hover:bg-muted/50 active:bg-muted/80 ${
                          pathname === '/courses' ? 'bg-muted text-primary' : 'text-foreground'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        Courses
                      </Link>
                      <Link 
                        href="/build"
                        className={`flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium transition-all hover:bg-muted/50 active:bg-muted/80 ${
                          pathname === '/build' ? 'bg-muted text-primary' : 'text-foreground'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        Build
                      </Link>
                      <Link 
                        href="/programs"
                        className={`flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium transition-all hover:bg-muted/50 active:bg-muted/80 ${
                          pathname === '/programs' ? 'bg-muted text-primary' : 'text-foreground'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        Programs
                      </Link>
                    </nav>

                    {/* Sign in / User Profile in Mobile Menu */}
                    <div className="mt-6 pt-6 border-t border-border">
                      {loadingUser ? (
                         <div className="h-11 w-full animate-pulse rounded-lg bg-muted-foreground/20"></div>
                      ) : user ? (
                        // Display user info and logout in mobile menu
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2 px-3 py-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                                <AvatarFallback>
                                  {user.email?.charAt(0).toUpperCase() ?? <UserIcon className="h-4 w-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate">{user.email}</span>
                            </div>
                            <Link 
                              href="/dashboard"
                              className={`flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium transition-all hover:bg-muted/50 active:bg-muted/80 text-foreground`}
                              onClick={() => setIsOpen(false)}
                            >
                              <LayoutDashboard className="mr-2 h-5 w-5" />
                              Dashboard
                            </Link>
                           <LogoutButton className="w-full h-11 rounded-lg text-base font-medium justify-start" />
                        </div>
                      ) : (
                        <Button 
                          asChild 
                          className="w-full h-11 rounded-lg text-base font-medium"
                          onClick={() => setIsOpen(false)} // Close sheet on click
                        >
                          {/* Add redirect_to parameter */}
                          <Link href={`/auth/login?redirect_to=${encodeURIComponent(pathname)}`}>Sign in</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}; 