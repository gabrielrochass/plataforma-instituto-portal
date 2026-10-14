"use client";

import { useEffect, useState, useTransition } from "react";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { ShareLink } from "@/components/team/share-link";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { openOffer, setOfferOpen } from "@/lib/actions/requests";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

export function PublicOffersLink() {
  const [link, setLink] = useState("");
  useEffect(() => setLink(`${window.location.origin}/inscricao`), []);
  if (!link) return null;
  return (
    <ShareLink
      title={m.requests.publicLink}
      hint={m.requests.publicIntro}
      link={link}
      message={`${m.requests.publicTitle}: ${link}`}
      focusOnMount={false}
    />
  );
}

export function OfferToggle({
  id,
  course,
  isOpen,
}: {
  id: string;
  course: string;
  isOpen: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={isOpen ? "destructive" : "secondary"}
      size="lg"
      aria-label={isOpen ? m.requests.close(course) : m.requests.reopen(course)}
      disabled={pending}
      focusableWhenDisabled
      onClick={() =>
        startTransition(async () => {
          const result = await attempt(setOfferOpen(id, !isOpen), failed);
          toast.add(
            result.ok
              ? {
                  title: isOpen ? m.requests.closed : m.requests.reopened,
                  type: "success",
                }
              : { title: result.message ?? m.common.tryAgain, type: "error" },
          );
        })
      }
    >
      {isOpen ? m.requests.closeShort : m.requests.reopenShort}
    </Button>
  );
}

export function OfferForm({
  classes,
}: {
  classes: readonly { id: string; name: string }[];
}) {
  const [id, setId] = useState(() => crypto.randomUUID());
  const [classId, setClassId] = useState("");
  const [description, setDescription] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await attempt(
        openOffer({ id, classId, description, closesOn }),
        failed,
      );
      if (!result.ok) {
        setErrors({
          classId: result.errors?.classId?.[0],
          form: result.errors ? undefined : result.message,
        });
        return;
      }
      setErrors({});
      setId(crypto.randomUUID());
      setClassId("");
      setDescription("");
      setClosesOn("");
      toast.add({ title: m.requests.opened, type: "success" });
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
          htmlFor="oferta-curso"
          className="text-footnote font-medium text-muted-foreground"
        >
          {m.requests.course}
        </label>
        <NativeSelect
          id="oferta-curso"
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          aria-invalid={errors.classId ? true : undefined}
          aria-describedby={errors.classId ? "oferta-curso-erro" : undefined}
        >
          <option value="" />
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        {errors.classId && (
          <p id="oferta-curso-erro" className="text-footnote text-destructive">
            {errors.classId}
          </p>
        )}
      </div>
      <TextAreaField
        label={m.requests.description}
        hint={m.requests.descriptionHint}
        maxLength={1000}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <TextField
        label={m.requests.closes}
        type="date"
        value={closesOn}
        onChange={(event) => setClosesOn(event.target.value)}
        className="max-w-56"
      />
      {errors.form && (
        <p role="alert" className="text-subhead text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} focusableWhenDisabled>
        {m.requests.open}
      </Button>
    </form>
  );
}
