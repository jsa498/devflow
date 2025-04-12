'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
// Removed Brain, Briefcase, Code, GraduationCap, Network, Users icons
import { Check } from 'lucide-react'; 

const MONTHLY_PRICE = 120;
const YEARLY_DISCOUNT = 0.25; // 25% discount
const YEARLY_PRICE_TOTAL = MONTHLY_PRICE * 12 * (1 - YEARLY_DISCOUNT);
const YEARLY_PRICE_PER_MONTH = YEARLY_PRICE_TOTAL / 12;

export default function ProgramsPage() {
  const [planType, setPlanType] = useState('monthly');
  const isYearly = planType === 'yearly';

  const handleEnrollClick = () => {
    // TODO: Implement calendar scheduling logic
    console.log('Enroll Now clicked. Plan selected:', planType);
    // For now, just log. Later, this will trigger the calendar view/modal.
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

        {/* Monthly/Yearly ToggleGroup - Replaced with Build Page Style */}
        <div className="flex justify-center mb-8">
          <ToggleGroup
            type="single"
            defaultValue="monthly"
            value={planType}
            onValueChange={(value) => {
              if (value) setPlanType(value);
            }}
            className="inline-flex rounded-lg border bg-background p-1 min-w-[260px]" // Style from build page
            aria-label="Select billing period"
          >
            <ToggleGroupItem
              value="monthly"
              aria-label="Select Monthly Billing"
              className="flex-1 px-3 py-2 data-[state=on]:bg-muted" // Style from build page
            >
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem
              value="yearly"
              aria-label="Select Yearly Billing"
              className="flex-1 px-3 py-2 data-[state=on]:bg-muted" // Style from build page
            >
              Yearly <span className="text-xs font-normal text-muted-foreground">(Save {YEARLY_DISCOUNT * 100}%)</span> {/* Inline save text */}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Pricing Card - uses isYearly derived state */}
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
            <Button className="w-full" size="lg" onClick={handleEnrollClick}>
              Enroll Now
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* TODO: Add Calendar Modal/Section triggered by Enroll Now */}
      {/* This section will initially be hidden and shown after clicking Enroll Now */}
      {/* It will contain:
          1. Selection for Beginner/Advanced time slot
          2. Confirmation step showing Sundays on a Calendar
          3. Button to proceed to checkout (placeholder for now)
      */}

    </div>
  );
} 