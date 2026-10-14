"use client";

import { CircleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { authErrorMessage } from "@/lib/auth-errors";
import { password } from "@/lib/credentials";
import { m } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Errors = { current?: string; next?: string; form?: string };

export function ChangePasswordForm({ email }: { email: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const currentRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);

  function show(found: Errors) {
    setErrors(found);
    if (found.current) currentRef.current?.focus();
    else if (found.next) nextRef.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = String(data.get("current") ?? "");
    const parsed = password.safeParse(String(data.get("next") ?? ""));
    if (!current || !parsed.success) {
      show({
        current: current ? undefined : m.auth.errors.passwordRequired,
        next: parsed.error?.issues[0]?.message,
      });
      return;
    }
    setErrors({});
    startTransition(async () => {
      const auth = createClient().auth;
      const verified = await auth.signInWithPassword({
        email,
        password: current,
      });
      if (verified.error) {
        show(
          verified.error.code === "invalid_credentials"
            ? { current: m.account.wrongCurrentPassword }
            : authErrorMessage(verified.error.code),
        );
        return;
      }
      const updated = await auth.updateUser({ password: parsed.data });
      if (updated.error) {
        const found = authErrorMessage(updated.error.code);
        show(
          updated.error.code === "same_password"
            ? { next: m.account.samePassword }
            : { next: found.password, form: found.form },
        );
        return;
      }
      await auth.signOut({ scope: "others" });
      toast.add({ title: m.account.passwordChanged, type: "success" });
      router.replace("/ajustes/conta");
    });
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-2xl bg-card p-5"
    >
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
      />
      <AuthField
        ref={currentRef}
        label={m.account.currentPassword}
        name="current"
        type="password"
        autoComplete="current-password"
        required
        error={errors.current}
      />
      <AuthField
        ref={nextRef}
        label={m.account.newPassword}
        name="next"
        type="password"
        autoComplete="new-password"
        required
        hint={m.auth.passwordHint}
        error={errors.next}
      />
      {errors.form && (
        <p
          role="alert"
          className="flex items-start gap-2 text-subhead text-destructive"
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
        {pending ? m.common.saving : m.account.changePassword}
      </Button>
    </form>
  );
}
