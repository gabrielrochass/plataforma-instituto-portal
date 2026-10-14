"use client";

import { CircleAlertIcon, InfoIcon, UsersRoundIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { CheckChips } from "@/components/forms/check-chips";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { fieldErrors } from "@/lib/action-result";
import {
  enrollStudent,
  registerStudent,
  saveStudentPhoto,
} from "@/lib/actions/students";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { formatCpf, formatPhone, isMinor } from "@/lib/people";
import { accessibilityKinds, studentInput } from "@/lib/schemas/students";
import { useStudentSearch } from "../enrollment/student-search";
import { type GuardianDraft, GuardianFields } from "./guardian-fields";
import { NewPhotoField, photoForm } from "./photo-field";

export type ClassChoice = { id: string; label: string; startsOn: string };

export function StudentForm({
  classes,
  units,
  presetClassId,
  canSkipClass,
}: {
  classes: readonly ClassChoice[];
  units: readonly { id: string; name: string }[];
  presetClassId: string | null;
  canSkipClass: boolean;
}) {
  const router = useRouter();
  const today = useToday();
  const [id] = useState(() => crypto.randomUUID());
  const [enrollmentId] = useState(() => crypto.randomUUID());
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [fullName, setFullName] = useState("");
  const [usesSocial, setUsesSocial] = useState(false);
  const [socialName, setSocialName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guardians, setGuardians] = useState<GuardianDraft[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [accessibilityNotes, setAccessibilityNotes] = useState("");
  const [notesForTeachers, setNotesForTeachers] = useState("");
  const [classId, setClassId] = useState(presetClassId ?? "");
  const [unitId, setUnitId] = useState(units.length === 1 ? units[0].id : "");
  const [enrolledOn, setEnrolledOn] = useState("");
  const [consentData, setConsentData] = useState(false);
  const [consentImage, setConsentImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  const query = cpf.replace(/\D/g, "").length === 11 ? cpf : fullName;
  const { matches, pending: searching } = useStudentSearch(query);
  const minor = birthDate ? isMinor(birthDate, today) : false;

  function input() {
    return {
      id,
      fullName,
      socialName: usesSocial ? socialName : "",
      birthDate,
      cpf,
      phone,
      email,
      guardians: guardians.map(({ key: _key, ...guardian }) => guardian),
      accessibility: accessibility as (typeof accessibilityKinds)[number][],
      accessibilityNotes,
      notesForTeachers,
      unitId: classId ? null : unitId || null,
      classId: classId || null,
      enrollmentId,
      enrolledOn: classId ? enrolledOn || today : null,
      consentData: consentData as true,
      consentImage,
    };
  }

  function next() {
    const parsed = studentInput.safeParse(input());
    const found: Record<string, string | undefined> = parsed.success
      ? {}
      : Object.fromEntries(
          Object.entries(fieldErrors(parsed.error)).map(([key, value]) => [
            key,
            value?.[0],
          ]),
        );
    if (minor && guardians.length === 0) {
      found.guardians = m.studentForm.errors.guardian;
    }
    if (!minor && !phone.trim() && guardians.length === 0) {
      found.phone = m.studentForm.errors.contact;
    }
    if (!classId && !canSkipClass) {
      found.classId = m.studentForm.errors.classRequired;
    }
    setErrors(found);
    const first = Object.values(found).find(Boolean);
    setStatus(first ?? "");
    if (first) return;
    submit();
  }

  function submit() {
    startTransition(async () => {
      const result = await attempt(registerStudent(input()), failed);
      if (!result.ok) {
        const found = Object.fromEntries(
          Object.entries(result.errors ?? {}).map(([key, value]) => [
            key,
            value?.[0],
          ]),
        );
        setErrors(found);
        setStatus(
          Object.values(found)[0] ?? result.message ?? m.common.tryAgain,
        );
        return;
      }
      if (photo) {
        const saved = await attempt(
          saveStudentPhoto(id, photoForm(photo)),
          failed,
        );
        if (!saved.ok) {
          toast.add({ title: m.studentForm.photoFailed, type: "error" });
        }
      }
      toast.add({
        title: m.students.registered(fullName.trim()),
        type: "success",
      });
      router.replace(`/alunos/${id}` as Route);
    });
  }

  function enrollExisting(studentId: string, name: string) {
    startTransition(async () => {
      const result = await attempt(
        enrollStudent(crypto.randomUUID(), studentId, classId),
        failed,
      );
      if (!result.ok) {
        setStatus(result.message ?? m.common.tryAgain);
        return;
      }
      toast.add({ title: m.enrollment.enrolled(name), type: "success" });
      router.replace(`/turmas/${classId}/alunos` as Route);
    });
  }

  const chosenClass = classes.find((option) => option.id === classId);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        next();
      }}
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col"
    >
      <FlowHeader title={m.students.new} fallback="/alunos" />
      <div className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-40">
        <section aria-labelledby={`${id}-who`} className="flex flex-col gap-5">
          <h2 id={`${id}-who`} className="text-title3 font-semibold">
            {m.studentForm.whoQuestion}
          </h2>
          <NewPhotoField name={fullName} value={photo} onChange={setPhoto} />
          <TextField
            label={m.studentForm.fullName}
            value={fullName}
            maxLength={120}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(event) => setFullName(event.target.value)}
            error={errors.fullName}
          />
          <div className="flex min-h-11 items-center justify-between gap-4">
            <label htmlFor={`${id}-social`} className="text-body">
              {m.studentForm.socialNameToggle}
            </label>
            <Switch
              id={`${id}-social`}
              checked={usesSocial}
              onCheckedChange={setUsesSocial}
            />
          </div>
          {usesSocial && (
            <TextField
              label={m.studentForm.socialName}
              hint={m.studentForm.socialNameHint}
              value={socialName}
              maxLength={120}
              autoComplete="off"
              onChange={(event) => setSocialName(event.target.value)}
            />
          )}
          <TextField
            label={m.studentForm.birthDate}
            type="date"
            min="1900-01-01"
            max={today}
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            error={errors.birthDate}
            className="max-w-56"
          />
          <TextField
            label={m.studentForm.cpf}
            hint={m.studentForm.cpfHint}
            inputMode="numeric"
            autoComplete="off"
            value={cpf}
            onChange={(event) => setCpf(formatCpf(event.target.value))}
            error={errors.cpf}
            className="max-w-56"
          />
          {(matches.length > 0 || searching) && (
            <section
              aria-labelledby={`${id}-dupes`}
              aria-live="polite"
              className="flex flex-col gap-3 rounded-2xl bg-warning/10 p-4"
            >
              <h3
                id={`${id}-dupes`}
                className="flex items-start gap-2 text-headline font-semibold"
              >
                <CircleAlertIcon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-warning"
                />
                {m.studentForm.duplicates}
              </h3>
              <p className="text-subhead">{m.studentForm.duplicatesHint}</p>
              <ul className="divide-y overflow-hidden rounded-xl bg-card">
                {matches.map((match) => (
                  <li
                    key={match.id}
                    className="flex min-h-15 flex-wrap items-center gap-3 px-4 py-2"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-body font-medium">
                        {match.name}
                      </span>
                      <span className="text-footnote text-muted-foreground">
                        {m.studentForm.matchDetail(
                          match.birthYear,
                          match.unitCode,
                        )}
                      </span>
                    </span>
                    {classId ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        disabled={pending}
                        onClick={() => enrollExisting(match.id, match.name)}
                      >
                        {m.studentForm.enrollExisting}
                      </Button>
                    ) : match.visible ? (
                      <Link
                        href={`/alunos/${match.id}` as Route}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "lg",
                        })}
                      >
                        {m.studentForm.openExisting}
                      </Link>
                    ) : (
                      <span className="text-footnote text-muted-foreground">
                        {m.studentForm.notVisible}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        <section
          aria-labelledby={`${id}-contact`}
          className="flex flex-col gap-5"
        >
          <h2 id={`${id}-contact`} className="text-title3 font-semibold">
            {m.studentForm.contactQuestion}
          </h2>
          <p className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-subhead">
            <InfoIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-link"
            />
            {minor ? m.studentForm.minorNotice : m.studentForm.adultNotice}
          </p>
          <TextField
            label={minor ? m.studentForm.phoneOptional : m.studentForm.phone}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
            error={errors.phone}
          />
          <TextField
            label={m.studentForm.email}
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <section
            aria-labelledby={`${id}-guardians`}
            className="flex flex-col gap-3"
          >
            <h3 id={`${id}-guardians`} className="text-title3 font-semibold">
              {m.students.guardians}
            </h3>
            <GuardianFields
              guardians={guardians}
              onChange={setGuardians}
              errors={errors}
              minimum={minor ? 1 : 0}
            />
          </section>
        </section>

        <section
          aria-labelledby={`${id}-class-title`}
          className="flex flex-col gap-5"
        >
          <h2 id={`${id}-class-title`} className="text-title3 font-semibold">
            {m.studentForm.classQuestion}
          </h2>
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${id}-class`}
              className="text-footnote font-medium text-muted-foreground"
            >
              {canSkipClass ? m.studentForm.classOptional : m.classes.title}
            </label>
            <NativeSelect
              id={`${id}-class`}
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              aria-invalid={errors.classId ? true : undefined}
            >
              <option value="">
                {canSkipClass
                  ? m.studentForm.noClass
                  : m.studentForm.noClassForTeacher}
              </option>
              {classes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
            {errors.classId && (
              <p className="text-footnote text-destructive">{errors.classId}</p>
            )}
          </div>
          {chosenClass && chosenClass.startsOn < today && (
            <TextField
              label={m.studentForm.enrolledOn}
              hint={m.studentForm.enrolledOnHint}
              type="date"
              min={chosenClass.startsOn}
              max={today}
              value={enrolledOn || today}
              onChange={(event) => setEnrolledOn(event.target.value)}
              error={errors.enrolledOn}
              className="max-w-56"
            />
          )}
          {!classId && canSkipClass && units.length > 1 && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${id}-unit`}
                className="text-footnote font-medium text-muted-foreground"
              >
                {m.studentForm.unit}
              </label>
              <NativeSelect
                id={`${id}-unit`}
                value={unitId}
                onChange={(event) => setUnitId(event.target.value)}
                aria-invalid={errors.unitId ? true : undefined}
              >
                <option value="" />
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </NativeSelect>
              {errors.unitId && (
                <p className="text-footnote text-destructive">
                  {errors.unitId}
                </p>
              )}
            </div>
          )}
        </section>

        <details className="rounded-2xl bg-card">
          <summary className="flex min-h-15 cursor-pointer items-center px-4 py-3 text-body font-medium">
            {m.studentForm.classroomQuestion}
          </summary>
          <div className="flex flex-col gap-5 px-4 pb-4">
            <p className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-subhead">
              <UsersRoundIcon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-link"
              />
              {m.students.classroomHint}
            </p>
            <CheckChips
              legend={m.studentForm.accessibilityLegend}
              name={`${id}-accessibility`}
              values={accessibility}
              onChange={setAccessibility}
              options={accessibilityKinds.map((kind) => ({
                value: kind,
                label: m.studentForm.accessibilityKinds[kind],
              }))}
            />
            <TextAreaField
              label={m.studentForm.accessibilityNotes}
              value={accessibilityNotes}
              maxLength={500}
              onChange={(event) => setAccessibilityNotes(event.target.value)}
            />
            <TextAreaField
              label={m.studentForm.notesForTeachers}
              value={notesForTeachers}
              maxLength={1000}
              onChange={(event) => setNotesForTeachers(event.target.value)}
            />
          </div>
        </details>

        <fieldset className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-2">
          <legend className="sr-only">{m.studentForm.consents}</legend>
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id={`${id}-consent-data`}
              checked={consentData}
              onCheckedChange={(checked) => setConsentData(checked === true)}
              aria-invalid={errors.consentData ? true : undefined}
            />
            <label htmlFor={`${id}-consent-data`} className="text-body">
              {m.studentForm.consentData}
            </label>
          </div>
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id={`${id}-consent-image`}
              checked={consentImage}
              onCheckedChange={(checked) => setConsentImage(checked === true)}
            />
            <label htmlFor={`${id}-consent-image`} className="text-body">
              {m.studentForm.consentImage}
            </label>
          </div>
          {errors.consentData && (
            <p className="pb-2 text-footnote text-destructive">
              {errors.consentData}
            </p>
          )}
        </fieldset>
      </div>

      <FlowBar status={status}>
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? m.studentForm.registering : m.studentForm.register}
        </Button>
      </FlowBar>
    </form>
  );
}
