"use client";

import { type ComponentProps, useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
};

function describedBy(id: string, hint?: string, error?: string) {
  return [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");
}

function FieldText({
  id,
  hint,
  error,
}: { id: string } & Omit<FieldProps, "label">) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="text-footnote text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-footnote text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  ...props
}: FieldProps & ComponentProps<"input">) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {label}
      </label>
      <Input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error) || undefined}
        className="bg-card dark:bg-card"
      />
      <FieldText id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...props
}: FieldProps & ComponentProps<"textarea">) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {label}
      </label>
      <Textarea
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error) || undefined}
        className="min-h-24 bg-card text-base dark:bg-card"
      />
      <FieldText id={id} hint={hint} error={error} />
    </div>
  );
}
