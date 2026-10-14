"use client";

import { CircleAlertIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToday } from "@/hooks/use-today";
import { fieldErrors } from "@/lib/action-result";
import { submitRequest } from "@/lib/actions/requests";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { formatPhone, isMinor } from "@/lib/people";
import { requestInput } from "@/lib/schemas/requests";

const fields = [
  "fullName",
  "birthDate",
  "phone",
  "email",
  "guardianName",
  "guardianPhone",
  "consent",
] as const;

export function RequestForm({ offerId }: { offerId: string }) {
  const router = useRouter();
  const today = useToday();
  const [startedAt] = useState(() => Date.now());
  const [values, setValues] = useState({
    fullName: "",
    socialName: "",
    birthDate: "",
    phone: "",
    email: "",
    neighborhood: "",
    guardianName: "",
    guardianPhone: "",
  });
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const minor = values.birthDate ? isMinor(values.birthDate, today) : false;

  function set(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function show(found: Record<string, string | undefined>) {
    setErrors(found);
    const first = fields.find((field) => found[field]);
    if (first) document.getElementById(`pedido-${first}`)?.focus();
  }

  function submit() {
    const input = { offerId, ...values, consent: consent as true };
    const parsed = requestInput.safeParse(input);
    const guardianMissing =
      minor && (!values.guardianName.trim() || !values.guardianPhone.trim());
    if (!parsed.success || guardianMissing) {
      show({
        ...(parsed.success
          ? {}
          : Object.fromEntries(
              Object.entries(fieldErrors(parsed.error)).map(([key, value]) => [
                key,
                value?.[0],
              ]),
            )),
        ...(guardianMissing
          ? { guardianName: m.requests.errors.guardian }
          : {}),
      });
      return;
    }
    setErrors({});
    setFormError(undefined);
    startTransition(async () => {
      const result = await attempt(
        submitRequest(input, { honeypot, startedAt }),
        failed,
      );
      if (!result.ok) {
        if (result.errors) {
          show(
            Object.fromEntries(
              Object.entries(result.errors).map(([key, value]) => [
                key,
                value?.[0],
              ]),
            ),
          );
        } else {
          setFormError(result.message ?? m.common.tryAgain);
        }
        return;
      }
      router.replace(
        `/inscricao/enviada?protocolo=${result.protocol}` as Route,
      );
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6"
    >
      <p className="text-subhead text-muted-foreground">
        {m.requests.formIntro}
      </p>
      <TextField
        id="pedido-fullName"
        label={m.requests.fullName}
        autoComplete="name"
        autoCapitalize="words"
        maxLength={120}
        value={values.fullName}
        onChange={(event) => set("fullName", event.target.value)}
        error={errors.fullName}
      />
      <TextField
        label={m.requests.socialName}
        maxLength={120}
        value={values.socialName}
        onChange={(event) => set("socialName", event.target.value)}
      />
      <TextField
        id="pedido-birthDate"
        label={m.requests.birthDate}
        type="date"
        autoComplete="bday"
        min="1900-01-01"
        max={today}
        value={values.birthDate}
        onChange={(event) => set("birthDate", event.target.value)}
        error={errors.birthDate}
        className="max-w-56"
      />
      <TextField
        id="pedido-phone"
        label={m.requests.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={values.phone}
        onChange={(event) => set("phone", formatPhone(event.target.value))}
        error={errors.phone}
      />
      <TextField
        id="pedido-email"
        label={m.requests.email}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        value={values.email}
        onChange={(event) => set("email", event.target.value)}
        error={errors.email}
      />
      <TextField
        label={m.requests.neighborhood}
        maxLength={80}
        value={values.neighborhood}
        onChange={(event) => set("neighborhood", event.target.value)}
      />
      {minor && (
        <fieldset className="flex flex-col gap-4 rounded-2xl bg-card p-4">
          <legend className="sr-only">{m.requests.guardianTitle}</legend>
          <p aria-hidden="true" className="text-headline font-semibold">
            {m.requests.guardianTitle}
          </p>
          <p className="text-subhead text-muted-foreground">
            {m.requests.guardianIntro}
          </p>
          <TextField
            id="pedido-guardianName"
            label={m.requests.guardianName}
            autoCapitalize="words"
            maxLength={120}
            value={values.guardianName}
            onChange={(event) => set("guardianName", event.target.value)}
            error={errors.guardianName}
          />
          <TextField
            id="pedido-guardianPhone"
            label={m.requests.guardianPhone}
            type="tel"
            inputMode="tel"
            value={values.guardianPhone}
            onChange={(event) =>
              set("guardianPhone", formatPhone(event.target.value))
            }
            error={errors.guardianPhone}
          />
        </fieldset>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="pedido-site">{m.requests.honeypot}</label>
        <input
          id="pedido-site"
          name="site"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="pedido-consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={
              errors.consent ? "pedido-consent-error" : undefined
            }
            className="mt-1"
          />
          <label htmlFor="pedido-consent" className="text-subhead">
            {m.requests.consent}
            <Link
              href="/privacidade"
              className="text-link underline underline-offset-2"
            >
              {m.requests.consentLink}
            </Link>
            .
          </label>
        </div>
        {errors.consent && (
          <p
            id="pedido-consent-error"
            className="text-footnote text-destructive"
          >
            {errors.consent}
          </p>
        )}
      </div>
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
        className="h-12 text-body"
        disabled={pending}
        focusableWhenDisabled
      >
        {pending ? m.requests.sending : m.requests.send}
      </Button>
    </form>
  );
}
