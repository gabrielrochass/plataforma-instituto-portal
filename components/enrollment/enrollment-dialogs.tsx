"use client";

import { useState, useTransition } from "react";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import {
  endEnrollment,
  reopenEnrollment,
  transferEnrollment,
} from "@/lib/actions/students";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

export type TransferTarget = { id: string; label: string };

const transferReasons = ["schedule", "moved", "level", "other"] as const;
const exitReasons = [
  "work",
  "schedule",
  "moved",
  "health",
  "family",
  "transport",
  "financial",
  "lost_interest",
  "no_contact",
  "other",
] as const;

export function TransferDialog({
  enrollmentId,
  name,
  targets,
  open,
  onOpenChange,
}: {
  enrollmentId: string;
  name: string;
  targets: readonly TransferTarget[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const today = useToday();
  const [newId] = useState(() => crypto.randomUUID());
  const [toClassId, setToClassId] = useState("");
  const [on, setOn] = useState("");
  const [reason, setReason] =
    useState<(typeof transferReasons)[number]>("schedule");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!toClassId) {
      setError(m.enrollment.transferTo);
      return;
    }
    startTransition(async () => {
      const result = await attempt(
        transferEnrollment({
          enrollmentId,
          newEnrollmentId: newId,
          toClassId,
          on: on || today,
          reason,
        }),
        failed,
      );
      if (!result.ok) {
        setError(result.message ?? m.common.tryAgain);
        return;
      }
      onOpenChange(false);
      toast.add({ title: m.enrollment.transferred(name), type: "success" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline font-semibold">
            {m.enrollment.transferTitle(name)}
          </DialogTitle>
          <DialogDescription className="text-subhead">
            {m.enrollment.transferHint}
          </DialogDescription>
        </DialogHeader>
        {targets.length === 0 ? (
          <p className="text-subhead text-muted-foreground">
            {m.enrollment.noTargets}
          </p>
        ) : (
          <form
            id={`${enrollmentId}-transfer`}
            noValidate
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${enrollmentId}-target`}
                className="text-footnote font-medium text-muted-foreground"
              >
                {m.enrollment.transferTo}
              </label>
              <NativeSelect
                id={`${enrollmentId}-target`}
                value={toClassId}
                onChange={(event) => setToClassId(event.target.value)}
              >
                <option value="" />
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <TextField
              label={m.enrollment.transferOn}
              type="date"
              value={on || today}
              onChange={(event) => setOn(event.target.value)}
            />
            <ChoiceChips
              legend={m.enrollment.transferReason}
              name={`${enrollmentId}-transfer-reason`}
              value={reason}
              onChange={(value) => setReason(value as typeof reason)}
              options={transferReasons.map((option) => ({
                value: option,
                label: m.enrollment.reasons[option],
              }))}
            />
            {error && (
              <p role="alert" className="text-subhead text-destructive">
                {error}
              </p>
            )}
          </form>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            {m.common.cancel}
          </Button>
          {targets.length > 0 && (
            <Button
              type="submit"
              form={`${enrollmentId}-transfer`}
              size="lg"
              disabled={pending}
              focusableWhenDisabled
            >
              {m.enrollment.transfer}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EndEnrollmentDialog({
  enrollmentId,
  name,
  open,
  onOpenChange,
}: {
  enrollmentId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const today = useToday();
  const [status, setStatus] = useState<"dropped_out" | "cancelled">(
    "dropped_out",
  );
  const [reason, setReason] = useState<(typeof exitReasons)[number]>("work");
  const [note, setNote] = useState("");
  const [on, setOn] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        endEnrollment({ enrollmentId, status, reason, note, on: on || today }),
        failed,
      );
      if (!result.ok) {
        setError(result.message ?? m.common.tryAgain);
        return;
      }
      onOpenChange(false);
      toast.add({
        title: m.enrollment.ended(name),
        timeout: 10_000,
        actionProps: {
          children: m.enrollment.undo,
          onClick: async () => {
            const undone = await attempt(
              reopenEnrollment(enrollmentId),
              failed,
            );
            toast.add({
              title: undone.ok ? m.enrollment.reopened : undone.message,
            });
          },
        },
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline font-semibold">
            {m.enrollment.endTitle(name)}
          </DialogTitle>
          <DialogDescription className="text-subhead">
            {m.enrollment.endText}
          </DialogDescription>
        </DialogHeader>
        <form
          id={`${enrollmentId}-end`}
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <ChoiceChips
            legend={m.enrollment.endKind}
            name={`${enrollmentId}-end-kind`}
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            options={(["dropped_out", "cancelled"] as const).map((option) => ({
              value: option,
              label: m.enrollment.endKinds[option],
            }))}
          />
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${enrollmentId}-end-reason`}
              className="text-footnote font-medium text-muted-foreground"
            >
              {m.enrollment.endReason}
            </label>
            <NativeSelect
              id={`${enrollmentId}-end-reason`}
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as typeof reason)
              }
            >
              {exitReasons.map((option) => (
                <option key={option} value={option}>
                  {m.enrollment.reasons[option]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <TextField
            label={m.enrollment.transferOn}
            type="date"
            value={on || today}
            onChange={(event) => setOn(event.target.value)}
          />
          <TextAreaField
            label={m.enrollment.endNote}
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-subhead text-destructive">
              {error}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            {m.common.cancel}
          </Button>
          <Button
            type="submit"
            form={`${enrollmentId}-end`}
            variant="destructive"
            size="lg"
            disabled={pending}
            focusableWhenDisabled
          >
            {m.enrollment.end}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
