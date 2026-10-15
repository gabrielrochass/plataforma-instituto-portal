"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { CheckChips } from "@/components/forms/check-chips";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useFinish } from "@/hooks/use-finish";
import { useToday } from "@/hooks/use-today";
import { createClass, updateClass } from "@/lib/actions/classes";
import { attempt, failed } from "@/lib/attempt";
import { addDays } from "@/lib/dates";
import { type GradingRules, gradingRules, presets } from "@/lib/grading";
import { m } from "@/lib/i18n";
import type { Unit } from "@/lib/roles";
import { type Weekday, weekdays } from "@/lib/schedule";
import { GradingFields } from "./grading-fields";
import { TeacherPicker } from "./teacher-picker";

const f = m.classForm;

type Person = { id: string; name: string };

export type ClassFormValue = {
  unitId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  weekdays: Weekday[];
  workloadHours: string;
  capacity: string;
  teacherIds: string[];
  rules: GradingRules;
};

export function ClassForm({
  classId,
  initial,
  units,
  staffByUnit,
  viewerId,
  teacherUnitIds,
}: {
  classId?: string;
  initial?: ClassFormValue;
  units: readonly Unit[];
  staffByUnit: Record<string, Person[]>;
  viewerId: string;
  teacherUnitIds: readonly string[];
}) {
  const router = useRouter();
  const today = useToday();
  const sectionId = useId();
  const [id] = useState(() => classId ?? crypto.randomUUID());
  const [value, setValue] = useState<ClassFormValue>(
    () =>
      initial ?? {
        unitId: units.length === 1 ? units[0].id : "",
        name: "",
        startsOn: "",
        endsOn: "",
        weekdays: [],
        workloadHours: "",
        capacity: "",
        teacherIds: [],
        rules: presets.numeric_10,
      },
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const editing = classId !== undefined;
  const periodError = errors.startsOn ?? errors.endsOn;
  const finish = useFinish(`/turmas/${id}` as Route);
  const viewerTeaches = !editing && teacherUnitIds.includes(value.unitId);
  const staff = (staffByUnit[value.unitId] ?? []).filter(
    (person) => !viewerTeaches || person.id !== viewerId,
  );

  function set<K extends keyof ClassFormValue>(
    key: K,
    next: ClassFormValue[K],
  ) {
    setStatus("");
    setErrors((current) =>
      key === "startsOn" || key === "endsOn"
        ? { ...current, startsOn: undefined, endsOn: undefined }
        : { ...current, [key]: undefined },
    );
    setValue((current) => ({ ...current, [key]: next }));
  }

  function validate() {
    const found: Record<string, string | undefined> = {};
    if (!value.unitId) found.unitId = f.errors.unit;
    if (!value.name.trim()) found.name = f.errors.name;
    if (!value.startsOn) found.startsOn = f.errors.startsOn;
    if (!value.endsOn) found.endsOn = f.errors.endsOn;
    else if (value.startsOn && value.endsOn < value.startsOn) {
      found.endsOn = f.errors.dates;
    } else if (value.endsOn > addDays(value.startsOn || today, 730)) {
      found.endsOn = f.errors.tooLong;
    }
    if (value.weekdays.length === 0) found.weekdays = f.errors.days;
    const hours = Number(value.workloadHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 2000) {
      found.workloadHours = f.errors.workload;
    }
    const seats = Number(value.capacity);
    if (
      value.capacity &&
      (!Number.isInteger(seats) || seats < 1 || seats > 500)
    ) {
      found.capacity = f.errors.capacity;
    }
    if (!gradingRules.safeParse(value.rules).success) {
      found.rules = m.grading.invalid;
    }
    setErrors(found);
    const first = Object.values(found).find(Boolean);
    setStatus(first ?? "");
    return !first;
  }

  function submit() {
    if (!validate()) return;
    const payload = {
      id,
      name: value.name,
      startsOn: value.startsOn,
      endsOn: value.endsOn,
      weekdays: value.weekdays,
      workloadHours: Number(value.workloadHours),
      capacity: value.capacity ? Number(value.capacity) : null,
      teacherIds: value.teacherIds,
      rules: value.rules,
    };
    startTransition(async () => {
      const result = await attempt(
        editing
          ? updateClass(payload)
          : createClass({ ...payload, unitId: value.unitId }),
        failed,
      );
      if (!result.ok) {
        const found = Object.fromEntries(
          Object.entries(result.errors ?? {}).map(([key, list]) => [
            key,
            list?.[0],
          ]),
        );
        setErrors(found);
        setStatus(
          Object.values(found).find(Boolean) ??
            result.message ??
            m.common.tryAgain,
        );
        return;
      }
      toast.add({
        title: editing ? m.classes.saved : m.classes.created(value.name.trim()),
        type: "success",
      });
      if (editing) finish();
      else router.replace(`/turmas/${id}` as Route);
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
        title={editing ? f.editTitle : f.newTitle}
        fallback={(editing ? `/turmas/${id}` : "/turmas") as Route}
      />
      <div className="flex flex-1 flex-col gap-8 px-4 pt-4 pb-40">
        <section
          aria-labelledby={`${sectionId}-about`}
          className="flex flex-col gap-5"
        >
          <h2 id={`${sectionId}-about`} className="text-title3 font-semibold">
            {f.aboutSection}
          </h2>
          {!editing && units.length > 1 && (
            <ChoiceChips
              legend={f.unit}
              name="unidade"
              value={value.unitId}
              onChange={(next) => {
                set("unitId", next);
                set("teacherIds", []);
              }}
              options={units.map((unit) => ({
                value: unit.id,
                label: unit.name,
              }))}
              error={errors.unitId}
            />
          )}
          <TextField
            label={f.name}
            hint={f.nameHint}
            value={value.name}
            maxLength={80}
            autoComplete="off"
            onChange={(event) => set("name", event.target.value)}
            error={errors.name}
          />
          <div className="grid items-start gap-5 sm:grid-cols-2 sm:gap-4">
            <TextField
              label={f.workload}
              hint={f.workloadHint}
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              value={value.workloadHours}
              onChange={(event) => set("workloadHours", event.target.value)}
              error={errors.workloadHours}
            />
            <TextField
              label={f.capacity}
              hint={f.capacityHint}
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={value.capacity}
              onChange={(event) => set("capacity", event.target.value)}
              error={errors.capacity}
            />
          </div>
        </section>
        <section
          aria-labelledby={`${sectionId}-when`}
          className="flex flex-col gap-5"
        >
          <h2 id={`${sectionId}-when`} className="text-title3 font-semibold">
            {f.whenSection}
          </h2>
          <div className="flex flex-col gap-2">
            <div className="grid items-start gap-3 min-[360px]:grid-cols-2">
              <TextField
                label={f.startsOn}
                type="date"
                value={value.startsOn}
                onChange={(event) => set("startsOn", event.target.value)}
                aria-invalid={errors.startsOn ? true : undefined}
                aria-describedby={
                  periodError ? `${sectionId}-period` : undefined
                }
              />
              <TextField
                label={f.endsOn}
                type="date"
                min={value.startsOn || undefined}
                value={value.endsOn}
                onChange={(event) => set("endsOn", event.target.value)}
                aria-invalid={errors.endsOn ? true : undefined}
                aria-describedby={
                  periodError ? `${sectionId}-period` : undefined
                }
              />
            </div>
            {periodError && (
              <p
                id={`${sectionId}-period`}
                className="text-footnote text-destructive"
              >
                {periodError}
              </p>
            )}
          </div>
          <CheckChips
            legend={f.days}
            name="dias"
            values={value.weekdays.map(String)}
            onChange={(next) =>
              set(
                "weekdays",
                next.map(Number).sort((a, b) => a - b) as Weekday[],
              )
            }
            options={weekdays.map((day) => ({
              value: String(day),
              label: m.schedule.weekdaysShort[day - 1],
            }))}
            error={errors.weekdays}
          />
        </section>
        {value.unitId && (
          <section
            aria-labelledby={`${sectionId}-teachers`}
            className="flex flex-col gap-5"
          >
            <h2
              id={`${sectionId}-teachers`}
              className="text-title3 font-semibold"
            >
              {f.teachersSection}
            </h2>
            {viewerTeaches && (
              <p className="rounded-2xl bg-card p-4 text-subhead">
                {f.youTeach}
              </p>
            )}
            <TeacherPicker
              name="professores"
              staff={staff}
              values={value.teacherIds}
              onChange={(next) => set("teacherIds", next)}
            />
          </section>
        )}
        <section
          aria-labelledby={`${sectionId}-grading`}
          className="flex flex-col gap-5"
        >
          <h2 id={`${sectionId}-grading`} className="text-title3 font-semibold">
            {f.grading}
          </h2>
          <GradingFields
            value={value.rules}
            onChange={(next) => set("rules", next)}
          />
          {errors.rules && (
            <p className="text-footnote text-destructive">{errors.rules}</p>
          )}
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
          {pending ? m.common.saving : editing ? f.save : f.create}
        </Button>
      </FlowBar>
    </form>
  );
}
