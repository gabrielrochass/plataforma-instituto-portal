"use client";

import { ChevronLeftIcon, LockIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { MiniCard } from "@/components/cards/card-face";
import { KindToggle } from "@/components/entry/kind-toggle";
import { AmountInput } from "@/components/forms/amount-input";
import {
  ChoiceChips,
  type ChoiceOption,
} from "@/components/forms/choice-chips";
import { DateChoice } from "@/components/forms/date-choice";
import { InlineCreate } from "@/components/forms/quick-create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useGoBack } from "@/hooks/use-go-back";
import { useToday } from "@/hooks/use-today";
import {
  createCategory,
  deleteTransaction,
  restoreTransactions,
  saveCard,
  saveTransaction,
  suggestCategory,
} from "@/lib/actions";
import { attempt, failed } from "@/lib/attempt";
import { billDates } from "@/lib/billing";
import { type CardDesign, cardDesignKeys } from "@/lib/card-designs";
import { categoryIcon, paymentIcons } from "@/lib/category-icons";
import type { Card, Category, Payment, Transaction } from "@/lib/data";
import { formatMonthName, formatShortDate } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import type { Enums } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Kind = Enums<"transaction_kind">;
type Errors = Partial<
  Record<"amountCents" | "categoryId" | "paymentKind" | "occurredOn", string>
>;

const barButton = "h-auto min-h-11 px-3 py-2 text-center whitespace-normal";

function paymentValue(source: Payment | null) {
  if (!source) return null;
  return source.card_id ? `card:${source.card_id}` : source.payment_kind;
}

function focusFirstControl(section: HTMLElement | null) {
  section?.querySelector<HTMLElement>("input, button")?.focus();
}

export function EntryForm({
  categories,
  cards,
  transaction,
  lastPayment = null,
  closedMonth = null,
}: {
  categories: Category[];
  cards: Card[];
  transaction: Transaction | null;
  lastPayment?: Payment | null;
  closedMonth?: string | null;
}) {
  const leave = useGoBack("/transacoes");
  const today = useToday();
  const editing = transaction !== null;
  const locked = transaction?.installment_group_id != null;
  const activeCards = cards.filter(
    (card) => card.archived_at === null || card.id === transaction?.card_id,
  );

  const [id, setId] = useState(() => transaction?.id ?? crypto.randomUUID());
  const [kind, setKind] = useState<Kind>(transaction?.kind ?? "expense");
  const [cents, setCents] = useState(transaction?.amount_cents ?? 0);
  const [description, setDescription] = useState(
    transaction?.description ?? "",
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    transaction?.category_id ?? null,
  );
  const [payment, setPayment] = useState(() => {
    const initial = paymentValue(transaction ?? lastPayment);
    const usable =
      !initial?.startsWith("card:") ||
      activeCards.some((card) => `card:${card.id}` === initial);
    return usable ? initial : null;
  });
  const [pickedDate, setDate] = useState(transaction?.occurred_on ?? null);
  const date = pickedDate ?? today;
  const [newCardDesign, setNewCardDesign] = useState<CardDesign>("grafite");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const categoryChosen = useRef(editing);
  const kindRef = useRef(kind);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  const kindCategories = categories.filter(
    (category) =>
      category.kind === kind &&
      (category.archived_at === null ||
        category.id === transaction?.category_id),
  );
  const cardId = payment?.startsWith("card:") ? payment.slice(5) : null;
  const card = activeCards.find((candidate) => candidate.id === cardId);
  const paymentKind = (
    cardId ? "card" : payment
  ) as Enums<"payment_kind"> | null;
  const bill =
    card?.best_purchase_day && card.due_day
      ? billDates(
          card.best_purchase_day,
          card.due_day,
          transaction?.installment_purchased_on ?? date,
          (transaction?.installment_number ?? 1) - 1,
        )
      : null;
  const kindLabel = kind === "expense" ? m.entry.expense : m.entry.income;

  const categoryOptions: ChoiceOption[] = kindCategories.map((category) => {
    const Icon = categoryIcon(category.icon);
    return {
      value: category.id,
      label: category.name,
      icon: <Icon aria-hidden="true" className="size-4" />,
    };
  });

  const paymentOptions: ChoiceOption[] = [
    ...(["pix", "boleto"] as const).map((value) => {
      const Icon = paymentIcons[value];
      return {
        value,
        label: m.payments[value],
        icon: <Icon aria-hidden="true" className="size-4" />,
      };
    }),
    ...activeCards.map((option) => ({
      value: `card:${option.id}`,
      label: option.name,
      icon: <MiniCard design={option.design} />,
    })),
  ];

  function changeKind(next: Kind) {
    kindRef.current = next;
    setKind(next);
    if (
      categories.find((category) => category.id === categoryId)?.kind !== next
    ) {
      setCategoryId(null);
      categoryChosen.current = false;
    }
  }

  async function suggest() {
    if (categoryChosen.current || !description.trim()) return;
    const requested = kind;
    const suggested = await attempt(
      suggestCategory(description, requested),
      null,
    );
    if (suggested && !categoryChosen.current && kindRef.current === requested) {
      setCategoryId(suggested);
    }
  }

  async function addCategory(name: string) {
    const newId = crypto.randomUUID();
    const result = await createCategory({ id: newId, kind, name });
    if (result.ok) {
      categoryChosen.current = true;
      setCategoryId(newId);
      setErrors((current) => ({ ...current, categoryId: undefined }));
      setStatus(m.entry.categoryAdded(name.trim()));
    }
    return result;
  }

  async function addCard(name: string) {
    const newId = crypto.randomUUID();
    const result = await saveCard(
      {
        id: newId,
        name,
        design: newCardDesign,
        bestPurchaseDay: null,
        dueDay: null,
      },
      true,
    );
    if (result.ok) {
      setPayment(`card:${newId}`);
      setErrors((current) => ({ ...current, paymentKind: undefined }));
      setStatus(m.entry.cardAdded(name.trim()));
    }
    return result;
  }

  function submit(again = false) {
    setStatus("");
    startTransition(async () => {
      const result = await attempt(
        saveTransaction(
          {
            id,
            kind,
            amountCents: cents,
            occurredOn: date,
            description,
            categoryId: categoryId ?? "",
            paymentKind: paymentKind ?? ("" as Enums<"payment_kind">),
            cardId,
          },
          !editing,
        ),
        failed,
      );
      if (!result.ok) {
        const found: Errors = {
          amountCents: result.errors?.amountCents?.[0],
          categoryId: result.errors?.categoryId?.[0],
          paymentKind: result.errors?.paymentKind?.[0],
          occurredOn: result.errors?.occurredOn?.[0],
        };
        setErrors(found);
        setStatus(
          found.amountCents ??
            found.categoryId ??
            found.paymentKind ??
            found.occurredOn ??
            result.message ??
            m.common.tryAgain,
        );
        if (found.amountCents) amountRef.current?.focus();
        else if (found.categoryId) focusFirstControl(categoryRef.current);
        else if (found.paymentKind) focusFirstControl(paymentRef.current);
        return;
      }

      const saved = m.entry.saved(kindLabel, formatBRL(cents));
      if (again) {
        setId(crypto.randomUUID());
        setCents(0);
        setDescription("");
        setCategoryId(null);
        setErrors({});
        categoryChosen.current = false;
        setStatus(saved);
        amountRef.current?.focus();
        return;
      }
      toast.add({ title: saved, type: "success" });
      leave();
    });
  }

  function remove() {
    if (!transaction) return;
    leave();
    startTransition(async () => {
      const result = await attempt(deleteTransaction(transaction.id), failed);
      if (!result.ok) {
        toast.add({ title: result.message, type: "error" });
        return;
      }
      toast.add({
        title: m.entry.deleted,
        timeout: 10_000,
        actionProps: {
          children: m.entry.undo,
          onClick: async () => {
            const restored = await attempt(
              restoreTransactions(result.ids),
              failed,
            );
            toast.add({
              title: restored.ok ? m.entry.restored : restored.message,
            });
          },
        },
      });
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
      <header className="sticky top-0 z-10 grid grid-cols-[2.75rem_1fr_2.75rem] items-center bg-background/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl min-[360px]:grid-cols-[6rem_1fr_6rem] [@media(prefers-reduced-transparency:reduce)]:bg-background">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="justify-self-start px-2 text-link"
          onClick={leave}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          <span className="max-[359px]:sr-only">{m.common.back}</span>
        </Button>
        <h1 className="text-center text-headline font-semibold text-balance">
          {editing ? m.entry.editTitle : m.entry.newTitle}
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-7 px-4 pt-4 pb-40">
        {closedMonth && (
          <div className="flex items-start gap-3 rounded-2xl bg-card p-4">
            <LockIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-link"
            />
            <div className="flex flex-col gap-1">
              <p className="text-body font-semibold">
                {m.closing.lockedNotice}
              </p>
              <p className="text-subhead text-muted-foreground">
                {m.closing.lockedDetail}
              </p>
              <Link
                href={`/balanco?mes=${closedMonth}`}
                className="flex min-h-11 w-fit items-center text-subhead font-medium text-link"
              >
                {m.closing.seeReport}
              </Link>
            </div>
          </div>
        )}
        <KindToggle value={kind} onChange={changeKind} disabled={locked} />

        <div
          className={cn(
            "rounded-3xl py-6 transition-colors",
            kind === "expense"
              ? "bg-expense/8 text-expense"
              : "bg-income/8 text-income",
          )}
        >
          <AmountInput
            id="amount"
            ref={amountRef}
            label={m.entry.amount}
            value={cents}
            onChange={setCents}
            disabled={locked}
            error={errors.amountCents}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="description"
            className="text-footnote font-medium text-muted-foreground"
          >
            {m.entry.description}
          </label>
          <Input
            id="description"
            maxLength={120}
            autoComplete="off"
            enterKeyHint="done"
            placeholder={m.entry.descriptionPlaceholder}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={suggest}
          />
        </div>

        <div ref={categoryRef} className="flex flex-col gap-3">
          {categoryOptions.length > 0 ? (
            <ChoiceChips
              legend={m.entry.category}
              name="category"
              value={categoryId}
              onChange={(value) => {
                categoryChosen.current = true;
                setCategoryId(value);
              }}
              options={categoryOptions}
              error={errors.categoryId}
            />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-footnote font-medium text-muted-foreground">
                {m.entry.category}
              </p>
              <p className="text-subhead">{m.entry.noCategories}</p>
              {errors.categoryId && (
                <p className="text-footnote text-destructive">
                  {errors.categoryId}
                </p>
              )}
            </div>
          )}
          <InlineCreate
            key={kind}
            defaultOpen={categoryOptions.length === 0}
            label={m.entry.newCategory}
            placeholder={m.settings.newCategoryPlaceholder[kind]}
            onCreate={addCategory}
          />
        </div>

        <div ref={paymentRef} className="flex flex-col gap-3">
          <ChoiceChips
            legend={m.entry.payment}
            name="payment"
            disabled={locked}
            value={payment}
            onChange={setPayment}
            options={paymentOptions}
            error={errors.paymentKind}
          />
          {!locked && (
            <InlineCreate
              label={m.entry.newCard}
              placeholder={m.settings.cardNamePlaceholder}
              onCreate={addCard}
            >
              <fieldset>
                <legend className="mb-2 text-footnote font-medium text-muted-foreground">
                  {m.settings.design}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {cardDesignKeys.map((design) => (
                    <label
                      key={design}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-xl ring-offset-2 ring-offset-secondary has-checked:ring-2 has-checked:ring-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring forced-colors:has-checked:outline-2 forced-colors:has-checked:outline-offset-2 forced-colors:has-checked:outline-[Highlight]"
                    >
                      <input
                        type="radio"
                        name="new-card-design"
                        value={design}
                        checked={newCardDesign === design}
                        onChange={() => setNewCardDesign(design)}
                        aria-label={m.cardDesigns[design]}
                        className="sr-only"
                      />
                      <MiniCard design={design} className="h-7 w-10" />
                    </label>
                  ))}
                </div>
              </fieldset>
            </InlineCreate>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <DateChoice value={date} onChange={setDate} disabled={locked} />
          {errors.occurredOn && (
            <p className="text-footnote text-destructive">
              {errors.occurredOn}
            </p>
          )}
        </div>

        {bill && (
          <p className="text-footnote text-muted-foreground">
            {m.entry.billPreview(
              formatMonthName(bill.dueOn.slice(0, 7)),
              formatShortDate(bill.closesOn),
              formatShortDate(bill.dueOn),
            )}
          </p>
        )}

        {locked && (
          <p className="text-footnote text-muted-foreground">
            {m.entry.installmentLocked}
          </p>
        )}

        {editing && (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={pending || closedMonth !== null}
            focusableWhenDisabled
            onClick={remove}
            className="self-start"
          >
            <Trash2Icon aria-hidden="true" />
            {locked ? m.entry.deleteAll : m.entry.delete}
          </Button>
        )}
      </div>

      <div
        data-entry-bar
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/90 backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-background"
      >
        <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <output className="block min-h-5 text-center text-footnote text-muted-foreground">
            {status}
          </output>
          <div className="grid auto-cols-fr grid-flow-col gap-2">
            {!editing && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={pending}
                focusableWhenDisabled
                onClick={() => submit(true)}
                className={barButton}
              >
                {m.entry.saveAndNew}
              </Button>
            )}
            <Button
              type="submit"
              variant={kind}
              size="lg"
              disabled={pending || closedMonth !== null}
              focusableWhenDisabled
              className={barButton}
            >
              {pending
                ? m.common.saving
                : editing
                  ? m.entry.saveChanges
                  : m.entry.add[kind]}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
