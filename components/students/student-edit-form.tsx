"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { CheckChips } from "@/components/forms/check-chips";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { fieldErrors } from "@/lib/action-result";
import { updateStudent } from "@/lib/actions/students";
import { attempt, failed } from "@/lib/attempt";
import type { Student } from "@/lib/data/students";
import { m } from "@/lib/i18n";
import { displayName, formatPhone, isMinor } from "@/lib/people";
import { accessibilityKinds, studentUpdateInput } from "@/lib/schemas/students";
import { type GuardianDraft, GuardianFields } from "./guardian-fields";

export function StudentEditForm({ student }: { student: Student }) {
  const router = useRouter();
  const today = useToday();
  const [fullName, setFullName] = useState(student.full_name);
  const [socialName, setSocialName] = useState(student.social_name ?? "");
  const [birthDate, setBirthDate] = useState(student.birth_date);
  const [phone, setPhone] = useState(
    student.phone ? formatPhone(student.phone) : "",
  );
  const [email, setEmail] = useState(student.email ?? "");
  const [guardians, setGuardians] = useState<GuardianDraft[]>(() =>
    student.guardians.map((guardian) => ({
      key: guardian.id,
      id: guardian.id,
      fullName: guardian.full_name,
      relationship: guardian.relationship,
      phone: formatPhone(guardian.phone),
      isWhatsapp: guardian.is_whatsapp,
    })),
  );
  const [accessibility, setAccessibility] = useState<string[]>(
    student.student_care?.accessibility ?? [],
  );
  const [accessibilityNotes, setAccessibilityNotes] = useState(
    student.student_care?.accessibility_notes ?? "",
  );
  const [notesForTeachers, setNotesForTeachers] = useState(
    student.student_care?.notes_for_teachers ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const minor = birthDate ? isMinor(birthDate, today) : false;

  function submit() {
    const input = {
      id: student.id,
      fullName,
      socialName,
      birthDate,
      phone,
      email,
      guardians: guardians.map(({ key: _key, ...guardian }) => guardian),
      accessibility: accessibility as (typeof accessibilityKinds)[number][],
      accessibilityNotes,
      notesForTeachers,
      removedGuardianIds: student.guardians
        .map((guardian) => guardian.id)
        .filter((id) => !guardians.some((guardian) => guardian.id === id)),
    };
    const parsed = studentUpdateInput.safeParse(input);
    if (!parsed.success) {
      const found = Object.fromEntries(
        Object.entries(fieldErrors(parsed.error)).map(([key, value]) => [
          key,
          value?.[0],
        ]),
      );
      setErrors(found);
      setStatus(Object.values(found)[0] ?? "");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await attempt(updateStudent(input), failed);
      if (!result.ok) {
        setStatus(
          Object.values(result.errors ?? {})[0]?.[0] ??
            result.message ??
            m.common.tryAgain,
        );
        return;
      }
      toast.add({ title: m.students.saved, type: "success" });
      router.replace(`/alunos/${student.id}` as Route);
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
        title={m.students.edit}
        subtitle={displayName(student)}
        fallback={`/alunos/${student.id}` as Route}
      />
      <div className="flex flex-1 flex-col gap-7 px-4 pt-4 pb-40">
        <TextField
          label={m.studentForm.fullName}
          value={fullName}
          maxLength={120}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <TextField
          label={m.studentForm.socialName}
          hint={m.studentForm.socialNameHint}
          value={socialName}
          maxLength={120}
          onChange={(event) => setSocialName(event.target.value)}
        />
        <TextField
          label={m.studentForm.birthDate}
          type="date"
          max={today}
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          error={errors.birthDate}
          className="max-w-56"
        />
        <TextField
          label={minor ? m.studentForm.phoneOptional : m.studentForm.phone}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(formatPhone(event.target.value))}
          error={errors.phone}
        />
        <TextField
          label={m.studentForm.email}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <section aria-labelledby="responsaveis" className="flex flex-col gap-3">
          <h2 id="responsaveis" className="text-title3 font-semibold">
            {m.students.guardians}
          </h2>
          <GuardianFields
            guardians={guardians}
            onChange={setGuardians}
            errors={errors}
            minimum={minor ? 1 : 0}
          />
        </section>
        <section aria-labelledby="sala" className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 id="sala" className="text-title3 font-semibold">
              {m.students.classroom}
            </h2>
            <p className="text-footnote text-muted-foreground">
              {m.students.classroomHint}
            </p>
          </div>
          <CheckChips
            legend={m.studentForm.accessibilityLegend}
            name="accessibility"
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
          {pending ? m.common.saving : m.common.save}
        </Button>
      </FlowBar>
    </form>
  );
}
