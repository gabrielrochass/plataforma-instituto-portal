import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full min-w-0">
      <select
        data-slot="native-select"
        className={cn(
          "h-11 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-input bg-card pr-11 pl-3 text-base text-foreground aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
      >
        <ChevronDownIcon className="size-5" />
      </span>
    </div>
  );
}

export { NativeSelect };
