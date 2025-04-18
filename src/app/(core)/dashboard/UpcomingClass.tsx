'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UpcomingOccurrence } from '@/utils/scheduleUtils';
import type { ChildWithEnrollments } from '@/types/enrollment';

interface UpcomingClassProps {
  upcomingClasses: UpcomingOccurrence[];
  enrolledChildren: ChildWithEnrollments[];
}

interface GroupedClassDay {
  date: Date;
  classes: UpcomingOccurrence[];
}

export function UpcomingClass({ upcomingClasses, enrolledChildren }: UpcomingClassProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (enrolledChildren && enrolledChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(enrolledChildren[0].id);
    } else if (!enrolledChildren || enrolledChildren.length === 0) {
       setSelectedChildId(null);
    }
    setCurrentIndex(0);
  }, [enrolledChildren, selectedChildId]);

  const groupedClasses = useMemo(() => {
    const filtered = selectedChildId
      ? upcomingClasses.filter(cls => cls.childId === selectedChildId)
      : [];

    if (filtered.length === 0) {
        return [];
    }

    const groups: Record<string, UpcomingOccurrence[]> = {};
    filtered.forEach(cls => {
      const dayKey = format(startOfDay(cls.date), 'yyyy-MM-dd');
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(cls);
      groups[dayKey].sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    const result: GroupedClassDay[] = Object.values(groups)
      .map((classes) => ({
        date: startOfDay(classes[0].date),
        classes: classes,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;

  }, [upcomingClasses, selectedChildId]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedChildId]);

  const selectedChildName = enrolledChildren.find(c => c.id === selectedChildId)?.name;

  if (!enrolledChildren || enrolledChildren.length === 0) {
    return (
      <Card className="flex items-center justify-center h-full bg-muted/30">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>No program enrollments found.</p> 
        </CardContent>
      </Card>
    );
  }

  const currentDayData = groupedClasses[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => Math.min(groupedClasses.length - 1, prevIndex + 1));
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming Class
        </CardTitle>
        <CardDescription>
          {selectedChildName ? `Next scheduled class for ${selectedChildName}.` : 'Your next scheduled class sessions.'}
        </CardDescription>
      </CardHeader>

      {enrolledChildren.length > 1 && (
        <div className="px-6 pb-4">
          <Tabs 
            value={selectedChildId ?? ''} 
            onValueChange={(value) => setSelectedChildId(value)} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              {enrolledChildren.map(child => (
                <TabsTrigger key={child.id} value={child.id}>{child.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <CardContent className="flex-grow flex flex-col justify-between">
        {groupedClasses.length > 0 && currentDayData ? (
          <> 
            <div className="mb-4 space-y-3 text-center flex-grow flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold text-primary">
                {format(currentDayData.date, 'eeee, MMM d')}
              </p>
              <div className="space-y-2 mt-2">
                  {currentDayData.classes.map((classItem) => (
                    <div key={classItem.slot + classItem.date.toISOString()} className="text-center">
                      <p className="text-lg">
                        {format(classItem.date, 'h:mm a')}
                      </p>
                      <p className="text-md font-medium text-muted-foreground">{classItem.description}</p>
                    </div>
                  ))}
              </div>
            </div>

            {groupedClasses.length > 1 && (
              <div className="flex justify-between items-center mt-auto pt-4 border-t">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  aria-label="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Day {currentIndex + 1} of {groupedClasses.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentIndex === groupedClasses.length - 1}
                  aria-label="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground flex-grow flex items-center justify-center">
            <p>No upcoming classes scheduled for {selectedChildName || 'this child'}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 