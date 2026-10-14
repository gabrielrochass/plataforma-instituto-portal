"use client";

import { UserPlusIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { enrollStudent } from "@/lib/actions/students";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { StudentSearchField, useStudentSearch } from "./student-search";

export function EnrollSheet({
  classId,
  enrolledIds,
}: {
  classId: string;
  enrolledIds: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { matches, searched, pending: searching } = useStudentSearch(query);
  const [pending, startTransition] = useTransition();

  function enroll(studentId: string, name: string) {
    startTransition(async () => {
      const result = await attempt(
        enrollStudent(crypto.randomUUID(), studentId, classId),
        failed,
      );
      if (!result.ok) {
        toast.add({
          title: result.message ?? m.common.tryAgain,
          type: "error",
        });
        return;
      }
      toast.add({ title: m.enrollment.enrolled(name), type: "success" });
      setOpen(false);
      setQuery("");
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <UserPlusIcon aria-hidden="true" />
        {m.enrollment.enroll}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        <SheetHeader className="pr-14">
          <SheetTitle className="text-headline font-semibold">
            {m.enrollment.enrollTitle}
          </SheetTitle>
          <SheetDescription className="text-subhead">
            {m.enrollment.searchHint}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <StudentSearchField
            value={query}
            onChange={setQuery}
            pending={searching}
          />
          <output aria-live="polite" className="flex flex-col gap-2">
            {searched && matches.length === 0 && (
              <span className="text-subhead text-muted-foreground">
                {m.students.noResults(searched)}
              </span>
            )}
            {matches.length > 0 && (
              <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                {matches.map((match) => {
                  const here = enrolledIds.includes(match.id);
                  return (
                    <li
                      key={match.id}
                      className="flex min-h-15 items-center gap-3 px-4 py-2"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-body font-medium">
                          {match.name}
                        </span>
                        <span className="text-footnote text-muted-foreground tabular-nums">
                          {m.studentForm.matchDetail(
                            match.birthYear,
                            match.unitCode,
                          )}
                        </span>
                      </span>
                      {here ? (
                        <span className="text-footnote text-muted-foreground">
                          {m.enrollment.alreadyHere}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="lg"
                          disabled={pending}
                          focusableWhenDisabled
                          onClick={() => enroll(match.id, match.name)}
                        >
                          {m.studentForm.enrollExisting}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </output>
          <Link
            href={`/alunos/novo?turma=${classId}` as Route}
            className={buttonVariants({
              variant: "ghost",
              size: "lg",
              className: "text-link",
            })}
          >
            {m.enrollment.newStudent}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
