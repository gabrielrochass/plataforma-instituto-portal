"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { addOutcome, removeOutcome } from "@/lib/actions/social";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

const a = m.alumni;
type Kind = keyof typeof a.kinds;

export type OutcomeItem = {
  id: string;
  kind: Kind;
  date: string;
  detail: string;
};

export function OutcomeList({ items }: { items: readonly OutcomeItem[] }) {
  const [pending, startTransition] = useTransition();
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
        {a.empty}
      </p>
    );
  }
  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex min-h-15 items-center gap-3 px-4 py-3"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body font-medium">{a.kinds[item.kind]}</span>
            <span className="text-footnote text-muted-foreground">
              {item.detail}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={a.remove(a.kinds[item.kind], item.date)}
            disabled={pending}
            focusableWhenDisabled
            onClick={() =>
              startTransition(async () => {
                const result = await attempt(removeOutcome(item.id), failed);
                toast.add(
                  result.ok
                    ? { title: a.removed, type: "success" }
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

export function OutcomeForm({ studentId }: { studentId: string }) {
  const today = useToday();
  const [kind, setKind] = useState<Kind>("employed");
  const [observedOn, setObservedOn] = useState("");
  const [formalJob, setFormalJob] = useState(false);
  const [related, setRelated] = useState(false);
  const [organization, setOrganization] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const working = kind === "employed" || kind === "internship";
      const result = await attempt(
        addOutcome({
          studentId,
          kind,
          observedOn: observedOn || today,
          formalJob: working ? formalJob : null,
          relatedToCourse: working || kind === "self_employed" ? related : null,
          organization,
        }),
        failed,
      );
      if (!result.ok) {
        toast.add({
          title: result.message ?? m.common.tryAgain,
          type: "error",
        });
        return;
      }
      setOrganization("");
      toast.add({ title: a.added, type: "success" });
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4 rounded-2xl bg-card p-4"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="egresso-tipo"
          className="text-footnote font-medium text-muted-foreground"
        >
          {a.kind}
        </label>
        <NativeSelect
          id="egresso-tipo"
          value={kind}
          onChange={(event) => setKind(event.target.value as Kind)}
        >
          {(Object.keys(a.kinds) as Kind[]).map((key) => (
            <option key={key} value={key}>
              {a.kinds[key]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <TextField
        label={a.observedOn}
        type="date"
        max={today}
        value={observedOn || today}
        onChange={(event) => setObservedOn(event.target.value)}
        className="max-w-56"
      />
      {(kind === "employed" || kind === "internship") && (
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox
            id="egresso-carteira"
            checked={formalJob}
            onCheckedChange={(checked) => setFormalJob(checked === true)}
          />
          <label htmlFor="egresso-carteira" className="text-body">
            {a.formalJob}
          </label>
        </div>
      )}
      {(kind === "employed" ||
        kind === "internship" ||
        kind === "self_employed") && (
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox
            id="egresso-curso"
            checked={related}
            onCheckedChange={(checked) => setRelated(checked === true)}
          />
          <label htmlFor="egresso-curso" className="text-body">
            {a.relatedToCourse}
          </label>
        </div>
      )}
      <TextField
        label={a.organization}
        maxLength={120}
        value={organization}
        onChange={(event) => setOrganization(event.target.value)}
      />
      <Button type="submit" size="lg" disabled={pending} focusableWhenDisabled>
        {a.add}
      </Button>
    </form>
  );
}
