"use client";

import { ArrowLeftIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useState,
  useTransition,
} from "react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthLegal } from "@/components/auth/auth-legal";
import { Tally } from "@/components/brand/tally";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";
import { withNext } from "@/lib/auth-paths";
import { credentials, firstErrors } from "@/lib/credentials";
import { m } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export const signupSteps = 5;

type Step = "name" | "email" | "password" | "confirm";

const order: Step[] = ["name", "email", "password"];

export function SignupFlow({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ReactNode>(null);
  const [pending, startTransition] = useTransition();
  const focusOnMount = useCallback(
    (element: HTMLInputElement | null) => element?.focus(),
    [],
  );
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const index = order.indexOf(step as (typeof order)[number]);

  function go(target: Step) {
    setError(null);
    setStep(target);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "name") {
      if (!name.trim()) return setError(m.signup.nameRequired);
      return go("email");
    }
    if (step === "email") {
      const parsed = credentials.shape.email.safeParse(email);
      if (!parsed.success) {
        return setError(
          email.includes("@")
            ? m.auth.errors.emailInvalid
            : m.signup.emailMissingAt,
        );
      }
      return go("password");
    }
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      const fields = firstErrors(parsed.error);
      if (fields.email) {
        go("email");
        return setError(fields.email);
      }
      return setError(fields.password);
    }
    setError(null);
    startTransition(async () => {
      const { data, error: signUpError } = await createClient().auth.signUp({
        ...parsed.data,
        options: { data: { full_name: name.trim().slice(0, 80) } },
      });
      if (
        signUpError?.code === "user_already_exists" ||
        signUpError?.code === "email_exists"
      ) {
        go("email");
        setError(
          <>
            {m.signup.emailTaken}{" "}
            <Link
              href={withNext("/entrar", next)}
              className="font-medium text-link underline underline-offset-2"
            >
              {m.signup.signInWith}
            </Link>
          </>,
        );
        return;
      }
      if (signUpError) {
        const found = authErrorMessage(signUpError.code);
        setError(found.password ?? found.email ?? found.form);
        return;
      }
      if (!data.session) {
        setStep("confirm");
        return;
      }
      router.replace(withNext("/comecar", next));
    });
  }

  if (step === "confirm") {
    return (
      <section
        aria-labelledby="confirmar"
        className="flex flex-col items-start gap-4"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-link/12 text-link">
          <MailIcon aria-hidden="true" className="size-6" />
        </span>
        <h1 id="confirmar" className="text-title1 font-bold tracking-tight">
          {m.signup.confirmTitle}
        </h1>
        <p className="text-body text-muted-foreground">
          {m.signup.confirmText(email)}
        </p>
      </section>
    );
  }

  const question =
    step === "name"
      ? m.signup.nameQuestion
      : step === "email"
        ? m.signup.emailQuestion(firstName)
        : m.signup.passwordQuestion;
  const longEnough = password.length >= 8;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        {index > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="-ml-3 text-link"
            onClick={() => go(order[index - 1])}
          >
            <ArrowLeftIcon aria-hidden="true" />
            {m.signup.back}
          </Button>
        ) : (
          <span />
        )}
        <Tally lit={index + 1} className="h-7 w-9" />
      </div>

      <div key={step} className="flex animate-step-in flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="text-footnote font-medium text-muted-foreground">
            {m.signup.step(index + 1, signupSteps)}
          </p>
          <h1 className="text-title1 font-bold tracking-tight text-balance">
            {question}
          </h1>
        </div>

        {step === "name" && (
          <AuthField
            ref={focusOnMount}
            label={m.signup.nameLabel}
            name="name"
            autoComplete="given-name"
            autoCapitalize="words"
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={error ? String(error) : undefined}
          />
        )}
        {step === "email" && (
          <AuthField
            ref={focusOnMount}
            label={m.auth.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            hint={m.signup.emailHint}
            error={typeof error === "string" ? error : undefined}
          />
        )}
        {step === "email" && error && typeof error !== "string" && (
          <p role="alert" className="text-subhead">
            {error}
          </p>
        )}
        {step === "password" && (
          <>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              readOnly
              hidden
            />
            <AuthField
              ref={focusOnMount}
              label={m.auth.password}
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={typeof error === "string" ? error : undefined}
            />
            <p
              className={cn(
                "-mt-3 flex items-center gap-1.5 text-footnote",
                longEnough ? "text-income" : "text-muted-foreground",
              )}
            >
              <CheckMark done={longEnough} />
              {m.signup.passwordRule}
            </p>
          </>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-12 text-body"
          disabled={pending}
          focusableWhenDisabled
        >
          {step === "password"
            ? pending
              ? m.signup.creating
              : m.signup.create
            : m.signup.next}
        </Button>
        {step === "password" && <AuthLegal />}
      </div>
    </form>
  );
}

function CheckMark({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d="M4.5 8.2 7 10.5l4.5-5"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
