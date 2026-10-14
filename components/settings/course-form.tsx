"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GradingFields } from "@/components/classes/grading-fields";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { saveCourse } from "@/lib/actions/classes";
import { attempt, failed } from "@/lib/attempt";
import type { Course } from "@/lib/data/classes";
import { type GradingRules, presets } from "@/lib/grading";
import { m } from "@/lib/i18n";

type Errors = Partial<
  Record<"name" | "workloadHours" | "rules" | "form", string>
>;

export function CourseForm({ course }: { course?: Course }) {
  const router = useRouter();
  const [id] = useState(() => course?.id ?? crypto.randomUUID());
  const [name, setName] = useState(course?.name ?? "");
  const [workload, setWorkload] = useState(
    course ? String(course.workload_hours) : "",
  );
  const [description, setDescription] = useState(course?.description ?? "");
  const [rules, setRules] = useState<GradingRules>(
    course?.rules ?? presets.numeric_10,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        saveCourse(
          {
            id,
            name,
            description,
            workloadHours: workload === "" ? Number.NaN : Number(workload),
            rules,
          },
          !course,
        ),
        failed,
      );
      if (!result.ok) {
        setErrors({
          name: result.errors?.name?.[0],
          workloadHours: result.errors?.workloadHours?.[0],
          rules: Object.keys(result.errors ?? {}).some((key) =>
            key.startsWith("rules"),
          )
            ? m.grading.invalid
            : undefined,
          form: result.errors ? undefined : result.message,
        });
        return;
      }
      toast.add({
        title: course ? m.courses.saved : m.courses.created(name.trim()),
        type: "success",
      });
      router.replace("/ajustes/cursos");
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-7"
    >
      <TextField
        label={m.courses.name}
        value={name}
        maxLength={80}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />
      <TextField
        label={m.courses.workload}
        type="number"
        inputMode="numeric"
        min={1}
        max={2000}
        value={workload}
        onChange={(event) => setWorkload(event.target.value)}
        error={errors.workloadHours}
        className="max-w-48"
      />
      <TextAreaField
        label={m.courses.description}
        hint={m.courses.descriptionHint}
        value={description}
        maxLength={2000}
        onChange={(event) => setDescription(event.target.value)}
      />
      <section aria-labelledby={`${id}-rule`} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={`${id}-rule`} className="text-title3 font-semibold">
            {m.courses.defaultRule}
          </h2>
          <p className="text-subhead text-muted-foreground">
            {m.courses.defaultRuleHint}
          </p>
        </div>
        <GradingFields value={rules} onChange={setRules} />
        {errors.rules && (
          <p className="text-footnote text-destructive">{errors.rules}</p>
        )}
      </section>
      {errors.form && (
        <p role="alert" className="text-subhead text-destructive">
          {errors.form}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="h-12 text-body"
        disabled={pending}
        focusableWhenDisabled
      >
        {pending ? m.common.saving : course ? m.common.save : m.courses.create}
      </Button>
    </form>
  );
}
