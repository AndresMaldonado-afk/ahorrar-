'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RegisterResult = { error: string } | { error: null }

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  const trimmedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const admin = createAdminClient()

  // Create the user already confirmed. The default Supabase dev email
  // provider is heavily rate-limited and only reliably reaches addresses in
  // the project's own organization, so relying on it for signup confirmation
  // breaks for real inboxes (Hotmail, Gmail, etc). Creating a pre-confirmed
  // user through the Admin API sidesteps that email step entirely.
  const { error: createError } = await admin.auth.admin.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: trimmedName },
  })

  if (createError) {
    const message = createError.message.toLowerCase()
    if (message.includes('already been registered') || message.includes('already registered')) {
      return { error: 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.' }
    }
    if (message.includes('password')) {
      return { error: 'La contraseña no cumple los requisitos mínimos de seguridad.' }
    }
    return { error: 'No pudimos crear tu cuenta. Intenta de nuevo.' }
  }

  // Sign the new user in immediately so registration lands them straight in
  // the dashboard instead of requiring an email confirmation step.
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (signInError) {
    return { error: 'Tu cuenta se creó, pero no pudimos iniciar sesión automáticamente. Intenta iniciar sesión.' }
  }

  return { error: null }
}
