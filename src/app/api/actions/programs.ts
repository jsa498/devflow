'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

type BillingCycle = 'monthly' | 'yearly';
type SelectedSlot = 'sunday_beginner' | 'sunday_advanced'; // Define allowed slots

interface ActionResult {
  success: boolean;
  error?: string;
  url?: string | null;
}

export async function createProgramCheckoutSession(
  programName: string,
  selectedSlot: SelectedSlot,
  billingCycle: BillingCycle
): Promise<ActionResult> {
  let user;
  let enrollmentId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !authUser) {
      console.error("Error getting user or user not authenticated:", getUserError);
      return { success: false, error: 'You must be logged in to enroll in a program.' };
    }
    user = authUser;

    // 1. Determine Stripe Price ID based on billing cycle
    const priceId = billingCycle === 'monthly'
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      console.error(`Stripe Price ID for ${billingCycle} plan is not configured.`);
      return { success: false, error: 'Server configuration error. Please contact support.' };
    }

    // 2. Create initial enrollment record in Supabase
    const { data: newEnrollment, error: insertError } = await supabase
      .from('program_enrollments')
      .insert({
        user_id: user.id,
        program_name: programName,
        selected_slot: selectedSlot,
        billing_cycle: billingCycle,
        status: 'pending_payment', // Initial status
      })
      .select('id') // Select the ID of the newly created record
      .single();

    if (insertError) {
      console.error('Error creating program enrollment record:', insertError);
      // Consider checking for specific errors like duplicate enrollment if needed
      return { success: false, error: 'Failed to initiate enrollment. Please try again.' };
    }

    if (!newEnrollment || !newEnrollment.id) {
        console.error('Failed to retrieve ID for new program enrollment record');
        return { success: false, error: 'Failed to initiate enrollment process. Please try again.'};
    }
    enrollmentId = newEnrollment.id;

    // 3. Create Stripe Checkout Session for Subscription
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?program_enrollment=success&program_name=${encodeURIComponent(programName)}&slot=${encodeURIComponent(selectedSlot)}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/programs?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Important: Set mode to subscription
      customer_email: user.email, // Pre-fill email
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        programEnrollmentId: enrollmentId, // Include the enrollment ID
      },
      // Optional: Allow promotion codes
      // allow_promotion_codes: true,
    });

    // 4. Update the enrollment record with the Stripe checkout session ID
    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', enrollmentId);

    if (updateError) {
        console.error(`Failed to update enrollment ${enrollmentId} with checkout session ID:`, updateError);
        // Although the session is created, log this error. The webhook should still function.
        // Consider if you need to return an error to the user here or handle differently.
    }


    // 5. Return success with the session URL
    return {
      success: true,
      url: session.url,
    };

  } catch (error: unknown) {
    console.error('Error creating program checkout session:', error);

    // Optional: Attempt to update enrollment status to 'failed' if possible
    if (enrollmentId && user?.id) {
      try {
          const supabase = await createClient();
          await supabase
              .from('program_enrollments')
              .update({ status: 'creation_failed' }) // Use a specific status
              .eq('id', enrollmentId)
              .eq('user_id', user.id); // Ensure user matches
      } catch (updateErr) {
          console.error(`Failed to update enrollment ${enrollmentId} status after checkout creation error:`, updateErr);
      }
    }


    let errorMessage = 'An unknown error occurred while creating the checkout session';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
} 