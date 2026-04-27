import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for Server Components and Route Handlers.
 * Uses the service role key to bypass RLS for admin operations.
 * This is the auth-aware client — it reads/writes session cookies.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can't be set here.
            // This is expected when reading session in Server Components.
          }
        },
      },
    }
  )
}

/**
 * Get the current authenticated user from the Supabase session.
 * Returns null if not authenticated.
 */
export async function getSessionUser() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

/**
 * Get the current user's email. Used for audit logging.
 */
export async function getSessionEmail(): Promise<string | null> {
  const user = await getSessionUser()
  return user?.email ?? null
}
