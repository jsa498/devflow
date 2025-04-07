'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../ui/theme-toggle'; // Adjusted path to use relative import
import { Menu, X, ShoppingCart } from 'lucide-react'; // Added ShoppingCart icon
import { Button } from '../ui/button'; // Adjusted path
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'; // Adjusted path

export const Navbar = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
          
          {/* Sign in button (placeholder for now) */}
          <div className="hidden md:flex items-center">
            <Button asChild variant="secondary" size="sm" className="rounded-full px-4 py-1.5 text-sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
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
                  {/* Header with larger close target */}
                  <div className="p-4 flex justify-end border-b border-border">
                    <Button
                      variant="ghost"
                      className="h-9 w-9 p-0 rounded-full hover:bg-muted/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>

                  {/* Navigation links with larger touch targets */}
                  <div className="flex-1 overflow-auto px-4 pb-6 pt-4">
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
                    </nav>

                    {/* Sign in button at the bottom */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <Button 
                        asChild 
                        className="w-full h-11 rounded-lg text-base font-medium"
                      >
                        <Link href="/auth/login">Sign in</Link>
                      </Button>
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