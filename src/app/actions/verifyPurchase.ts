'use server';

import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';

interface VerifyResult {
  success: boolean;
  error?: string;
  message?: string; // Optional success message
}

export async function verifyPurchase(sessionId: string): Promise<VerifyResult> {
  if (!sessionId) {
    return { success: false, error: 'Session ID is required.' };
  }

  console.log(`[Verify Action] Verifying session: ${sessionId}`);

  try {
    const supabase = await createClient();

    // --- Check if session already processed --- (CRUCIAL to prevent duplicates)
    // Check programs first
    const { data: existingProgramEnrollment, error: checkProgramError } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle();

    if (checkProgramError) {
      console.error('[Verify Action] Error checking program enrollments:', checkProgramError);
      return { success: false, error: 'Database error during pre-check.' };
    }
    if (existingProgramEnrollment && existingProgramEnrollment.status === 'active') {
        console.log(`[Verify Action] Session ${sessionId} already processed for program enrollment ${existingProgramEnrollment.id}.`);
        return { success: true, message: 'Purchase already verified.' };
    }

    // Check courses next
    const { data: existingCourseEnrollment, error: checkCourseError } = await supabase
      .from('user_course_enrollments')
      .select('id')
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle();

    if (checkCourseError) {
        console.error('[Verify Action] Error checking course enrollments:', checkCourseError);
        return { success: false, error: 'Database error during pre-check.' };
    }
    if (existingCourseEnrollment) {
        console.log(`[Verify Action] Session ${sessionId} already processed for course enrollment ${existingCourseEnrollment.id}.`);
        return { success: true, message: 'Purchase already verified.' };
    }

    // --- Retrieve session from Stripe --- 
    console.log(`[Verify Action] Retrieving session ${sessionId} from Stripe...`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'], // Expand subscription for program enrollments
    });
    console.log(`[Verify Action] Retrieved session status: ${session.status}, payment_status: ${session.payment_status}`);

    // --- Validate session status --- 
    if (session.status !== 'complete' && session.payment_status !== 'paid') {
        console.log(`[Verify Action] Session ${sessionId} not complete or paid.`);
        return { success: false, error: 'Payment not completed successfully.' };
    }

    // --- Extract metadata and process based on type --- 
    const metadata = session.metadata;
    if (!metadata || !metadata.userId) {
      console.error(`[Verify Action] Missing userId in metadata for session ${sessionId}`);
      return { success: false, error: 'Required information missing from purchase session.' };
    }

    const userId = metadata.userId;

    // --- Process Program Enrollment --- 
    if (metadata.programEnrollmentId) {
      const programEnrollmentId = metadata.programEnrollmentId;
      const subscription = session.subscription as Stripe.Subscription | null; // Expanded subscription
      const subscriptionId = subscription?.id;

      if (!subscriptionId) {
        console.error(`[Verify Action] Missing subscription ID for program enrollment ${programEnrollmentId} in session ${sessionId}`);
        return { success: false, error: 'Subscription details missing.' };
      }

      console.log(`[Verify Action] Updating program enrollment ${programEnrollmentId} to active...`);
      const { error: updateError } = await supabase
        .from('program_enrollments')
        .update({
          status: 'active',
          stripe_subscription_id: subscriptionId,
          stripe_checkout_session_id: sessionId, // Ensure checkout session ID is stored
          updated_at: new Date().toISOString(),
        })
        .eq('id', programEnrollmentId)
        .eq('user_id', userId);

      if (updateError) {
        console.error(`[Verify Action] Failed to update program enrollment ${programEnrollmentId}:`, updateError);
        return { success: false, error: 'Failed to update enrollment record.' };
      }

      console.log(`[Verify Action] Program enrollment ${programEnrollmentId} activated successfully.`);
      revalidatePath('/dashboard'); // Revalidate dashboard after update
      return { success: true, message: 'Program enrollment verified.' };
    }

    // --- Process Course Purchase --- 
    else if (metadata.courseId) {
      const courseId = metadata.courseId;
      const courseSlug = metadata.courseSlug;
      const amountTotal = session.amount_total;
      const pricePaid = amountTotal ? amountTotal / 100 : null;

      console.log(`[Verify Action] Inserting course enrollment for course ${courseId}...`);
      const { error: insertError } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          stripe_checkout_session_id: sessionId,
          price_paid: pricePaid,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[Verify Action] Error recording course purchase for course ${courseId}:`, insertError);
        // Check for unique constraint violation (duplicate)
        if (insertError.code === '23505') { // Postgres unique violation code
           console.log(`[Verify Action] Course purchase for session ${sessionId} likely already recorded.`);
           return { success: true, message: 'Course purchase already verified.' };
        }
        return { success: false, error: insertError.message };
      }

      console.log(`[Verify Action] Course enrollment for ${courseId} recorded successfully.`);
      if (courseSlug) {
        revalidatePath(`/courses/${courseSlug}`); // Revalidate course page
      }
      revalidatePath('/dashboard'); // Also revalidate dashboard
      return { success: true, message: 'Course purchase verified.' };
    }
    
    // --- Process Cart Checkout --- 
    else if (metadata.isCartCheckout === 'true') {
      const courseIdsString = metadata.courseIds;
      if (!courseIdsString) {
        console.error(`[Verify Action] Missing courseIds in metadata for cart checkout session ${sessionId}`);
        return { success: false, error: 'Required course information missing from purchase session.' };
      }
      
      console.log(`[Verify Action] Processing cart checkout with courses: ${courseIdsString}`);
      
      try {
        // Parse the JSON string containing course IDs
        const courseIdList = JSON.parse(courseIdsString);
        
        if (!Array.isArray(courseIdList) || courseIdList.length === 0) {
          console.error(`[Verify Action] Invalid or empty courseIds format in session ${sessionId}`);
          return { success: false, error: 'No valid courses found to enroll in' };
        }
        
        // Calculate price per course (divide total by number of courses)
        const amountTotal = session.amount_total;
        const pricePerCourse = amountTotal ? (amountTotal / courseIdList.length) / 100 : null;
        
        // Insert enrollment records for each course
        const enrollments = [];
        for (const courseId of courseIdList) {
          console.log(`[Verify Action] Enrolling in course ${courseId}...`);
          
          const { data, error } = await supabase
            .from('user_course_enrollments')
            .insert({
              user_id: userId,
              course_id: courseId, 
              stripe_checkout_session_id: sessionId,
              price_paid: pricePerCourse,
            })
            .select()
            .single();
            
          if (error) {
            // Skip duplicates but log other errors
            if (error.code === '23505') { // Postgres unique violation code
              console.log(`[Verify Action] Course enrollment for ${courseId} already exists, skipping.`);
              continue;
            } else {
              console.error(`[Verify Action] Error enrolling in course ${courseId}:`, error);
            }
          } else if (data) {
            enrollments.push(data);
          }
        }
        
        // Clear the user's cart after successful purchase verification
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId);
        
        // Revalidate relevant pages
        revalidatePath('/courses');
        revalidatePath('/dashboard');
        
        return { 
          success: true, 
          message: `Successfully enrolled in ${enrollments.length} courses.`
        };
      } catch (parseError) {
        console.error(`[Verify Action] Error parsing courseIds in session ${sessionId}:`, parseError);
        return { success: false, error: 'Failed to process cart courses' };
      }
    }

    // --- Fallback if metadata doesn't match --- 
    else {
      console.warn(`[Verify Action] Session ${sessionId} completed but metadata did not match known types:`, metadata);
      return { success: false, error: 'Unrecognized purchase type.' };
    }

  } catch (error: unknown) {
    console.error(`[Verify Action] Error verifying session ${sessionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during verification.';
    return { success: false, error: errorMessage };
  }
} 