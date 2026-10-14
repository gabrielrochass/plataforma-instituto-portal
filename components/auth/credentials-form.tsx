"use client";

import { CircleAlertIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { type AuthErrors, authErrorMessage } from "@/lib/auth-errors";
import { firstErrors, signInInput } from "@/lib/credentials";
import { m } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function CredentialsForm({ next }: { next: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<AuthErrors>({});
  const [pending, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function show(next: AuthErrors) {
    setErrors(next);
    if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signInInput.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      show(firstErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const { data, error } = await createClient().auth.signInWithPassword(
        parsed.data,
      );
      if (error || !data.session) {
        show(authErrorMessage(error?.code));
        return;
      }
      router.replace(next as Route);
    });
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <AuthField
        ref={emailRef}
        label={m.auth.email}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        maxLength={254}
        required
        error={errors.email}
      />
      <AuthField
        ref={passwordRef}
        label={m.auth.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      {errors.form && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-subhead text-destructive"
        >
          <CircleAlertIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          {errors.form}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-2 h-12 text-body"
        disabled={pending}
        focusableWhenDisabled
      >
        {pending ? m.auth.signingIn : m.auth.signIn}
      </Button>
    </form>
  );
}
