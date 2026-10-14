"use client";

import { ScanLineIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { badgeTokenOf } from "@/lib/badge";
import { m } from "@/lib/i18n";

const a = m.attendance;

export function BadgeScanner({
  onToken,
  disabled,
}: {
  onToken: (token: string) => string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const handler = useRef(onToken);
  handler.current = onToken;

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let frame = 0;
    let stream: MediaStream | null = null;
    const recent = new Map<string, number>();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch {
        setFailed(true);
        return;
      }
      const element = video.current;
      if (stopped || !element || !context) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      element.srcObject = stream;
      await element.play().catch(() => {});
      const { default: jsQR } = await import("jsqr");
      let last = 0;
      const tick = (time: number) => {
        if (stopped) return;
        frame = requestAnimationFrame(tick);
        if (time - last < 200 || element.readyState < 2) return;
        last = time;
        const scale = Math.min(1, 640 / element.videoWidth);
        canvas.width = Math.round(element.videoWidth * scale);
        canvas.height = Math.round(element.videoHeight * scale);
        context.drawImage(element, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, canvas.width, canvas.height, {
          inversionAttempts: "dontInvert",
        });
        const token = code ? badgeTokenOf(code.data) : null;
        if (!token) return;
        const seen = recent.get(token) ?? 0;
        if (time - seen < 2500) return;
        recent.set(token, time);
        navigator.vibrate?.(60);
        setMessage(handler.current(token));
        setCount((value) => value + 1);
      };
      frame = requestAnimationFrame(tick);
    }

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setMessage("");
          setCount(0);
          setFailed(false);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={disabled}
          />
        }
      >
        <ScanLineIcon aria-hidden="true" />
        {a.scan}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{a.scanTitle}</DialogTitle>
          <DialogDescription>{a.scanHint}</DialogDescription>
        </DialogHeader>
        {failed ? (
          <p role="alert" className="text-subhead text-destructive">
            {a.cameraError}
          </p>
        ) : (
          <video
            ref={video}
            muted
            playsInline
            className="aspect-square w-full rounded-xl bg-black object-cover"
          />
        )}
        <p aria-live="polite" className="min-h-6 text-body font-medium">
          {message}
        </p>
        <p className="text-footnote text-muted-foreground tabular-nums">
          {a.scanCount(count)}
        </p>
        <Button type="button" size="lg" onClick={() => setOpen(false)}>
          {a.stopScan}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
