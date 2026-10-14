"use client";

import { InfoIcon, PlusIcon, XIcon } from "lucide-react";
import { useId } from "react";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  type GradingRules,
  type GradingScheme,
  gradingSchemes,
  maxScore,
  presets,
  ruleSentence,
} from "@/lib/grading";
import { m } from "@/lib/i18n";

const attendanceOptions = [60, 70, 75, 80, 90];

export function GradingFields({
  value,
  onChange,
}: {
  value: GradingRules;
  onChange: (rules: GradingRules) => void;
}) {
  const id = useId();
  const max = maxScore[value.scheme];
  const labels = value.conceptLabels ?? [];

  function pickScheme(scheme: GradingScheme) {
    onChange({ ...presets[scheme], minAttendance: value.minAttendance });
  }

  function setLabels(next: string[]) {
    onChange({
      ...value,
      conceptLabels: next,
      conceptPassing: Math.min(value.conceptPassing ?? 1, next.length),
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-footnote font-medium text-muted-foreground">
          {m.grading.scheme}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {gradingSchemes.map((scheme) => (
            <label
              key={scheme}
              className="flex min-h-15 cursor-pointer flex-col justify-center gap-0.5 rounded-2xl border-2 border-transparent bg-card px-4 py-3 has-checked:border-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring forced-colors:border-[CanvasText] forced-colors:has-checked:border-[Highlight]"
            >
              <input
                type="radio"
                name={`${id}-scheme`}
                value={scheme}
                checked={value.scheme === scheme}
                onChange={() => pickScheme(scheme)}
                className="sr-only"
              />
              <span className="text-body font-semibold">
                {m.grading.schemes[scheme]}
              </span>
              <span className="text-footnote text-muted-foreground">
                {m.grading.schemeHints[scheme]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <ChoiceChips
        legend={m.grading.minAttendance}
        name={`${id}-attendance`}
        value={String(value.minAttendance)}
        onChange={(next) => onChange({ ...value, minAttendance: Number(next) })}
        options={[...new Set([...attendanceOptions, value.minAttendance])]
          .sort((a, b) => a - b)
          .map((option) => ({ value: String(option), label: `${option}%` }))}
      />

      {value.scheme !== "attendance_only" && (
        <details className="group rounded-2xl bg-card">
          <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 text-body font-medium text-link [&::-webkit-details-marker]:hidden">
            {m.grading.advanced}
          </summary>
          <div className="flex flex-col gap-4 px-4 pb-4">
            {max !== null && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`${id}-passing`}
                  className="text-footnote font-medium text-muted-foreground"
                >
                  {m.grading.passingScore}
                </label>
                <Input
                  id={`${id}-passing`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={max}
                  step={max === 10 ? 0.5 : 1}
                  value={value.passingScore ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      passingScore:
                        event.target.value === ""
                          ? null
                          : Math.min(
                              max,
                              Math.max(0, Number(event.target.value)),
                            ),
                    })
                  }
                  className="max-w-32 tabular-nums"
                />
              </div>
            )}
            {value.scheme === "concept" && (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-footnote font-medium text-muted-foreground">
                    {m.grading.conceptLabels}
                  </legend>
                  {labels.map((label, index) => (
                    <div
                      key={`${index}-${labels.length}`}
                      className="flex gap-2"
                    >
                      <Input
                        aria-label={m.grading.conceptLabel(index + 1)}
                        value={label}
                        maxLength={20}
                        onChange={(event) =>
                          setLabels(
                            labels.map((current, position) =>
                              position === index ? event.target.value : current,
                            ),
                          )
                        }
                      />
                      {labels.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-lg"
                          aria-label={m.grading.removeConcept(label)}
                          onClick={() =>
                            setLabels(
                              labels.filter(
                                (_, position) => position !== index,
                              ),
                            )
                          }
                        >
                          <XIcon aria-hidden="true" className="size-5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {labels.length < 10 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      className="self-start text-link"
                      onClick={() => setLabels([...labels, ""])}
                    >
                      <PlusIcon aria-hidden="true" />
                      {m.grading.addConcept}
                    </Button>
                  )}
                </fieldset>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`${id}-concept-passing`}
                    className="text-footnote font-medium text-muted-foreground"
                  >
                    {m.grading.conceptPassing}
                  </label>
                  <NativeSelect
                    id={`${id}-concept-passing`}
                    value={value.conceptPassing ?? 1}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        conceptPassing: Number(event.target.value),
                      })
                    }
                    className="max-w-32"
                  >
                    {labels.map((_, index) => (
                      <option key={String(index)} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </>
            )}
          </div>
        </details>
      )}

      <p
        aria-live="polite"
        className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-subhead"
      >
        <InfoIcon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-link"
        />
        {ruleSentence(value)}
      </p>
    </div>
  );
}
