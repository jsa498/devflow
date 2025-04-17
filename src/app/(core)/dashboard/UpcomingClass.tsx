'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import type { UpcomingOccurrence } from '@/utils/scheduleUtils'; // Assuming utils file path

interface UpcomingClassProps {
  upcomingClasses: UpcomingOccurrence[];
}

export function UpcomingClass({ upcomingClasses }: UpcomingClassProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!upcomingClasses || upcomingClasses.length === 0) {
    return (
      <Card className="flex items-center justify-center h-full bg-muted/30">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>No upcoming classes found.</p>
        </CardContent>
      </Card>
    );
  }

  const currentClass = upcomingClasses[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => Math.min(upcomingClasses.length - 1, prevIndex + 1));
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming Class
        </CardTitle>
        <CardDescription>Your next scheduled class session.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="mb-4 space-y-2 text-center">
          <p className="text-2xl font-semibold text-primary">
            {format(currentClass.date, 'eeee, MMM d')} 
          </p>
          <p className="text-lg">
            {format(currentClass.date, 'h:mm a')} 
          </p>
          <p className="text-md font-medium">{currentClass.description}</p>
          <p className="text-sm text-muted-foreground">For: {currentClass.childName}</p>
        </div>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevious} 
            disabled={currentIndex === 0}
            aria-label="Previous Class"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {upcomingClasses.length}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNext} 
            disabled={currentIndex === upcomingClasses.length - 1}
            aria-label="Next Class"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 