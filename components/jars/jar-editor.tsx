"use client";

import { ArchiveIcon, ArchiveRestoreIcon, PlusIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { MoneyInput } from "@/components/forms/money-input";
import { ColorPicker, IconPicker } from "@/components/forms/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useGoBack } from "@/hooks/use-go-back";
import { saveJar, setJarArchived } from "@/lib/actions";
import { attempt, failed } from "@/lib/attempt";
import { categoryIcon } from "@/lib/category-icons";
import type { Jar } from "@/lib/data";
import { m } from "@/lib/i18n";
import { type PaletteColor, swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-footnote text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export function JarEditor({ jar }: { jar: Jar | null }) {
  const goBack = useGoBack("/cofrinhos");
  const [id] = useState(() => jar?.id ?? crypto.randomUUID());
  const [name, setName] = useState(jar?.name ?? "");
  const [icon, setIcon] = useState(jar?.icon ?? "piggy-bank");
  const [color, setColor] = useState((jar?.color ?? "chart-3") as PaletteColor);
  const [target, setTarget] = useState(jar?.target_cents ?? 0);
  const [targetDate, setTargetDate] = useState(jar?.target_date ?? "");
  const [planned, setPlanned] = useState(jar?.planned_monthly_cents ?? 0);
  const [opening, setOpening] = useState(0);
  const [nameError, setNameError] = useState<string>();
  const [status, setStatus] = useState("");
  const [saving, startSave] = useTransition();
  const [archiving, startArchive] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const archived = jar?.archived_at != null;
  const busy = saving || archiving;
  const Icon = categoryIcon(icon);

  function save() {
    startSave(async () => {
      const result = await attempt(
        saveJar(
          {
            id,
            name,
            icon,
            color,
            targetCents: target > 0 ? target : null,
            targetDate: targetDate || null,
            plannedMonthlyCents: planned > 0 ? planned : null,
            openingCents: jar === null && opening > 0 ? opening : null,
          },
          jar === null,
        ),
        failed,
      );
      if (!result.ok) {
        setNameError(result.errors?.name?.[0]);
        setStatus(result.errors?.targetDate?.[0] ?? result.message ?? "");
        if (result.errors?.name) nameRef.current?.focus();
        return;
      }
      toast.add({
        title: jar ? m.jars.jarSaved : m.jars.jarCreated,
        type: "success",
      });
      goBack();
    });
  }

  function toggleArchived() {
    if (!jar) return;
    startArchive(async () => {
      const result = await attempt(setJarArchived(jar.id, !archived), failed);
      if (!result.ok) {
        setStatus(result.message ?? m.common.tryAgain);
        return;
      }
      toast.add({
        title: archived
          ? m.settings.restoredToast(jar.name)
          : m.settings.archivedToast(jar.name),
      });
      goBack();
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="flex flex-col gap-8"
    >
      <div
        aria-hidden="true"
        className="flex flex-col items-center gap-3 rounded-3xl bg-card px-4 py-8"
      >
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-full text-swatch-foreground",
            swatch(color),
          )}
        >
          <Icon className="size-8" />
        </span>
        <span className="max-w-full truncate text-title2 font-bold tracking-tight">
          {name.trim() || m.jars.name}
        </span>
      </div>

      <Field id="jar-name" label={m.jars.name}>
        <Input
          ref={nameRef}
          id="jar-name"
          maxLength={40}
          autoComplete="off"
          placeholder={m.jars.namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "jar-name-error" : undefined}
          className="bg-card dark:bg-card"
        />
        {nameError && (
          <p id="jar-name-error" className="text-footnote text-destructive">
            {nameError}
          </p>
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="jar-goal" label={m.jars.goal} hint={m.jars.goalHint}>
          <MoneyInput
            id="jar-goal"
            value={target}
            onChange={setTarget}
            placeholder={m.jars.noGoal}
            aria-describedby="jar-goal-hint"
          />
        </Field>
        <Field
          id="jar-deadline"
          label={m.jars.deadline}
          hint={m.jars.deadlineHint}
        >
          <Input
            id="jar-deadline"
            type="date"
            min="2000-01-01"
            max="2100-12-31"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            aria-describedby="jar-deadline-hint"
            className="bg-card dark:bg-card"
          />
        </Field>
        <Field
          id="jar-planned"
          label={m.jars.planned}
          hint={m.jars.plannedHint}
        >
          <MoneyInput
            id="jar-planned"
            value={planned}
            onChange={setPlanned}
            aria-describedby="jar-planned-hint"
          />
        </Field>
        {jar === null && (
          <Field
            id="jar-opening"
            label={m.jars.opening}
            hint={m.jars.openingHint}
          >
            <MoneyInput
              id="jar-opening"
              value={opening}
              onChange={setOpening}
              aria-describedby="jar-opening-hint"
            />
          </Field>
        )}
      </div>

      <ColorPicker value={color} onChange={setColor} />
      <IconPicker value={icon} color={color} onChange={setIcon} />

      <div className="flex flex-col gap-3">
        <output className="block min-h-5 text-footnote text-muted-foreground">
          {status}
        </output>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {jar && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={busy}
              focusableWhenDisabled
              onClick={toggleArchived}
            >
              {archived ? (
                <ArchiveRestoreIcon aria-hidden="true" />
              ) : (
                <ArchiveIcon aria-hidden="true" />
              )}
              {archived ? m.settings.restore : m.settings.archive}
            </Button>
          )}
          <Button type="submit" size="lg" disabled={busy} focusableWhenDisabled>
            {!jar && <PlusIcon aria-hidden="true" />}
            {saving ? m.common.saving : jar ? m.common.save : m.jars.createJar}
          </Button>
        </div>
      </div>
    </form>
  );
}
