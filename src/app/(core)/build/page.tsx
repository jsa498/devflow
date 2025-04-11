"use client";

import { useState } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Zap, Bot, UserCheck } from "lucide-react"; // Assuming these icons are suitable
import { type VariantProps } from 'class-variance-authority'; // Import VariantProps
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Added import

const plans = [
  {
    title: "Basic Plan",
    description: "Ideal for experienced individuals needing periodic expert check-ins.",
    price: 120.00,
    setupFee: 200,
    features: [
      "1 coaching session per month",
      "60-minute sessions",
      "1-on-1 personalized coaching",
      "Email support between sessions",
    ],
    popular: false,
    buttonVariant: "outline",
  },
  {
    title: "Standard Plan",
    description: "Our most popular plan for consistent progress",
    price: 240.00,
    setupFee: 200,
    features: [
      "2 coaching sessions per month",
      "60-minute sessions",
      "1-on-1 personalized coaching",
      "Email support between sessions",
      "Priority scheduling",
    ],
    popular: true,
    buttonVariant: "default",
  },
  {
    title: "Premium Plan",
    description: "Intensive coaching for rapid skill development",
    price: 480.00,
    setupFee: 200,
    features: [
      "4 coaching sessions per month",
      "60-minute sessions",
      "1-on-1 personalized coaching",
      "Email support between sessions",
      "Priority scheduling",
      "Access to exclusive resources",
    ],
    popular: false,
    buttonVariant: "outline",
  },
];

export default function BuildPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly'); // Added state

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background text-foreground px-4">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          One-on-One Coaching to Build Anything
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Get personalized guidance from industry experts to build anything you want. Whether it&apos;s designing a website, creating an app, or building with AI - we&apos;ll help you bring your ideas to life. Choose a plan that fits your needs and start building today.
        </p>
        <div className="flex justify-center items-center gap-6 text-muted-foreground text-sm md:text-base">
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Front & Back-end Development</span>
            <span className="flex items-center gap-2"><Bot className="w-4 h-4" /> AI Integration</span>
            <span className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> Personalized Support</span>
        </div>
      </div>

      {/* Added Toggle Group */}
      <div className="flex justify-center mb-8">
        <ToggleGroup
          type="single"
          defaultValue="monthly"
          value={billingCycle}
          onValueChange={(value) => {
            if (value) setBillingCycle(value as 'monthly' | 'yearly');
          }}
          className="inline-flex rounded-lg border bg-background p-1 min-w-[260px]"
        >
          <ToggleGroupItem value="monthly" aria-label="Select monthly" className="flex-1 px-3 py-2 data-[state=on]:bg-muted">
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" aria-label="Select yearly" className="flex-1 px-3 py-2 data-[state=on]:bg-muted">
            Yearly <span className="text-xs font-normal text-muted-foreground">(Save 20%)</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => (
          <Card key={plan.title} className={`flex flex-col ${plan.popular ? 'border-primary border-2 relative shadow-lg' : ''} hover:shadow-xl hover:scale-[1.02] transition-transform duration-200 ease-in-out`}>
             {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardHeader className="pt-8">
              <CardTitle className="text-2xl font-semibold">{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                {/* Updated Price Display */}
                <span className="text-4xl font-bold">
                  $
                  {billingCycle === 'monthly'
                    ? plan.price.toFixed(2)
                    : (plan.price * 0.8).toFixed(2)}
                </span>
                 {/* Updated Frequency Text */}
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                 /month{billingCycle === 'yearly' ? ' (billed annually)' : ''}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                + ${plan.setupFee} one-time setup fee
              </p>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.buttonVariant as VariantProps<typeof buttonVariants>['variant']}>
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
