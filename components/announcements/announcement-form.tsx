"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import {
  FlowBar,
  FlowHeader,
  flowBarButton,
} from "@/components/app-shell/flow";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { TextAreaField, TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { useToday } from "@/hooks/use-today";
import {
  type AnnouncementInput,
  postAnnouncement,
} from "@/lib/actions/announcements";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

const a = m.announcements;

type Audience = AnnouncementInput["audience"];
type Option = { id: string; name: string };

export function AnnouncementForm({
  canPostEveryone,
  units,
  classes,
}: {
  canPostEveryone: boolean;
  units: readonly Option[];
  classes: readonly Option[];
}) {
  const router = useRouter();
  const today = useToday();
  const audiences = [
    ...(canPostEveryone ? (["everyone"] as const) : []),
    ...(units.length > 0 ? (["unit"] as const) : []),
    ...(classes.length > 0 ? (["class"] as const) : []),
  ];
  const [audience, setAudience] = useState<Audience>(audiences[0] ?? "class");
  const [unitId, setUnitId] = useState(units.length === 1 ? units[0].id : "");
  const [classId, setClassId] = useState(
    classes.length === 1 ? classes[0].id : "",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const unitSelect = useId();
  const classSelect = useId();

  function submit() {
    const found: Record<string, string[]> = {};
    if (!title.trim()) found.title = [a.errors.title];
    if (!body.trim()) found.body = [a.errors.body];
    if (audience === "unit" && !unitId) found.unitId = [a.errors.target];
    if (audience === "class" && !classId) found.classId = [a.errors.target];
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setStatus(Object.values(found)[0][0]);
      return;
    }
    startTransition(async () => {
      const result = await attempt(
        postAnnouncement({
          title,
          body,
          audience,
          unitId,
          classId,
          expiresOn,
        }),
        failed,
      );
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setStatus(
          result.message ??
            Object.values(result.errors ?? {})[0]?.[0] ??
            m.common.tryAgain,
        );
        return;
      }
      toast.add({ title: a.published, type: "success" });
      router.replace("/avisos");
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
      <FlowHeader title={a.new} fallback="/avisos" />
      <div className="flex flex-1 flex-col gap-5 px-4 pt-4 pb-40">
        {audiences.length > 1 && (
          <ChoiceChips
            legend={a.audience}
            name="publico"
            value={audience}
            onChange={(next) => setAudience(next as Audience)}
            options={audiences.map((key) => ({
              value: key,
              label: a.audiences[key],
            }))}
          />
        )}
        {audience === "unit" && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor={unitSelect}
              className="text-footnote font-medium text-muted-foreground"
            >
              {a.unit}
            </label>
            <NativeSelect
              id={unitSelect}
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              aria-invalid={errors.unitId ? true : undefined}
            >
              <option value="" />
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        {audience === "class" && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor={classSelect}
              className="text-footnote font-medium text-muted-foreground"
            >
              {a.class}
            </label>
            <NativeSelect
              id={classSelect}
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              aria-invalid={errors.classId ? true : undefined}
            >
              <option value="" />
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        <TextField
          label={a.titleLabel}
          value={title}
          maxLength={120}
          error={errors.title?.[0]}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextAreaField
          label={a.body}
          value={body}
          maxLength={4000}
          rows={6}
          error={errors.body?.[0]}
          onChange={(event) => setBody(event.target.value)}
        />
        <TextField
          label={a.expiresOn}
          type="date"
          min={today}
          value={expiresOn}
          error={errors.expiresOn?.[0]}
          onChange={(event) => setExpiresOn(event.target.value)}
          className="max-w-56"
        />
      </div>
      <FlowBar status={status}>
        <Button
          type="submit"
          size="lg"
          className={flowBarButton}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? m.common.saving : a.publish}
        </Button>
      </FlowBar>
    </form>
  );
}
