import { m } from "@/lib/i18n";

export const failed = { ok: false, message: m.common.tryAgain } as const;

export async function attempt<T>(call: Promise<T>, fallback: T) {
  try {
    return await call;
  } catch {
    return fallback;
  }
}
