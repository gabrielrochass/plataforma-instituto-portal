"use client";

import { useId } from "react";
import { CheckChips } from "@/components/forms/check-chips";
import { TextField } from "@/components/forms/text-field";
import { Switch } from "@/components/ui/switch";
import { m } from "@/lib/i18n";
import { type Slot, type Weekday, weekdays } from "@/lib/schedule";

export type ScheduleDraft = {
  startsOn: string;
  endsOn: string;
  days: Weekday[];
  sameTime: boolean;
  time: { startsAt: string; endsAt: string };
  times: Partial<Record<Weekday, { startsAt: string; endsAt: string }>>;
};

export function slotsOf(draft: ScheduleDraft): Slot[] {
  return [...draft.days]
    .sort((a, b) => a - b)
    .map((weekday) => ({
      weekday,
      ...(draft.sameTime ? draft.time : (draft.times[weekday] ?? draft.time)),
    }));
}

export function draftFromSlots(
  slots: readonly Slot[],
  startsOn: string,
  endsOn: string,
): ScheduleDraft {
  const first = slots[0] ?? { startsAt: "08:00", endsAt: "10:00" };
  const sameTime = slots.every(
    (slot) => slot.startsAt === first.startsAt && slot.endsAt === first.endsAt,
  );
  return {
    startsOn,
    endsOn,
    days: slots.map((slot) => slot.weekday),
    sameTime,
    time: { startsAt: first.startsAt, endsAt: first.endsAt },
    times: Object.fromEntries(
      slots.map((slot) => [
        slot.weekday,
        { startsAt: slot.startsAt, endsAt: slot.endsAt },
      ]),
    ),
  };
}

function TimePair({
  label,
  value,
  onChange,
  error,
}: {
  label?: string;
  value: { startsAt: string; endsAt: string };
  onChange: (value: { startsAt: string; endsAt: string }) => void;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      {label && (
        <legend className="mb-2 text-subhead font-semibold">{label}</legend>
      )}
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={m.wizard.startsAt}
          type="time"
          value={value.startsAt}
          onChange={(event) =>
            onChange({ ...value, startsAt: event.target.value })
          }
        />
        <TextField
          label={m.wizard.endsAt}
          type="time"
          value={value.endsAt}
          onChange={(event) =>
            onChange({ ...value, endsAt: event.target.value })
          }
          error={error}
        />
      </div>
    </fieldset>
  );
}

export function ScheduleFields({
  value,
  onChange,
  errors,
  lockStart = false,
}: {
  value: ScheduleDraft;
  onChange: (value: ScheduleDraft) => void;
  errors: Partial<Record<"endsOn" | "days" | "time", string>>;
  lockStart?: boolean;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={m.wizard.startsOn}
          type="date"
          min="2000-01-01"
          max="2100-12-31"
          value={value.startsOn}
          disabled={lockStart}
          onChange={(event) =>
            onChange({ ...value, startsOn: event.target.value })
          }
        />
        <TextField
          label={m.wizard.endsOn}
          type="date"
          min={value.startsOn || "2000-01-01"}
          max="2100-12-31"
          value={value.endsOn}
          onChange={(event) =>
            onChange({ ...value, endsOn: event.target.value })
          }
          error={errors.endsOn}
        />
      </div>
      <CheckChips
        legend={m.wizard.days}
        name={`${id}-days`}
        values={value.days.map(String)}
        onChange={(days) =>
          onChange({ ...value, days: days.map(Number) as Weekday[] })
        }
        options={weekdays.map((day) => ({
          value: String(day),
          label: m.schedule.weekdaysShort[day - 1],
        }))}
        error={errors.days}
      />
      {value.days.length > 1 && (
        <div className="flex min-h-11 items-center justify-between gap-4">
          <label htmlFor={`${id}-same`} className="text-body">
            {m.wizard.sameTime}
          </label>
          <Switch
            id={`${id}-same`}
            checked={value.sameTime}
            onCheckedChange={(sameTime) => onChange({ ...value, sameTime })}
          />
        </div>
      )}
      {value.sameTime || value.days.length <= 1 ? (
        <TimePair
          value={value.time}
          onChange={(time) => onChange({ ...value, time })}
          error={errors.time}
        />
      ) : (
        [...value.days]
          .sort((a, b) => a - b)
          .map((day) => (
            <TimePair
              key={day}
              label={m.wizard.timeFor(m.schedule.weekdays[day - 1])}
              value={value.times[day] ?? value.time}
              onChange={(time) =>
                onChange({ ...value, times: { ...value.times, [day]: time } })
              }
              error={errors.time}
            />
          ))
      )}
    </div>
  );
}
