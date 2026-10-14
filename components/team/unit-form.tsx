"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { saveUnit } from "@/lib/actions/team";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import type { Unit } from "@/lib/roles";

type Errors = { code?: string; name?: string; form?: string };

export function UnitForm({ unit }: { unit?: Unit }) {
  const router = useRouter();
  const [id, setId] = useState(() => unit?.id ?? crypto.randomUUID());
  const [code, setCode] = useState(unit?.code ?? "");
  const [name, setName] = useState(unit?.name ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const isNew = !unit;

  function submit() {
    startTransition(async () => {
      const result = await attempt(saveUnit({ id, code, name }, isNew), failed);
      if (!result.ok) {
        setErrors({
          code: result.errors?.code?.[0],
          name: result.errors?.name?.[0],
          form: result.errors ? undefined : result.message,
        });
        return;
      }
      setErrors({});
      if (isNew) {
        toast.add({ title: m.units.created(name.trim()), type: "success" });
        setId(crypto.randomUUID());
        setCode("");
        setName("");
      } else {
        toast.add({ title: m.units.saved, type: "success" });
        router.replace("/unidades");
      }
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4 rounded-2xl bg-card p-5"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-code`}
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.units.code}
        </label>
        <Input
          id={`${id}-code`}
          value={code}
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          disabled={!isNew}
          onChange={(event) => setCode(event.target.value)}
          aria-invalid={errors.code ? true : undefined}
          aria-describedby={`${id}-code-hint`}
          className="uppercase"
        />
        <p
          id={`${id}-code-hint`}
          className={
            errors.code
              ? "text-footnote text-destructive"
              : "text-footnote text-muted-foreground"
          }
        >
          {errors.code ?? m.units.codeHint}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-name`}
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.units.name}
        </label>
        <Input
          id={`${id}-name`}
          value={name}
          maxLength={80}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
        />
        {errors.name && (
          <p id={`${id}-name-error`} className="text-footnote text-destructive">
            {errors.name}
          </p>
        )}
      </div>
      {errors.form && (
        <p role="alert" className="text-subhead text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} focusableWhenDisabled>
        {pending ? m.common.saving : isNew ? m.units.create : m.common.save}
      </Button>
    </form>
  );
}
