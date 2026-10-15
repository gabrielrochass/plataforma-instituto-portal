"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { NativeSelect } from "@/components/ui/native-select";

export function FilterSelect({
  label,
  options,
  value,
}: {
  label: string;
  options: readonly { href: Route; label: string; value: string }[];
  value: string;
}) {
  const router = useRouter();
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5 sm:max-w-72">
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {label}
      </label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => {
          const next = options.find(
            (option) => option.value === event.target.value,
          );
          if (next) router.replace(next.href, { scroll: false });
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
