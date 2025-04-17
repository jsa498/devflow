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
} from "@/components/ui/dialog";
import { createProgramCheckoutSession } from '@/app/api/actions/programs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from '@/lib/supabase/client';
import { FamilyRegistrationForm } from '@/components/family-registration-form';
import { type FormValues as FamilyRegistrationFormValues } from '@/components/family-registration-form'; // Import the type

// Define types for clarity
type BillingCycle = 'monthly' | 'yearly';
type SelectedSlot = 
  'sunday_beginner' | 'sunday_advanced' | // Punjabi classes
  'saturday_math_grade1_5' | 'saturday_math_grade6_8' | 'saturday_math_grade9_plus' | // Math classes
  'saturday_coding_beginner' | 'saturday_coding_advanced'; // Coding classes

type EnrollmentStatus = 'active' | 'pending_payment' | 'not_enrolled' | 'unknown' | 'error';

const MONTHLY_PRICE = 120;
const YEARLY_DISCOUNT = 0.25; // 25% discount
const YEARLY_PRICE_TOTAL = MONTHLY_PRICE * 12 * (1 - YEARLY_DISCOUNT);
const YEARLY_PRICE_PER_MONTH = YEARLY_PRICE_TOTAL / 12;

export default function ProgramsPage() {
  const [planType, setPlanType] = useState<BillingCycle>('monthly');
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('unknown');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // New state for registration - replaced counts with full form data
  // const [childCount, setChildCount] = useState(0);
  // const [extraClassCount, setExtraClassCount] = useState(0);
  // const [parentInfo, setParentInfo] = useState<{ name: string, phone: string } | null>(null);
  const [registrationData, setRegistrationData] = useState<FamilyRegistrationFormValues | null>(null);
  const [registrationStep, setRegistrationStep] = useState<'family' | 'checkout'>('family');

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
    setErrorMessage(null);
    setRegistrationStep('family');
    setIsRegistrationDialogOpen(true);
    setRegistrationData(null); // Reset data when opening dialog
  };

  const handleFamilyRegistrationComplete = (formData: FamilyRegistrationFormValues) => {
    // setChildCount(childrenCount);
    // setExtraClassCount(classesCount);
    // setParentInfo(parentData);
    setRegistrationData(formData);
    setRegistrationStep('checkout');
  };

  const handleProceedToCheckout = () => {
    setErrorMessage(null);

    // Ensure registrationData exists before proceeding
    if (!registrationData) {
      setErrorMessage("Missing registration details. Please complete the form again.");
      setRegistrationStep('family'); // Go back to form step
      return;
    }

    startTransition(async () => {
      // For family subscriptions, use a generic slot for tracking - this might need review later
      // If specific classes matter for the *program* itself, this might need adjustment.
      // But for now, keeping it as is.
      const selectedSlot: SelectedSlot = 'sunday_beginner';

      const result = await createProgramCheckoutSession(
        'Learn & Lead', // Program Name
        selectedSlot,
        planType,
        // Pass detailed child data instead of counts
        // childCount,
        // extraClassCount,
        registrationData.children, // Pass the children array
        registrationData.parentInfo // Pass parent info object
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
          Gain practical skills through expert mentorship, access real-world internship opportunities, qualify for scholarships, and engage with our Math, Coding, and Punjabi classes. One subscription covers the whole family.
        </p>
      </section>

      {/*. Pricing & Enrollment Section */}
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
                'Access to all current classes (Math, Coding, and Punjabi)',
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

      {/* Registration Dialog - Modified to handle multi-step registration */}
      <Dialog open={isRegistrationDialogOpen && enrollmentStatus !== 'active'} onOpenChange={setIsRegistrationDialogOpen}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto p-6 ${registrationStep === 'family' ? "sm:max-w-5xl" : "sm:max-w-md"}`}>
          <DialogHeader className="p-6">
            <DialogTitle>
              {registrationStep === 'family'
                ? 'Family Registration'
                : 'Confirm & Checkout'}
            </DialogTitle>
            <DialogDescription>
              {registrationStep === 'family'
                ? 'Please provide your information and add details for each child enrolling.'
                : `Review your ${planType} subscription details below for the Learn & Lead program.`}
            </DialogDescription>
          </DialogHeader>
          
          {registrationStep === 'family' && (
            <FamilyRegistrationForm onComplete={handleFamilyRegistrationComplete} />
          )}

          {registrationStep === 'checkout' && registrationData && (
            <div className="p-6 pt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Summary</CardTitle>
                  <CardDescription>You are enrolling in the Learn & Lead program.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p><strong>Billing Cycle:</strong> {planType === 'monthly' ? 'Monthly' : 'Yearly'}</p>
                    {/* Display calculated price based on planType */}
                    <p><strong>Base Price:</strong> ${isYearly ? YEARLY_PRICE_PER_MONTH.toFixed(0) : MONTHLY_PRICE}/month</p>
                    {/* TODO: Display additional fees if needed based on registrationData */} 
                  </div>
                  <div>
                    <p><strong>Parent:</strong> {registrationData.parentInfo.name} ({registrationData.parentInfo.phone})</p>
                    <p><strong>Children Enrolling:</strong></p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {/* Explicitly type the parameters based on FormValues['children'][number] */}
                      {registrationData.children.map((child: FamilyRegistrationFormValues['children'][number], index: number) => (
                        <li key={index}>{child.name} (Age: {child.age})</li>
                      ))}
                    </ul>
                    {/* TODO: Optionally display selected classes */} 
                  </div>
                  {errorMessage && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegistrationStep('family')}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={handleProceedToCheckout} 
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isPending ? 'Processing...' : 'Proceed to Checkout'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 