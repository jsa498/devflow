import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { recordCoursePurchase } from '../../actions/stripe';

// This is your Stripe webhook endpoint
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  // Validate that this is a legitimate Stripe webhook
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Webhook signature verification failed', { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    // Type guard to safely access the message property
    const errorMessage = err && typeof err === 'object' && 'message' in err 
      ? err.message as string
      : 'Unknown webhook error';
      
    console.error(`Webhook Error: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Handle specific webhook events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Process the successful payment by recording the course enrollment
    try {
      const result = await recordCoursePurchase(session.id);
      if (!result.success) {
        console.error('Failed to record purchase:', result.error);
        // We still return 200 to Stripe so they don't retry,
        // but this error should be logged and investigated
        return new NextResponse(JSON.stringify({ received: true, warning: result.error }), { status: 200 });
      }
      
      return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
    } catch (error: unknown) {
      // Type guard to safely access the message property
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? error.message as string
        : 'Unknown error processing checkout session';
        
      console.error('Error handling checkout session:', error);
      // Still return 200 to acknowledge receipt
      return new NextResponse(JSON.stringify({ received: true, error: errorMessage }), { status: 200 });
    }
  }

  // Return 200 for other event types
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
} 