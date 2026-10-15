"use client";

import { LockIcon } from "lucide-react";
import type { Route } from "next";
import { useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { CheckChips } from "@/components/forms/check-chips";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { MoneyInput } from "@/components/forms/money-input";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { useFinish } from "@/hooks/use-finish";
import { useToday } from "@/hooks/use-today";
import { type ProfileInput, saveSocialProfile } from "@/lib/actions/social";
import { attempt, failed } from "@/lib/attempt";
import type { SocialProfile } from "@/lib/ficha";
import { m } from "@/lib/i18n";

const s = m.social;

function Select<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: T | null;
  options: Partial<Record<T, string>>;
  onChange: (value: T | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {label}
      </label>
      <NativeSelect
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange((event.target.value || null) as T | null)}
      >
        <option value="">{s.notInformed}</option>
        {(Object.entries(options) as [T, string][]).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

function YesNo({
  name,
  legend,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <ChoiceChips
      legend={legend}
      name={name}
      value={value === null ? "unknown" : value ? "yes" : "no"}
      onChange={(next) => onChange(next === "unknown" ? null : next === "yes")}
      options={[
        { value: "yes", label: s.yes },
        { value: "no", label: s.no },
        { value: "unknown", label: s.notInformed },
      ]}
    />
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-5 rounded-2xl bg-card p-4"
    >
      <h2 id={id} className="text-headline font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SocialProfileForm({
  studentId,
  studentName,
  latest,
  consent,
}: {
  studentId: string;
  studentName: string;
  latest: SocialProfile | null;
  consent: boolean;
}) {
  const finish = useFinish(`/alunos/${studentId}/ficha` as Route);
  const today = useToday();
  const [value, setValue] = useState<
    Omit<ProfileInput, "studentId" | "assessedOn">
  >(() => ({
    moment: latest ? "follow_up" : "intake",
    neighborhood: latest?.neighborhood ?? "",
    city: latest?.city ?? "Recife",
    householdSize: latest?.household_size ?? null,
    householdIncomeCents: latest?.household_income_cents ?? null,
    housing: (latest?.housing as ProfileInput["housing"]) ?? null,
    benefits: (latest?.benefits ?? []) as ProfileInput["benefits"],
    hasInternet: latest?.has_internet ?? null,
    hasComputer: latest?.has_computer ?? null,
    schooling: (latest?.schooling as ProfileInput["schooling"]) ?? null,
    studyingNow: latest?.studying_now ?? null,
    work: (latest?.work as ProfileInput["work"]) ?? null,
    gender: (latest?.gender as ProfileInput["gender"]) ?? null,
    raceColor: consent
      ? ((latest?.race_color as ProfileInput["raceColor"]) ?? null)
      : null,
    disability: consent
      ? ((latest?.disability ?? []) as ProfileInput["disability"])
      : [],
    healthNotes: consent ? (latest?.health_notes ?? "") : "",
    notes: latest?.notes ?? "",
  }));
  const [assessedOn, setAssessedOn] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof value>(key: K, next: (typeof value)[K]) {
    setStatus("");
    setValue((current) => ({ ...current, [key]: next }));
  }

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        saveSocialProfile({
          ...value,
          studentId,
          assessedOn: assessedOn || today,
        }),
        failed,
      );
      if (!result.ok) {
        setStatus(
          result.message ??
            Object.values(result.errors ?? {})[0]?.[0] ??
            m.common.tryAgain,
        );
        return;
      }
      toast.add({ title: s.saved, type: "success" });
      finish();
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
        title={s.newTitle}
        subtitle={studentName}
        fallback={`/alunos/${studentId}/ficha` as Route}
      />
      <div className="flex flex-1 flex-col gap-5 px-4 pt-4 pb-40">
        <p className="text-subhead text-muted-foreground">{s.intro}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={s.assessedOn}
            type="date"
            max={today}
            value={assessedOn || today}
            onChange={(event) => setAssessedOn(event.target.value)}
          />
        </div>
        <ChoiceChips
          legend={s.moment}
          name="momento"
          value={value.moment}
          onChange={(next) => set("moment", next as ProfileInput["moment"])}
          options={(["intake", "follow_up", "exit"] as const).map((key) => ({
            value: key,
            label: s.moments[key],
          }))}
        />

        <Section id="familia" title={s.sections.family}>
          <TextField
            label={s.householdSize}
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={value.householdSize ?? ""}
            onChange={(event) =>
              set(
                "householdSize",
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            className="max-w-48"
          />
          <div className="flex flex-col gap-2">
            <label
              htmlFor="renda"
              className="text-footnote font-medium text-muted-foreground"
            >
              {s.householdIncome}
            </label>
            <MoneyInput
              id="renda"
              value={value.householdIncomeCents ?? 0}
              onChange={(cents) => set("householdIncomeCents", cents)}
            />
          </div>
          <CheckChips
            legend={s.benefits}
            name="beneficios"
            values={value.benefits ?? []}
            onChange={(next) =>
              set("benefits", next as ProfileInput["benefits"])
            }
            options={Object.entries(s.benefitKinds).map(([key, label]) => ({
              value: key,
              label,
            }))}
          />
        </Section>

        <Section id="moradia" title={s.sections.home}>
          <TextField
            label={s.neighborhood}
            maxLength={80}
            value={value.neighborhood ?? ""}
            onChange={(event) => set("neighborhood", event.target.value)}
          />
          <TextField
            label={s.city}
            maxLength={80}
            value={value.city ?? ""}
            onChange={(event) => set("city", event.target.value)}
          />
          <Select
            id="moradia-tipo"
            label={s.housing}
            value={value.housing ?? null}
            options={s.housingKinds}
            onChange={(next) => set("housing", next)}
          />
        </Section>

        <Section id="estudo" title={s.sections.study}>
          <Select
            id="escolaridade"
            label={s.schooling}
            value={value.schooling ?? null}
            options={s.schoolingLevels}
            onChange={(next) => set("schooling", next)}
          />
          <YesNo
            name="estuda"
            legend={s.studyingNow}
            value={value.studyingNow ?? null}
            onChange={(next) => set("studyingNow", next)}
          />
          <Select
            id="trabalho"
            label={s.work}
            value={value.work ?? null}
            options={s.workKinds}
            onChange={(next) => set("work", next)}
          />
        </Section>

        <Section id="digital" title={s.sections.digital}>
          <YesNo
            name="internet"
            legend={s.hasInternet}
            value={value.hasInternet ?? null}
            onChange={(next) => set("hasInternet", next)}
          />
          <YesNo
            name="computador"
            legend={s.hasComputer}
            value={value.hasComputer ?? null}
            onChange={(next) => set("hasComputer", next)}
          />
        </Section>

        <Section id="identidade" title={s.sections.identity}>
          <Select
            id="genero"
            label={s.gender}
            value={value.gender ?? null}
            options={s.genders}
            onChange={(next) => set("gender", next)}
          />
          <Select
            id="raca"
            label={s.raceColor}
            value={value.raceColor ?? null}
            options={consent ? s.races : { undeclared: s.races.undeclared }}
            onChange={(next) => set("raceColor", next)}
          />
        </Section>

        <Section id="saude" title={s.sections.health}>
          {consent ? (
            <>
              <CheckChips
                legend={s.disability}
                name="deficiencia"
                values={value.disability ?? []}
                onChange={(next) =>
                  set("disability", next as ProfileInput["disability"])
                }
                options={Object.entries(s.disabilities).map(([key, label]) => ({
                  value: key,
                  label,
                }))}
              />
              <TextAreaField
                label={s.healthNotes}
                maxLength={1000}
                value={value.healthNotes ?? ""}
                onChange={(event) => set("healthNotes", event.target.value)}
              />
            </>
          ) : (
            <p className="flex items-start gap-2 text-subhead text-muted-foreground">
              <LockIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {s.sensitiveLocked}
            </p>
          )}
        </Section>

        <TextAreaField
          label={s.notes}
          maxLength={4000}
          value={value.notes ?? ""}
          onChange={(event) => set("notes", event.target.value)}
        />
      </div>
      <FlowBar status={status}>
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? m.common.saving : s.save}
        </Button>
      </FlowBar>
    </form>
  );
}
