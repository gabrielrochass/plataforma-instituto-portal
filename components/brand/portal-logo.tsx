import { cn } from "@/lib/utils";

export function PortalLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 170 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 5v57M5 5h17a17 17 0 0 1 0 34H5" />
      <circle cx="83" cy="35" r="27" />
      <path d="M127 5v57M127 5h17a16 16 0 0 1 0 32h-17M141 37l24 27" />
      <path d="M2 95h44M24 95v60" />
      <path d="M56 155 83 46l27 109M65.3 118h35.4" />
      <path d="M127 95v60h38" />
    </svg>
  );
}

export function PortalMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[22%] bg-primary text-white ring-1 ring-black/10 dark:ring-white/10",
        className,
      )}
    >
      <PortalLogo className="w-[58%]" />
    </span>
  );
}
