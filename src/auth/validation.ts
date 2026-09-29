/**
 * Account validation (email + password) and friendly auth error messages.
 *
 * This is only the FIRST line of defence, for instant feedback in the form.
 * Supabase Auth validates again on the server (and hashes the password with
 * bcrypt) — the browser can never be trusted to enforce rules on its own.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(email: string): string | null {
  const value = email.trim()
  if (!value) return 'Enter your email.'
  if (value.length > 254 || !EMAIL_RE.test(value)) return 'That email doesn’t look right.'
  return null
}

/** At least 8 characters with a letter and a number; bcrypt only uses the first 72 bytes. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (new TextEncoder().encode(password).length > 72) return 'Use at most 72 characters.'
  if (!/[a-z]/i.test(password) || !/[0-9]/.test(password)) return 'Include at least one letter and one number.'
  return null
}

export interface CredentialErrors {
  email?: string
  password?: string
  confirm?: string
}

export function validateCredentials(mode: 'login' | 'signup', email: string, password: string, confirm: string): CredentialErrors {
  const errors: CredentialErrors = {}
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  if (mode === 'signup') {
    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError
    if (confirm !== password) errors.confirm = 'Passwords don’t match.'
  } else if (!password) {
    errors.password = 'Enter your password.'
  }
  return errors
}

/** Turns Supabase Auth errors (which carry a `code`) into short, human messages. */
export function describeAuthError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : ''
  const message = error instanceof Error ? error.message : ''
  switch (code) {
    case 'invalid_credentials':
      return 'Wrong email or password.'
    case 'email_not_confirmed':
      return 'Confirm your email first — check your inbox.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Log in instead.'
    case 'weak_password':
      return 'That password is too weak — try a longer one.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a minute and try again.'
    case 'signup_disabled':
      return 'Sign-ups are currently closed.'
    case 'email_address_invalid':
      return 'That email address can’t be used.'
  }
  if (/fetch|network|timed out|unavailable/i.test(message)) return 'Signal lost — check your connection and try again.'
  return message || 'Something went wrong. Try again.'
}
