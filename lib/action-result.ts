import type { z } from "zod";
import { m } from "@/lib/i18n";

export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      errors?: Record<string, string[] | undefined>;
      message?: string;
    };

export const failure = { ok: false, message: m.common.tryAgain } as const;

const messages: Record<string, string> = {
  "42501": m.errors.forbidden,
  "55000": m.errors.locked,
  "54000": m.errors.limit,
};

export function failureFor(error: { code?: string }): Failure {
  const message = error.code ? messages[error.code] : undefined;
  return message ? { ok: false, message } : failure;
}

export function fieldErrors(error: z.ZodError) {
  const found: Record<string, string[] | undefined> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    found[key] = [...(found[key] ?? []), issue.message];
  }
  return found;
}

export type Failure = Extract<ActionResult, { ok: false }>;

export type LinkResult = { ok: true; token: string } | Failure;
