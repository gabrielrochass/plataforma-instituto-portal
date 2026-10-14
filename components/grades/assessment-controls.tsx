"use client";

import { Trash2Icon } from "lucide-react";
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
import {
  deleteAssessment,
  reopenClass,
  saveAssessment,
} from "@/lib/actions/grades";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

export function NewAssessmentForm({ classId }: { classId: string }) {
  const [id, setId] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState("");
  const [heldOn, setHeldOn] = useState("");
  const [weight, setWeight] = useState("1");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        saveAssessment(
          {
            id,
            classId,
            title,
            heldOn,
            weight:
              weight === "" ? Number.NaN : Number(weight.replace(",", ".")),
          },
          true,
        ),
        failed,
      );
      if (!result.ok) {
        setErrors({
          title: result.errors?.title?.[0],
          weight: result.errors?.weight?.[0],
          form: result.errors ? undefined : result.message,
        });
        return;
      }
      setErrors({});
      setId(crypto.randomUUID());
      setTitle("");
      setHeldOn("");
      setWeight("1");
      toast.add({ title: m.grades.created, type: "success" });
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
        label={m.grades.title}
        placeholder={m.grades.titlePlaceholder}
        maxLength={80}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={errors.title}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={m.grades.heldOn}
          type="date"
          value={heldOn}
          onChange={(event) => setHeldOn(event.target.value)}
        />
        <TextField
          label={m.grades.weight}
          hint={m.grades.weightHint}
          inputMode="decimal"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          error={errors.weight}
        />
      </div>
      {errors.form && (
        <p role="alert" className="text-subhead text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} focusableWhenDisabled>
        {m.grades.create}
      </Button>
    </form>
  );
}

export function DeleteAssessmentButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={`${m.grades.remove}: ${title}`}
          />
        }
      >
        <Trash2Icon aria-hidden="true" className="size-5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.grades.removeTitle(title)}</AlertDialogTitle>
          <AlertDialogDescription>{m.grades.removeText}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">{m.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await attempt(deleteAssessment(id), failed);
                toast.add(
                  result.ok
                    ? { title: m.grades.removed, type: "success" }
                    : {
                        title: result.message ?? m.common.tryAgain,
                        type: "error",
                      },
                );
              })
            }
          >
            {m.grades.remove}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReopenClassButton({ classId }: { classId: string }) {
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
          const result = await attempt(reopenClass(classId), failed);
          toast.add(
            result.ok
              ? { title: m.closing.reopened, type: "success" }
              : { title: result.message ?? m.common.tryAgain, type: "error" },
          );
        })
      }
    >
      {m.closing.reopen}
    </Button>
  );
}
