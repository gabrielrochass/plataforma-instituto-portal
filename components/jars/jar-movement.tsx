"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { AmountInput } from "@/components/forms/amount-input";
import { DateChoice } from "@/components/forms/date-choice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import { addJarEntry } from "@/lib/actions";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import type { Enums } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Kind = Enums<"jar_entry_kind">;

export function JarMovement({
  jarId,
  balance,
}: {
  jarId: string;
  balance: number;
}) {
  const today = useToday();
  const [kind, setKind] = useState<Kind | null>(null);
  const [id, setId] = useState(() => crypto.randomUUID());
  const [cents, setCents] = useState(0);
  const [pickedDate, setDate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const amountRef = useRef<HTMLInputElement>(null);
  const depositRef = useRef<HTMLButtonElement>(null);
  const withdrawRef = useRef<HTMLButtonElement>(null);
  const noteId = useId();
  const date = pickedDate ?? today;

  function open(next: Kind) {
    flushSync(() => {
      setKind(next);
      setAmountError("");
      setStatus("");
    });
    amountRef.current?.focus();
  }

  function close(emptied = false) {
    const toWithdraw = kind === "withdrawal" && !emptied;
    flushSync(() => setKind(null));
    const opener =
      toWithdraw && !withdrawRef.current?.disabled ? withdrawRef : depositRef;
    opener.current?.focus();
  }

  function submit(chosen: Kind) {
    startTransition(async () => {
      const result = await attempt(
        addJarEntry({
          id,
          jarId,
          kind: chosen,
          amountCents: cents,
          occurredOn: date,
          note,
        }),
        failed,
      );
      if (!result.ok) {
        const amount = result.errors?.amountCents?.[0];
        setAmountError(amount ?? "");
        setStatus(
          amount ??
            result.errors?.occurredOn?.[0] ??
            result.message ??
            m.common.tryAgain,
        );
        if (amount) amountRef.current?.focus();
        return;
      }
      toast.add({
        title:
          chosen === "deposit"
            ? m.jars.deposited(formatBRL(cents))
            : m.jars.withdrawn(formatBRL(cents)),
        type: "success",
      });
      setId(crypto.randomUUID());
      setCents(0);
      setNote("");
      setDate(null);
      close(chosen === "withdrawal" && cents >= balance);
    });
  }

  if (!kind) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button
          ref={depositRef}
          variant="income"
          size="lg"
          onClick={() => open("deposit")}
        >
          <PlusIcon aria-hidden="true" />
          {m.jars.deposit}
        </Button>
        <Button
          ref={withdrawRef}
          variant="expense"
          size="lg"
          disabled={balance <= 0}
          onClick={() => open("withdrawal")}
        >
          <MinusIcon aria-hidden="true" />
          {m.jars.withdraw}
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-labelledby="movimentar"
      onSubmit={(event) => {
        event.preventDefault();
        submit(kind);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      className="flex flex-col gap-5 rounded-2xl bg-card p-4"
    >
      <h2 id="movimentar" className="text-headline font-semibold">
        {kind === "deposit" ? m.jars.deposit : m.jars.withdraw}
      </h2>
      <div
        className={cn(
          "rounded-3xl py-5",
          kind === "deposit"
            ? "bg-income/8 text-income"
            : "bg-expense/8 text-expense",
        )}
      >
        <AmountInput
          id="jar-amount"
          ref={amountRef}
          label={m.jars.amount}
          value={cents}
          onChange={setCents}
          error={amountError || undefined}
        />
      </div>
      <DateChoice value={date} onChange={setDate} />
      <div className="flex flex-col gap-2">
        <label
          htmlFor={noteId}
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.jars.note}
        </label>
        <Input
          id={noteId}
          maxLength={120}
          autoComplete="off"
          placeholder={m.jars.notePlaceholder}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="bg-card dark:bg-card"
        />
      </div>
      <output className="block min-h-5 text-footnote text-muted-foreground">
        {status}
      </output>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="lg" onClick={() => close()}>
          {m.common.cancel}
        </Button>
        <Button
          type="submit"
          variant={kind === "deposit" ? "income" : "expense"}
          size="lg"
          disabled={pending}
          focusableWhenDisabled
          className="tabular-nums"
        >
          {pending
            ? m.common.saving
            : kind === "deposit"
              ? m.jars.depositAmount(formatBRL(cents))
              : m.jars.withdrawAmount(formatBRL(cents))}
        </Button>
      </div>
    </form>
  );
}
