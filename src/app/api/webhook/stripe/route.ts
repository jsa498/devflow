import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { recordCoursePurchase } from '../../actions/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// This is your Stripe webhook endpoint
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Validate that this is a legitimate Stripe webhook
  if (!signature || !webhookSecret) {
    console.warn('Webhook signature or secret missing');
    return new NextResponse('Webhook signature or secret missing', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error(`Webhook Error: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Handle specific webhook events
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
          // Still return 200 to Stripe, but log the issue
          return new NextResponse(JSON.stringify({ received: true, warning: 'Missing user ID in metadata' }), { status: 200 });
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
          // Return 200 to Stripe but log the failure
          return new NextResponse(JSON.stringify({ received: true, warning: 'Failed to update enrollment record' }), { status: 200 });
        }

        console.log(`Program enrollment ${programEnrollmentId} activated successfully.`);
        return new NextResponse(JSON.stringify({ received: true }), { status: 200 });

      } catch (dbError: unknown) {
        const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        console.error(`Webhook Error: Database error during program enrollment update for ${programEnrollmentId}:`, dbErrorMessage);
        // Return 200 to Stripe but log the failure
        return new NextResponse(JSON.stringify({ received: true, error: 'Database processing error' }), { status: 200 });
      }

    } else if (metadata?.courseId) {
      // Fallback to existing course purchase logic
      console.log(`Processing course purchase completion for Session ID: ${session.id}`);
      try {
        const result = await recordCoursePurchase(session.id);
        if (!result.success) {
          console.error('Webhook Warning: Failed to record course purchase:', result.error);
          return new NextResponse(JSON.stringify({ received: true, warning: result.error }), { status: 200 });
        }
        return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
      } catch (courseError: unknown) {
        const courseErrorMessage = courseError instanceof Error ? courseError.message : 'Unknown error processing course purchase';
        console.error('Webhook Error: Error handling course checkout session:', courseErrorMessage);
        return new NextResponse(JSON.stringify({ received: true, error: courseErrorMessage }), { status: 200 });
      }
    } else {
      // Session completed, but metadata doesn't match expected patterns
      console.warn(`Webhook Warning: Received checkout.session.completed for session ${session.id} with unrecognized metadata:`, metadata);
      return new NextResponse(JSON.stringify({ received: true, warning: 'Unrecognized checkout session type' }), { status: 200 });
    }
  }
  // TODO: Handle other relevant subscription events like:
  // - invoice.payment_failed: Update status to 'payment_failed' or similar
  // - customer.subscription.updated: Handle plan changes if needed
  // - customer.subscription.deleted: Update status to 'canceled'

  // Return 200 for other event types we don't handle explicitly
  console.log(`Webhook Received: Unhandled event type ${event.type}`);
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
} 