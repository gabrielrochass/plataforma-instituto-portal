import { CheckIcon } from "lucide-react";
import { categoryIcons } from "@/lib/category-icons";
import { m } from "@/lib/i18n";
import { type PaletteColor, paletteColors, swatchClass } from "@/lib/palette";
import { cn } from "@/lib/utils";

const optionClass =
  "relative flex size-11 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background has-checked:ring-2 has-checked:ring-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring forced-colors:has-checked:outline-2 forced-colors:has-checked:outline-offset-2 forced-colors:has-checked:outline-[Highlight]";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: PaletteColor) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-footnote font-medium text-muted-foreground">
        {m.settings.color}
      </legend>
      <div className="flex flex-wrap gap-2">
        {paletteColors.map((color) => (
          <label
            key={color}
            className={cn(
              optionClass,
              "forced-color-adjust-none",
              swatchClass[color],
            )}
          >
            <input
              type="radio"
              name="color"
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              aria-label={m.colors[color]}
              className="peer sr-only"
            />
            <CheckIcon
              aria-hidden="true"
              className="hidden size-5 text-swatch-foreground drop-shadow peer-checked:block"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (icon: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-footnote font-medium text-muted-foreground">
        {m.settings.icon}
      </legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
        {Object.entries(categoryIcons).map(([key, Icon]) => (
          <label
            key={key}
            className={cn(
              optionClass,
              "bg-secondary text-secondary-foreground has-checked:text-swatch-foreground",
              value === key && swatchClass[color as PaletteColor],
            )}
          >
            <input
              type="radio"
              name="icon"
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              aria-label={m.icons[key as keyof typeof m.icons]}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-5" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
