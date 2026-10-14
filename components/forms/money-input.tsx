import { Input } from "@/components/ui/input";
import { formatCentsInput, parseCentsInput } from "@/lib/money";

export function MoneyInput({
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: number;
  onChange: (cents: number) => void;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted-foreground"
      >
        R$
      </span>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value > 0 ? formatCentsInput(value) : ""}
        onChange={(event) => onChange(parseCentsInput(event.target.value))}
        className="bg-card pl-10 tabular-nums dark:bg-card"
        {...props}
      />
    </div>
  );
}
