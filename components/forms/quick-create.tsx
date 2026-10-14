"use client";

import { PlusIcon } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type QuickCreateProps = {
  label: string;
  placeholder: string;
  onCreate: (name: string) => Promise<ActionResult>;
  children?: React.ReactNode;
};

export function QuickCreate({
  label,
  placeholder,
  onCreate,
  onClose,
  autoFocus,
  className,
  children,
}: QuickCreateProps & {
  onClose?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  function create() {
    setError("");
    if (!name.trim()) {
      setError(m.settings.nameRequired);
      inputRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const result = await attempt(onCreate(name), failed);
      if (!result.ok) {
        setError(
          result.errors?.name?.[0] ?? result.message ?? m.common.tryAgain,
        );
        inputRef.current?.focus();
        return;
      }
      setName("");
      if (onClose) onClose();
      else inputRef.current?.focus();
    });
  }

  const createButton = (
    <Button
      type="button"
      size="lg"
      disabled={pending}
      focusableWhenDisabled
      onClick={create}
    >
      <PlusIcon aria-hidden="true" />
      {m.common.create}
    </Button>
  );

  return (
    <fieldset
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          create();
        }
        if (event.key === "Escape" && onClose) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <Input
          ref={inputRef}
          id={inputId}
          autoFocus={autoFocus}
          maxLength={40}
          autoComplete="off"
          enterKeyHint="done"
          placeholder={placeholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="bg-card dark:bg-card"
        />
        {!onClose && createButton}
      </div>
      {children}
      {onClose && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="lg" onClick={onClose}>
            {m.common.cancel}
          </Button>
          {createButton}
        </div>
      )}
      <p
        id={errorId}
        role="alert"
        className="text-footnote text-destructive empty:-mt-3"
      >
        {error}
      </p>
    </fieldset>
  );
}

export function InlineCreate({
  defaultOpen = false,
  ...props
}: QuickCreateProps & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!open) {
    return (
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        className="min-h-11 w-fit rounded-full px-4"
        onClick={() => {
          setFocusOnOpen(true);
          setOpen(true);
        }}
      >
        <PlusIcon aria-hidden="true" />
        {props.label}
      </Button>
    );
  }

  return (
    <QuickCreate
      {...props}
      autoFocus={focusOnOpen}
      onClose={() => {
        flushSync(() => setOpen(false));
        triggerRef.current?.focus();
      }}
      className="rounded-2xl bg-secondary p-3"
    />
  );
}
