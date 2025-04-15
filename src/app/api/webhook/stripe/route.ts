import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { recordCoursePurchase } from '../../actions/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  let event: Stripe.Event;
  let bodyText: string;

  try {
    // 1. Read the raw text body
    bodyText = await req.text();

    // 2. Get the signature from headers using next/headers
    const signature = (await headers()).get('stripe-signature');

    // 3. Get the webhook secret from environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // 4. Verify signature and secret
    if (!signature || !webhookSecret) {
      console.warn('Webhook signature or secret missing');
      return NextResponse.json(
        { message: 'Webhook signature or secret missing' },
        { status: 400 }
      );
    }

    // Add logging to verify the secret being used
    console.log('Using Webhook Secret (first 5 chars):', webhookSecret.substring(0, 5));
    console.log('Received Signature (first 5 chars):', signature.substring(0, 5));

    // 5. Construct the event using the raw text body
    event = stripe.webhooks.constructEvent(
      bodyText, // Use the text body read via req.text()
      signature,
      webhookSecret
    );

    console.log('✅ Success constructing event:', event.id);

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error(`❌ Webhook signature verification failed: ${errorMessage}`);
    // Log the raw body received *only* if verification fails for debugging
    // Avoid logging sensitive payload data in production if possible
    // console.error('Raw body received:', bodyText);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // --- Event Handling (Your existing logic) ---
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      // Check if it's a program enrollment completion
      if (metadata?.programEnrollmentId && session.subscription) {
        const programEnrollmentId = metadata.programEnrollmentId;
        const subscriptionId = session.subscription as string;
        const userId = metadata.userId;

        if (!userId) {
            console.error(`Webhook Error: Missing userId in metadata for program enrollment ${programEnrollmentId}`);
            return NextResponse.json({ received: true, warning: 'Missing user ID in metadata' }, { status: 200 });
        }

        console.log(`Processing program enrollment completion for ID: ${programEnrollmentId}, Subscription ID: ${subscriptionId}`);
        try {
          const supabase = await createClient();
          const { error: updateError } = await supabase
            .from('program_enrollments')
            .update({
              status: 'active',
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', programEnrollmentId)
            .eq('user_id', userId);

          if (updateError) {
            console.error(`Webhook Error: Failed to update program enrollment ${programEnrollmentId}:`, updateError);
            return NextResponse.json({ received: true, warning: 'Failed to update enrollment record' }, { status: 200 });
          }
          console.log(`Program enrollment ${programEnrollmentId} activated successfully.`);
          // Return success using NextResponse.json
          return NextResponse.json({ received: true }, { status: 200 });

        } catch (dbError: unknown) {
          const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
          console.error(`Webhook Error: Database error during program enrollment update for ${programEnrollmentId}:`, dbErrorMessage);
          return NextResponse.json({ received: true, error: 'Database processing error' }, { status: 200 });
        }

      } else if (metadata?.isCartCheckout === 'true' || metadata?.courseId) {
        // ... (Keep your course purchase logic exactly as it was) ...
        console.log(`Processing course purchase completion for Session ID: ${session.id}`);
        try {
          const result = await recordCoursePurchase(session.id);
          if (!result.success) {
            console.error('Webhook Warning: Failed to record course purchase:', result.error);
            return NextResponse.json({ received: true, warning: result.error }, { status: 200 });
          }
           // Return success using NextResponse.json
          return NextResponse.json({ received: true }, { status: 200 });
        } catch (courseError: unknown) {
          const courseErrorMessage = courseError instanceof Error ? courseError.message : 'Unknown error processing course purchase';
          console.error('Webhook Error: Error handling course checkout session:', courseErrorMessage);
          return NextResponse.json({ received: true, error: courseErrorMessage }, { status: 200 });
        }
      } else {
        console.warn(`Webhook Warning: Received checkout.session.completed for session ${session.id} with unrecognized metadata:`, metadata);
        return NextResponse.json({ received: true, warning: 'Unrecognized checkout session type' }, { status: 200 });
      }
    }
    // TODO: Handle other relevant subscription events

    // Return 200 OK for unhandled events
    console.log(`Webhook Received: Unhandled event type ${event.type}`);
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (handlerError: unknown) {
    const handlerErrorMessage = handlerError instanceof Error ? handlerError.message : 'Unknown event handler error';
    console.error(`Webhook Error: Failed to process event ${event.id}: ${handlerErrorMessage}`);
    // Return 500 for internal processing errors, but still 200 to Stripe if verification passed
    return NextResponse.json({ message: 'Webhook handler failed', error: handlerErrorMessage }, { status: 500 });
  }
} 