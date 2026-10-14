"use client";

import { CircleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/actions/access";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { acceptInviteInput } from "@/lib/schemas/team";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

export function AcceptInviteForm({
  token,
  defaultName,
}: {
  token: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  function show(found: Errors) {
    setErrors(found);
    const first = (["name", "email", "password"] as const).find(
      (field) => found[field],
    );
    if (first) refs[first].current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    const parsed = acceptInviteInput.safeParse(input);
    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      show({
        name: fields.name?.[0],
        email: fields.email?.[0],
        password: fields.password?.[0],
      });
      return;
    }
    startTransition(async () => {
      const result = await attempt(acceptInvite(token, parsed.data), failed);
      if (!result.ok) {
        show({
          name: result.errors?.name?.[0],
          email: result.errors?.email?.[0],
          password: result.errors?.password?.[0],
          form: result.errors ? undefined : result.message,
        });
        return;
      }
      router.replace("/");
    });
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <AuthField
        ref={refs.name}
        label={m.invite.nameLabel}
        name="name"
        autoComplete="name"
        autoCapitalize="words"
        defaultValue={defaultName}
        maxLength={80}
        required
        error={errors.name}
      />
      <AuthField
        ref={refs.email}
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
        ref={refs.password}
        label={m.auth.password}
        name="password"
        type="password"
        autoComplete="new-password"
        hint={m.auth.passwordHint}
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
        {pending ? m.invite.accepting : m.invite.accept}
      </Button>
    </form>
  );
}
