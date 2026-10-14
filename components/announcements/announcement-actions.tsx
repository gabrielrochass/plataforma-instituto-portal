"use client";

import { ArchiveIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  archiveAnnouncement,
  markAnnouncementRead,
} from "@/lib/actions/announcements";
import { whatsappText } from "@/lib/announcement";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

const a = m.announcements;

export function AnnouncementActions({
  id,
  title,
  body,
  unread,
  canArchive,
}: {
  id: string;
  title: string;
  body: string;
  unread: boolean;
  canArchive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ ok: boolean; message?: string }>,
    success: string,
  ) {
    startTransition(async () => {
      const result = await attempt(action(), failed);
      toast.add(
        result.ok
          ? { title: success, type: "success" }
          : { title: result.message ?? m.common.tryAgain, type: "error" },
      );
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(whatsappText(title, body));
      toast.add({ title: a.copied, type: "success" });
    } catch {
      toast.add({ title: m.common.tryAgain, type: "error" });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {unread && (
        <Button
          type="button"
          size="lg"
          disabled={pending}
          focusableWhenDisabled
          onClick={() => run(() => markAnnouncementRead(id), a.read)}
        >
          <CheckIcon aria-hidden="true" />
          {a.markRead}
        </Button>
      )}
      <Button type="button" variant="secondary" size="lg" onClick={copy}>
        <CopyIcon aria-hidden="true" />
        {a.copy}
      </Button>
      {canArchive && (
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={a.archive(title)}
          disabled={pending}
          focusableWhenDisabled
          onClick={() => run(() => archiveAnnouncement(id), a.archived)}
        >
          <ArchiveIcon aria-hidden="true" className="size-5" />
        </Button>
      )}
    </div>
  );
}
