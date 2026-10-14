import { initials } from "@/lib/people";
import { cn } from "@/lib/utils";

export function PersonAvatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: string | null;
  className?: string;
}) {
  const shape = cn(
    "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-subhead font-semibold text-secondary-foreground",
    className,
  );
  if (photo) {
    return (
      // biome-ignore lint/performance/noImgElement: signed URLs from private storage expire and skip the image optimizer
      <img src={photo} alt="" className={cn(shape, "object-cover")} />
    );
  }
  return (
    <span aria-hidden="true" className={shape}>
      {initials(name)}
    </span>
  );
}
