"use client";

import { ArrowLeftIcon, CheckIcon, PlusIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useId, useState, useTransition } from "react";
import { signupSteps } from "@/components/auth/signup-flow";
import { Tally } from "@/components/brand/tally";
import { CardFace, MiniCard } from "@/components/cards/card-face";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { createStarterCategories, saveCard } from "@/lib/actions";
import type { CardDesign } from "@/lib/card-designs";
import { categoryIcon } from "@/lib/category-icons";
import { m } from "@/lib/i18n";
import { type PaletteColor, paletteColors, swatch } from "@/lib/palette";
import {
  type StarterCategory,
  starterCategories,
} from "@/lib/starter-categories";
import { cn } from "@/lib/utils";

const designs: CardDesign[] = ["grafite", "meia-noite", "ametista", "ouro"];

type Step = "categories" | "card";

export function SetupFlow({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("categories");
  const [options, setOptions] = useState<StarterCategory[]>(() => [
    ...starterCategories,
  ]);
  const [other, setOther] = useState("");
  const [usesCard, setUsesCard] = useState<boolean | null>(null);
  const [cardName, setCardName] = useState("");
  const [design, setDesign] = useState<CardDesign>("meia-noite");
  const [cardId] = useState(() => crypto.randomUUID());
  const [pending, startTransition] = useTransition();
  const focusOnMount = useCallback(
    (element: HTMLHeadingElement | null) => element?.focus(),
    [],
  );
  const otherId = useId();
  const cardNameId = useId();

  function toggle(name: string) {
    setOptions((current) =>
      current.map((option) =>
        option.name === name ? { ...option, checked: !option.checked } : option,
      ),
    );
  }

  function addOther() {
    const name = other.trim().slice(0, 40);
    if (!name) return;
    if (
      !options.some(
        (option) => option.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      const expenses = options.filter((option) => option.kind === "expense");
      setOptions((current) => [
        ...current,
        {
          name,
          icon: "tag",
          color: paletteColors[expenses.length % 5] as PaletteColor,
          kind: "expense",
          checked: true,
        },
      ]);
    }
    setOther("");
  }

  function saveCategories() {
    const chosen = options
      .filter((option) => option.checked)
      .map(({ kind, name, icon, color }) => ({ kind, name, icon, color }));
    startTransition(async () => {
      const result = await createStarterCategories(chosen);
      if (!result.ok) {
        toast.add({ title: result.message, type: "error" });
        return;
      }
      setStep("card");
    });
  }

  function leave() {
    router.replace(next as Route);
  }

  function finish() {
    if (!usesCard || !cardName.trim()) return leave();
    startTransition(async () => {
      const result = await saveCard(
        {
          id: cardId,
          name: cardName.trim(),
          design,
          bestPurchaseDay: null,
          dueDay: null,
        },
        true,
      );
      if (!result.ok) {
        toast.add({
          title: result.message ?? m.common.tryAgain,
          type: "error",
        });
        return;
      }
      leave();
    });
  }

  const index = step === "categories" ? 3 : 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        {step === "card" ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="-ml-3 text-link"
            onClick={() => setStep("categories")}
          >
            <ArrowLeftIcon aria-hidden="true" />
            {m.signup.back}
          </Button>
        ) : (
          <span />
        )}
        <Tally lit={index + 1} className="h-7 w-9" />
      </div>

      <div key={step} className="flex animate-step-in flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-footnote font-medium text-muted-foreground">
            {m.signup.step(index + 1, signupSteps)}
          </p>
          <h1
            ref={focusOnMount}
            tabIndex={-1}
            className="text-title1 font-bold tracking-tight text-balance"
          >
            {step === "categories"
              ? m.signup.categoriesQuestion
              : m.signup.cardQuestion}
          </h1>
          <p className="text-body text-muted-foreground">
            {step === "categories"
              ? m.signup.categoriesHint
              : m.signup.cardHint}
          </p>
        </div>

        {step === "categories" && (
          <>
            <CategoryGroup
              legend={m.signup.expenseLegend}
              options={options.filter((option) => option.kind === "expense")}
              onToggle={toggle}
            />
            <div className="flex flex-col gap-2">
              <label
                htmlFor={otherId}
                className="text-footnote font-medium text-muted-foreground"
              >
                {m.signup.otherLabel}
              </label>
              <div className="flex gap-2">
                <Input
                  id={otherId}
                  value={other}
                  maxLength={40}
                  autoComplete="off"
                  onChange={(event) => setOther(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addOther();
                    }
                  }}
                  className="h-11 bg-card dark:bg-card"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={addOther}
                >
                  <PlusIcon aria-hidden="true" />
                  {m.signup.add}
                </Button>
              </div>
            </div>
            <CategoryGroup
              legend={m.signup.incomeLegend}
              options={options.filter((option) => option.kind === "income")}
              onToggle={toggle}
            />
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setStep("card")}
              >
                {m.signup.skip}
              </Button>
              <Button
                type="button"
                size="lg"
                className="h-12 text-body"
                disabled={pending}
                focusableWhenDisabled
                onClick={saveCategories}
              >
                {pending ? m.signup.finishing : m.signup.next}
              </Button>
            </div>
          </>
        )}

        {step === "card" && (
          <>
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="sr-only">{m.signup.cardQuestion}</legend>
              {[true, false].map((value) => (
                <label
                  key={String(value)}
                  className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-secondary text-body font-medium text-secondary-foreground transition-colors select-none has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                >
                  <input
                    type="radio"
                    name="usa-cartao"
                    checked={usesCard === value}
                    onChange={() => setUsesCard(value)}
                    className="sr-only"
                  />
                  {value ? m.signup.yes : m.signup.no}
                </label>
              ))}
            </fieldset>

            {usesCard && (
              <div className="flex animate-step-in flex-col gap-4">
                <CardFace
                  name={cardName.trim() || m.signup.cardNamePlaceholder}
                  design={design}
                  className="mx-auto max-w-72"
                />
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={cardNameId}
                    className="text-footnote font-medium text-muted-foreground"
                  >
                    {m.signup.cardName}
                  </label>
                  <Input
                    id={cardNameId}
                    value={cardName}
                    maxLength={40}
                    autoComplete="off"
                    placeholder={m.signup.cardNamePlaceholder}
                    onChange={(event) => setCardName(event.target.value)}
                    className="h-11 bg-card dark:bg-card"
                  />
                </div>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-footnote font-medium text-muted-foreground">
                    {m.signup.cardDesign}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {designs.map((key) => (
                      <label
                        key={key}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 text-subhead font-medium text-secondary-foreground transition-colors select-none has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                      >
                        <input
                          type="radio"
                          name="visual"
                          checked={design === key}
                          onChange={() => setDesign(key)}
                          className="sr-only"
                        />
                        <MiniCard design={key} />
                        {m.cardDesigns[key]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="text-footnote text-muted-foreground">
                  {m.signup.cardDaysLater}
                </p>
              </div>
            )}

            <Button
              type="button"
              size="lg"
              className="h-12 text-body"
              disabled={pending || usesCard === null}
              focusableWhenDisabled
              onClick={finish}
            >
              {pending ? m.signup.finishing : m.signup.finish}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function CategoryGroup({
  legend,
  options,
  onToggle,
}: {
  legend: string;
  options: StarterCategory[];
  onToggle: (name: string) => void;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col">
      <legend className="mb-3 text-footnote font-medium text-muted-foreground">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const Icon = categoryIcon(option.icon);
          return (
            <label
              key={option.name}
              className="flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full border border-input bg-card py-1 pr-4 pl-1 text-subhead font-medium transition-colors select-none has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="checkbox"
                checked={option.checked}
                onChange={() => onToggle(option.name)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-swatch-foreground",
                  swatch(option.color),
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="truncate">{option.name}</span>
              {option.checked && (
                <CheckIcon aria-hidden="true" className="size-4 shrink-0" />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
