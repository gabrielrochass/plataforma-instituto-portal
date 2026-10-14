"use client";

import { useRef, useState, useTransition } from "react";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInvite } from "@/lib/actions/team";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import type { Unit, UnitRole } from "@/lib/roles";
import { ShareLink } from "./share-link";

type Errors = { name?: string; unitId?: string; form?: string };

export function InviteForm({
  units,
  rolesByUnit,
}: {
  units: readonly Unit[];
  rolesByUnit: Record<string, UnitRole[]>;
}) {
  const [id, setId] = useState(() => crypto.randomUUID());
  const [name, setName] = useState("");
  const [unitId, setUnitId] = useState(units.length === 1 ? units[0].id : "");
  const [role, setRole] = useState<UnitRole>("teacher");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{ name: string; link: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const roles = rolesByUnit[unitId] ?? ["teacher"];

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        createInvite({ id, name, unitId, role }),
        failed,
      );
      if (!result.ok) {
        const found = {
          name: result.errors?.name?.[0],
          unitId: result.errors?.unitId?.[0],
          form: result.errors ? undefined : result.message,
        };
        setErrors(found);
        if (found.name) nameRef.current?.focus();
        return;
      }
      setErrors({});
      setSent({
        name: name.trim(),
        link: `${window.location.origin}/convite/${result.token}`,
      });
    });
  }

  function again() {
    setSent(null);
    setId(crypto.randomUUID());
    setName("");
    setRole("teacher");
  }

  if (sent) {
    return (
      <ShareLink
        title={m.team.linkReady(sent.name)}
        hint={m.team.linkHint}
        link={sent.link}
        message={m.team.inviteMessage(sent.name, sent.link)}
      >
        <Button type="button" variant="ghost" size="lg" onClick={again}>
          {m.team.another}
        </Button>
      </ShareLink>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-7"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="invite-name"
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.team.name}
        </label>
        <Input
          ref={nameRef}
          id="invite-name"
          maxLength={80}
          autoComplete="off"
          placeholder={m.team.namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "invite-name-error" : undefined}
          className="bg-card dark:bg-card"
        />
        {errors.name && (
          <p id="invite-name-error" className="text-footnote text-destructive">
            {errors.name}
          </p>
        )}
      </div>
      <ChoiceChips
        legend={m.team.unit}
        name="unit"
        value={unitId}
        onChange={(value) => {
          setUnitId(value);
          if (!(rolesByUnit[value] ?? []).includes(role)) setRole("teacher");
        }}
        options={units.map((unit) => ({ value: unit.id, label: unit.name }))}
        error={errors.unitId}
      />
      {roles.length > 1 && (
        <ChoiceChips
          legend={m.team.role}
          name="role"
          value={role}
          onChange={(value) => setRole(value as UnitRole)}
          options={roles.map((option) => ({
            value: option,
            label: m.roles[option],
          }))}
        />
      )}
      {errors.form && (
        <p role="alert" className="text-subhead text-destructive">
          {errors.form}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="h-12 text-body"
        disabled={pending}
        focusableWhenDisabled
      >
        {pending ? m.team.creating : m.team.createLink}
      </Button>
    </form>
  );
}
