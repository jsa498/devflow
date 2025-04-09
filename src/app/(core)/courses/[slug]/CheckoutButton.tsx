'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/app/api/actions/stripe';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// Initialize Stripe.js with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ''
);

interface CheckoutButtonProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  courseSlug: string;
  courseImageUrl: string;
}

export function CheckoutButton({
  courseId,
  courseTitle,
  coursePrice,
  courseSlug,
  courseImageUrl,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleCheckout = async () => {
    setShowLoginDialog(false);
    
    try {
      setIsLoading(true);

      const result = await createCheckoutSession(
        courseId,
        courseTitle,
        coursePrice,
        courseSlug,
        courseImageUrl
      );

      if (!result.success) {
        if (result.error === 'You must be logged in to purchase a course') {
          setShowLoginDialog(true);
          return;
        }
        
        console.error('Error:', result.error);
        alert(result.error || 'An error occurred while creating the checkout session');
        setIsLoading(false);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
        return;
      }

      if (!result.sessionId) {
        setIsLoading(false);
        throw new Error('No session ID or URL returned from server');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setIsLoading(false);
        throw new Error('Failed to load Stripe.js');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: result.sessionId,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        alert(error.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="w-full text-base py-6"
        size="lg"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Buy Now'}
      </Button>

      <Dialog open={showLoginDialog} onOpenChange={(open) => {
        setShowLoginDialog(open);
        if (!open) {
          setIsLoading(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please log in or create an account to purchase this course. This allows us to save your progress and grant you lifetime access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-start">
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/auth/login?redirect_to=/courses/${courseSlug}`}>Login</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href={`/auth/sign-up?redirect_to=/courses/${courseSlug}`}>Sign Up</Link>
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 