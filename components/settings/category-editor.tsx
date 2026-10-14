"use client";

import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { MoneyInput } from "@/components/forms/money-input";
import { ColorPicker, IconPicker } from "@/components/forms/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useGoBack } from "@/hooks/use-go-back";
import { saveCategory, setCategoryArchived } from "@/lib/actions";
import { attempt, failed } from "@/lib/attempt";
import { categoryIcon } from "@/lib/category-icons";
import type { Category } from "@/lib/data";
import { m } from "@/lib/i18n";
import { type PaletteColor, swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function CategoryEditor({ category }: { category: Category }) {
  const goBack = useGoBack("/ajustes/categorias");
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color as PaletteColor);
  const [limit, setLimit] = useState(category.monthly_limit_cents ?? 0);
  const [nameError, setNameError] = useState<string>();
  const [status, setStatus] = useState("");
  const [saving, startSave] = useTransition();
  const [archiving, startArchive] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const archived = category.archived_at !== null;
  const Icon = categoryIcon(icon);

  function save() {
    startSave(async () => {
      const result = await attempt(
        saveCategory({
          id: category.id,
          name,
          icon,
          color,
          monthlyLimitCents: limit > 0 ? limit : null,
        }),
        failed,
      );
      if (!result.ok) {
        setNameError(result.errors?.name?.[0]);
        setStatus(result.message ?? "");
        if (result.errors?.name) nameRef.current?.focus();
        return;
      }
      toast.add({ title: m.settings.categorySaved, type: "success" });
      goBack();
    });
  }

  function toggleArchived() {
    startArchive(async () => {
      const result = await attempt(
        setCategoryArchived(category.id, !archived),
        failed,
      );
      if (!result.ok) {
        setStatus(result.message ?? m.common.tryAgain);
        return;
      }
      toast.add({
        title: archived
          ? m.settings.restoredToast(category.name)
          : m.settings.archivedToast(category.name),
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
      <div
        aria-hidden="true"
        className="flex flex-col items-center gap-3 rounded-3xl bg-card px-4 py-8"
      >
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-full text-swatch-foreground transition-colors",
            swatch(color),
          )}
        >
          <Icon className="size-8" />
        </span>
        <span className="max-w-full truncate text-title2 font-bold tracking-tight">
          {name.trim() || category.name}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="category-name"
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.settings.name}
        </label>
        <Input
          ref={nameRef}
          id="category-name"
          maxLength={40}
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "category-name-error" : undefined}
          className="bg-card dark:bg-card"
        />
        {nameError && (
          <p
            id="category-name-error"
            className="text-footnote text-destructive"
          >
            {nameError}
          </p>
        )}
      </div>

      {category.kind === "expense" && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="category-limit"
            className="text-footnote font-medium text-muted-foreground"
          >
            {m.settings.monthlyLimit}
          </label>
          <MoneyInput
            id="category-limit"
            value={limit}
            onChange={setLimit}
            placeholder={m.settings.noLimit}
            aria-describedby="category-limit-hint"
          />
          <p
            id="category-limit-hint"
            className="text-footnote text-muted-foreground"
          >
            {m.settings.monthlyLimitHint}
          </p>
        </div>
      )}

      <ColorPicker value={color} onChange={setColor} />
      <IconPicker value={icon} color={color} onChange={setIcon} />

      <div className="flex flex-col gap-3">
        <output className="block min-h-5 text-footnote text-muted-foreground">
          {status}
        </output>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={saving || archiving}
            onClick={toggleArchived}
          >
            {archived ? (
              <ArchiveRestoreIcon aria-hidden="true" />
            ) : (
              <ArchiveIcon aria-hidden="true" />
            )}
            {archived ? m.settings.restore : m.settings.archive}
          </Button>
          <Button type="submit" size="lg" disabled={saving || archiving}>
            {saving ? m.common.saving : m.common.save}
          </Button>
        </div>
      </div>
    </form>
  );
}
