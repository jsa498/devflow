import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/video-player";
import { CheckoutButton } from './CheckoutButton';

export const revalidate = 3600; // Revalidate this page every hour

export default async function CourseDetailPage({ 
  params,
  searchParams 
}: { 
  params: { slug: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Explicitly await both params and searchParams
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;
  
  const supabase = await createClient();
  
  // Fetch the specific course by slug
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  // Access searchParams after awaiting it
  const success = resolvedSearchParams.success === 'true';
  const sessionId = resolvedSearchParams.session_id as string | undefined;
  const canceled = resolvedSearchParams.canceled === 'true';

  if (error || !course) {
    console.error('Error fetching course:', error);
    return notFound();
  }

  // Format price with dollar sign and ensure it's displayed with 2 decimal places
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Handle successful payment if sessionId exists
  if (success && sessionId) {
    // Import action dynamically to avoid including it in the client bundle
    const { recordCoursePurchase } = await import('@/app/api/actions/stripe');
    await recordCoursePurchase(sessionId);
  }

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

      {/* Success/Error Messages */}
      {success && (
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg">
            <h3 className="font-medium">Purchase Successful!</h3>
            <p>Thank you for your purchase. You now have access to this course.</p>
          </div>
        </div>
      )}
      
      {canceled && (
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg">
            <h3 className="font-medium">Payment Canceled</h3>
            <p>Your payment was canceled. You have not been charged.</p>
          </div>
        </div>
      )}

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
                  autoPlay={true}
                  muted={true}
                  controlsList="nodownload"
                  loop={true}
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
                <CheckoutButton
                  courseId={course.id}
                  courseTitle={course.title}
                  coursePrice={course.price}
                  courseSlug={course.slug}
                  courseImageUrl={course.thumbnail_image_url || course.image_url || ''}
                />
                
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