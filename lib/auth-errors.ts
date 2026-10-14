import { m } from "@/lib/i18n";

export type AuthErrors = { email?: string; password?: string; form?: string };

export function authErrorMessage(code: string | undefined): AuthErrors {
  switch (code) {
    case "invalid_credentials":
      return { form: m.auth.errors.invalidCredentials };
    case "user_already_exists":
    case "email_exists":
      return { form: m.auth.errors.exists };
    case "email_address_invalid":
      return { email: m.auth.errors.emailInvalid };
    case "weak_password":
      return { password: m.auth.errors.passwordShort };
    case "over_request_rate_limit":
      return { form: m.auth.errors.rateLimit };
    default:
      return { form: m.auth.errors.failed };
  }
}
