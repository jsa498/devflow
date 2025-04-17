'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

type BillingCycle = 'monthly' | 'yearly';
// Updated to include new time slots
export type SelectedSlot = 
  'sunday_beginner' | 'sunday_advanced' | // Punjabi classes
  'saturday_math_grade1_5' | 'saturday_math_grade6_8' | 'saturday_math_grade9_plus' | // Math classes
  'saturday_coding_beginner' | 'saturday_coding_advanced'; // Coding classes

// Add parent info type
type ParentInfo = {
  name: string;
  phone: string;
};

// Add types for children and class enrollments
type Child = {
  id?: string;
  name: string;
  age: number;
};

export type ClassEnrollment = {
  childId: string;
  classType: 'punjabi' | 'math' | 'coding';
  classLevel: string;
  timeSlot: SelectedSlot;
};

// Define types based on database schema
type DbChild = {
  id: string; // uuid translates to string in TS
  user_id: string;
  name: string;
  age: number; // int4 translates to number
  created_at: string; // timestamptz translates to string
  updated_at: string;
};

type DbEnrollment = {
  id: string; // uuid
  child_id: string; // uuid
  class_type: string; // text - or use 'punjabi' | 'math' | 'coding' if validated elsewhere
  class_level: string; // text
  time_slot: string; // text - or use SelectedSlot if validated elsewhere
  created_at: string; // timestamptz
  updated_at: string;
};

// Type for combining child data with their enrollments
type ChildWithEnrollments = DbChild & {
  enrollments: DbEnrollment[];
};

// Type for the input data from the form
type ChildWithPotentialClasses = {
  name: string;
  age: number;
  classes?: Array<{
    classType: "punjabi" | "math" | "coding";
    classLevel: string;
    timeSlot: SelectedSlot; // Assuming timeSlot from form aligns with SelectedSlot
  }>;
};

interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  url?: string | null;
  data?: T;
}

// Function to add children to a user's account
export async function addChildren(children: Child[], programEnrollmentId: string | null): Promise<ActionResult<DbChild[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      console.error("Error getting user or user not authenticated:", getUserError);
      return { success: false, error: 'You must be logged in to add children.' };
    }

    // Include program_enrollment_id in the insert data
    const childrenToInsert = children.map(child => ({
      user_id: user.id,
      name: child.name,
      age: child.age,
      program_enrollment_id: programEnrollmentId // Add the ID here
    }));

    const { data, error } = await supabase
      .from('children')
      .insert(childrenToInsert)
      .select();

    if (error) {
      console.error('Error adding children:', error);
      // Add specific error handling if needed, e.g., constraint violation
      if (error.code === '23503') { // Foreign key violation (program_enrollment_id doesn't exist)
          return { success: false, error: 'Invalid program enrollment reference.' };
      }
      return { success: false, error: 'Failed to add children. Please try again.' };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error adding children:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

// Function to get children for a user
export async function getChildren(): Promise<ActionResult<DbChild[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      console.error("Error getting user or user not authenticated:", getUserError);
      return { success: false, error: 'You must be logged in to view children.' };
    }

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching children:', error);
      return { success: false, error: 'Failed to fetch children. Please try again.' };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error fetching children:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

// Function to enroll children in classes
export async function enrollChildrenInClasses(enrollments: ClassEnrollment[]): Promise<ActionResult<DbEnrollment[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      console.error("Error getting user or user not authenticated:", getUserError);
      return { success: false, error: 'You must be logged in to enroll children in classes.' };
    }

    // Verify all children belong to this user
    const childIds = [...new Set(enrollments.map(enrollment => enrollment.childId))];
    
    const { data: userChildren, error: childrenError } = await supabase
      .from('children')
      .select('id')
      .eq('user_id', user.id)
      .in('id', childIds);

    if (childrenError) {
      console.error('Error verifying children:', childrenError);
      return { success: false, error: 'Failed to verify children. Please try again.' };
    }

    const validChildIds = new Set(userChildren.map(child => child.id));
    const invalidEnrollments = enrollments.filter(enrollment => !validChildIds.has(enrollment.childId));

    if (invalidEnrollments.length > 0) {
      return { success: false, error: 'Some children do not belong to this user.' };
    }

    // Insert enrollments
    const enrollmentsToInsert = enrollments.map(enrollment => ({
      child_id: enrollment.childId,
      class_type: enrollment.classType,
      class_level: enrollment.classLevel,
      time_slot: enrollment.timeSlot
    }));

    const { data, error } = await supabase
      .from('child_class_enrollments')
      .insert(enrollmentsToInsert)
      .select();

    if (error) {
      console.error('Error enrolling children in classes:', error);
      return { success: false, error: 'Failed to enroll children in classes. Please try again.' };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error enrolling children in classes:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

// Function to get enrollments for a user's children
export async function getChildEnrollments(): Promise<ActionResult<ChildWithEnrollments[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      console.error("Error getting user or user not authenticated:", getUserError);
      return { success: false, error: 'You must be logged in to view enrollments.' };
    }

    // 1. Check for an active program enrollment for this user
    const { data: activeEnrollment, error: enrollmentError } = await supabase
      .from('program_enrollments')
      .select('id') // Select the ID of the active enrollment
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (enrollmentError && enrollmentError.code !== 'PGRST116') { // PGRST116 is the code for 'Row not found' with maybeSingle
        console.error('Error fetching active program enrollment:', enrollmentError);
        return { success: false, error: 'Failed to check program status. Please try again.' };
    }
    
    // If no active enrollment is found, return empty data
    if (!activeEnrollment) {
        console.log(`No active program enrollment found for user ${user.id}. Returning empty schedule.`);
        return { success: true, data: [] };
    }

    // Store the active enrollment ID
    const activeEnrollmentId = activeEnrollment.id;

    // 2. If active enrollment exists, proceed to get children *linked to this specific enrollment*
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, user_id, name, age, created_at, updated_at') // Explicitly select columns for DbChild type
      .eq('user_id', user.id) // Still filter by user_id for safety/indexing
      .eq('program_enrollment_id', activeEnrollmentId); // Filter by the active enrollment ID

    if (childrenError) {
      console.error('Error fetching children for enrollment:', childrenError);
      return { success: false, error: 'Failed to fetch children for this enrollment. Please try again.' };
    }

    if (!children || children.length === 0) {
      // This case might happen if enrollment is active but children were removed? Or an edge case.
      console.log(`Active enrollment ${activeEnrollmentId} found for user ${user.id}, but no children records linked.`);
      return { success: true, data: [] }; 
    }

    // 3. Get enrollments for the children - select columns matching DbEnrollment
    const childIds = children.map(child => child.id);
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('child_class_enrollments')
      .select('id, child_id, class_type, class_level, time_slot, created_at, updated_at') // Explicitly select columns for DbEnrollment type
      .in('child_id', childIds);

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return { success: false, error: 'Failed to fetch enrollments. Please try again.' };
    }

    // 4. Combine children and enrollments
    const childMap = new Map(children.map(child => [child.id, { ...child, enrollments: [] as DbEnrollment[] }]));
    
    enrollments?.forEach(enrollment => {
      const child = childMap.get(enrollment.child_id);
      if (child) {
        child.enrollments.push(enrollment);
      }
    });

    return { success: true, data: Array.from(childMap.values()) };
  } catch (error: unknown) {
    console.error('Error fetching enrollments:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

// Updated function for checkout to include parent info
export async function createProgramCheckoutSession(
  programName: string,
  selectedSlot: SelectedSlot,
  billingCycle: BillingCycle,
  childrenDetails: ChildWithPotentialClasses[],
  parentInfo?: ParentInfo
): Promise<ActionResult> {
  let user;
  let enrollmentId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !authUser) {
      console.error("Error getting user or user not authenticated:", getUserError);
      return { success: false, error: 'You must be logged in to enroll in a program.' };
    }
    user = authUser;

    // --- Calculate counts and fees based on childrenDetails --- START
    const childCount = childrenDetails.length;
    let extraClassCount = 0;
    childrenDetails.forEach(child => {
      const childClassCount = child.classes?.length || 0;
      const MAX_INCLUDED_CLASSES = 3; // Define constant for clarity
      if (childClassCount > MAX_INCLUDED_CLASSES) {
        extraClassCount += childClassCount - MAX_INCLUDED_CLASSES;
      }
    });

    let additionalChildFee = 0;
    let additionalClassFee = 0;
    const MAX_INCLUDED_CHILDREN = 2; // Define constant

    // $20 per additional child beyond MAX_INCLUDED_CHILDREN
    if (childCount > MAX_INCLUDED_CHILDREN) {
      additionalChildFee = (childCount - MAX_INCLUDED_CHILDREN) * 20;
    }

    // $50 per additional class beyond MAX_INCLUDED_CLASSES per child total
    if (extraClassCount > 0) {
      additionalClassFee = extraClassCount * 50;
    }
    // --- Calculate counts and fees based on childrenDetails --- END

    // 1. Determine Stripe Price ID based on billing cycle
    const priceId = billingCycle === 'monthly'
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      console.error(`Stripe Price ID for ${billingCycle} plan is not configured.`);
      return { success: false, error: 'Server configuration error. Please contact support.' };
    }

    // 2. Create initial enrollment record in Supabase
    const { data: newEnrollment, error: insertError } = await supabase
      .from('program_enrollments')
      .insert({
        user_id: user.id,
        program_name: programName,
        selected_slot: selectedSlot,
        billing_cycle: billingCycle,
        status: 'pending_payment', // Initial status
        parent_name: parentInfo?.name,
        parent_phone: parentInfo?.phone,
        // Use calculated counts here
        additional_child_count: childCount > MAX_INCLUDED_CHILDREN ? childCount - MAX_INCLUDED_CHILDREN : 0,
        additional_class_count: extraClassCount
      })
      .select('id') // Select the ID of the newly created record
      .single();

    if (insertError) {
      console.error('Error creating program enrollment record:', insertError);
      // Consider checking for specific errors like duplicate enrollment if needed
      return { success: false, error: 'Failed to initiate enrollment. Please try again.' };
    }

    if (!newEnrollment || !newEnrollment.id) {
        console.error('Failed to retrieve ID for new program enrollment record');
        return { success: false, error: 'Failed to initiate enrollment process. Please try again.'};
    }
    enrollmentId = newEnrollment.id;

    // --- ADD children and class enrollments to DB --- START
    // Map childrenDetails to the format needed for addChildren (name, age)
    const childrenToAdd: Child[] = childrenDetails.map(cd => ({ name: cd.name, age: cd.age }));

    const addChildrenResult = await addChildren(childrenToAdd, enrollmentId);

    if (!addChildrenResult.success || !addChildrenResult.data) {
      console.error(`Failed to add children for enrollment ${enrollmentId}:`, addChildrenResult.error);
      // Attempt to roll back or mark enrollment as failed? Or just return error?
      // For now, return an error, preventing checkout creation.
      return { success: false, error: `Failed to save child details: ${addChildrenResult.error || 'Unknown error'}` };
    }

    const registeredChildren: DbChild[] = addChildrenResult.data;

    // Prepare class enrollments using the newly created child IDs
    const classEnrollments: ClassEnrollment[] = [];
    childrenDetails.forEach((childDetail, index) => {
      const registeredChild = registeredChildren[index]; // Assumes order is preserved
      if (!registeredChild || !registeredChild.id) {
        console.error(`Could not find registered child data for child at index ${index} for enrollment ${enrollmentId}`);
        // Skip this child's enrollments if ID is missing
        return; 
      }
      childDetail.classes?.forEach(cls => {
        classEnrollments.push({
          childId: registeredChild.id,
          classType: cls.classType,
          classLevel: cls.classLevel,
          timeSlot: cls.timeSlot, // Already ensured it aligns with SelectedSlot type in ChildWithPotentialClasses
        });
      });
    });

    // Save class enrollments if any exist
    if (classEnrollments.length > 0) {
      const enrollResult = await enrollChildrenInClasses(classEnrollments);
      if (!enrollResult.success) {
        console.error(`Failed to enroll children in classes for enrollment ${enrollmentId}:`, enrollResult.error);
        // Decide on error handling: proceed to checkout anyway, or fail?
        // Failing seems safer to ensure data consistency.
        return { success: false, error: `Failed to save class selections: ${enrollResult.error || 'Unknown error'}` };
      }
    }
    // --- ADD children and class enrollments to DB --- END

    // 3. Create Stripe Checkout Session for Subscription
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?program_enrollment=success&checkout_session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/programs?canceled=true`;

    // Create line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: priceId,
        quantity: 1,
      }
    ];
    
    // Add additional fees if needed
    if (additionalChildFee > 0 || additionalClassFee > 0) {
      // For additional children
      if (additionalChildFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Additional Children Fee (${childCount - MAX_INCLUDED_CHILDREN} additional children)`,
              description: `Fee for each additional child beyond the ${MAX_INCLUDED_CHILDREN} included in the subscription`,
            },
            unit_amount: additionalChildFee * 100, // Convert to cents
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        });
      }
      
      // For additional classes
      if (additionalClassFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Additional Classes Fee (${extraClassCount} additional classes)`,
              description: 'Fee for each additional class beyond the 3 included per child',
            },
            unit_amount: additionalClassFee * 100, // Convert to cents
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Important: Set mode to subscription
      customer_email: user.email, // Pre-fill email
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        programEnrollmentId: enrollmentId, // Include the enrollment ID
        // Use calculated counts
        childCount: childCount.toString(),
        extraClassCount: extraClassCount.toString()
      },
      // Optional: Allow promotion codes
      // allow_promotion_codes: true,
    });

    // 4. Update the enrollment record with the Stripe checkout session ID
    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', enrollmentId);

    if (updateError) {
        console.error(`Failed to update enrollment ${enrollmentId} with checkout session ID:`, updateError);
        // Although the session is created, log this error. The webhook should still function.
        // Consider if you need to return an error to the user here or handle differently.
    }


    // 5. Return success with the session URL
    return {
      success: true,
      url: session.url,
    };

  } catch (error: unknown) {
    console.error('Error creating program checkout session:', error);

    // Optional: Attempt to update enrollment status to 'failed' if possible
    if (enrollmentId && user?.id) {
      try {
          const supabase = await createClient();
          await supabase
              .from('program_enrollments')
              .update({ status: 'creation_failed' }) // Use a specific status
              .eq('id', enrollmentId)
              .eq('user_id', user.id); // Ensure user matches
      } catch (updateErr) {
          console.error(`Failed to update enrollment ${enrollmentId} status after checkout creation error:`, updateErr);
      }
    }


    let errorMessage = 'An unknown error occurred while creating the checkout session';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
} 