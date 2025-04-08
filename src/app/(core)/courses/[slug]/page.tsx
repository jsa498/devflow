import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/video-player";

export const revalidate = 3600; // Revalidate this page every hour

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
  is_published: boolean;
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  // Await params before using its properties
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const supabase = await createClient();
  
  // Fetch the specific course by slug
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !course) {
    console.error('Error fetching course:', error);
    return notFound();
  }

  // Format price with dollar sign and ensure it's displayed with 2 decimal places
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8">
        <Link href="/courses" passHref>
          <Button variant="ghost" className="mb-6 group">
            <ChevronLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Courses
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info Section */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {course.title}
            </h1>
            
            {/* Course Video or Image */}
            {course.video_url ? (
              <div className="w-full h-[300px] md:h-[400px] relative mb-8 rounded-xl overflow-hidden">
                <VideoPlayer 
                  src={course.video_url}
                  poster={course.thumbnail_image_url || course.image_url || undefined}
                  className="w-full h-full"
                />
              </div>
            ) : course.image_url ? (
              <div className="w-full h-[300px] md:h-[400px] relative mb-8 rounded-xl overflow-hidden">
                <Image
                  src={course.image_url}
                  alt={course.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-muted rounded-xl mb-8">
                <svg
                  className="h-24 w-24 text-muted-foreground/50"
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
            
            {/* Course Description */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-4">About This Course</h2>
              <p className="text-lg text-muted-foreground mb-8">{course.description}</p>
            </div>
            
            {/* What You'll Learn */}
            {course.what_youll_get && course.what_youll_get.length > 0 && (
              <div className="mt-8 mb-10">
                <h2 className="text-2xl font-bold mb-6">What You&apos;ll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.what_youll_get.map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="mr-3 mt-1 text-primary">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Purchase Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-card rounded-2xl shadow-xl p-6 border border-border">
              <div className="text-3xl font-bold text-primary mb-4">
                {formatPrice(course.price)}
              </div>
              
              <div className="space-y-4 mb-6">
                <Button className="w-full text-base py-6" size="lg">
                  Buy Now
                </Button>
                
                <Button variant="outline" className="w-full text-base py-6" size="lg">
                  Add to Cart
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground mt-6">
                <p className="mb-2">• Full lifetime access</p>
                <p className="mb-2">• Access on mobile and desktop</p>
                <p>• Certificate of completion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 