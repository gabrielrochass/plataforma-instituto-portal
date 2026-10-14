"use client";

import { CircleAlertIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { TextField } from "@/components/forms/text-field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { closeClass } from "@/lib/actions/grades";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { ResultLabel } from "./result-label";

export type ClosingRow = {
  enrollmentId: string;
  name: string;
  detail: string;
  result: keyof typeof m.grades.result;
};

type Override = { on: boolean; passed: boolean; reason: string };

export function CloseClassForm({
  classId,
  className,
  rows,
  warnings,
}: {
  classId: string;
  className: string;
  rows: readonly ClosingRow[];
  warnings: readonly string[];
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  function passedOf(row: ClosingRow) {
    const override = overrides[row.enrollmentId];
    return override?.on ? override.passed : row.result === "approved";
  }

  const approved = rows.filter(passedOf).length;

  function update(row: ClosingRow, patch: Partial<Override>) {
    setStatus("");
    setOverrides((current) => {
      const base = current[row.enrollmentId] ?? {
        on: false,
        passed: row.result !== "approved",
        reason: "",
      };
      return { ...current, [row.enrollmentId]: { ...base, ...patch } };
    });
  }

  function review() {
    const found: Record<string, string | undefined> = {};
    for (const row of rows) {
      const override = overrides[row.enrollmentId];
      if (override?.on && !override.reason.trim()) {
        found[row.enrollmentId] = m.closing.reasonRequired;
      }
    }
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      setStatus(m.closing.reasonRequired);
      document.getElementById(`${first}-motivo`)?.focus();
      return;
    }
    setConfirming(true);
  }

  function confirm() {
    startTransition(async () => {
      const result = await attempt(
        closeClass({
          classId,
          overrides: rows.flatMap((row) => {
            const override = overrides[row.enrollmentId];
            return override?.on
              ? [
                  {
                    enrollmentId: row.enrollmentId,
                    passed: override.passed,
                    reason: override.reason,
                  },
                ]
              : [];
          }),
        }),
        failed,
      );
      setConfirming(false);
      if (!result.ok) {
        setStatus(result.message ?? m.common.tryAgain);
        return;
      }
      toast.add({ title: m.closing.done, type: "success" });
      router.replace(`/turmas/${classId}` as Route);
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        review();
      }}
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col"
    >
      <FlowHeader
        title={m.closing.title}
        subtitle={className}
        fallback={`/turmas/${classId}/notas` as Route}
      />
      <div className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-40">
        <p className="text-subhead text-muted-foreground">{m.closing.intro}</p>
        {warnings.length > 0 && (
          <section
            aria-labelledby="avisos"
            className="flex flex-col gap-2 rounded-2xl bg-warning/10 p-4"
          >
            <h2
              id="avisos"
              className="flex items-center gap-2 text-headline font-semibold"
            >
              <CircleAlertIcon
                aria-hidden="true"
                className="size-5 text-warning"
              />
              {m.closing.warningsTitle}
            </h2>
            <ul className="list-disc pl-5 text-subhead">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
            <p className="text-footnote">{m.closing.warningsText}</p>
          </section>
        )}
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const override = overrides[row.enrollmentId];
            return (
              <li
                key={row.enrollmentId}
                className="flex flex-col gap-3 rounded-2xl bg-card p-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-body font-semibold">{row.name}</span>
                  <span className="text-footnote text-muted-foreground tabular-nums">
                    {row.detail}
                  </span>
                  <ResultLabel result={row.result} />
                </div>
                <div className="flex min-h-11 items-center justify-between gap-4">
                  <label
                    htmlFor={`${row.enrollmentId}-ajuste`}
                    className="text-subhead"
                  >
                    {m.closing.override}
                  </label>
                  <Switch
                    id={`${row.enrollmentId}-ajuste`}
                    checked={override?.on ?? false}
                    onCheckedChange={(on) => update(row, { on })}
                  />
                </div>
                {override?.on && (
                  <>
                    <ChoiceChips
                      legend={m.closing.override}
                      name={`${row.enrollmentId}-decisao`}
                      value={override.passed ? "approve" : "fail"}
                      onChange={(value) =>
                        update(row, { passed: value === "approve" })
                      }
                      options={[
                        { value: "approve", label: m.closing.approve },
                        { value: "fail", label: m.closing.fail },
                      ]}
                    />
                    <TextField
                      id={`${row.enrollmentId}-motivo`}
                      label={m.closing.reason}
                      maxLength={500}
                      value={override.reason}
                      onChange={(event) =>
                        update(row, { reason: event.target.value })
                      }
                      error={errors[row.enrollmentId]}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <FlowBar
        status={status || m.closing.final(approved, rows.length - approved)}
      >
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {m.closing.action}
        </Button>
      </FlowBar>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.closing.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.closing.confirmText}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg">{m.common.cancel}</AlertDialogCancel>
            <AlertDialogAction size="lg" disabled={pending} onClick={confirm}>
              {m.closing.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
