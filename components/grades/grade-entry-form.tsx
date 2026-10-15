"use client";

import type { Route } from "next";
import { useRef, useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useFinish } from "@/hooks/use-finish";
import { saveGrades } from "@/lib/actions/grades";
import { attempt, failed } from "@/lib/attempt";
import {
  formatScore,
  type GradingScheme,
  maxScore,
  parseGrade,
} from "@/lib/grading";
import { m } from "@/lib/i18n";

export type GradeRow = {
  enrollmentId: string;
  name: string;
  score: number | null;
  concept: string | null;
  missed: boolean;
};

type Entry = { text: string; concept: string | null; missed: boolean };

export function GradeEntryForm({
  classId,
  assessmentId,
  title,
  subtitle,
  scheme,
  concepts,
  rows,
}: {
  classId: string;
  assessmentId: string;
  title: string;
  subtitle: string;
  scheme: GradingScheme;
  concepts: readonly string[];
  rows: readonly GradeRow[];
}) {
  const finish = useFinish(`/turmas/${classId}/notas` as Route);
  const max = maxScore[scheme];
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.enrollmentId,
        {
          text: row.score === null ? "" : formatScore(row.score),
          concept: row.concept,
          missed: row.missed,
        },
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  function update(id: string, patch: Partial<Entry>) {
    setStatus("");
    setEntries((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  const entered = rows.filter((row) => {
    const entry = entries[row.enrollmentId];
    return entry.missed || entry.concept !== null || entry.text.trim() !== "";
  }).length;

  function save() {
    const found: Record<string, boolean> = {};
    const grades = rows.map((row) => {
      const entry = entries[row.enrollmentId];
      const parsed = parseGrade(entry.text, scheme);
      if (!entry.missed && max !== null && !parsed.ok)
        found[row.enrollmentId] = true;
      return {
        enrollmentId: row.enrollmentId,
        score: entry.missed || max === null || !parsed.ok ? null : parsed.value,
        concept: entry.missed || max !== null ? null : entry.concept,
        missed: entry.missed,
      };
    });
    setErrors(found);
    const first = rows.find((row) => found[row.enrollmentId]);
    if (first && max !== null) {
      setStatus(m.grades.invalidScore(max));
      inputs.current[first.enrollmentId]?.focus();
      return;
    }
    startTransition(async () => {
      const result = await attempt(
        saveGrades({ assessmentId, grades }),
        failed,
      );
      if (!result.ok) {
        setStatus(result.message ?? m.common.tryAgain);
        return;
      }
      toast.add({ title: m.grades.saved, type: "success" });
      finish();
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col"
    >
      <FlowHeader
        title={title}
        subtitle={subtitle}
        fallback={`/turmas/${classId}/notas` as Route}
      />
      <ul className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-40">
        {rows.map((row, index) => {
          const entry = entries[row.enrollmentId];
          const errorId = `${row.enrollmentId}-erro`;
          return (
            <li
              key={row.enrollmentId}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4"
            >
              <p className="text-body font-semibold">{row.name}</p>
              {max !== null ? (
                <div className="flex items-center gap-4">
                  <Input
                    ref={(element) => {
                      inputs.current[row.enrollmentId] = element;
                    }}
                    aria-label={m.grades.score(row.name)}
                    inputMode="decimal"
                    enterKeyHint={index === rows.length - 1 ? "done" : "next"}
                    disabled={entry.missed}
                    value={entry.text}
                    onChange={(event) =>
                      update(row.enrollmentId, { text: event.target.value })
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      const next = rows[index + 1];
                      if (!next) return;
                      event.preventDefault();
                      inputs.current[next.enrollmentId]?.focus();
                    }}
                    aria-invalid={errors[row.enrollmentId] ? true : undefined}
                    aria-describedby={
                      errors[row.enrollmentId] ? errorId : undefined
                    }
                    className="w-28 text-center text-title3 tabular-nums"
                  />
                  <div className="flex min-h-11 items-center gap-3">
                    <Checkbox
                      id={`${row.enrollmentId}-faltou`}
                      checked={entry.missed}
                      onCheckedChange={(checked) =>
                        update(row.enrollmentId, { missed: checked === true })
                      }
                    />
                    <label
                      htmlFor={`${row.enrollmentId}-faltou`}
                      className="text-body"
                    >
                      {m.grades.missed}
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <ChoiceChips
                    legend={m.grades.concept(row.name)}
                    name={`conceito-${row.enrollmentId}`}
                    value={entry.missed ? null : entry.concept}
                    disabled={entry.missed}
                    onChange={(value) =>
                      update(row.enrollmentId, { concept: value })
                    }
                    options={concepts.map((concept) => ({
                      value: concept,
                      label: concept,
                    }))}
                  />
                  <div className="flex min-h-11 items-center gap-3">
                    <Checkbox
                      id={`${row.enrollmentId}-faltou`}
                      checked={entry.missed}
                      onCheckedChange={(checked) =>
                        update(row.enrollmentId, { missed: checked === true })
                      }
                    />
                    <label
                      htmlFor={`${row.enrollmentId}-faltou`}
                      className="text-body"
                    >
                      {m.grades.missed}
                    </label>
                  </div>
                </div>
              )}
              {errors[row.enrollmentId] && max !== null && (
                <p id={errorId} className="text-footnote text-destructive">
                  {m.grades.invalidScore(max)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <FlowBar status={status || m.grades.enteredCount(entered, rows.length)}>
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? m.common.saving : m.grades.save}
        </Button>
      </FlowBar>
    </form>
  );
}
