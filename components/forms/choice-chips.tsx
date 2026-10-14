export type ChoiceOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

export function ChoiceChips({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  disabled,
}: {
  legend: string;
  name: string;
  options: readonly ChoiceOption[];
  value: string | null;
  onChange: (value: string) => void;
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
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 text-subhead font-medium text-secondary-foreground transition-colors select-none has-checked:bg-foreground has-checked:text-background has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring forced-colors:border forced-colors:has-checked:forced-color-adjust-none forced-colors:has-checked:bg-[Highlight] forced-colors:has-checked:text-[HighlightText]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon}
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-footnote text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
