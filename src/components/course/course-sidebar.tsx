import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
}

export function CourseSidebar({ modules, courseSlug, className }: CourseSidebarProps) {
  return (
    <div className={className}>
      {modules.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {modules.map((module) => (
            <AccordionItem value={`module-${module.id}`} key={module.id}>
              <AccordionTrigger className="text-base font-medium hover:no-underline">
                {/* Removed "Module {module.order}:" to simplify */}
                {module.title}
              </AccordionTrigger>
              <AccordionContent>
                {module.lessons && module.lessons.length > 0 ? (
                  <ul className="space-y-1 pt-1">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        {/* TODO: Update Link href when lesson slug is available - Now updated */}
                        <Link
                          href={`/learn/${courseSlug}/lessons/${lesson.id}`} // Updated href
                          className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          // Add active state styling later based on current lesson
                        >
                          {lesson.title}
                        </Link>
                      </li>
                    ))}
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