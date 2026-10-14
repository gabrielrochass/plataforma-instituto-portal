"use client";

import { useState, useTransition } from "react";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { addCaseNote } from "@/lib/actions/attendance";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

type Kind = keyof typeof m.notes.kinds;

export function NoteComposer({
  studentId,
  kinds,
  initialKind,
}: {
  studentId: string;
  kinds: readonly Kind[];
  initialKind: Kind;
}) {
  const today = useToday();
  const [id, setId] = useState(() => crypto.randomUUID());
  const [kind, setKind] = useState<Kind>(initialKind);
  const [happenedOn, setHappenedOn] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        addCaseNote({
          id,
          studentId,
          kind,
          happenedOn: happenedOn || today,
          body,
        }),
        failed,
      );
      if (!result.ok) {
        setError(
          result.errors?.body?.[0] ?? result.message ?? m.common.tryAgain,
        );
        return;
      }
      setError(undefined);
      setId(crypto.randomUUID());
      setBody("");
      toast.add({ title: m.notes.saved, type: "success" });
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5 rounded-2xl bg-card p-4"
    >
      <ChoiceChips
        legend={m.notes.kind}
        name="note-kind"
        value={kind}
        onChange={(value) => setKind(value as Kind)}
        options={kinds.map((option) => ({
          value: option,
          label: m.notes.kinds[option],
        }))}
      />
      <TextField
        label={m.notes.happenedOn}
        type="date"
        max={today}
        value={happenedOn || today}
        onChange={(event) => setHappenedOn(event.target.value)}
        className="max-w-56"
      />
      <TextAreaField
        label={m.notes.body}
        placeholder={m.notes.bodyPlaceholder}
        value={body}
        maxLength={4000}
        onChange={(event) => setBody(event.target.value)}
        error={error}
      />
      <Button type="submit" size="lg" disabled={pending} focusableWhenDisabled>
        {pending ? m.common.saving : m.notes.save}
      </Button>
    </form>
  );
}
