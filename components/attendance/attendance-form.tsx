"use client";

import {
  AccessibilityIcon,
  CalendarXIcon,
  CheckIcon,
  CircleAlertIcon,
  EllipsisIcon,
  MessageCircleIcon,
  PhoneIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useGoBack } from "@/hooks/use-go-back";
import { cancelSession, takeAttendance } from "@/lib/actions/attendance";
import { attempt, failed } from "@/lib/attempt";
import {
  type AttendanceStatus,
  alertStreak,
  countMarks,
  streakAfter,
} from "@/lib/attendance";
import { m } from "@/lib/i18n";
import { telHref, whatsappHref } from "@/lib/people";
import { cn } from "@/lib/utils";

export type ChamadaRow = {
  enrollmentId: string;
  studentId: string;
  name: string;
  accessibility: boolean;
  status: AttendanceStatus | null;
  note: string;
  streak: number;
  contactName: string | null;
  contactPhone: string | null;
  contactWhatsapp: boolean;
};

type Mark = { status: AttendanceStatus | null; note: string };

const otherReason = "__outro";

export function AttendanceForm({
  sessionId,
  classId,
  title,
  subtitle,
  rows,
  initialTopic,
  takenLabel,
}: {
  sessionId: string;
  classId: string;
  title: string;
  subtitle: string;
  rows: readonly ChamadaRow[];
  initialTopic: string;
  takenLabel: string | null;
}) {
  const router = useRouter();
  const leave = useGoBack(`/turmas/${classId}/aulas` as Route);
  const draftKey = `chamada:${sessionId}`;
  const [marks, setMarks] = useState<Record<string, Mark>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.enrollmentId,
        { status: row.status, note: row.note },
      ]),
    ),
  );
  const [topic, setTopic] = useState(initialTopic);
  const [restored, setRestored] = useState(false);
  const [status, setStatus] = useState(takenLabel ?? "");
  const [options, setOptions] = useState<ChamadaRow | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [alerts, setAlerts] = useState<ChamadaRow[] | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (takenLabel) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const draft = JSON.parse(saved) as {
        marks: Record<string, Mark>;
        topic: string;
      };
      setMarks((current) => ({ ...current, ...draft.marks }));
      setTopic(draft.topic ?? "");
      setRestored(true);
    } catch {}
  }, [draftKey, takenLabel]);

  useEffect(() => {
    if (!touched.current) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ marks, topic }));
    } catch {}
  }, [draftKey, marks, topic]);

  function setMark(enrollmentId: string, patch: Partial<Mark>) {
    touched.current = true;
    setMarks((current) => ({
      ...current,
      [enrollmentId]: { ...current[enrollmentId], ...patch },
    }));
  }

  function markAllPresent() {
    touched.current = true;
    setMarks((current) =>
      Object.fromEntries(
        Object.entries(current).map(([id, mark]) => [
          id,
          mark.status === null ? { ...mark, status: "present" } : mark,
        ]),
      ),
    );
  }

  const counts = countMarks(Object.values(marks).map((mark) => mark.status));

  function save() {
    if (counts.unmarked > 0) {
      setStatus(m.attendance.unmarkedLeft(counts.unmarked));
      const first = rows.find((row) => marks[row.enrollmentId].status === null);
      listRef.current
        ?.querySelector<HTMLInputElement>(
          `[name="mark-${first?.enrollmentId}"]`,
        )
        ?.focus();
      return;
    }
    startTransition(async () => {
      const result = await attempt(
        takeAttendance({
          sessionId,
          topic,
          marks: rows.map((row) => ({
            enrollmentId: row.enrollmentId,
            status: marks[row.enrollmentId].status as AttendanceStatus,
            note: marks[row.enrollmentId].note,
          })),
        }),
        failed,
      );
      if (!result.ok) {
        setStatus(result.message ?? m.common.tryAgain);
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      const reached = rows.filter(
        (row) =>
          row.streak < alertStreak &&
          streakAfter(row.streak, marks[row.enrollmentId].status) >=
            alertStreak,
      );
      if (reached.length > 0) {
        setAlerts(reached);
        return;
      }
      toast.add({ title: m.attendance.saved, type: "success" });
      leave();
    });
  }

  if (alerts) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
        <FlowHeader title={title} subtitle={subtitle} fallback="/" />
        <section
          aria-labelledby="alertas"
          className="flex flex-col gap-4 px-4 pt-4 pb-12"
        >
          <p className="flex items-start gap-2 text-subhead text-success">
            <CheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {m.attendance.saved}
          </p>
          <h2
            id="alertas"
            tabIndex={-1}
            ref={(element) => element?.focus()}
            className="flex items-start gap-2 text-title2 font-bold"
          >
            <CircleAlertIcon
              aria-hidden="true"
              className="mt-1 size-6 shrink-0 text-warning"
            />
            {m.attendance.alertsTitle}
          </h2>
          <p className="text-body text-muted-foreground">
            {m.attendance.alertsText}
          </p>
          <ul className="flex flex-col gap-3">
            {alerts.map((row) => (
              <li key={row.enrollmentId}>
                <ContactCard row={row} />
              </li>
            ))}
          </ul>
          <Button size="lg" className="h-12 text-body" onClick={leave}>
            {m.attendance.finish}
          </Button>
        </section>
      </div>
    );
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
        fallback={`/turmas/${classId}/aulas` as Route}
        action={
          takenLabel === null ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label={m.attendance.didNotHappen}
              onClick={() => setCancelOpen(true)}
            >
              <CalendarXIcon aria-hidden="true" className="size-5" />
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-1 flex-col gap-5 px-4 pt-4 pb-44">
        {restored && (
          <p className="text-footnote text-muted-foreground">
            {m.attendance.draft}
          </p>
        )}
        {counts.unmarked > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="h-12 text-body"
            onClick={markAllPresent}
          >
            <CheckIcon aria-hidden="true" />
            {m.attendance.allPresent}
          </Button>
        )}
        <div ref={listRef} className="flex flex-col gap-3">
          {rows.map((row) => (
            <StudentMark
              key={row.enrollmentId}
              row={row}
              mark={marks[row.enrollmentId]}
              onStatus={(value) => setMark(row.enrollmentId, { status: value })}
              onMore={() => setOptions(row)}
            />
          ))}
        </div>
        <TextAreaField
          label={m.attendance.topic}
          hint={m.attendance.topicHint}
          value={topic}
          maxLength={500}
          onChange={(event) => {
            touched.current = true;
            setTopic(event.target.value);
          }}
        />
      </div>

      <FlowBar
        status={
          status ||
          m.attendance.summary(counts.present, counts.absent, counts.unmarked)
        }
      >
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? m.attendance.saving : m.attendance.save}
        </Button>
      </FlowBar>

      <Sheet
        open={options !== null}
        onOpenChange={(open) => !open && setOptions(null)}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          {options && (
            <>
              <SheetHeader className="pr-14">
                <SheetTitle className="text-headline font-semibold">
                  {options.name}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4">
                <ChoiceChips
                  legend={m.attendance.status}
                  name={`options-${options.enrollmentId}`}
                  value={marks[options.enrollmentId].status}
                  onChange={(value) =>
                    setMark(options.enrollmentId, {
                      status: value as AttendanceStatus,
                    })
                  }
                  options={(
                    ["present", "late", "absent", "excused"] as const
                  ).map((value) => ({ value, label: m.attendance[value] }))}
                />
                <TextField
                  label={m.attendance.note}
                  placeholder={m.attendance.notePlaceholder}
                  value={marks[options.enrollmentId].note}
                  maxLength={200}
                  onChange={(event) =>
                    setMark(options.enrollmentId, { note: event.target.value })
                  }
                />
                <ContactLinks row={options} />
                <Button
                  size="lg"
                  type="button"
                  onClick={() => setOptions(null)}
                >
                  {m.common.close}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CancelSessionDialog
        sessionId={sessionId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onDone={() => router.replace(`/turmas/${classId}/aulas` as Route)}
      />
    </form>
  );
}

function StudentMark({
  row,
  mark,
  onStatus,
  onMore,
}: {
  row: ChamadaRow;
  mark: Mark;
  onStatus: (status: AttendanceStatus) => void;
  onMore: () => void;
}) {
  const choice =
    mark.status === "present" || mark.status === "late"
      ? "present"
      : mark.status === "absent" || mark.status === "excused"
        ? "absent"
        : null;
  const detail =
    mark.status === "late"
      ? m.attendance.late
      : mark.status === "excused"
        ? m.attendance.excused
        : mark.status === null
          ? m.attendance.unmarked
          : null;

  return (
    <fieldset className="flex flex-col gap-2 rounded-2xl bg-card p-3">
      <legend className="sr-only">{row.name}</legend>
      <div
        aria-hidden="true"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1"
      >
        <span className="text-body font-semibold">{row.name}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-footnote">
        {row.accessibility && (
          <span className="inline-flex items-center gap-1 text-link">
            <AccessibilityIcon aria-hidden="true" className="size-4" />
            {m.students.accessibility}
          </span>
        )}
        {row.streak >= 2 && (
          <span className="inline-flex items-center gap-1 text-warning">
            <CircleAlertIcon aria-hidden="true" className="size-4" />
            {m.attendance.streak(row.streak)}
          </span>
        )}
        {detail && (
          <span
            className={cn(
              mark.status === null ? "text-muted-foreground" : "font-medium",
            )}
          >
            {detail}
            {mark.note ? `. ${mark.note}` : ""}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        {(["present", "absent"] as const).map((value) => (
          <label
            key={value}
            className={cn(
              "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-transparent bg-secondary px-3 text-subhead font-semibold select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring forced-colors:border-[CanvasText]",
              value === "present"
                ? "has-checked:border-success has-checked:bg-success/12 has-checked:text-success"
                : "has-checked:border-destructive has-checked:bg-destructive/10 has-checked:text-destructive",
            )}
          >
            <input
              type="radio"
              name={`mark-${row.enrollmentId}`}
              value={value}
              checked={choice === value}
              onChange={() => onStatus(value)}
              className="sr-only"
            />
            {value === "present" ? (
              <CheckIcon aria-hidden="true" className="size-5" />
            ) : (
              <XIcon aria-hidden="true" className="size-5" />
            )}
            {m.attendance[value]}
          </label>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-12"
          aria-label={m.attendance.more(row.name)}
          onClick={onMore}
        >
          <EllipsisIcon aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </fieldset>
  );
}

function ContactLinks({ row }: { row: ChamadaRow }) {
  if (!row.contactPhone || !row.contactName) return null;
  const first = row.contactName.split(" ")[0];
  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={telHref(row.contactPhone)}
        aria-label={m.attendance.callPerson(row.contactName)}
        className={buttonVariants({ variant: "secondary", size: "lg" })}
      >
        <PhoneIcon aria-hidden="true" />
        {m.attendance.call}
      </a>
      {row.contactWhatsapp && (
        <a
          href={whatsappHref(row.contactPhone)}
          target="_blank"
          rel="noreferrer"
          aria-label={m.attendance.whatsappPerson(first)}
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          <MessageCircleIcon aria-hidden="true" />
          {m.attendance.whatsapp}
        </a>
      )}
    </div>
  );
}

function ContactCard({ row }: { row: ChamadaRow }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
      <p className="flex flex-col">
        <span className="text-headline font-semibold">{row.name}</span>
        {row.contactName && (
          <span className="text-footnote text-muted-foreground">
            {row.contactName}
          </span>
        )}
      </p>
      <ContactLinks row={row} />
      <Link
        href={
          `/alunos/${row.studentId}/acompanhamento?tipo=family_contact` as Route
        }
        aria-label={m.attendance.registerContactFor(row.name)}
        className={buttonVariants({
          variant: "ghost",
          size: "lg",
          className: "text-link",
        })}
      >
        {m.attendance.registerContact}
      </Link>
    </div>
  );
}

function CancelSessionDialog({
  sessionId,
  open,
  onOpenChange,
  onDone,
}: {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [choice, setChoice] = useState<string>(m.attendance.reasons[0]);
  const [other, setOther] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirm() {
    const reason = choice === otherReason ? other : choice;
    startTransition(async () => {
      const result = await attempt(cancelSession(sessionId, reason), failed);
      if (!result.ok) {
        setError(
          result.errors?.reason?.[0] ?? result.message ?? m.common.tryAgain,
        );
        return;
      }
      onOpenChange(false);
      toast.add({ title: m.attendance.cancelled, type: "success" });
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline font-semibold">
            {m.attendance.cancelTitle}
          </DialogTitle>
          <DialogDescription className="text-subhead">
            {m.attendance.cancelText}
          </DialogDescription>
        </DialogHeader>
        <ChoiceChips
          legend={m.attendance.reason}
          name="cancel-reason"
          value={choice}
          onChange={setChoice}
          options={[
            ...m.attendance.reasons.map((reason) => ({
              value: reason,
              label: reason,
            })),
            { value: otherReason, label: m.attendance.otherReason },
          ]}
        />
        {choice === otherReason && (
          <TextField
            label={m.attendance.reason}
            value={other}
            maxLength={120}
            onChange={(event) => setOther(event.target.value)}
          />
        )}
        {error && (
          <p role="alert" className="text-subhead text-destructive">
            {error}
          </p>
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
          <Button
            type="button"
            size="lg"
            disabled={pending}
            focusableWhenDisabled
            onClick={confirm}
          >
            {m.attendance.confirmCancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
