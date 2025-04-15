'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyPurchase } from '@/app/actions/verifyPurchase';
import { toast } from 'sonner';

export function VerifyCartPurchaseClient() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    // Check for success flag and session_id parameters
    const success = searchParams.get('success') === 'true';
    const sessionId = searchParams.get('session_id');

    // Only run verification if we have both success=true and a session ID and haven't already tried
    if (success && sessionId && !isVerifying && !verificationAttempted) {
      setIsVerifying(true);
      setVerificationAttempted(true); // Mark as attempted immediately
      console.log(`[VerifyCartClient] Found successful checkout session ID: ${sessionId}, attempting verification...`);

      verifyPurchase(sessionId)
        .then((result) => {
          if (result.success) {
            console.log(`[VerifyCartClient] Verification successful: ${result.message}`);
            // Show toast only on initial successful verification, not if already verified
            if (result.message && result.message !== 'Purchase already verified.') {
              toast.success(result.message || 'Course purchases successfully verified!');
            }
            // Revalidation happens server-side in the action
          } else {
            console.error(`[VerifyCartClient] Verification failed: ${result.error}`);
            toast.error(result.error || 'Failed to verify purchase. Please contact support.');
          }
        })
        .catch((error) => {
          console.error('[VerifyCartClient] Error calling verifyPurchase action:', error);
          toast.error('An unexpected error occurred during verification.');
        })
        .finally(() => {
          setIsVerifying(false);
        });
    }
    // Only re-run if searchParams changes (e.g., navigation)
    // verificationAttempted ensures it runs only once per session ID presence
  }, [searchParams, isVerifying, verificationAttempted]); 

  // This component doesn't render anything itself, it just runs the effect
  return null;
} 