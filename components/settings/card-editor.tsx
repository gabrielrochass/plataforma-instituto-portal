"use client";

import { ArchiveIcon, ArchiveRestoreIcon, PlusIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { CardFace, MiniCard } from "@/components/cards/card-face";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { useGoBack } from "@/hooks/use-go-back";
import { useToday } from "@/hooks/use-today";
import { saveCard, setCardArchived } from "@/lib/actions";
import { attempt, failed } from "@/lib/attempt";
import { billDates } from "@/lib/billing";
import { type CardDesign, cardDesignKeys } from "@/lib/card-designs";
import type { Card } from "@/lib/data";
import { formatShortDate } from "@/lib/dates";
import { m } from "@/lib/i18n";

const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);

export function CardEditor({ card }: { card: Card | null }) {
  const goBack = useGoBack("/ajustes/cartoes");
  const today = useToday();
  const [id] = useState(() => card?.id ?? crypto.randomUUID());
  const [name, setName] = useState(card?.name ?? "");
  const [design, setDesign] = useState(
    (card?.design ?? "grafite") as CardDesign,
  );
  const [tracksBill, setTracksBill] = useState(card?.due_day != null);
  const [bestDay, setBestDay] = useState(card?.best_purchase_day ?? null);
  const [dueDay, setDueDay] = useState(card?.due_day ?? null);
  const [errors, setErrors] = useState<{ name?: string; days?: string }>({});
  const [status, setStatus] = useState("");
  const [saving, startSave] = useTransition();
  const [archiving, startArchive] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const bestDayRef = useRef<HTMLSelectElement>(null);
  const dueDayRef = useRef<HTMLSelectElement>(null);
  const archived = card?.archived_at != null;
  const busy = saving || archiving;
  const example =
    tracksBill && bestDay && dueDay ? billDates(bestDay, dueDay, today) : null;

  function save() {
    if (tracksBill && !(bestDay && dueDay)) {
      setErrors({ days: m.settings.billDaysRequired });
      (bestDay ? dueDayRef : bestDayRef).current?.focus();
      return;
    }
    startSave(async () => {
      const result = await attempt(
        saveCard(
          {
            id,
            name,
            design,
            bestPurchaseDay: tracksBill ? bestDay : null,
            dueDay: tracksBill ? dueDay : null,
          },
          card === null,
        ),
        failed,
      );
      if (!result.ok) {
        setErrors({ name: result.errors?.name?.[0] });
        setStatus(result.message ?? "");
        if (result.errors?.name) nameRef.current?.focus();
        return;
      }
      toast.add({
        title: card ? m.settings.cardSaved : m.settings.cardCreated,
        type: "success",
      });
      goBack();
    });
  }

  function toggleArchived() {
    if (!card) return;
    startArchive(async () => {
      const result = await attempt(setCardArchived(card.id, !archived), failed);
      if (!result.ok) {
        setStatus(result.message ?? m.common.tryAgain);
        return;
      }
      toast.add({
        title: archived
          ? m.settings.restoredToast(card.name)
          : m.settings.archivedToast(card.name),
      });
      goBack();
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="flex flex-col gap-8"
    >
      <div aria-hidden="true" className="mx-auto w-full max-w-sm">
        <CardFace
          name={name.trim() || m.settings.cardName}
          design={design}
          bestPurchaseDay={tracksBill ? bestDay : null}
          dueDay={tracksBill ? dueDay : null}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="card-name"
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.settings.cardName}
        </label>
        <Input
          ref={nameRef}
          id="card-name"
          maxLength={40}
          autoComplete="off"
          placeholder={m.settings.cardNamePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "card-name-error" : undefined}
          className="bg-card dark:bg-card"
        />
        {errors.name && (
          <p id="card-name-error" className="text-footnote text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <fieldset className="flex min-w-0 flex-col">
        <legend className="mb-3 text-footnote font-medium text-muted-foreground">
          {m.settings.design}
        </legend>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3 min-[360px]:grid-cols-5">
          {cardDesignKeys.map((key) => (
            <label
              key={key}
              className="flex min-w-0 cursor-pointer flex-col items-center gap-1.5"
            >
              <input
                type="radio"
                name="design"
                value={key}
                checked={design === key}
                onChange={() => setDesign(key)}
                className="peer sr-only"
              />
              <MiniCard
                design={key}
                className="aspect-[1.586] h-auto w-full rounded-lg ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring forced-colors:peer-checked:outline-2 forced-colors:peer-checked:outline-offset-2 forced-colors:peer-checked:outline-[Highlight]"
              />
              <span className="max-w-full text-center text-caption2 leading-tight text-muted-foreground peer-checked:font-semibold peer-checked:text-foreground">
                {m.cardDesigns[key]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 rounded-2xl bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <label htmlFor="tracks-bill" className="text-body font-medium">
              {m.settings.useBill}
            </label>
            <p
              id="tracks-bill-hint"
              className="text-footnote text-muted-foreground"
            >
              {m.settings.useBillHint}
            </p>
          </div>
          <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer">
            <input
              id="tracks-bill"
              type="checkbox"
              role="switch"
              checked={tracksBill}
              aria-checked={tracksBill}
              onChange={(event) => {
                setTracksBill(event.target.checked);
                setErrors({});
              }}
              aria-describedby="tracks-bill-hint"
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative block h-7.5 w-12.5 rounded-full border-2 border-input transition-colors forced-color-adjust-none peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring after:absolute after:top-1/2 after:left-0.5 after:size-5.5 after:-translate-y-1/2 after:rounded-full after:bg-input after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-primary-foreground forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:after:bg-[CanvasText] forced-colors:peer-checked:border-[Highlight] forced-colors:peer-checked:bg-[Highlight] forced-colors:peer-checked:after:bg-[HighlightText]"
            />
          </label>
        </div>

        {tracksBill && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <DayField
                id="best-day"
                ref={bestDayRef}
                label={m.settings.bestPurchaseDay}
                value={bestDay}
                onChange={setBestDay}
                invalid={Boolean(errors.days) && !bestDay}
              />
              <DayField
                id="due-day"
                ref={dueDayRef}
                label={m.settings.dueDay}
                value={dueDay}
                onChange={setDueDay}
                invalid={Boolean(errors.days) && !dueDay}
              />
            </div>
            {errors.days && (
              <p
                id="bill-days-error"
                className="text-footnote text-destructive"
              >
                {errors.days}
              </p>
            )}
            {example && (
              <p className="text-footnote text-muted-foreground">
                {m.settings.billExample(
                  formatShortDate(example.closesOn),
                  formatShortDate(example.dueOn),
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <output className="block min-h-5 text-footnote text-muted-foreground">
          {status}
        </output>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {card && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={busy}
              onClick={toggleArchived}
            >
              {archived ? (
                <ArchiveRestoreIcon aria-hidden="true" />
              ) : (
                <ArchiveIcon aria-hidden="true" />
              )}
              {archived ? m.settings.restore : m.settings.archive}
            </Button>
          )}
          <Button type="submit" size="lg" disabled={busy}>
            {!card && <PlusIcon aria-hidden="true" />}
            {saving
              ? m.common.saving
              : card
                ? m.common.save
                : m.settings.createCard}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DayField({
  id,
  label,
  value,
  onChange,
  invalid,
  ref,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (day: number) => void;
  invalid: boolean;
  ref: React.Ref<HTMLSelectElement>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={id}
        className="text-footnote font-medium text-muted-foreground"
      >
        {label}
      </label>
      <NativeSelect
        ref={ref}
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "bill-days-error" : undefined}
      >
        <option value="" disabled>
          {m.settings.chooseDay}
        </option>
        {monthDays.map((day) => (
          <option key={day} value={day}>
            {m.settings.dayOption(day)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
