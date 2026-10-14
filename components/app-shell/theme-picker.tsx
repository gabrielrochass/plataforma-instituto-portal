"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";
import { saveTheme } from "@/lib/actions/theme";
import { m } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

const options = [
  { value: "light", label: m.theme.light, icon: SunIcon },
  { value: "dark", label: m.theme.dark, icon: MoonIcon },
] as const;

export function ThemePicker({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    saveTheme(next).catch(() => {});
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl bg-card p-4">
      <legend className="sr-only">{m.theme.title}</legend>
      <p aria-hidden="true" className="text-body font-medium">
        {m.theme.title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-transparent bg-secondary px-3 text-body font-medium text-secondary-foreground has-checked:border-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name="tema"
                value={option.value}
                checked={theme === option.value}
                onChange={() => choose(option.value)}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="size-5" />
              {option.label}
            </label>
          );
        })}
      </div>
      <p className="text-footnote text-muted-foreground">{m.theme.hint}</p>
    </fieldset>
  );
}
