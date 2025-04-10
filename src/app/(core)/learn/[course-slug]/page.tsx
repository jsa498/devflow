import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CourseSidebar } from '@/components/course/course-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { VideoPlayer } from "@/components/ui/video-player";
import Image from 'next/image';

// Define types for clarity (can be moved to a types file later)
interface Lesson {
  id: string;
  title: string;
  order: number;
  // Add other lesson fields as needed (content_type, etc.)
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  video_url?: string;
  image_url?: string;
  thumbnail_image_url?: string;
  what_youll_get?: string[];
}

export const revalidate = 0; // Or set a reasonable revalidation period

export default async function CourseLearnPage({ params }: { params: { 'course-slug': string } }) {
  const supabase = await createClient();
  const { 'course-slug': courseSlug } = params;

  // 1. Get user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Redirect to login if no user
  if (userError || !user) {
    redirect(`/auth/login?redirect_to=/learn/${courseSlug}`);
  }

  // 2. Fetch Course details by slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, description, video_url, image_url, thumbnail_image_url, what_youll_get')
    .eq('slug', courseSlug)
    .single();

  if (courseError || !course) {
    console.error("Error fetching course or course not found:", courseError);
    notFound();
  }

  // 3. Verify User Enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('user_course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle();

  if (enrollmentError) {
    console.error("Error checking enrollment:", enrollmentError);
    // Handle appropriately - maybe show an error message page
    return <div>Error checking course access. Please try again later.</div>;
  }

  if (!enrollment) {
    // User is not enrolled, redirect or show an 'access denied' message
     console.warn(`User ${user.id} attempted to access non-enrolled course ${course.id}`);
     // Option 1: Redirect to course purchase page
     redirect(`/courses/${courseSlug}?error=not_enrolled`);
     // Option 2: Show an access denied message
     // return <div>Access Denied. You are not enrolled in this course.</div>;
  }

  // 4. Fetch Modules and Lessons for this course
  // Use a regular string for the select query
  const selectQuery = `
      id,
      title,
      order,
      lessons (
        id,
        title,
        order
      )
    `;
  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .select(selectQuery) // Use the regular string here
    .eq('course_id', course.id)
    .order('order', { ascending: true }) // Order modules
    .order('order', { foreignTable: 'lessons', ascending: true }); // Order lessons within modules

  if (modulesError) {
    console.error("Error fetching modules/lessons:", modulesError);
    // Handle appropriately
    return <div>Error loading course content. Please try again later.</div>;
  }

  // Type assertion for safety (adjust based on actual fetched data structure)
  const modules: Module[] = modulesData as Module[] || [];
  const courseData: Course = course as Course; // Assert the fetched course data type

  // TODO: Add actual lesson content viewing logic later
  // This logic will likely involve checking for a lesson slug in the URL
  // and conditionally rendering lesson content instead of the initial view below.

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header/Navbar Placeholder - Assuming you have one */}
      {/* <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6"></header> */}

      <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-14 md:pl-0">
        {/* Mobile Navigation Trigger (Sheet) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          {/* Placeholder for potential logo/breadcrumbs */}
          <span className="font-semibold">{courseData.title}</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Course Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <SheetHeader className="mb-4">
                <SheetTitle>Course Content</SheetTitle>
              </SheetHeader>
              <CourseSidebar modules={modules} courseSlug={courseSlug} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 md:flex md:flex-row">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:w-64 lg:w-72 xl:w-80 border-r pr-4 h-full">
            <h2 className="text-xl font-semibold mb-4 sticky top-[calc(theme(spacing.14)+1px)] pt-4 bg-background"> {/* Adjust top based on header height */} 
              Course Content
            </h2>
            <CourseSidebar modules={modules} courseSlug={courseSlug} className="sticky top-[calc(theme(spacing.14)+1px+theme(spacing.10))]" /> {/* Adjust top based on header+title height */} 
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="container mx-auto px-0 py-6 md:py-12">
              <h1 className="text-3xl font-bold tracking-tight mb-2">{courseData.title}</h1>
              <p className="text-lg text-muted-foreground mb-8">Start learning!</p>

              {/* Initial Course Content Display Area (Replaced by Lesson Content Later) */}
              <div className="mt-8">
                {/* Course Video or Image */}
                {courseData.video_url ? (
                  <div className="w-full h-auto aspect-video relative mb-8 rounded-lg overflow-hidden border">
                    <VideoPlayer 
                      src={courseData.video_url}
                      poster={courseData.thumbnail_image_url || courseData.image_url || undefined}
                      className="w-full h-full"
                      controls
                      autoPlay
                      muted
                      loop
                      controlsList="nodownload"
                    />
                  </div>
                ) : courseData.image_url ? (
                  <div className="w-full h-auto aspect-video relative mb-8 rounded-lg overflow-hidden border">
                    <Image
                      src={courseData.image_url}
                      alt={courseData.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 800px"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg mb-8 border">
                    {/* Placeholder SVG or similar */}
                    <svg className="h-16 w-16 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}

                {/* Course Description */}
                {courseData.description && (
                  <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
                    <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                    <p>{courseData.description}</p>
                  </div>
                )}
                
                {/* What You'll Learn */}
                {courseData.what_youll_get && courseData.what_youll_get.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6">What You&apos;ll Learn</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {courseData.what_youll_get.map((item: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 mr-3 mt-1 text-primary">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-base text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Placeholder message if no details are available */}
                {!courseData.video_url && !courseData.image_url && !courseData.description && (!courseData.what_youll_get || courseData.what_youll_get.length === 0) && (
                   <p>Select a lesson from the sidebar to begin.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 