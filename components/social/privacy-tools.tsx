"use client";

import { DownloadIcon, UserRoundXIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { TextField } from "@/components/forms/text-field";
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
import { useToday } from "@/hooks/use-today";
import {
  anonymizeStudent,
  exportStudent,
  recordConsent,
  revokeConsent,
  saveCpf,
} from "@/lib/actions/social";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { formatCpf } from "@/lib/people";

const p = m.privacyTools;
type ConsentKind = keyof typeof p.consentKinds;

export function CpfForm({
  studentId,
  cpf,
}: {
  studentId: string;
  cpf: string | null;
}) {
  const [value, setValue] = useState(cpf ? formatCpf(cpf) : "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await attempt(saveCpf(studentId, value), failed);
          if (!result.ok) {
            setError(result.errors?.cpf?.[0] ?? result.message);
            return;
          }
          setError(undefined);
          toast.add({ title: p.cpfSaved, type: "success" });
        });
      }}
      className="flex flex-col gap-3 rounded-2xl bg-card p-4"
    >
      <TextField
        label={p.cpf}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(formatCpf(event.target.value))}
        error={error}
        className="max-w-56"
      />
      <Button
        type="submit"
        variant="secondary"
        size="lg"
        className="self-start"
        disabled={pending}
        focusableWhenDisabled
      >
        {p.cpfSave}
      </Button>
    </form>
  );
}

export function ConsentRow({
  studentId,
  kind,
  consent,
}: {
  studentId: string;
  kind: ConsentKind;
  consent: { id: string; signedOn: string; label: string } | null;
}) {
  const today = useToday();
  const [pending, startTransition] = useTransition();
  const label = p.consentKinds[kind];

  return (
    <li className="flex min-h-15 flex-wrap items-center justify-between gap-3 px-4 py-3">
      <span className="flex min-w-0 flex-col">
        <span className="text-body font-medium">{label}</span>
        <span className="text-footnote text-muted-foreground">
          {consent ? consent.label : p.notSigned}
        </span>
      </span>
      <Button
        type="button"
        variant={consent ? "ghost" : "secondary"}
        size="lg"
        aria-label={consent ? p.revoke(label) : p.record(label)}
        disabled={pending}
        focusableWhenDisabled
        onClick={() =>
          startTransition(async () => {
            const result = await attempt(
              consent
                ? revokeConsent(consent.id, today)
                : recordConsent(studentId, kind, today),
              failed,
            );
            toast.add(
              result.ok
                ? { title: consent ? p.revoked : p.recorded, type: "success" }
                : { title: result.message ?? m.common.tryAgain, type: "error" },
            );
          })
        }
      >
        {consent ? p.revokeShort : p.recordShort}
      </Button>
    </li>
  );
}

export function ExportButton({
  studentId,
  fileName,
}: {
  studentId: string;
  fileName: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="self-start"
      disabled={pending}
      focusableWhenDisabled
      onClick={() =>
        startTransition(async () => {
          const result = await attempt(exportStudent(studentId), failed);
          if (!result.ok) {
            toast.add({
              title: result.message ?? m.common.tryAgain,
              type: "error",
            });
            return;
          }
          const url = URL.createObjectURL(
            new Blob([result.json], { type: "application/json" }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = `${fileName}.json`;
          link.click();
          URL.revokeObjectURL(url);
          toast.add({ title: p.exported, type: "success" });
        })
      }
    >
      <DownloadIcon aria-hidden="true" />
      {p.export}
    </Button>
  );
}

export function AnonymizeButton({ studentId }: { studentId: string }) {
  const [word, setWord] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="lg" className="self-start" />
        }
      >
        <UserRoundXIcon aria-hidden="true" />
        {p.anonymize}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{p.anonymizeTitle}</AlertDialogTitle>
          <AlertDialogDescription>{p.anonymizeText}</AlertDialogDescription>
        </AlertDialogHeader>
        <TextField
          label={p.anonymizeConfirmLabel}
          autoComplete="off"
          value={word}
          onChange={(event) => setWord(event.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">{m.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            disabled={pending || word.trim().toUpperCase() !== p.anonymizeWord}
            onClick={() =>
              startTransition(async () => {
                const result = await attempt(
                  anonymizeStudent(studentId),
                  failed,
                );
                toast.add(
                  result.ok
                    ? { title: p.anonymized, type: "success" }
                    : {
                        title: result.message ?? m.common.tryAgain,
                        type: "error",
                      },
                );
              })
            }
          >
            {p.anonymize}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
