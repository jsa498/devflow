import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen } from 'lucide-react';

export const revalidate = 0; // Ensure fresh data on each visit

// Define the course type
interface CourseType {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_image_url: string | null;
  image_url: string | null;
}

// For TypeScript's type checking purposes
type EnrollmentResponse = {
  courses: CourseType | unknown[] | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // 2. Redirect if not logged in
  if (userError || !user) {
    redirect('/auth/login?redirect_to=/dashboard');
  }

  // 3. Fetch enrolled courses
  const { data: enrolledCourses, error: enrollmentError } = await supabase
    .from('user_course_enrollments')
    .select(`
      courses (
        id,
        title,
        slug,
        description,
        thumbnail_image_url,
        image_url
      )
    `)
    .eq('user_id', user.id);

  if (enrollmentError) {
    console.error('Error fetching enrolled courses:', enrollmentError);
    // Optionally render an error message to the user
    return (
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">My Courses</h1>
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                Could not load your courses. Please try again later.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  // Extract courses from the enrollment data
  const validCourses: CourseType[] = [];
  
  if (enrolledCourses && enrolledCourses.length > 0) {
    // Type the enrollments properly for TypeScript
    const typedEnrollments = enrolledCourses as EnrollmentResponse[];
    
    typedEnrollments.forEach((enrollment) => {
      if (enrollment.courses) {
        // Handle both array and object cases
        if (Array.isArray(enrollment.courses)) {
          // If courses is an array
          enrollment.courses.forEach((courseData) => {
            // Type check each course
            const course = courseData as CourseType;
            if (course && course.id) {
              validCourses.push({
                id: course.id,
                title: course.title,
                slug: course.slug,
                description: course.description,
                thumbnail_image_url: course.thumbnail_image_url,
                image_url: course.image_url
              });
            }
          });
        } else {
          // If courses is a single object
          const course = enrollment.courses as CourseType;
          if (course && course.id) {
            validCourses.push({
              id: course.id,
              title: course.title,
              slug: course.slug,
              description: course.description,
              thumbnail_image_url: course.thumbnail_image_url,
              image_url: course.image_url
            });
          }
        }
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Courses</h1>

      {/* Placeholder for course content status */}
       <Alert className="mb-8 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300">
         <BookOpen className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
         <AlertTitle className="font-semibold text-blue-900 dark:text-blue-200">Content Under Development</AlertTitle>
         <AlertDescription>
           Thank you for your purchase! Course content is currently being developed and will be available soon. Stay tuned!
         </AlertDescription>
       </Alert>

      {validCourses && validCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {validCourses.map((course) => (
            <Card key={course.id} className="group overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
              <div className="relative w-full h-48 bg-muted">
                {course.thumbnail_image_url || course.image_url ? (
                  <Image
                    src={course.thumbnail_image_url || course.image_url || ''}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted group-hover:bg-muted/80 transition-colors">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardHeader className="flex-grow">
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {/* Link will eventually go to the course content page */}
                  <Link href={`/courses/${course.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                    {course.title}
                  </Link>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/50 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">No Courses Yet!</h3>
          <p className="text-muted-foreground mb-6">You haven&apos;t enrolled in any courses.</p>
          <Button asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      )}
    </div>
  );
} 