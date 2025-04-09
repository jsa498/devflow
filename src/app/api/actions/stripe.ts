'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';

/**
 * Creates a Stripe checkout session for a course purchase
 */
export async function createCheckoutSession(
  courseId: string, 
  courseTitle: string, 
  coursePrice: number, 
  courseSlug: string,
  courseImageUrl: string
) {
  let user;
  try {
    // Get the current user from Supabase auth
    const supabase = await createClient();
    const { data, error: getUserError } = await supabase.auth.getUser();

    // Handle potential errors during getUser explicitly
    if (getUserError) {
      console.error("Error getting user:", getUserError);
      // Treat getUser error as not logged in
      return { error: 'You must be logged in to purchase a course', success: false };
    }

    user = data.user;

    if (!user) {
      // User not authenticated
      return { error: 'You must be logged in to purchase a course', success: false };
    }

    // If we reach here, user is authenticated

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: courseTitle,
              images: [courseImageUrl],
            },
            unit_amount: Math.round(coursePrice * 100), // Convert from dollars to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseSlug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseSlug}?canceled=true`,
      metadata: {
        userId: user.id, // user is guaranteed to be non-null here
        courseId: courseId,
        courseSlug: courseSlug,
      },
    });

    // Return success with the session ID or URL
    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: unknown) {
    // Handle errors during Stripe session creation or other unexpected issues
    console.error('Error creating checkout session:', error);
    
    // Check if it's the specific "not logged in" error we already handled
    // This check might be redundant now but kept for clarity
    if (error && typeof error === 'object' && 'message' in error && error.message === 'You must be logged in to purchase a course') {
        return { success: false, error: error.message };
    }
    
    // General error message for other issues
    let errorMessage = 'An unknown error occurred while creating the checkout session';
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Records a successful course purchase in the database
 * This would typically be called by a webhook handler, but we'll also use it for success page redirects
 */
export async function recordCoursePurchase(sessionId: string) {
  try {
    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // If the session is not in a paid status, do nothing
    if (session.payment_status !== 'paid') {
      return { success: false, error: 'Payment not completed' };
    }
    
    // Extract metadata
    const { userId, courseId } = session.metadata || {};
    
    if (!userId || !courseId) {
      return { success: false, error: 'Missing user or course information' };
    }
    
    // Get price paid
    const amountTotal = session.amount_total;
    const pricePaid = amountTotal ? amountTotal / 100 : null; // Convert from cents to dollars
    
    // Insert enrollment record
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_course_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        stripe_checkout_session_id: sessionId,
        price_paid: pricePaid,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error recording purchase:', error);
      return { success: false, error: error.message };
    }
    
    // Revalidate the course page to show updated access
    if (session.metadata?.courseSlug) {
      revalidatePath(`/courses/${session.metadata.courseSlug}`);
    }
    
    return { success: true, enrollment: data };
  } catch (error: unknown) {
    console.error('Error recording purchase:', error);
    // Type guard for errors with message property
    if (error && typeof error === 'object' && 'message' in error) {
      return { 
        success: false, 
        error: error.message as string || 'Failed to record purchase' 
      };
    }
    return { 
      success: false, 
      error: 'An unknown error occurred while recording the purchase'
    };
  }
} 