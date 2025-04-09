'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton(props: React.ComponentProps<typeof Button>) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
      setIsLoggingOut(true);
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Error signing out:", error);
        alert("Failed to sign out. Please try again.");
      } else {
        // First refresh to update all components
        router.refresh();
        // Then navigate to login page for clear user feedback
        router.push('/auth/login');
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      alert("An unexpected error occurred during sign out.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <Button 
      onClick={logout} 
      disabled={isLoggingOut}
      {...props}
    >
      {isLoggingOut ? 'Logging out...' : props.children ?? 'Logout'}
    </Button>
  )
}
