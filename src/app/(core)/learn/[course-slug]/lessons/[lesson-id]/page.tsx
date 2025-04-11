import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CourseSidebar } from '@/components/course/course-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ArrowLeft, ArrowRight } from 'lucide-react';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import Link from 'next/link';

// Re-use or import types from a shared location if available
interface Lesson {
  id: string;
  title: string;
  order: number;
  content_markdown?: string; // Ensure this is fetched
  // Add other lesson fields as needed
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Omit<Lesson, 'content_markdown'>[]; // Sidebar doesn't need full content
}

interface Course {
  id: string;
  title: string;
  slug: string;
  // Add other course fields if needed by layout
}

// Update interface to expect a Promise
interface LessonPageProps {
  params: Promise<{ // Now a Promise
    'course-slug': string;
    'lesson-id': string;
  }>;
}

// Helper to find next/prev lessons
const findAdjacentLessons = (modules: Module[], currentLessonId: string) => {
  let prevLesson: Lesson | null = null;
  let nextLesson: Lesson | null = null;
  const allLessonsFlat: Omit<Lesson, 'content_markdown'>[] = [];

  modules.forEach(module => {
    allLessonsFlat.push(...module.lessons);
  });

  for (let i = 0; i < allLessonsFlat.length; i++) {
    if (allLessonsFlat[i].id === currentLessonId) {
      if (i > 0) {
        prevLesson = allLessonsFlat[i - 1];
      }
      if (i < allLessonsFlat.length - 1) {
        nextLesson = allLessonsFlat[i + 1];
      }
      break;
    }
  }
  return { prevLesson, nextLesson };
};

export const revalidate = 0; // Or set a reasonable revalidation period

// Update signature to use a different prop name for the promise
export default async function LessonPage({ params: paramsPromise }: LessonPageProps) {
  const supabase = await createClient();

  // Await the params promise first
  const params = await paramsPromise;
  const { 'course-slug': courseSlug, 'lesson-id': lessonId } = params;

  // 1. Get user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Use resolved slugs in redirect
  if (userError || !user) {
    redirect(`/auth/login?redirect_to=/learn/${courseSlug}/lessons/${lessonId}`);
  }

  // 2. Fetch Lesson Details and Verify Course Membership
  // Fetch lesson and include course slug via module relation
  const { data: lessonData, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      *,
      modules (
        id,
        course_id,
        courses ( id, slug, title )
      )
    `)
    .eq('id', lessonId)
    .maybeSingle(); // Use maybeSingle in case ID is invalid

  if (lessonError) {
    console.error("Error fetching lesson:", lessonError);
    // Consider a more user-friendly error page/component
    return <div>Error loading lesson. Please try again later.</div>;
  }

  // Validate if lesson exists and belongs to the course specified in the slug
  if (!lessonData || !lessonData.modules || !lessonData.modules.courses || lessonData.modules.courses.slug !== courseSlug) {
    console.warn(`Lesson ${lessonId} not found or does not belong to course ${courseSlug}.`);
    notFound();
  }

  const lesson: Lesson = lessonData as Lesson;
  const course: Course = lessonData.modules.courses as Course;

  // 3. Verify User Enrollment (using course_id from the fetched lesson's module)
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('user_course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle();

  if (enrollmentError) {
    console.error("Error checking enrollment:", enrollmentError);
    return <div>Error checking course access. Please try again later.</div>;
  }

  if (!enrollment) {
    redirect(`/courses/${courseSlug}?error=not_enrolled`);
  }

  // 4. Fetch All Modules and Lessons for the Sidebar
  // Re-fetch modules/lessons for the sidebar (could potentially optimize this)
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
    .select(selectQuery)
    .eq('course_id', course.id)
    .order('order', { ascending: true })
    .order('order', { foreignTable: 'lessons', ascending: true });

  if (modulesError) {
    console.error("Error fetching modules/lessons for sidebar:", modulesError);
    return <div>Error loading course structure. Please try again later.</div>;
  }

  const modules: Module[] = modulesData as Module[] || [];

  // 5. Find Previous/Next Lesson
  const { prevLesson, nextLesson } = findAdjacentLessons(modules, lessonId);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-14 md:pl-0">
        {/* Mobile Navigation Trigger (Sheet) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <span className="font-semibold">{course.title}</span>
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
              {/* Pass current lesson ID for active state styling later */}
              <CourseSidebar modules={modules} courseSlug={courseSlug} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 md:flex md:flex-row">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:w-64 lg:w-72 xl:w-80 border-r pr-4 h-full">
            <h2 className="text-xl font-semibold mb-4 sticky top-[calc(theme(spacing.14)+1px)] pt-4 bg-background">
              Course Content
            </h2>
            {/* Pass current lesson ID for active state styling later */}
            <CourseSidebar modules={modules} courseSlug={courseSlug} className="sticky top-[calc(theme(spacing.14)+1px+theme(spacing.10))]" />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 py-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">{lesson.title}</h1>

            {/* Lesson Content */}
            <div className="mb-8">
              <MarkdownRenderer markdown={lesson.content_markdown || "No content available for this lesson."} />
            </div>

            {/* Prev/Next Navigation */}
            <div className="flex justify-between items-center mt-10 pt-6 border-t">
              <div>
                {prevLesson && (
                  <Button variant="outline" asChild>
                    <Link href={`/learn/${courseSlug}/lessons/${prevLesson.id}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous: {prevLesson.title}
                    </Link>
                  </Button>
                )}
              </div>
              <div>
                {nextLesson && (
                  <Button variant="outline" asChild>
                    <Link href={`/learn/${courseSlug}/lessons/${nextLesson.id}`}>
                      Next: {nextLesson.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 