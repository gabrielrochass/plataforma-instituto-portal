"use client";

import { useState } from "react";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { Input } from "@/components/ui/input";
import { useToday } from "@/hooks/use-today";
import { addDays } from "@/lib/dates";
import { m } from "@/lib/i18n";

export function DateChoice({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}) {
  const today = useToday();
  const yesterday = addDays(today, -1);
  const [custom, setCustom] = useState(value !== today && value !== yesterday);
  const preset = custom ? "other" : value === yesterday ? "yesterday" : "today";

  return (
    <div className="flex flex-col gap-3">
      <ChoiceChips
        legend={m.entry.date}
        name="date-preset"
        disabled={disabled}
        value={preset}
        onChange={(choice) => {
          setCustom(choice === "other");
          if (choice === "today") onChange(today);
          if (choice === "yesterday") onChange(yesterday);
        }}
        options={[
          { value: "today", label: m.transactions.today },
          { value: "yesterday", label: m.transactions.yesterday },
          { value: "other", label: m.entry.otherDate },
        ]}
      />
      {custom && (
        <Input
          type="date"
          aria-label={m.entry.date}
          disabled={disabled}
          value={value}
          min="2000-01-01"
          max="2100-12-31"
          onChange={(event) =>
            event.target.value && onChange(event.target.value)
          }
        />
      )}
    </div>
  );
}
