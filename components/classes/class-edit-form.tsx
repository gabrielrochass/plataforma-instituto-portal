"use client";

import { InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { updateClass } from "@/lib/actions/classes";
import { attempt, failed } from "@/lib/attempt";
import { addDays } from "@/lib/dates";
import type { GradingRules } from "@/lib/grading";
import { holidaysBetween } from "@/lib/holidays";
import { m } from "@/lib/i18n";
import {
  type Closure,
  generateSessions,
  isValidSlot,
  planReschedule,
  type Session,
  type Slot,
} from "@/lib/schedule";
import { GradingFields } from "./grading-fields";
import { draftFromSlots, ScheduleFields, slotsOf } from "./schedule-fields";
import { TeacherPicker } from "./teacher-picker";

export function ClassEditForm({
  classId,
  initial,
  sessions,
  staff,
  closures,
}: {
  classId: string;
  initial: {
    name: string;
    capacity: number | null;
    startsOn: string;
    endsOn: string;
    slots: Slot[];
    rules: GradingRules;
    teacherIds: string[];
  };
  sessions: readonly (Session & { id: string; locked: boolean })[];
  staff: readonly { id: string; name: string }[];
  closures: readonly Closure[];
}) {
  const router = useRouter();
  const today = useToday();
  const [name, setName] = useState(initial.name);
  const [capacity, setCapacity] = useState(
    initial.capacity === null ? "" : String(initial.capacity),
  );
  const [schedule, setSchedule] = useState(() =>
    draftFromSlots(initial.slots, initial.startsOn, initial.endsOn),
  );
  const [rules, setRules] = useState(initial.rules);
  const [teacherIds, setTeacherIds] = useState(initial.teacherIds);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  const slots = slotsOf(schedule);
  const from = today > schedule.startsOn ? today : schedule.startsOn;
  const periodOk =
    schedule.endsOn >= schedule.startsOn &&
    schedule.endsOn <= addDays(schedule.startsOn, 730);
  const generated =
    periodOk && slots.every(isValidSlot)
      ? generateSessions({
          startsOn: schedule.startsOn,
          endsOn: schedule.endsOn,
          slots,
          closures,
          holidays: holidaysBetween(schedule.startsOn, schedule.endsOn),
        }).included
      : [];
  const plan = planReschedule(sessions, generated, from);
  const changed = plan.added.length > 0 || plan.removed.length > 0;

  function submit() {
    const found: Record<string, string | undefined> = {};
    if (!name.trim()) found.name = m.wizard.errors.name;
    if (!periodOk) found.endsOn = m.wizard.errors.dates;
    if (schedule.days.length === 0) found.days = m.wizard.errors.days;
    if (!slots.every(isValidSlot)) found.time = m.wizard.errors.time;
    setErrors(found);
    const first = Object.values(found).find(Boolean);
    if (first) {
      setStatus(first);
      return;
    }
    startTransition(async () => {
      const result = await attempt(
        updateClass({
          id: classId,
          name,
          startsOn: schedule.startsOn,
          endsOn: schedule.endsOn,
          slots,
          capacity: capacity ? Number(capacity) : null,
          teacherIds,
          rules,
          removeSessionIds: plan.removed.map((session) => session.id),
          addSessions: plan.added,
        }),
        failed,
      );
      if (!result.ok) {
        const message =
          Object.values(result.errors ?? {})[0]?.[0] ??
          result.message ??
          m.common.tryAgain;
        setStatus(message);
        return;
      }
      toast.add({ title: m.classes.saved, type: "success" });
      router.replace(`/turmas/${classId}`);
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col"
    >
      <FlowHeader
        title={m.classes.edit}
        subtitle={initial.name}
        fallback="/turmas"
      />
      <div className="flex flex-1 flex-col gap-8 px-4 pt-4 pb-40">
        <TextField
          label={m.wizard.name}
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <TextField
          label={m.wizard.capacity}
          hint={m.wizard.capacityHint}
          type="number"
          inputMode="numeric"
          min={1}
          max={500}
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          className="max-w-48"
        />
        <section aria-labelledby="horarios" className="flex flex-col gap-4">
          <h2 id="horarios" className="text-title3 font-semibold">
            {m.classes.schedule}
          </h2>
          <ScheduleFields
            value={schedule}
            onChange={setSchedule}
            errors={{
              endsOn: errors.endsOn,
              days: errors.days,
              time: errors.time,
            }}
            lockStart
          />
          {changed && (
            <p
              aria-live="polite"
              className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-subhead"
            >
              <InfoIcon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-link"
              />
              {m.wizard.reschedule(plan.removed.length, plan.added.length)}
            </p>
          )}
        </section>
        <section aria-labelledby="professores" className="flex flex-col gap-4">
          <h2 id="professores" className="text-title3 font-semibold">
            {m.classes.teachers}
          </h2>
          <TeacherPicker
            name={`${classId}-teachers`}
            staff={staff}
            values={teacherIds}
            onChange={setTeacherIds}
          />
        </section>
        <section aria-labelledby="avaliacao" className="flex flex-col gap-4">
          <h2 id="avaliacao" className="text-title3 font-semibold">
            {m.classes.rule}
          </h2>
          <GradingFields value={rules} onChange={setRules} />
        </section>
      </div>
      <FlowBar status={status}>
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? m.common.saving : m.common.save}
        </Button>
      </FlowBar>
    </form>
  );
}
