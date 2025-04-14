'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyPurchase } from '@/app/actions/verifyPurchase'; // Adjust path if needed
import { toast } from 'sonner';

export function VerifyCoursePurchaseClient() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    // Check for 'session_id' as used in the stripe.ts action
    const sessionId = searchParams.get('session_id');

    if (sessionId && !isVerifying && !verificationAttempted) {
      setIsVerifying(true);
      setVerificationAttempted(true); 
      console.log(`[VerifyCourseClient] Found session ID: ${sessionId}, attempting verification...`);

      verifyPurchase(sessionId)
        .then((result) => {
          if (result.success) {
            console.log(`[VerifyCourseClient] Verification successful: ${result.message}`);
            if (result.message && result.message !== 'Purchase already verified.') {
              toast.success(result.message);
            }
          } else {
            console.error(`[VerifyCourseClient] Verification failed: ${result.error}`);
            toast.error(result.error || 'Failed to verify purchase.');
          }
        })
        .catch((error) => {
          console.error('[VerifyCourseClient] Error calling verifyPurchase action:', error);
          toast.error('An unexpected error occurred during verification.');
        })
        .finally(() => {
          setIsVerifying(false);
        });
    }
  }, [searchParams, isVerifying, verificationAttempted]); 

  return null; // No visual output
} 