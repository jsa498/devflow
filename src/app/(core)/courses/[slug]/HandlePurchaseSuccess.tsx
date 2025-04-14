'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { recordCoursePurchase } from '@/app/api/actions/stripe';

export function HandlePurchaseSuccess() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (success && sessionId) {
      console.log('Client: Detected successful purchase, calling recordCoursePurchase...');
      recordCoursePurchase(sessionId)
        .then(() => {
          console.log('Client: recordCoursePurchase action completed successfully.');
          // Optionally, trigger a client-side state update or notification
        })
        .catch((error) => {
          console.error('Client: Error calling recordCoursePurchase action:', error);
          // Optionally, show an error message to the user
        });
    }
  }, [success, sessionId]); // Depend on params to run only when they change/are present

  // This component doesn't need to render anything visible itself,
  // as the success message is handled by the parent page based on URL params.
  return null;
} 