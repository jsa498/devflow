"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from 'lucide-react';

// Define types matching the ones in the page component
interface Lesson {
  id: string;
  title: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseSidebarProps {
  modules: Module[];
  courseSlug: string;
  // Add className prop to allow passing Tailwind classes for styling
  className?: string;
  currentLessonId?: string;
}

export function CourseSidebar({ modules, courseSlug, className, currentLessonId }: CourseSidebarProps) {
  const pathname = usePathname();
  
  // Find which module(s) should be expanded by default
  const defaultExpandedModules = modules
    .filter(module => 
      module.lessons.some(lesson => lesson.id === currentLessonId)
    )
    .map(module => `module-${module.id}`);

  return (
    <div className={className}>
      {modules.length > 0 ? (
        <Accordion type="multiple" defaultValue={defaultExpandedModules} className="w-full">
          {modules.map((module) => (
            <AccordionItem 
              value={`module-${module.id}`} 
              key={module.id}
              className="border-b border-border/60 last:border-0"
            >
              <AccordionTrigger className="text-base font-medium hover:no-underline py-3 text-left">
                <span className="flex items-start">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded mr-2 text-muted-foreground mt-0.5">
                    Module {module.order}
                  </span>
                  {module.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pl-0">
                {module.lessons && module.lessons.length > 0 ? (
                  <ul className="space-y-1 pb-2">
                    {module.lessons.map((lesson) => {
                      const lessonUrl = `/learn/${courseSlug}/lessons/${lesson.id}`;
                      const isActive = currentLessonId === lesson.id || pathname === lessonUrl;
                      
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={lessonUrl}
                            className={`
                              flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors
                              ${isActive 
                                ? 'bg-primary/10 text-primary font-medium' 
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              }
                            `}
                          >
                            <BookOpen className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/70'}`} />
                            {lesson.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    No lessons in this module yet.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-muted-foreground text-center py-4">
          Course content is coming soon!
        </p>
      )}
    </div>
  );
} 