"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { m } from "@/lib/i18n";
import { formatPhone } from "@/lib/people";
import type { GuardianInput } from "@/lib/schemas/students";
import { Constants } from "@/lib/supabase/database.types";

export type GuardianDraft = GuardianInput & { key: string };

export function newGuardian(): GuardianDraft {
  return {
    key: crypto.randomUUID(),
    id: null,
    fullName: "",
    relationship: "mother",
    phone: "",
    isWhatsapp: true,
  };
}

export function GuardianFields({
  guardians,
  onChange,
  errors,
  minimum,
}: {
  guardians: readonly GuardianDraft[];
  onChange: (guardians: GuardianDraft[]) => void;
  errors: Record<string, string | undefined>;
  minimum: number;
}) {
  function update(key: string, patch: Partial<GuardianDraft>) {
    onChange(
      guardians.map((guardian) =>
        guardian.key === key ? { ...guardian, ...patch } : guardian,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {guardians.map((guardian, index) => (
        <fieldset
          key={guardian.key}
          className="flex flex-col gap-4 rounded-2xl bg-card p-4"
        >
          <legend className="sr-only">
            {m.studentForm.guardian(index + 1)}
          </legend>
          <div className="flex items-center justify-between gap-3">
            <p aria-hidden="true" className="text-headline font-semibold">
              {m.studentForm.guardian(index + 1)}
            </p>
            {guardians.length > minimum && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label={m.studentForm.removeGuardian(index + 1)}
                onClick={() =>
                  onChange(
                    guardians.filter((item) => item.key !== guardian.key),
                  )
                }
              >
                <Trash2Icon aria-hidden="true" className="size-5" />
              </Button>
            )}
          </div>
          <TextField
            label={m.studentForm.guardianName}
            value={guardian.fullName}
            maxLength={120}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(event) =>
              update(guardian.key, { fullName: event.target.value })
            }
            error={errors[`guardians.${index}.fullName`]}
          />
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${guardian.key}-relationship`}
              className="text-footnote font-medium text-muted-foreground"
            >
              {m.studentForm.relationship}
            </label>
            <NativeSelect
              id={`${guardian.key}-relationship`}
              value={guardian.relationship}
              onChange={(event) =>
                update(guardian.key, {
                  relationship: event.target
                    .value as GuardianDraft["relationship"],
                })
              }
            >
              {Constants.public.Enums.guardian_relationship.map((option) => (
                <option key={option} value={option}>
                  {m.studentForm.relationships[option]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <TextField
            label={m.studentForm.guardianPhone}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={guardian.phone}
            onChange={(event) =>
              update(guardian.key, { phone: formatPhone(event.target.value) })
            }
            error={errors[`guardians.${index}.phone`]}
          />
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id={`${guardian.key}-whatsapp`}
              checked={guardian.isWhatsapp}
              onCheckedChange={(checked) =>
                update(guardian.key, { isWhatsapp: checked === true })
              }
            />
            <label htmlFor={`${guardian.key}-whatsapp`} className="text-body">
              {m.studentForm.isWhatsapp}
            </label>
          </div>
        </fieldset>
      ))}
      {errors.guardians && (
        <p className="text-footnote text-destructive">{errors.guardians}</p>
      )}
      {guardians.length < 4 && (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="self-start text-link"
          onClick={() => onChange([...guardians, newGuardian()])}
        >
          <PlusIcon aria-hidden="true" />
          {guardians.length === 0
            ? m.studentForm.guardian(1)
            : m.studentForm.addGuardian}
        </Button>
      )}
    </div>
  );
}

export function guardianErrors(
  errors: Record<string, string[] | undefined> = {},
) {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, value?.[0]]),
  );
}
