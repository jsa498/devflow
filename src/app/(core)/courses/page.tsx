import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Define the Course interface based on database schema
interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  image_url: string | null;
  thumbnail_image_url: string | null;
  video_url: string | null;
  what_youll_get: string[];
  created_at: string;
}

export const revalidate = 3600; // Revalidate this page every hour

export default async function CoursesPage() {
  const supabase = await createClient();
  
  // Fetch published courses from Supabase
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return <div>Error loading courses. Please try again later.</div>;
  }

  // Format price with dollar sign and ensure it's displayed with 2 decimal places
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 py-16 md:py-20 lg:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
                Courses
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                Level up your skills with our expert-crafted courses designed to help you master new technologies and concepts.
              </p>
              
              {/* Decorative elements */}
              <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] opacity-25 dark:opacity-15">
                  <div className="absolute inset-0 rounded-[50%] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-[96px]" />
                </div>
                <div className="absolute top-0 left-0 right-0 h-[350px] bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-[350px] bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid Section */}
      <div className="py-16 bg-gradient-to-b from-background to-background/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course: Course) => (
                <Card key={course.id} className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 h-full flex flex-col p-0">
                  {course.thumbnail_image_url || course.image_url ? (
                    <div className="w-full h-64 relative bg-black overflow-hidden rounded-t-2xl">
                      <Image
                        src={course.thumbnail_image_url || course.image_url || ''}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  ) : (
                    <div className="h-64 w-full flex items-center justify-center bg-muted group-hover:bg-muted/80 transition-colors rounded-t-2xl">
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
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                      <Link href={`/courses/${course.slug}`} className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        {course.title}
                      </Link>
                    </h2>
                    <CardDescription className="text-sm mb-6 line-clamp-3">
                      {course.description}
                    </CardDescription>
                    
                    {/* What You'll Get section */}
                    {course.what_youll_get && course.what_youll_get.length > 0 && (
                      <div className="mt-2 mb-6">
                        <h3 className="font-medium text-sm mb-2">What you&apos;ll learn:</h3>
                        <ul className="space-y-1">
                          {course.title === "Introduction to Modern Web Development" ? (
                            // Show all bullet points for the Introduction course
                            course.what_youll_get.map((item: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <div className="mr-2 mt-0.5 text-primary">•</div>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            // For other courses, use the "and more" format
                            <>
                              {course.what_youll_get.slice(0, 1).map((item: string, index: number) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start">
                                  <div className="mr-2 mt-0.5 text-primary">•</div>
                                  <span>{item}</span>
                                </li>
                              ))}
                              {course.what_youll_get.length > 1 && (
                                <li className="text-sm text-muted-foreground flex items-start">
                                  <div className="mr-2 mt-0.5 text-primary">•</div>
                                  <span>
                                    {course.what_youll_get[1]}
                                    {course.what_youll_get.length > 2 && (
                                      <Link href={`/courses/${course.slug}`} className="text-primary hover:underline font-medium inline-block ml-1">
                                        ... and more
                                      </Link>
                                    )}
                                  </span>
                                </li>
                              )}
                            </>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-auto flex flex-col gap-4">
                      <div className="text-xl font-bold text-primary">
                        {formatPrice(course.price)}
                      </div>
                      <Link href={`/courses/${course.slug}`} passHref legacyBehavior>
                        <Button className="w-full">
                          View Course <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold mb-4">No courses available yet</h3>
              <p className="text-muted-foreground mb-8">Check back soon for our upcoming courses!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
