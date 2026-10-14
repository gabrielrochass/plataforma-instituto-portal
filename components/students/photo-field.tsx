"use client";

import { CameraIcon, Trash2Icon } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import { PersonAvatar } from "@/components/app-shell/person-avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { removeStudentPhoto, saveStudentPhoto } from "@/lib/actions/students";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";
import { resizePhoto } from "@/lib/photo";

const f = m.studentForm;

export function photoForm(blob: Blob) {
  const data = new FormData();
  data.append("photo", new File([blob], "foto.jpg", { type: "image/jpeg" }));
  return data;
}

function usePreview(blob: Blob | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

function PhotoPicker({
  name,
  photo,
  hasPhoto,
  pending,
  onPick,
  onRemove,
}: {
  name: string;
  photo: string | null;
  hasPhoto: boolean;
  pending: boolean;
  onPick: (blob: Blob) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-footnote font-medium text-muted-foreground">
        {f.photo}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar
          name={name || "?"}
          photo={photo}
          className="size-20 text-title2"
        />
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={id}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-secondary px-4 text-subhead font-medium text-secondary-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
          >
            <CameraIcon aria-hidden="true" className="size-5" />
            {hasPhoto ? f.photoChange : f.photoAdd}
            <input
              id={id}
              type="file"
              accept="image/*"
              disabled={pending}
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  setError(undefined);
                  onPick(await resizePhoto(file));
                } catch {
                  setError(f.photoError);
                }
              }}
            />
          </label>
          {hasPhoto && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={pending}
              onClick={onRemove}
            >
              <Trash2Icon aria-hidden="true" />
              {f.photoRemove}
            </Button>
          )}
        </div>
      </div>
      <p className="text-footnote text-muted-foreground">{f.photoHint}</p>
      {error && (
        <p role="alert" className="text-footnote text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function NewPhotoField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: Blob | null;
  onChange: (blob: Blob | null) => void;
}) {
  const preview = usePreview(value);
  return (
    <PhotoPicker
      name={name}
      photo={preview}
      hasPhoto={value !== null}
      pending={false}
      onPick={onChange}
      onRemove={() => onChange(null)}
    />
  );
}

export function StudentPhotoField({
  studentId,
  name,
  photo,
}: {
  studentId: string;
  name: string;
  photo: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState<Blob | null>(null);
  const preview = usePreview(local);

  return (
    <PhotoPicker
      name={name}
      photo={preview ?? photo}
      hasPhoto={photo !== null || local !== null}
      pending={pending}
      onPick={(blob) =>
        startTransition(async () => {
          setLocal(blob);
          const result = await attempt(
            saveStudentPhoto(studentId, photoForm(blob)),
            failed,
          );
          toast.add(
            result.ok
              ? { title: f.photoSaved, type: "success" }
              : { title: result.message ?? m.common.tryAgain, type: "error" },
          );
          if (!result.ok) setLocal(null);
        })
      }
      onRemove={() =>
        startTransition(async () => {
          const result = await attempt(removeStudentPhoto(studentId), failed);
          setLocal(null);
          toast.add(
            result.ok
              ? { title: f.photoRemoved, type: "success" }
              : { title: result.message ?? m.common.tryAgain, type: "error" },
          );
        })
      }
    />
  );
}
