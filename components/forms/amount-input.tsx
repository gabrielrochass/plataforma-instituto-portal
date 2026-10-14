"use client";

import { formatCentsInput, parseCentsInput } from "@/lib/money";
import { cn } from "@/lib/utils";

export function AmountInput({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  ref,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (cents: number) => void;
  error?: string;
  disabled?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const text = formatCentsInput(value);
  const size =
    text.length > 12
      ? "text-title1"
      : text.length > 9
        ? "text-large-title"
        : "text-hero";

  return (
    <div className="flex flex-col items-center gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex max-w-full items-baseline justify-center gap-1.5 tabular-nums">
        <span
          aria-hidden="true"
          className="text-title3 font-semibold text-muted-foreground"
        >
          R$
        </span>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="next"
          disabled={disabled}
          size={Math.max(text.length, 4)}
          value={text}
          onChange={(event) => onChange(parseCentsInput(event.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "field-sizing-content min-w-[4ch] max-w-full rounded-xl bg-transparent px-2 text-center font-bold tracking-tight disabled:opacity-60",
            size,
          )}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-footnote text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
