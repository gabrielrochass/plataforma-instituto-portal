"use client";

import { AccessibilityIcon, CircleAlertIcon, Trash2Icon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { PersonAvatar } from "@/components/app-shell/person-avatar";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteAttendance, takeAttendance } from "@/lib/actions/attendance";
import { attempt, failed } from "@/lib/attempt";
import { alertStreak } from "@/lib/attendance";
import { m } from "@/lib/i18n";
import { BadgeScanner } from "./badge-scanner";

const a = m.attendance;

export type ChamadaRow = {
  enrollmentId: string;
  name: string;
  photo: string | null;
  token: string | null;
  accessibility: boolean;
  present: boolean;
  streak: number;
};

export function AttendanceForm({
  classId,
  className,
  day,
  minDay,
  maxDay,
  dayInfo,
  sessionId,
  initialNote,
  rows,
}: {
  classId: string;
  className: string;
  day: string;
  minDay: string;
  maxDay: string;
  dayInfo: string | null;
  sessionId: string | null;
  initialNote: string;
  rows: readonly ChamadaRow[];
}) {
  const router = useRouter();
  const [present, setPresent] = useState(
    () =>
      new Set(rows.filter((row) => row.present).map((row) => row.enrollmentId)),
  );
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const back = `/turmas/${classId}` as Route;

  function toggle(enrollmentId: string, checked: boolean) {
    setStatus("");
    setPresent((current) => {
      const next = new Set(current);
      if (checked) next.add(enrollmentId);
      else next.delete(enrollmentId);
      return next;
    });
  }

  function scanned(token: string) {
    const row = rows.find((candidate) => candidate.token === token);
    if (!row) return a.unknownBadge;
    if (present.has(row.enrollmentId)) return a.alreadyScanned(row.name);
    toggle(row.enrollmentId, true);
    return a.scanned(row.name);
  }

  function changeDay(next: string) {
    if (!next || next === day) return;
    router.replace(`/turmas/${classId}/chamada?data=${next}` as Route, {
      scroll: false,
    });
  }

  function save() {
    startTransition(async () => {
      const result = await attempt(
        takeAttendance({
          classId,
          day,
          presentIds: [...present],
          note,
        }),
        failed,
      );
      if (!result.ok) {
        const message =
          result.errors?.day?.[0] ?? result.message ?? m.common.tryAgain;
        setError(result.errors?.day?.[0]);
        setStatus(message);
        return;
      }
      toast.add({ title: a.saved, type: "success" });
      router.replace(back);
    });
  }

  function remove() {
    if (!sessionId) return;
    startTransition(async () => {
      const result = await attempt(deleteAttendance(sessionId), failed);
      if (!result.ok) {
        toast.add({
          title: result.message ?? m.common.tryAgain,
          type: "error",
        });
        return;
      }
      toast.add({ title: a.deleted, type: "success" });
      router.replace(back);
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
      <FlowHeader title={a.title} subtitle={className} fallback={back} />
      <div className="flex flex-1 flex-col gap-5 px-4 pt-4 pb-40">
        <TextField
          label={a.day}
          type="date"
          min={minDay}
          max={maxDay}
          value={day}
          hint={sessionId ? a.taken : (dayInfo ?? undefined)}
          error={error}
          onChange={(event) => changeDay(event.target.value)}
          className="max-w-56"
        />
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
            {a.noStudents}
          </p>
        ) : (
          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="sr-only">{a.list}</legend>
            <div className="flex flex-wrap items-center gap-2">
              <output className="mr-auto text-headline font-semibold tabular-nums">
                {a.counter(present.size, rows.length)}
              </output>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() =>
                  setPresent(
                    present.size === rows.length
                      ? new Set()
                      : new Set(rows.map((row) => row.enrollmentId)),
                  )
                }
              >
                {present.size === rows.length ? a.nonePresent : a.allPresent}
              </Button>
              <BadgeScanner onToken={scanned} />
            </div>
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {rows.map((row) => (
                <li key={row.enrollmentId}>
                  <label className="flex min-h-15 cursor-pointer items-center gap-3 px-4 py-2 has-checked:bg-primary/15 has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-ring">
                    <input
                      type="checkbox"
                      checked={present.has(row.enrollmentId)}
                      onChange={(event) =>
                        toggle(row.enrollmentId, event.target.checked)
                      }
                      className="size-6 shrink-0 accent-foreground"
                    />
                    <PersonAvatar name={row.name} photo={row.photo} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-body font-medium">{row.name}</span>
                      {(row.accessibility || row.streak >= alertStreak - 1) && (
                        <span className="flex flex-wrap gap-x-3 text-footnote text-muted-foreground">
                          {row.accessibility && (
                            <span className="flex items-center gap-1">
                              <AccessibilityIcon
                                aria-hidden="true"
                                className="size-4"
                              />
                              {a.accessibility}
                            </span>
                          )}
                          {row.streak >= alertStreak - 1 && (
                            <span className="flex items-center gap-1">
                              <CircleAlertIcon
                                aria-hidden="true"
                                className="size-4"
                              />
                              {a.streak(row.streak)}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}
        <TextAreaField
          label={a.note}
          placeholder={a.notePlaceholder}
          maxLength={1000}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {sessionId && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="self-start text-destructive"
                />
              }
            >
              <Trash2Icon aria-hidden="true" />
              {a.delete}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{a.deleteTitle}</AlertDialogTitle>
                <AlertDialogDescription>{a.deleteText}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel size="lg">
                  {m.common.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  size="lg"
                  disabled={pending}
                  onClick={remove}
                >
                  {a.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <FlowBar status={status}>
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending || rows.length === 0}
          focusableWhenDisabled
        >
          {pending ? a.saving : a.save}
        </Button>
      </FlowBar>
    </form>
  );
}
