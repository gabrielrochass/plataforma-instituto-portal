"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { addClosure, removeClosure } from "@/lib/actions/classes";
import { attempt, failed } from "@/lib/attempt";
import { formatFullDate } from "@/lib/dates";
import { m } from "@/lib/i18n";
import type { Unit } from "@/lib/roles";

export type ClosureItem = {
  id: string;
  unitName: string | null;
  startsOn: string;
  endsOn: string;
  reason: string;
};

export function ClosureList({ closures }: { closures: ClosureItem[] }) {
  const [pending, startTransition] = useTransition();

  if (closures.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
        {m.calendar.empty}
      </p>
    );
  }

  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {closures.map((closure) => (
        <li
          key={closure.id}
          className="flex min-h-15 items-center gap-3 px-4 py-3"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body font-medium">{closure.reason}</span>
            <span className="text-footnote text-muted-foreground">
              {m.calendar.range(
                formatFullDate(closure.startsOn),
                formatFullDate(closure.endsOn),
              )}
              {`. ${closure.unitName ?? m.calendar.allUnits}`}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={m.calendar.remove(closure.reason)}
            disabled={pending}
            focusableWhenDisabled
            onClick={() =>
              startTransition(async () => {
                const result = await attempt(removeClosure(closure.id), failed);
                toast.add(
                  result.ok
                    ? { title: m.calendar.removed, type: "success" }
                    : {
                        title: result.message ?? m.common.tryAgain,
                        type: "error",
                      },
                );
              })
            }
          >
            <Trash2Icon aria-hidden="true" className="size-5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function ClosureForm({
  units,
  allowAll,
}: {
  units: readonly Unit[];
  allowAll: boolean;
}) {
  const today = useToday();
  const [id, setId] = useState(() => crypto.randomUUID());
  const [reason, setReason] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [unitId, setUnitId] = useState(allowAll ? "" : (units[0]?.id ?? ""));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        addClosure({
          id,
          unitId: unitId || null,
          startsOn: startsOn || today,
          endsOn: endsOn || startsOn || today,
          reason,
        }),
        failed,
      );
      if (!result.ok) {
        setErrors({
          reason: result.errors?.reason?.[0],
          endsOn: result.errors?.endsOn?.[0],
          form: result.errors ? undefined : result.message,
        });
        return;
      }
      setErrors({});
      setId(crypto.randomUUID());
      setReason("");
      setStartsOn("");
      setEndsOn("");
      toast.add({ title: m.calendar.added, type: "success" });
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4 rounded-2xl bg-card p-5"
    >
      <TextField
        label={m.calendar.reason}
        placeholder={m.calendar.reasonPlaceholder}
        value={reason}
        maxLength={80}
        onChange={(event) => setReason(event.target.value)}
        error={errors.reason}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={m.calendar.from}
          type="date"
          min="2000-01-01"
          max="2100-12-31"
          value={startsOn}
          onChange={(event) => setStartsOn(event.target.value)}
        />
        <TextField
          label={m.calendar.to}
          type="date"
          min={startsOn || "2000-01-01"}
          max="2100-12-31"
          value={endsOn}
          onChange={(event) => setEndsOn(event.target.value)}
          error={errors.endsOn}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-unit`}
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.calendar.unit}
        </label>
        <NativeSelect
          id={`${id}-unit`}
          value={unitId}
          onChange={(event) => setUnitId(event.target.value)}
        >
          {allowAll && <option value="">{m.calendar.allUnits}</option>}
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {errors.form && (
        <p role="alert" className="text-subhead text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} focusableWhenDisabled>
        {m.calendar.add}
      </Button>
    </form>
  );
}
