"use client";

import { MessageCircleIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { convertRequest, decideRequest } from "@/lib/actions/requests";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

type Status = "pending" | "waitlisted" | "declined" | "withdrawn";

export function RequestDecision({
  requestId,
  status,
  whatsappHref,
}: {
  requestId: string;
  status: Status;
  whatsappHref: string;
}) {
  const [pending, startTransition] = useTransition();
  const options: { status: Status; label: string }[] =
    status === "pending"
      ? [
          { status: "waitlisted", label: m.requests.waitlist },
          { status: "declined", label: m.requests.decline },
          { status: "withdrawn", label: m.requests.withdraw },
        ]
      : status === "waitlisted"
        ? [
            { status: "declined", label: m.requests.decline },
            { status: "withdrawn", label: m.requests.withdraw },
          ]
        : [{ status: "pending", label: m.requests.reopenRequest }];

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ variant: "secondary", size: "lg" })}
      >
        <MessageCircleIcon aria-hidden="true" />
        {m.requests.whatsapp}
      </a>
      {options.map((option) => (
        <Button
          key={option.status}
          type="button"
          variant={option.status === "declined" ? "destructive" : "secondary"}
          size="lg"
          disabled={pending}
          focusableWhenDisabled
          onClick={() =>
            startTransition(async () => {
              const result = await attempt(
                decideRequest(requestId, option.status),
                failed,
              );
              toast.add(
                result.ok
                  ? { title: m.requests.decided, type: "success" }
                  : {
                      title: result.message ?? m.common.tryAgain,
                      type: "error",
                    },
              );
            })
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function ConvertRequest({
  requestId,
  name,
  classes,
  matches,
}: {
  requestId: string;
  name: string;
  classes: readonly { id: string; label: string }[];
  matches: readonly { id: string; label: string }[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState(
    classes.length === 1 ? classes[0].id : "",
  );
  const [enrollmentId] = useState(() => crypto.randomUUID());
  const [newStudentId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function convert(studentId: string | null) {
    if (!classId) {
      setError(m.requests.chooseClass);
      return;
    }
    startTransition(async () => {
      const result = await attempt(
        convertRequest({
          requestId,
          classId,
          enrollmentId,
          studentId,
          newStudentId,
        }),
        failed,
      );
      if (!result.ok) {
        setError(result.message ?? m.common.tryAgain);
        return;
      }
      toast.add({ title: m.requests.enrolled(name), type: "success" });
      router.replace(`/alunos/${studentId ?? newStudentId}` as Route);
    });
  }

  if (classes.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
        {m.requests.noClass}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4">
      <p className="text-subhead text-muted-foreground">
        {m.requests.enrollIntro}
      </p>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="converter-turma"
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.requests.chooseClass}
        </label>
        <NativeSelect
          id="converter-turma"
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
        >
          <option value="" />
          {classes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      {matches.length > 0 && (
        <section aria-labelledby="parecidos" className="flex flex-col gap-2">
          <h3 id="parecidos" className="text-headline font-semibold">
            {m.requests.existing}
          </h3>
          <ul className="divide-y overflow-hidden rounded-xl bg-muted">
            {matches.map((match) => (
              <li
                key={match.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <span className="text-body">{match.label}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={pending}
                  onClick={() => convert(match.id)}
                >
                  {m.requests.useExisting}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {error && (
        <p role="alert" className="text-subhead text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        size="lg"
        className="h-12 text-body"
        disabled={pending}
        focusableWhenDisabled
        onClick={() => convert(null)}
      >
        {m.requests.createNew}
      </Button>
    </div>
  );
}
