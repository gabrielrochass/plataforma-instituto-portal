import { CalendarCheckIcon } from "lucide-react";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { getViewer } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";

export default async function HomePage() {
  const viewer = await getViewer();
  const firstName = viewer.name?.split(" ")[0] ?? null;

  return (
    <>
      <PageHeader
        title={m.home.greeting(firstName)}
        subtitle={formatFullDate(todayInRecife())}
      />
      <EmptyState
        icon={CalendarCheckIcon}
        title={m.home.emptyTitle}
        description={m.home.emptyDescription}
      />
    </>
  );
}
