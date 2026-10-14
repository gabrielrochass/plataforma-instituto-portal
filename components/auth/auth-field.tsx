"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AuthField({
  label,
  hint,
  error,
  type,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
} & ComponentProps<"input">) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const describedBy = error ? `${id}-error` : hint && `${id}-hint`;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={password && visible ? "text" : type}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn("h-12 bg-card dark:bg-card", password && "pr-12")}
        />
        {password && (
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={m.auth.showPassword}
            aria-pressed={visible}
            aria-controls={id}
            className="absolute top-0.5 right-0.5 rounded-md text-muted-foreground"
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? (
              <EyeOffIcon aria-hidden="true" className="size-5" />
            ) : (
              <EyeIcon aria-hidden="true" className="size-5" />
            )}
          </Button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-footnote text-destructive">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-footnote text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
