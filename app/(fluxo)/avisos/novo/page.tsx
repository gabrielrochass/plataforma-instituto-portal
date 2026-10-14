import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { getClasses } from "@/lib/data/classes";
import { getUnits } from "@/lib/data/team";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { adminUnits, can } from "@/lib/roles";

export const metadata: Metadata = { title: m.announcements.new };

export default async function NewAnnouncementPage() {
  const viewer = await getViewer();
  if (!can.postAnnouncement(viewer)) forbidden();
  const [units, classes] = await Promise.all([getUnits(), getClasses()]);

  return (
    <AnnouncementForm
      canPostEveryone={viewer.isAdminGeral}
      units={adminUnits(viewer, units)}
      classes={classes
        .filter((row) => row.operable && row.status === "open")
        .map((row) => ({ id: row.id, name: `${row.name}, ${row.unit_code}` }))}
    />
  );
}
