import { z } from "zod";
import { ptBR } from "zod/locales";
import { m } from "@/lib/i18n";

z.config({ ...ptBR(), jitless: true });

const encoder = new TextEncoder();

export const password = z
  .string()
  .min(8, m.auth.errors.passwordShort)
  .refine(
    (value) => encoder.encode(value).length <= 72,
    m.auth.errors.passwordLong,
  );

export const credentials = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email(m.auth.errors.emailInvalid).max(254)),
  password,
});

export const signInInput = credentials.extend({
  password: z.string().min(1, m.auth.errors.passwordRequired),
});

export function firstErrors(error: z.ZodError) {
  const fields = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return { email: fields.email?.[0], password: fields.password?.[0] };
}
