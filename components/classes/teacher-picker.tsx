"use client";

import { CheckChips } from "@/components/forms/check-chips";
import { m } from "@/lib/i18n";

export function TeacherPicker({
  name,
  staff,
  values,
  onChange,
  error,
}: {
  name: string;
  staff: readonly { id: string; name: string }[];
  values: readonly string[];
  onChange: (values: string[]) => void;
  error?: string;
}) {
  if (staff.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
        {m.wizard.noTeachersToPick}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <CheckChips
        legend={m.classes.teachers}
        name={name}
        values={values}
        onChange={onChange}
        options={staff.map((person) => ({
          value: person.id,
          label: person.name,
        }))}
        error={error}
      />
      <p className="text-footnote text-muted-foreground">
        {m.wizard.teachersHint}
      </p>
    </div>
  );
}
