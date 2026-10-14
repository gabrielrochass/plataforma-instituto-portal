"use client";

import { LoaderCircleIcon, SearchIcon } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { findStudents, type StudentMatch } from "@/lib/actions/students";
import { attempt } from "@/lib/attempt";
import { m } from "@/lib/i18n";

export function useStudentSearch(query: string) {
  const [matches, setMatches] = useState<StudentMatch[]>([]);
  const [searched, setSearched] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.replace(/\s/g, "").length < 3) {
      setMatches([]);
      setSearched("");
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        setMatches(await attempt(findStudents(trimmed), []));
        setSearched(trimmed);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return { matches, searched, pending };
}

export function StudentSearchField({
  value,
  onChange,
  pending,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  pending: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {m.students.search}
      </label>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={m.students.searchPlaceholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="bg-card pl-10 dark:bg-card"
        />
        {pending && (
          <LoaderCircleIcon
            aria-hidden="true"
            className="absolute top-1/2 right-3 size-5 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-footnote text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
