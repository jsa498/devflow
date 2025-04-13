'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
// Removed Brain, Briefcase, Code, GraduationCap, Network, Users icons
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { createProgramCheckoutSession } from '@/app/api/actions/programs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from '@/lib/supabase/client';

// Define types for clarity
type BillingCycle = 'monthly' | 'yearly';
type SelectedSlot = 'sunday_beginner' | 'sunday_advanced';
type EnrollmentStatus = 'active' | 'pending_payment' | 'not_enrolled' | 'unknown' | 'error';

const MONTHLY_PRICE = 120;
const YEARLY_DISCOUNT = 0.25; // 25% discount
const YEARLY_PRICE_TOTAL = MONTHLY_PRICE * 12 * (1 - YEARLY_DISCOUNT);
const YEARLY_PRICE_PER_MONTH = YEARLY_PRICE_TOTAL / 12;

export default function ProgramsPage() {
  const [planType, setPlanType] = useState<BillingCycle>('monthly');
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('unknown');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isPending, startTransition] = useTransition();

  const isYearly = planType === 'yearly';

  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        const supabase = createClient(); 
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('program_enrollments')
            .select('status')
            .eq('user_id', user.id)
            .eq('program_name', 'Learn & Lead')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error("Error fetching enrollment status:", error);
            setEnrollmentStatus('error');
          } else if (data) {
            setEnrollmentStatus(data.status as EnrollmentStatus);
          } else {
            setEnrollmentStatus('not_enrolled');
          }
        } else {
          setEnrollmentStatus('not_enrolled');
        }
      } catch (err) {
        console.error("Unexpected error fetching enrollment status:", err);
        setEnrollmentStatus('error');
      }
      setIsCheckingStatus(false);
    };

    checkStatus();
  }, []);

  const handleEnrollClick = () => {
    // Reset error message and selected slot when opening dialog
    setErrorMessage(null);
    setSelectedSlot(null);
    setIsSchedulingDialogOpen(true);
    // console.log('Enroll Now clicked. Plan selected:', planType);
    // // For now, just log. Later, this will trigger the calendar view/modal.
  };

  const handleProceedToCheckout = () => {
    if (!selectedSlot) {
      setErrorMessage('Please select a class time slot.');
      return;
    }
    setErrorMessage(null); // Clear previous errors

    startTransition(async () => {
      const result = await createProgramCheckoutSession(
        'Learn & Lead', // Program Name
        selectedSlot, 
        planType
      );

      if (!result.success || !result.url) {
        setErrorMessage(result.error || 'An unknown error occurred. Please try again.');
      } else {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
      {/* A. Hero Section - Updated Text */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
          Learn, Grow, and Lead with DevFlow Programs
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Gain practical skills through expert mentorship, access real-world internship opportunities, qualify for scholarships, and start with engaging Punjabi classes. One subscription covers the whole family.
        </p>
      </section>

      {/* B. The DevFlow Advantage Section - REMOVED */}
      {/* C. Our Approach / Curriculum Section - REMOVED */}
      {/* D. Opportunities Spotlight Section - REMOVED */}

      {/* E. Pricing & Enrollment Section */}
      <section className="text-center">
        <h2 className="text-3xl font-semibold mb-6">
          Join the Learn & Lead Program
        </h2>

        {/* Monthly/Yearly ToggleGroup */}
        <div className="flex justify-center mb-8">
          <ToggleGroup
            type="single"
            defaultValue="monthly"
            value={planType}
            onValueChange={(value: BillingCycle) => {
              if (value) setPlanType(value);
            }}
            className="inline-flex rounded-lg border bg-background p-1 min-w-[260px]"
            aria-label="Select billing period"
            disabled={isPending}
          >
            <ToggleGroupItem
              value="monthly"
              aria-label="Select Monthly Billing"
              className="flex-1 px-3 py-2 data-[state=on]:bg-muted"
            >
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem
              value="yearly"
              aria-label="Select Yearly Billing"
              className="flex-1 px-3 py-2 data-[state=on]:bg-muted"
            >
              Yearly <span className="text-xs font-normal text-muted-foreground">(Save {YEARLY_DISCOUNT * 100}%)</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Pricing Card */}
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Learn & Lead Subscription</CardTitle>
            <CardDescription>One subscription for the entire family.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                ${isYearly ? YEARLY_PRICE_PER_MONTH.toFixed(0) : MONTHLY_PRICE}
              </span>
              <span className="text-muted-foreground">/month</span>
              {isYearly && (
                <p className="text-sm text-muted-foreground">
                  Billed ${YEARLY_PRICE_TOTAL.toFixed(0)} annually
                </p>
              )}
            </div>
            <ul className="space-y-3 text-left text-muted-foreground">
              {[
                'One subscription covers the entire family',
                'Access to all current classes (Starting with Punjabi)',
                'Eligibility for DevFlow Internship Application Pool',
                'Consideration for Scholarship Opportunities',
                'Access to Workshops & Events',
                'Personalized Progress Reports',
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleEnrollClick}
              disabled={isCheckingStatus || enrollmentStatus === 'active' || isPending}
            >
              {isCheckingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : enrollmentStatus === 'active' ? (
                <Check className="mr-2 h-4 w-4" />
              ) : isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isCheckingStatus
                ? 'Checking Status...'
                : enrollmentStatus === 'active'
                ? 'Enrolled'
                : isPending 
                ? 'Processing...'
                : 'Enroll Now'}
            </Button>
          </CardFooter>
        </Card>

        {/* Display error or pending payment info */}
        {enrollmentStatus === 'error' && (
            <Alert variant="destructive" className="mt-4 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not verify enrollment status. Please try refreshing.</AlertDescription>
            </Alert>
        )}
      </section>

      {/* Scheduling Dialog */}
      <Dialog open={isSchedulingDialogOpen && enrollmentStatus !== 'active'} onOpenChange={setIsSchedulingDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Your Class</DialogTitle>
            <DialogDescription>
              Select your preferred time slot for the Sunday classes. Plan: {planType === 'monthly' ? 'Monthly' : 'Yearly'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Slot Selection */}
            <ToggleGroup
              type="single"
              value={selectedSlot ?? ''}
              onValueChange={(value: SelectedSlot) => {
                if (value) setSelectedSlot(value);
              }}
              className="flex flex-col md:flex-row gap-3 w-full" 
              aria-label="Select class time slot"
              disabled={isPending}
            >
              <ToggleGroupItem
                value="sunday_beginner"
                aria-label="Beginner Group: Sundays 10:00 AM - 11:30 AM"
                className="flex-1 flex flex-col items-start p-4 border rounded-lg hover:bg-muted/60 data-[state=on]:border-primary data-[state=on]:bg-muted data-[state=on]:ring-2 data-[state=on]:ring-primary/50 transition-all duration-150 h-auto text-left"
              >
                <span className="font-semibold">Beginner Group</span>
                <span className="text-sm text-muted-foreground">Sundays 10:00 AM - 11:30 AM</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="sunday_advanced"
                aria-label="Mid/Advanced Group: Sundays 11:30 AM - 1:00 PM"
                className="flex-1 flex flex-col items-start p-4 border rounded-lg hover:bg-muted/60 data-[state=on]:border-primary data-[state=on]:bg-muted data-[state=on]:ring-2 data-[state=on]:ring-primary/50 transition-all duration-150 h-auto text-left"
              >
                <span className="font-semibold">Mid/Advanced Group</span>
                <span className="text-sm text-muted-foreground">Sundays 11:30 AM - 1:00 PM</span>
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleProceedToCheckout} 
              disabled={!selectedSlot || isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Processing...' : 'Confirm & Proceed to Checkout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 