"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { createClass } from "@/lib/actions/classes";
import { attempt, failed } from "@/lib/attempt";
import { addDays, formatFullDate } from "@/lib/dates";
import { type GradingRules, gradingRules, ruleSentence } from "@/lib/grading";
import { holidaysBetween } from "@/lib/holidays";
import { m } from "@/lib/i18n";
import type { Unit } from "@/lib/roles";
import {
  type Closure,
  generateSessions,
  isValidSlot,
  maxSessions,
  scheduleSummary,
} from "@/lib/schedule";
import { GradingFields } from "./grading-fields";
import { type ScheduleDraft, ScheduleFields, slotsOf } from "./schedule-fields";
import { SessionsPreview, sessionKey } from "./sessions-preview";
import { TeacherPicker } from "./teacher-picker";

type CourseOption = {
  id: string;
  name: string;
  workloadHours: number;
  rules: GradingRules;
};

type Step = 1 | 2 | 3 | 4 | 5;

const total = 5;

export function ClassWizard({
  courses,
  units,
  staffByUnit,
  closures,
  viewerId,
  teacherUnitIds,
}: {
  courses: readonly CourseOption[];
  units: readonly Unit[];
  staffByUnit: Record<string, { id: string; name: string }[]>;
  closures: readonly (Closure & { unitId: string | null })[];
  viewerId: string;
  teacherUnitIds: readonly string[];
}) {
  const router = useRouter();
  const today = useToday();
  const [id] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState<Step>(1);
  const [courseId, setCourseId] = useState("");
  const [unitId, setUnitId] = useState(units.length === 1 ? units[0].id : "");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [schedule, setSchedule] = useState<ScheduleDraft>({
    startsOn: "",
    endsOn: "",
    days: [],
    sameTime: true,
    time: { startsAt: "08:00", endsAt: "10:00" },
    times: {},
  });
  const [skipped, setSkipped] = useState<string[]>([]);
  const [rules, setRules] = useState<GradingRules | null>(null);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  const course = courses.find((candidate) => candidate.id === courseId);
  const slots = slotsOf(schedule);
  const viewerTeaches = teacherUnitIds.includes(unitId);
  const staff = (staffByUnit[unitId] ?? []).filter(
    (person) => person.id !== viewerId || !viewerTeaches,
  );

  const periodOk =
    schedule.startsOn !== "" &&
    schedule.endsOn >= schedule.startsOn &&
    schedule.endsOn <= addDays(schedule.startsOn, 730);
  const generated = periodOk
    ? generateSessions({
        startsOn: schedule.startsOn,
        endsOn: schedule.endsOn,
        slots: slots.filter(isValidSlot),
        closures: closures.filter(
          (closure) => closure.unitId === null || closure.unitId === unitId,
        ),
        holidays: holidaysBetween(schedule.startsOn, schedule.endsOn),
      })
    : { included: [], excluded: [] };

  const sessions = generated.included.filter(
    (session) => !skipped.includes(sessionKey(session)),
  );

  function chooseCourse(next: string) {
    setCourseId(next);
    const picked = courses.find((candidate) => candidate.id === next);
    if (picked) {
      setRules(picked.rules);
      if (!name) setName(`${picked.name} ${today.slice(0, 4)}`);
    }
  }

  function validate(current: Step) {
    const found: Record<string, string | undefined> = {};
    if (current === 1) {
      if (!courseId) found.courseId = m.wizard.errors.course;
      if (!unitId) found.unitId = m.wizard.errors.unit;
      if (!name.trim()) found.name = m.wizard.errors.name;
      const seats = Number(capacity);
      if (capacity && (!Number.isInteger(seats) || seats < 1 || seats > 500)) {
        found.capacity = m.wizard.errors.capacity;
      }
    }
    if (current === 2) {
      if (!periodOk) found.endsOn = m.wizard.errors.dates;
      if (schedule.days.length === 0) found.days = m.wizard.errors.days;
      if (!slots.every(isValidSlot)) found.time = m.wizard.errors.time;
    }
    if (current === 3) {
      if (sessions.length === 0) found.sessions = m.wizard.noSessions;
      if (sessions.length > maxSessions)
        found.sessions = m.wizard.tooManySessions;
    }
    if (current === 4 && !gradingRules.safeParse(rules).success) {
      found.rules = m.grading.invalid;
    }
    setErrors(found);
    const first = Object.values(found).find(Boolean);
    setStatus(first ?? "");
    return !first;
  }

  function next() {
    if (!validate(step)) return;
    if (step < total) {
      setStep((step + 1) as Step);
      return;
    }
    submit();
  }

  function submit() {
    if (!rules) return;
    startTransition(async () => {
      const result = await attempt(
        createClass({
          id,
          courseId,
          unitId,
          name,
          startsOn: schedule.startsOn,
          endsOn: schedule.endsOn,
          slots,
          capacity: capacity ? Number(capacity) : null,
          teacherIds,
          rules,
          sessions,
        }),
        failed,
      );
      if (!result.ok) {
        const message =
          result.errors?.name?.[0] ??
          Object.values(result.errors ?? {})[0]?.[0] ??
          result.message ??
          m.common.tryAgain;
        setStatus(message);
        if (result.errors?.name) {
          setErrors({ name: result.errors.name[0] });
          setStep(1);
        }
        return;
      }
      toast.add({ title: m.classes.created(name.trim()), type: "success" });
      router.replace(`/turmas/${id}`);
    });
  }

  const questions: Record<Step, string> = {
    1: m.wizard.courseQuestion,
    2: m.wizard.periodQuestion,
    3: m.wizard.sessionsQuestion,
    4: m.wizard.gradingQuestion,
    5: m.wizard.reviewQuestion,
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        next();
      }}
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col"
    >
      <FlowHeader title={m.classes.new} fallback="/turmas" />
      <div
        key={step}
        className="flex flex-1 animate-step-in flex-col gap-7 px-4 pt-4 pb-40"
      >
        <div className="flex flex-col gap-1">
          <p className="text-footnote font-medium text-muted-foreground">
            {m.wizard.step(step, total)}
          </p>
          <h2
            ref={(element) => element?.focus()}
            tabIndex={-1}
            className="text-title1 font-bold tracking-tight text-balance"
          >
            {questions[step]}
          </h2>
        </div>

        {step === 1 && (
          <>
            {courses.length > 8 ? (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`${id}-course`}
                  className="text-footnote font-medium text-muted-foreground"
                >
                  {m.classes.course}
                </label>
                <NativeSelect
                  id={`${id}-course`}
                  value={courseId}
                  onChange={(event) => chooseCourse(event.target.value)}
                  aria-invalid={errors.courseId ? true : undefined}
                >
                  <option value="">{m.wizard.errors.course}</option>
                  {courses.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </NativeSelect>
                {errors.courseId && (
                  <p className="text-footnote text-destructive">
                    {errors.courseId}
                  </p>
                )}
              </div>
            ) : (
              <ChoiceChips
                legend={m.classes.course}
                name={`${id}-course`}
                value={courseId}
                onChange={chooseCourse}
                options={courses.map((option) => ({
                  value: option.id,
                  label: option.name,
                }))}
                error={errors.courseId}
              />
            )}
            {units.length > 1 && (
              <ChoiceChips
                legend={m.classes.unit}
                name={`${id}-unit`}
                value={unitId}
                onChange={(value) => {
                  setUnitId(value);
                  setTeacherIds([]);
                }}
                options={units.map((unit) => ({
                  value: unit.id,
                  label: unit.name,
                }))}
                error={errors.unitId}
              />
            )}
            <TextField
              label={m.wizard.name}
              hint={m.wizard.nameHint}
              value={name}
              maxLength={80}
              autoComplete="off"
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
              error={errors.capacity}
              className="max-w-48"
            />
          </>
        )}

        {step === 2 && (
          <ScheduleFields
            value={schedule}
            onChange={(value) => {
              setSchedule(value);
              setSkipped([]);
            }}
            errors={{
              endsOn: errors.endsOn,
              days: errors.days,
              time: errors.time,
            }}
          />
        )}

        {step === 3 && (
          <SessionsPreview
            sessions={generated.included}
            excluded={generated.excluded}
            skipped={skipped}
            onToggle={(key) =>
              setSkipped((current) =>
                current.includes(key)
                  ? current.filter((item) => item !== key)
                  : [...current, key],
              )
            }
            workloadHours={course?.workloadHours ?? null}
            today={today}
          />
        )}

        {step === 4 && rules && (
          <>
            <GradingFields value={rules} onChange={setRules} />
            {errors.rules && (
              <p className="text-footnote text-destructive">{errors.rules}</p>
            )}
          </>
        )}

        {step === 5 && (
          <>
            {viewerTeaches && (
              <p className="rounded-2xl bg-card p-4 text-subhead">
                {m.wizard.youTeach}
              </p>
            )}
            <TeacherPicker
              name={`${id}-teachers`}
              staff={staff}
              values={teacherIds}
              onChange={setTeacherIds}
            />
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {[
                [
                  m.wizard.courseStep,
                  `${course?.name ?? ""}. ${name.trim()}`,
                  1,
                ],
                [
                  m.wizard.periodStep,
                  `${m.classes.periodRange(
                    formatFullDate(schedule.startsOn),
                    formatFullDate(schedule.endsOn),
                  )}. ${scheduleSummary(slots)}`,
                  2,
                ],
                [
                  m.wizard.sessionsStep,
                  m.classes.sessionsCount(sessions.length),
                  3,
                ],
                [m.wizard.gradingStep, rules ? ruleSentence(rules) : "", 4],
              ].map(([label, text, target]) => (
                <li
                  key={String(target)}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-footnote font-medium text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-body">{text}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="text-link"
                    aria-label={m.wizard.editStep(String(label))}
                    onClick={() => setStep(target as Step)}
                  >
                    {m.common.edit}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <FlowBar status={status}>
        {step > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className={flowBarButton}
            onClick={() => {
              setStatus("");
              setStep((step - 1) as Step);
            }}
          >
            {m.wizard.back}
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {step < total
            ? m.wizard.next
            : pending
              ? m.wizard.creating
              : m.wizard.create}
        </Button>
      </FlowBar>
    </form>
  );
}
