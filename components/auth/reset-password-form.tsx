"use client";

import { CircleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/actions/access";
import { attempt, failed } from "@/lib/attempt";
import { password } from "@/lib/credentials";
import { m } from "@/lib/i18n";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("password"));
    const parsed = password.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      ref.current?.focus();
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await attempt(resetPassword(token, parsed.data), failed);
      if (!result.ok) {
        setFormError(result.errors?.password?.[0] ?? result.message);
        return;
      }
      router.replace("/entrar?senha=nova");
    });
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <AuthField
        ref={ref}
        label={m.account.newPassword}
        name="password"
        type="password"
        autoComplete="new-password"
        hint={m.auth.passwordHint}
        required
        error={error}
      />
      {formError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-subhead text-destructive"
        >
          <CircleAlertIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          {formError}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-2 h-12 text-body"
        disabled={pending}
        focusableWhenDisabled
      >
        {pending ? m.reset.saving : m.reset.save}
      </Button>
    </form>
  );
}
