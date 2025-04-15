'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';

// Define the structure of the item fetched from Supabase cart_items joined with courses
// interface CartItemFromSupabase { // Removed as it's unused after using 'any'
//   id: string;
//   course_id: string;
//   courses: {
//     title: string;
//     price: number;
//     image_url: string | null; // Allow null for image_url
//     slug: string;
//   };
// }

/**
 * Creates a Stripe checkout session for a course purchase
 */
export async function createCheckoutSession(
  courseId: string, 
  courseTitle: string, 
  coursePrice: number, 
  courseSlug: string,
  courseImageUrl: string,
  courseDescription: string
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
    
    // Check if this is a cart checkout
    const isCartCheckout = courseSlug === 'cart-checkout';
    
    // For cart checkout, fetch all cart items
    let cartItems = [];
    let metadata = {};
    let lineItems = [];

    if (isCartCheckout) {
      // Get all cart items
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          id,
          course_id,
          courses:course_id (
            title,
            price,
            image_url,
            slug
          )
        `)
        .eq('user_id', user.id);
        
      if (cartError) {
        console.error("Error fetching cart items:", cartError);
        return { error: 'Failed to fetch cart items', success: false };
      }

      cartItems = cartData; // Keep inferred type for cartData
      
      // Create line items for each cart item
      // FIXME: Linter incorrectly infers item.courses as an array type from Supabase join. Using any temporarily.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lineItems = cartItems.map((item: any) => { 
        const productData: {
          name: string;
          description: string;
          images?: string[]; // Make images optional
        } = {
          name: item.courses.title,
          description: `Purchase of ${item.courses.title}`,
        };

        // Only add images if the URL exists
        if (item.courses.image_url) {
          productData.images = [item.courses.image_url];
        }
        
        return {
          price_data: {
            currency: 'usd',
            product_data: productData, // Use the constructed productData
            unit_amount: Math.round(item.courses.price * 100), // Convert from dollars to cents
          },
          quantity: 1,
        };
      });
      
      // Store course IDs in metadata for processing after payment
      metadata = {
        userId: user.id,
        isCartCheckout: true,
        // FIXME: Linter incorrectly infers item type from Supabase join. Using any temporarily.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        courseIds: JSON.stringify(cartItems.map((item: any) => item.course_id)),
      };
    } else {
      // Single course checkout
      const productData: {
        name: string;
        description: string;
        images?: string[]; // Make images optional
      } = {
        name: courseTitle,
        description: courseDescription,
      };
      
      // Only add images if the URL exists
      if (courseImageUrl) {
        productData.images = [courseImageUrl];
      }

      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: productData, // Use the constructed productData
            unit_amount: Math.round(coursePrice * 100), // Convert from dollars to cents
          },
          quantity: 1,
        },
      ];
      
      metadata = {
        userId: user.id,
        courseId: courseId,
        courseSlug: courseSlug,
        isCartCheckout: false,
      };
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: lineItems,
      mode: 'payment',
      success_url: isCartCheckout 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/courses?success=true&session_id={CHECKOUT_SESSION_ID}` 
        : `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseSlug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: isCartCheckout
        ? `${process.env.NEXT_PUBLIC_APP_URL}/courses?canceled=true`
        : `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseSlug}?canceled=true`,
      metadata,
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
    const { userId, courseId, isCartCheckout, courseIds } = session.metadata || {};
    
    if (!userId) {
      return { success: false, error: 'Missing user information' };
    }
    
    // Get price paid
    const amountTotal = session.amount_total;
    const pricePaid = amountTotal ? amountTotal / 100 : null; // Convert from cents to dollars
    
    // Create Supabase client
    console.log('[Action] Attempting to create Supabase client for course enrollment...');
    const supabase = await createClient();
    console.log('[Action] Supabase client created successfully for course enrollment.');
    
    if (isCartCheckout === 'true') {
      // Cart checkout - process multiple courses
      const courseIdList = JSON.parse(courseIds || '[]');
      
      if (!courseIdList.length) {
        return { success: false, error: 'No courses to enroll in' };
      }
      
      // Calculate price per course (divide total by number of courses)
      const pricePerCourse = pricePaid ? pricePaid / courseIdList.length : null;
      
      // Insert enrollment records for each course
      const enrollments = [];
      
      for (const courseId of courseIdList) {
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
          console.error(`Error enrolling in course ${courseId}:`, error);
        } else {
          enrollments.push(data);
        }
      }
      
      // Clear the user's cart after successful purchase
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
      
      // Revalidate courses page
      revalidatePath('/courses');
      
      return { success: true, enrollments };
    } else {
      // Single course purchase
      if (!courseId) {
        return { success: false, error: 'Missing course information' };
      }
      
      // Insert enrollment record
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
    }
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