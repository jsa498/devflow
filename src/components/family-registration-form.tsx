import React, { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Plus, Minus, Loader2, User, Calendar, BookOpen } from 'lucide-react';
import { addChildren, enrollChildrenInClasses, type ClassEnrollment, type SelectedSlot } from '@/app/api/actions/programs';

// Define the form schema
const formSchema = z.object({
  parentInfo: z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  }),
  children: z.array(
    z.object({
      name: z.string().min(2, { message: "Name must be at least 2 characters." }),
      age: z.coerce.number().min(3, { message: "Age must be at least 3 years." }).max(18, { message: "Age must not exceed 18 years." }),
      classes: z.array(
        z.object({
          classType: z.enum(["punjabi", "math", "coding"]),
          classLevel: z.string(),
          timeSlot: z.string(),
        })
      ).optional(),
    })
  ).min(1, { message: "At least one child is required." }),
});

type FormValues = z.infer<typeof formSchema>;

const classOptions = [
  // Punjabi Classes (Sunday)
  { 
    type: "punjabi", 
    label: "Punjabi/Gurmukhi", 
    levels: [
      { level: "beginner", timeSlot: "sunday_beginner", displayTime: "Sundays 10:00 AM - 11:30 AM (Beginner)" },
      { level: "advanced", timeSlot: "sunday_advanced", displayTime: "Sundays 11:30 AM - 1:00 PM (Mid/Advanced)" },
    ]
  },
  // Math Classes (Saturday)
  { 
    type: "math", 
    label: "Math", 
    levels: [
      { level: "grade1-5", timeSlot: "saturday_math_grade1_5", displayTime: "Saturdays 11:00 AM - 12:00 PM (Grade 1-5)" },
      { level: "grade6-8", timeSlot: "saturday_math_grade6_8", displayTime: "Saturdays 12:30 PM - 1:30 PM (Grade 6-8)" },
      { level: "grade9+", timeSlot: "saturday_math_grade9_plus", displayTime: "Saturdays 2:00 PM - 3:00 PM (Grade 9+)" },
    ]
  },
  // Coding Classes (Saturday)
  { 
    type: "coding", 
    label: "Coding", 
    levels: [
      { level: "beginner", timeSlot: "saturday_coding_beginner", displayTime: "Saturdays 4:00 PM - 5:00 PM (Beginner)" },
      { level: "advanced", timeSlot: "saturday_coding_advanced", displayTime: "Saturdays 6:00 PM - 7:00 PM (Mid/Advanced)" },
    ]
  },
];

interface FamilyRegistrationFormProps {
  onComplete: (childCount: number, extraClassCount: number, parentInfo: { name: string, phone: string }) => void;
}

export function FamilyRegistrationForm({ onComplete }: FamilyRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classSelections, setClassSelections] = useState<Record<number, Record<string, boolean>>>({});
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentInfo: {
        name: "",
        phone: "",
      },
      children: [
        {
          name: "",
          age: undefined as unknown as number,
          classes: [],
        },
      ],
    },
  });

  // Set up field array for children
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children",
  });

  // Handle class selection checkboxes
  const handleClassSelection = (childIndex: number, classType: string, classLevel: string, timeSlot: string, checked: boolean) => {
    // Create a deep copy of the current selections
    const newSelections = JSON.parse(JSON.stringify(classSelections));
    
    // Initialize child's selections if not already present
    if (!newSelections[childIndex]) {
      newSelections[childIndex] = {};
    }
    
    // Create a unique key for this class
    const classKey = `${classType}-${classLevel}-${timeSlot}`;
    
    // Update the selection state
    newSelections[childIndex][classKey] = checked;
    
    setClassSelections(newSelections);
    
    // Update the form values for the children classes
    const currentChildren = form.getValues("children");
    const currentChild = currentChildren[childIndex];
    
    if (!currentChild.classes) {
      currentChild.classes = [];
    }
    
    if (checked) {
      // Add class to the child's class list if not already there
      if (!currentChild.classes.some(c => c.classType === classType && c.classLevel === classLevel && c.timeSlot === timeSlot)) {
        currentChild.classes.push({
          classType: classType as "punjabi" | "math" | "coding",
          classLevel,
          timeSlot,
        });
      }
    } else {
      // Remove class from the child's class list
      currentChild.classes = currentChild.classes.filter(
        c => !(c.classType === classType && c.classLevel === classLevel && c.timeSlot === timeSlot)
      );
    }
    
    // Update the form
    const newChildren = [...currentChildren];
    form.setValue("children", newChildren);
  };

  // Check if a class is selected
  const isClassSelected = (childIndex: number, classType: string, classLevel: string, timeSlot: string) => {
    const classKey = `${classType}-${classLevel}-${timeSlot}`;
    return classSelections[childIndex]?.[classKey] || false;
  };

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Calculate the number of children and extra classes
      const childCount = data.children.length;
      
      // Count classes per child and total extra classes
      let extraClassCount = 0;
      data.children.forEach(child => {
        const childClassCount = child.classes?.length || 0;
        if (childClassCount > 3) {
          extraClassCount += childClassCount - 3;
        }
      });
      
      // Add children to database
      const addChildrenResult = await addChildren(data.children);
      
      // Check for success and data presence before proceeding
      if (!addChildrenResult.success || !addChildrenResult.data) {
        throw new Error(addChildrenResult.error || "Failed to register children or retrieve their data.");
      }
      
      // Store the validated child data
      const registeredChildren = addChildrenResult.data; // Now registeredChildren is DbChild[]
            
      // Prepare enrollments from selected classes (Now safe to access addChildrenResult.data)
      const enrollments: ClassEnrollment[] = [];
      
      // Map through children and their classes
      data.children.forEach((child, childIndex) => {
        // Use the validated data variable here
        const childId = registeredChildren[childIndex].id; // Use registeredChildren instead of addChildrenResult.data
        
        if (child.classes && child.classes.length > 0) {
          child.classes.forEach(cls => {
            enrollments.push({
              childId,
              classType: cls.classType,
              classLevel: cls.classLevel,
              timeSlot: cls.timeSlot as SelectedSlot,
            });
          });
        }
      });
      
      // Save enrollments if there are any
      if (enrollments.length > 0) {
        const enrollResult = await enrollChildrenInClasses(enrollments);
        
        if (!enrollResult.success) {
          throw new Error(enrollResult.error || "Failed to enroll in classes");
        }
      }
      
      // Call the onComplete function with the counts and parent info
      onComplete(childCount, extraClassCount, {
        name: data.parentInfo.name,
        phone: data.parentInfo.phone
      });
      
    } catch (error: unknown) {
      console.error("Error submitting family registration:", error);
      setError((error instanceof Error ? error.message : null) || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Parent Information Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Parent Information</CardTitle>
              </div>
              <CardDescription>Please provide your contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentInfo.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentInfo.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Children Registration Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Children Registration</CardTitle>
              </div>
              <CardDescription>
                Add your children who will be attending classes. The subscription includes up to 2 children.
              </CardDescription>
              <FormDescription className="text-xs text-muted-foreground">
                Note: Additional fee of $20/month per child beyond 2 children will be applied.
              </FormDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add Child Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      append({ name: "", age: undefined as unknown as number });
                    }}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Child
                  </Button>
                </div>
                
                {/* Tab Navigation for Children */}
                <Tabs 
                  defaultValue={`child-0`}
                  value={`child-${activeChildIndex}`}
                  onValueChange={(value) => {
                    const index = parseInt(value.split('-')[1]);
                    setActiveChildIndex(index);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid grid-flow-col auto-cols-fr">
                    {fields.map((field, index) => (
                      <TabsTrigger key={field.id} value={`child-${index}`} className="text-center">
                        Child {index + 1}
                        {fields.length > 1 && index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-2 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(index);
                              if (activeChildIndex >= index && activeChildIndex > 0) {
                                setActiveChildIndex(activeChildIndex - 1);
                              }
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {fields.map((field, index) => (
                    <TabsContent key={field.id} value={`child-${index}`} className="space-y-6 pt-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Child {index + 1} Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <FormField
                            control={form.control}
                            name={`children.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Child's full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`children.${index}.age`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                  <Input placeholder="Age" type="number" min={3} max={18} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* Class Selection */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                            <h4 className="font-medium">Select Classes</h4>
                          </div>
                          
                          <FormDescription className="mb-4">
                            Each child can enroll in up to 3 classes with the base subscription.
                            {form.getValues().children[index]?.classes && form.getValues().children[index].classes!.length > 3 && (
                              <p className="text-amber-600 mt-1">
                                Note: Additional fee of $50/month per class beyond 3 classes will be applied.
                              </p>
                            )}
                          </FormDescription>
                          
                          <div className="space-y-4">
                            {classOptions.map((classOption) => (
                              <div key={classOption.type} className="border rounded-lg p-3">
                                <h5 className="font-medium mb-2">{classOption.label} Classes</h5>
                                <div className="space-y-2">
                                  {classOption.levels.map((level) => (
                                    <div key={level.timeSlot} className="flex items-start space-x-2">
                                      <Checkbox 
                                        id={`${index}-${classOption.type}-${level.level}`}
                                        checked={isClassSelected(index, classOption.type, level.level, level.timeSlot)}
                                        onCheckedChange={(checked) => 
                                          handleClassSelection(
                                            index, 
                                            classOption.type, 
                                            level.level, 
                                            level.timeSlot, 
                                            !!checked
                                          )
                                        }
                                      />
                                      <label 
                                        htmlFor={`${index}-${classOption.type}-${level.level}`}
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {level.displayTime}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </CardContent>
          </Card>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Checkout"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
} 