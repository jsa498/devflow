import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') // PKCE flow
  const token_hash = searchParams.get('token_hash') // Older flow / Email OTP
  const type = searchParams.get('type') as EmailOtpType | null // Older flow / Email OTP
  const next = searchParams.get('next') ?? '/'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('code') // Clean up params
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')

  const supabase = await createClient()
  let error: string | null = null

  if (code) {
    // Handle PKCE code exchange
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      error = exchangeError.message
    }
  } else if (token_hash && type) {
    // Handle older token/type verification
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
     if (verifyError) {
       error = verifyError.message
     }
  } else {
    // No valid parameters found
    error = 'No valid confirmation parameters found (code, or token_hash/type).'
  }

  if (!error) {
    // Redirect to the 'next' URL on success (cleaned)
    redirectTo.searchParams.delete('error') // Ensure no error param exists
    return redirect(redirectTo.toString())
  } else {
    // Redirect to an error page on failure (cleaned)
    redirectTo.pathname = '/auth/error'
    redirectTo.searchParams.set('error', error)
    return redirect(redirectTo.toString())
  }
}
