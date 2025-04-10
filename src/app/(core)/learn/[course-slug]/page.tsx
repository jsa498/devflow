import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';

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
    .select('id, title, slug')
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

  // Type assertion for safety (consider refining this)
  const modules: Module[] = modulesData as Module[] || [];

  // TODO: Add actual lesson content viewing logic later

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
      <p className="text-lg text-muted-foreground mb-8">Start learning!</p>

      {/* TODO: Add a proper sidebar or navigation for modules/lessons */}
      {/* TODO: Add content display area */}

      <div className="w-full max-w-2xl mx-auto"> {/* Or adjust layout */}
         <h2 className="text-2xl font-semibold mb-4">Course Content</h2>
         {modules.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {modules.map((module) => (
                <AccordionItem value={`module-${module.id}`} key={module.id}>
                  <AccordionTrigger className="text-lg font-medium">
                    Module {module.order}: {module.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    {module.lessons && module.lessons.length > 0 ? (
                      <ul className="space-y-2 pl-4 pt-2">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center justify-between">
                            {/* TODO: Make this a link to the actual lesson view */}
                            <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                               Lesson {lesson.order}: {lesson.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-4 pt-2">No lessons in this module yet.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
         ) : (
            <p className="text-muted-foreground text-center py-8">Course content is coming soon!</p>
         )}
      </div>

      {/* Placeholder for Start/Continue Button */}
      <div className="mt-8 flex justify-center">
          {/* TODO: Link this to the first lesson or track progress */}
          <Button size="lg">
              Start Course
          </Button>
      </div>
    </div>
  );
} 