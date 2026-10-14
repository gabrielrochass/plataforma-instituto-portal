import { m } from "@/lib/i18n";
import type { Enums } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Kind = Enums<"transaction_kind">;

const options: { value: Kind; label: string; selected: string }[] = [
  {
    value: "expense",
    label: m.entry.expense,
    selected: "has-checked:bg-expense has-checked:text-expense-foreground",
  },
  {
    value: "income",
    label: m.entry.income,
    selected: "has-checked:bg-income has-checked:text-income-foreground",
  },
];

export function KindToggle({
  value,
  onChange,
  disabled,
}: {
  value: Kind;
  onChange: (kind: Kind) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">{m.entry.kind}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-full text-subhead font-semibold text-muted-foreground transition-colors select-none has-disabled:cursor-not-allowed has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring forced-colors:has-checked:forced-color-adjust-none forced-colors:has-checked:bg-[Highlight] forced-colors:has-checked:text-[HighlightText]",
              option.selected,
            )}
          >
            <input
              type="radio"
              name="kind"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
