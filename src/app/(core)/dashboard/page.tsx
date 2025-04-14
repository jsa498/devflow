import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, CalendarDays } from 'lucide-react';
import { VerifyPurchaseClient } from './VerifyPurchaseClient';

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

// Define the program enrollment type
interface ProgramEnrollmentType {
  id: string;
  program_name: string;
  selected_slot: string; // e.g., 'sunday_beginner', 'sunday_advanced'
  status: string;
  billing_cycle: string;
}

// For TypeScript's type checking purposes
type CourseEnrollmentResponse = {
  courses: CourseType | unknown[] | null;
};

// Helper function to format schedule slot
const formatScheduleSlot = (slot: string): string => {
  switch (slot) {
    case 'sunday_beginner':
      return 'Sundays 10:00 AM - 11:30 AM (Beginner Group)';
    case 'sunday_advanced':
      return 'Sundays 11:30 AM - 1:00 PM (Mid/Advanced Group)';
    default:
      return 'Schedule details unavailable';
  }
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // 2. Redirect if not logged in
  if (userError || !user) {
    redirect('/auth/login');
  }

  // 3. Fetch enrolled courses (parallel fetch)
  const fetchCourses = supabase
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

  // 4. Fetch active program enrollment (parallel fetch)
  const fetchProgramEnrollment = supabase
    .from('program_enrollments')
    .select('id, program_name, selected_slot, status, billing_cycle')
    .eq('user_id', user.id)
    .eq('status', 'active') // Only fetch active enrollments
    .maybeSingle(); // Expecting zero or one active enrollment

  // Execute fetches concurrently
  const [courseEnrollmentResult, programEnrollmentResult] = await Promise.all([
    fetchCourses,
    fetchProgramEnrollment,
  ]);

  // Handle course enrollment errors
  if (courseEnrollmentResult.error) {
    console.error('Error fetching enrolled courses:', courseEnrollmentResult.error);
    // Render only error? Or continue to show program enrollment?
    // For now, let's show an error but still try to render other sections
  }

  // Handle program enrollment errors (excluding not found)
  if (programEnrollmentResult.error && programEnrollmentResult.status !== 406) { // 406 is expected for maybeSingle() when no row found
    console.error('Error fetching program enrollment:', programEnrollmentResult.error);
  }

  // Extract courses from the enrollment data
  const validCourses: CourseType[] = [];
  if (courseEnrollmentResult.data && courseEnrollmentResult.data.length > 0) {
    const typedEnrollments = courseEnrollmentResult.data as CourseEnrollmentResponse[];
    typedEnrollments.forEach((enrollment) => {
      if (enrollment.courses) {
        if (Array.isArray(enrollment.courses)) {
          enrollment.courses.forEach((courseData) => {
            const course = courseData as CourseType;
            if (course && course.id) validCourses.push(course);
          });
        } else {
          const course = enrollment.courses as CourseType;
          if (course && course.id) validCourses.push(course);
        }
      }
    });
  }

  // Get program enrollment data
  const activeProgramEnrollment = programEnrollmentResult.data as ProgramEnrollmentType | null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Render the client component - it doesn't display anything visually */}
      <VerifyPurchaseClient /> 
      
      {/* Program Enrollment Section */}
      {activeProgramEnrollment && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">My Program</h2>
          <Card className="bg-gradient-to-r from-primary/10 to-background border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {activeProgramEnrollment.program_name} Schedule
              </CardTitle>
              <CardDescription>Your upcoming class time.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">
                {formatScheduleSlot(activeProgramEnrollment.selected_slot)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Billing: {activeProgramEnrollment.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              </p>
              {/* TODO: Add link to manage subscription in Stripe customer portal */}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Existing Courses Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">My Courses</h2>

        {/* Course Loading Error */}
        {courseEnrollmentResult.error && (
            <Alert variant="destructive" className="mb-8">
                <AlertTitle>Error Loading Courses</AlertTitle>
                <AlertDescription>
                Could not load your courses. Please try refreshing the page.
                </AlertDescription>
            </Alert>
        )}

        {/* Content Under Development Alert - Keep this? */}
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
                    <Link href={`/learn/${course.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                      {course.title}
                    </Link>
                  </CardTitle>
                  <div className="mt-4">
                    <Button asChild size="sm" className="w-full">
                      <Link href={`/learn/${course.slug}`}>
                        Start Course
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          // Only show "No Courses Yet" if there wasn't an error loading them
          !courseEnrollmentResult.error && (
            <div className="text-center py-16 bg-muted/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">No Courses Yet!</h3>
              <p className="text-muted-foreground mb-6">You haven&apos;t enrolled in any courses.</p>
              <Button asChild>
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>
          )
        )}
      </section>

      {/* Message for no enrollments - Check program data directly, check course data length */}
      {!programEnrollmentResult.data && (!courseEnrollmentResult.data || courseEnrollmentResult.data.length === 0) && (
         <div className="text-center py-12">
           <p className="text-lg text-gray-600 mb-4">You haven&apos;t enrolled in any courses or programs yet.</p>
           <Link href="/products" passHref>
              <Button>Browse Offerings</Button>
           </Link>
         </div>
      )}
    </div>
  );
} 