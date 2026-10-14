import { cn } from "@/lib/utils";

const strokes = [
  "M8 6 L7 34",
  "M18 5 L17.5 35",
  "M28 6 L28.5 34",
  "M38 5 L39 35",
  "M2 30 L46 9",
];

export function Tally({
  className,
  lit = strokes.length,
}: {
  className?: string;
  lit?: number;
}) {
  const progress = lit < strokes.length;
  return (
    <svg
      viewBox="0 0 48 40"
      aria-hidden="true"
      className={cn("h-8 w-10 text-link", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
    >
      {strokes.map((d, index) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          className={
            index < lit ? "tally-stroke" : "stroke-muted-foreground/25"
          }
          style={{ "--i": progress ? 0 : index } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}
