"use client";

import NumberFlow from "@number-flow/react";
import { brl, formatBRL, formatWholeBRL, toReais, wholeBrl } from "@/lib/money";

export function Money({
  cents,
  whole = false,
  className,
}: {
  cents: number;
  whole?: boolean;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="sr-only">
        {whole ? formatWholeBRL(cents) : formatBRL(cents)}
      </span>
      <NumberFlow
        aria-hidden="true"
        value={toReais(cents, whole)}
        locales="pt-BR"
        format={whole ? wholeBrl : brl}
      />
    </span>
  );
}
