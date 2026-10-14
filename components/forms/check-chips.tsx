import { CheckIcon } from "lucide-react";
import type { ChoiceOption } from "./choice-chips";

export function CheckChips({
  legend,
  name,
  options,
  values,
  onChange,
  error,
  disabled,
}: {
  legend: string;
  name: string;
  options: readonly ChoiceOption[];
  values: readonly string[];
  onChange: (values: string[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const errorId = `${name}-error`;

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
      className="flex min-w-0 flex-col gap-2"
    >
      <legend className="mb-2 text-footnote font-medium text-muted-foreground">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              className="flex min-h-11 max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 text-subhead font-medium text-secondary-foreground transition-colors select-none has-checked:bg-foreground has-checked:text-background has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring forced-colors:border forced-colors:has-checked:forced-color-adjust-none forced-colors:has-checked:bg-[Highlight] forced-colors:has-checked:text-[HighlightText]"
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? values.filter((value) => value !== option.value)
                      : [...values, option.value],
                  )
                }
                className="sr-only"
              />
              {checked ? (
                <CheckIcon aria-hidden="true" className="size-4" />
              ) : (
                option.icon
              )}
              <span className="truncate">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="text-footnote text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
