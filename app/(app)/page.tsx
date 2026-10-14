import { CalendarCheckIcon } from "lucide-react";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { getProfile } from "@/lib/data/account";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";

export default async function HomePage() {
  const profile = await getProfile();
  const firstName = profile?.display_name?.split(" ")[0] ?? null;

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
