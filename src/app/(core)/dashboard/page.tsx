import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, CalendarDays, Users } from 'lucide-react';
import { VerifyPurchaseClient } from './VerifyPurchaseClient';
import { getChildEnrollments, type SelectedSlot } from '@/app/api/actions/programs';
import type { ChildWithEnrollments } from '@/types/enrollment';
import type { CourseType, CourseEnrollmentResponse } from '@/types/course';
import { getAllUpcomingOccurrences } from '@/utils/scheduleUtils';
import { UpcomingClass } from './UpcomingClass';

export const revalidate = 0; // Ensure fresh data on each visit

// Define the course type
// interface CourseType {
//   id: string;
//   title: string;
//   slug: string;
//   description: string | null;
//   thumbnail_image_url: string | null;
//   image_url: string | null;
// }

// Define the program enrollment type
interface ProgramEnrollmentType {
  id: string;
  program_name: string;
  selected_slot: string; // This might become less relevant if we show per-child schedule
  status: string;
  billing_cycle: string;
}

// Expanded helper function to format schedule slot
const formatScheduleSlot = (slot: string): string => {
  // Ensure slot is treated as SelectedSlot type if possible, or handle string input
  const safeSlot = slot as SelectedSlot; 
  switch (safeSlot) {
    // Punjabi
    case 'sunday_beginner':
      return 'Punjabi/Gurmukhi: Sundays 10:00 AM - 11:30 AM (Beginner)';
    case 'sunday_advanced':
      return 'Punjabi/Gurmukhi: Sundays 11:30 AM - 1:00 PM (Mid/Advanced)';
    // Math
    case 'saturday_math_grade1_5':
      return 'Math: Saturdays 11:00 AM - 12:00 PM (Grade 1-5)';
    case 'saturday_math_grade6_8':
      return 'Math: Saturdays 12:30 PM - 1:30 PM (Grade 6-8)';
    case 'saturday_math_grade9_plus':
      return 'Math: Saturdays 2:00 PM - 3:00 PM (Grade 9+)';
    // Coding
    case 'saturday_coding_beginner':
      return 'Coding: Saturdays 4:00 PM - 5:00 PM (Beginner)';
    case 'saturday_coding_advanced':
      return 'Coding: Saturdays 6:00 PM - 7:00 PM (Mid/Advanced)';
    default:
      console.warn(`Unknown schedule slot encountered: ${slot}`); // Log unknown slots
      return `Unknown Class Schedule (${slot})`;
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

  // 4. Fetch active program enrollment (parallel fetch) - Still useful to know if they *are* enrolled
  const fetchProgramEnrollment = supabase
    .from('program_enrollments')
    .select('id, program_name, selected_slot, status, billing_cycle') // Keep selection for now
    .eq('user_id', user.id)
    .eq('status', 'active') // Only fetch active enrollments
    .maybeSingle(); // Expecting zero or one active enrollment

  // 5. Fetch child enrollments (parallel fetch) - New fetch
  const fetchChildEnrollments = getChildEnrollments();

  // Execute fetches concurrently
  const [
    courseEnrollmentResult, 
    programEnrollmentResult,
    childEnrollmentsResult // Add result for child enrollments
  ] = await Promise.all([
    fetchCourses,
    fetchProgramEnrollment,
    fetchChildEnrollments, // Add the fetch promise
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

  // Handle child enrollment errors
  if (!childEnrollmentsResult.success) {
    console.error('Error fetching child enrollments:', childEnrollmentsResult.error);
    // Decide how to handle this - show an error message?
  }

  // Extract courses from the enrollment data
  const validCourses: CourseType[] = [];
  if (courseEnrollmentResult.data && courseEnrollmentResult.data.length > 0) {
    // Ensure correct type assertion for the initial data structure if needed
    const typedEnrollments = courseEnrollmentResult.data as CourseEnrollmentResponse[]; // Assuming data is an array of these
    typedEnrollments.forEach((enrollment) => {
      if (enrollment.courses) {
        if (Array.isArray(enrollment.courses)) {
          // Explicitly type courseData here
          enrollment.courses.forEach((courseData: CourseType) => { 
            // Type assertion `as CourseType` might not be needed if courseData is correctly typed
            if (courseData && courseData.id) validCourses.push(courseData); 
          });
        } else {
          // Type assertion needed here as enrollment.courses could be a single CourseType
          const course = enrollment.courses as CourseType; 
          if (course && course.id) validCourses.push(course);
        }
      }
    });
  }

  // Get program enrollment data (still useful to know if they are enrolled at all)
  const activeProgramEnrollment = programEnrollmentResult.data as ProgramEnrollmentType | null;
  // Get child enrollment data
  const childrenWithSchedules = childEnrollmentsResult.success ? childEnrollmentsResult.data as ChildWithEnrollments[] : [];

  // Calculate upcoming occurrences
  const now = new Date();
  const sortedOccurrences = getAllUpcomingOccurrences(childrenWithSchedules, now);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Render the client component - it doesn't display anything visually */}
      <VerifyPurchaseClient /> 
      
      {/* Program Enrollment Section - Modified */}
      {/* Show this section if the user has an active program enrollment OR if there are children with schedules */}
      {(activeProgramEnrollment || (childrenWithSchedules && childrenWithSchedules.length > 0)) && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">My Program</h2>
          
          {/* Error fetching child enrollments */}
          {!childEnrollmentsResult.success && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error Loading Schedules</AlertTitle>
              <AlertDescription>
                Could not load your children&apos;s class schedules. Error: {childEnrollmentsResult.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Display schedules if successfully fetched */}
          {childEnrollmentsResult.success && childrenWithSchedules && childrenWithSchedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Full Schedule */}
              <Card> 
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> 
                    Full Schedule
                  </CardTitle>
                  <CardDescription>Class schedule for your registered children.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Schedule Accordion */}
                  <Accordion type="multiple" className="w-full">
                    {childrenWithSchedules.map((child) => (
                      <AccordionItem key={child.id} value={child.id}>
                        <AccordionTrigger className="text-lg font-medium">{child.name}</AccordionTrigger>
                        <AccordionContent>
                          {child.enrollments && child.enrollments.length > 0 ? (
                            <ul className="space-y-2 pt-2">
                              {child.enrollments.map((enrollment) => (
                                <li key={enrollment.id} className="text-sm flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span>{formatScheduleSlot(enrollment.time_slot)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground pt-2">No classes scheduled for {child.name}.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Element 2: Upcoming Class or its empty state card */}
              {sortedOccurrences.length > 0 ? (
                  <UpcomingClass upcomingClasses={sortedOccurrences} />
              ) : (
                  <Card className="bg-muted/30 flex items-center justify-center h-full">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>No upcoming class sessions found.</p>
                    </CardContent>
                  </Card>
              )}
            </div>
          ) : childEnrollmentsResult.success ? ( 
             // Successfully fetched but no children/schedules
             <Card className="bg-muted/30">
               <CardContent className="pt-6">
                 <p className="text-muted-foreground text-center">No children are currently registered in the program, or no classes are scheduled.</p>
                 {/* Optionally add a link back to registration/programs page */}
                 <div className="text-center mt-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/programs">View Programs</Link>
                    </Button>
                 </div>
               </CardContent>
             </Card>
          ) : null /* Error handled above */ }
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