import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Zap, Bot, UserCheck } from "lucide-react"; // Assuming these icons are suitable

const plans = [
  {
    title: "Basic Plan",
    description: "Perfect for beginners who need occasional guidance",
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
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background text-foreground px-4">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          One-on-One Coaching to Build Anything
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Get personalized guidance from industry experts to build anything you want. Whether it's designing a website, creating an app, or building with AI - we'll help you bring your ideas to life. Choose a plan that fits your needs and start building today.
        </p>
        <div className="flex justify-center items-center gap-6 text-muted-foreground text-sm md:text-base">
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Front & Back-end Development</span>
            <span className="flex items-center gap-2"><Bot className="w-4 h-4" /> AI Integration</span>
            <span className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> Personalized Support</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => (
          <Card key={plan.title} className={`flex flex-col ${plan.popular ? 'border-primary border-2 relative shadow-lg' : ''}`}>
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
                <span className="text-4xl font-bold">${plan.price.toFixed(2)}</span>
                <span className="text-muted-foreground">/month</span>
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
              <Button className="w-full" variant={plan.buttonVariant as any}> {/* Using 'as any' for variant type safety if needed, adjust if Button variant type is strictly defined */}
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
