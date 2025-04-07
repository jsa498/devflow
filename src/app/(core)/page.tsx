'use client';

import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { useTheme } from 'next-themes'; // Assuming next-themes based on theme-provider pattern
import { TrendingUp, ShoppingBag, BookOpen, ArrowRight } from 'lucide-react';
import { RainbowButton } from '@/components/ui/rainbow-button'; // Updated path
import { Card, CardContent, CardDescription } from "@/components/ui/card"; // Import Card components
import { Button } from "@/components/ui/button"; // Import Button
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Import Carousel components

// Define the interface for featured items (can represent products or courses)
interface FeaturedItem {
  id: string | number;
  title: string;
  description: string;
  image_url?: string; // Optional image URL
  link: string; // Link for the "View Details" button
}

export default function Home() {
  useTheme(); // Call useTheme if needed for side effects, otherwise remove

  // Define featured items including Fitbull and placeholders
  const featuredItems: FeaturedItem[] = [
    {
      id: 'fitbull',
      title: 'FitBull Workout Tracker',
      description: 'Your ultimate workout companion. Log sets, track lifts, manage routines, and visualize strength gains.',
      image_url: '/fitbull/fitbull.JPG', // Path to FitBull image
      link: '/products', // Link to the product page (or a specific product detail page if available)
    },
    {
      id: 'placeholder-1',
      title: 'Placeholder Product 1',
      description: 'Brief description of placeholder product 1.',
      image_url: undefined, // No image for placeholder
      link: '#', // Placeholder link
    },
    {
      id: 'placeholder-2',
      title: 'Placeholder Resource 2',
      description: 'Brief description of placeholder resource 2.',
      image_url: undefined, // No image for placeholder
      link: '#', // Placeholder link
    },
    {
      id: 'placeholder-3',
      title: 'Placeholder Course 3',
      description: 'Brief description of placeholder course 3.',
      image_url: undefined, // No image for placeholder
      link: '#', // Placeholder link
    },
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 py-20 md:py-28 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
                DevFlow
              </h1>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-foreground">
                Resources & Tools
              </h2>
              <p className="mt-6 text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                Helping you navigate the landscape with professional resources, tools, and guidance for your marketing journey.
              </p>
              <div className="mt-10 flex flex-row gap-4 justify-center px-4">
                <Link href="/products" passHref>
                  <RainbowButton
                    className="flex-1 max-w-[200px] text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl transition-transform hover:scale-105"
                  >
                    View Products
                  </RainbowButton>
                </Link>
                <Link href="/courses" passHref>
                  <RainbowButton
                    className="flex-1 max-w-[200px] text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl transition-transform hover:scale-105 whitespace-nowrap"
                  >
                    Browse Courses
                  </RainbowButton>
                </Link>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute inset-0 -z-10 overflow-hidden">
                {/* Main gradient blob with improved gradient spread and opacity transition */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1200px] opacity-20 dark:opacity-10">
                  <div className="absolute inset-0 rounded-[50%] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-[64px]" />
                </div>
                {/* Top fade gradient */}
                <div className="absolute top-0 left-0 right-0 h-[150px] bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
                {/* Bottom fade gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
                {/* Improved radial gradient overlay */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products & Resources Section */}
      <div className="py-16 bg-gradient-to-b from-background to-background/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center mb-16 relative">
            <div className="absolute -top-10 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
            <span className="relative z-10 text-sm font-medium px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">FEATURED</span>
            <h2 className="text-4xl md:text-5xl font-bold text-center max-w-3xl leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground">
              Our Products & Resources
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary/80 to-primary/20 rounded-full mt-6"></div>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl text-center mx-auto">
              Explore our popular products, tools, and resources designed to help you achieve your goals.
            </p>
          </div>

          {/* Wrapper div for Carousel centering and max-width */}
          <div className="max-w-xs sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative">
            {/* Shadcn Carousel Implementation */}
            <Carousel
              opts={{
                align: "start",
                loop: true, // Optional: loop the carousel
              }}
              className="w-full" 
            >
              <CarouselContent className="-ml-4">
                {featuredItems.map((item) => (
                  <CarouselItem key={item.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                      <Card className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 h-full flex flex-col p-0">
                        {item.image_url ? (
                          <div className="w-full h-52 relative bg-black overflow-hidden">
                            <Image
                              src={item.image_url}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-contain p-2 transition-transform duration-500 group-hover:scale-110" 
                            />
                          </div>
                        ) : (
                          <div className="h-52 w-full flex items-center justify-center bg-muted group-hover:bg-muted/80 transition-colors">
                            <svg
                              className="h-16 w-16 text-muted-foreground/50"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            <Link href={item.link} className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                              {item.title}
                            </Link>
                          </h3>
                          <CardDescription className="text-sm mb-6 line-clamp-3 flex-grow">
                            {item.description}
                          </CardDescription>
                          <div className="mt-auto">
                            <Link href={item.link} passHref legacyBehavior>
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                View Details <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Previous/Next buttons are now siblings of CarouselContent, inside the wrapper */}
              <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
              <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 hidden md:inline-flex" /> 
            </Carousel>
          </div> { /* End of wrapper div */}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Benefits</h2>
            <p className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">
              Why Choose Our Resources
            </p>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Our marketing tools and resources are designed to help you grow your online presence effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-background to-muted p-8 transition-all hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-2xl font-bold">Proven Growth Strategies</h3>
                <p className="text-muted-foreground">
                  Resources backed by data and industry best practices to help you achieve measurable results.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-background to-muted p-8 transition-all hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-2xl font-bold">Premium Quality</h3>
                <p className="text-muted-foreground">
                  Every resource is carefully crafted to the highest standards by industry experts.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-background to-muted p-8 transition-all hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-2xl font-bold">Continuous Learning</h3>
                <p className="text-muted-foreground">
                  Stay ahead with regularly updated content and resources reflecting the latest trends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-background py-24">
        <div className="container mx-auto">
          <div className="relative z-10 bg-gradient-to-r from-background via-background/80 to-background rounded-3xl p-12 mx-auto max-w-5xl shadow-lg dark:shadow-[0_8px_30px_rgba(255,255,255,0.06)] dark:border dark:border-zinc-800/40">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-left max-w-xl">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground">
                  Ready to level up your marketing?
                </h2>
                <p className="mt-6 text-xl text-muted-foreground">
                  Explore our premium resources today and transform your online presence.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/courses" passHref>
                  <RainbowButton
                    className="text-lg px-8 py-6 rounded-xl transition-transform hover:scale-105"
                  >
                    Browse Products
                  </RainbowButton>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] opacity-20 dark:opacity-10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-primary/50 blur-3xl" />
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
