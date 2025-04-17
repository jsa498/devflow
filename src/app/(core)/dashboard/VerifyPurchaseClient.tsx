'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyPurchase } from '@/app/actions/verifyPurchase';
import { toast } from 'sonner';

export function VerifyPurchaseClient() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('checkout_session_id');

    // Only run verification if we have a session ID and haven't already tried
    if (sessionId && !isVerifying && !verificationAttempted) {
      setIsVerifying(true);
      setVerificationAttempted(true); // Mark as attempted immediately
      // console.log(`[VerifyClient] Found checkout session ID: ${sessionId}, attempting verification...`); // Removed this log

      verifyPurchase(sessionId)
        .then((result) => {
          if (result.success) {
            console.log(`[VerifyClient] Verification successful: ${result.message}`);
            // Show toast only on initial successful verification, not if already verified
            if (result.message && result.message !== 'Purchase already verified.') {
              toast.success(result.message);
            }
            // Revalidation happens server-side in the action
          } else {
            console.error(`[VerifyClient] Verification failed: ${result.error}`);
            toast.error(result.error || 'Failed to verify purchase. Please contact support.');
          }
        })
        .catch((error) => {
          console.error('[VerifyClient] Error calling verifyPurchase action:', error);
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