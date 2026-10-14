"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Tally } from "@/components/brand/tally";
import { Button, buttonVariants } from "@/components/ui/button";
import { finishOnboarding } from "@/lib/actions";
import { m } from "@/lib/i18n";
import {
  availableSteps,
  type Box,
  popupPlacement,
  type TourStep,
} from "@/lib/tour";
import { cn } from "@/lib/utils";

type Phase = "welcome" | "steps" | "done";

const padding = 8;

function findTarget(step: TourStep) {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour="${step}"]`),
  ).find((element) => element.getClientRects().length > 0);
}

function boxOf(element: HTMLElement): Box {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function Tour({
  autoStart,
  hasEntries,
}: {
  autoStart: boolean;
  hasEntries: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tour") === "1";
  const [phase, setPhase] = useState<Phase | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [popupSize, setPopupSize] = useState({ width: 320, height: 200 });
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    if (autoStart || requested) setPhase("welcome");
  }, [autoStart, requested]);

  const step = phase === "steps" ? steps[index] : undefined;

  const measure = useCallback(() => {
    const target = step && findTarget(step);
    setBox(target ? boxOf(target) : null);
  }, [step]);

  useLayoutEffect(() => {
    if (!step) return;
    const target = findTarget(step);
    if (target) {
      const rect = target.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        target.scrollIntoView({ block: "center" });
      }
    }
    measure();
  }, [step, measure]);

  useEffect(() => {
    if (!phase) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [phase, measure]);

  useLayoutEffect(() => {
    if (!phase || !popupRef.current) return;
    const { offsetWidth, offsetHeight } = popupRef.current;
    setPopupSize((current) =>
      current.width === offsetWidth && current.height === offsetHeight
        ? current
        : { width: offsetWidth, height: offsetHeight },
    );
  });

  useEffect(() => {
    if (!phase) return;
    const root = rootRef.current;
    const others = Array.from(document.body.children).filter(
      (element) => element !== root && !element.hasAttribute("inert"),
    );
    for (const element of others) element.setAttribute("inert", "");
    return () => {
      for (const element of others) element.removeAttribute("inert");
    };
  }, [phase]);

  useEffect(() => {
    if (phase) primaryRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (!phase) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (phase === "steps" && event.key === "ArrowRight") {
        go(1);
      } else if (phase === "steps" && event.key === "ArrowLeft") {
        go(-1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function begin() {
    const found = availableSteps((candidate) => Boolean(findTarget(candidate)));
    setSteps(found);
    setIndex(0);
    setPhase(found.length > 0 ? "steps" : "done");
  }

  function go(delta: number) {
    const next = index + delta;
    if (next < 0) return;
    if (next >= steps.length) setPhase("done");
    else setIndex(next);
    if (next === 0) primaryRef.current?.focus();
  }

  function finish() {
    setPhase(null);
    setBox(null);
    if (requested) router.replace(pathname as "/", { scroll: false });
    void finishOnboarding();
  }

  if (!phase) return null;

  const viewport = {
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
  };
  const placement =
    phase === "steps" && box ? popupPlacement(box, viewport, popupSize) : null;
  const copy = step ? m.tour.steps[step] : null;

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-45">
      {placement && box ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl shadow-[0_0_0_9999px_rgb(0_0_0/0.62)] outline-2 outline-offset-0 outline-ring transition-[top,left,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/62" />
      )}

      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className={cn(
          "fixed flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl bg-popover p-5 text-popover-foreground shadow-xl transition-[top,left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          !placement && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
        style={placement ? { top: placement.top, left: placement.left } : {}}
      >
        {phase === "welcome" && (
          <>
            <Tally className="h-10 w-12" />
            <h2 id={titleId} className="text-title3 font-semibold">
              {m.tour.welcomeTitle}
            </h2>
            <p id={textId} className="text-body text-muted-foreground">
              {m.tour.welcomeText}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="ghost" size="lg" onClick={finish}>
                {m.tour.later}
              </Button>
              <Button ref={primaryRef} size="lg" onClick={begin}>
                {m.tour.start}
              </Button>
            </div>
          </>
        )}

        {phase === "steps" && copy && (
          <>
            <p className="text-footnote font-medium text-link tabular-nums">
              {m.tour.step(index + 1, steps.length)}
            </p>
            <h2 id={titleId} className="text-headline font-semibold">
              {copy.title}
            </h2>
            <p id={textId} className="text-body text-muted-foreground">
              {copy.text}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="lg"
                className="-ml-3 text-muted-foreground"
                onClick={finish}
              >
                {m.tour.skip}
              </Button>
              <div className="flex gap-2">
                {index > 0 && (
                  <Button
                    variant="secondary"
                    size="icon-lg"
                    aria-label={m.tour.back}
                    onClick={() => go(-1)}
                  >
                    <ArrowLeftIcon aria-hidden="true" />
                  </Button>
                )}
                <Button ref={primaryRef} size="lg" onClick={() => go(1)}>
                  {m.tour.next}
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <Tally className="h-10 w-12" />
            <h2 id={titleId} className="text-title3 font-semibold">
              {m.tour.doneTitle}
            </h2>
            <p id={textId} className="text-body text-muted-foreground">
              {m.tour.doneText}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {!hasEntries && (
                <Link
                  ref={primaryRef}
                  href="/lancamentos/novo"
                  onClick={finish}
                  className={buttonVariants({ size: "lg" })}
                >
                  {m.tour.firstEntry}
                </Link>
              )}
              <Button
                ref={hasEntries ? primaryRef : undefined}
                variant={hasEntries ? "default" : "ghost"}
                size="lg"
                onClick={finish}
              >
                {m.tour.close}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
