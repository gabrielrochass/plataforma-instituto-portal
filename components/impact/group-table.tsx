import { m } from "@/lib/i18n";
import { type ImpactGroup, percent } from "@/lib/impact";

function rate(part: number, whole: number) {
  const value = percent(part, whole);
  return value === null ? m.impact.noData : m.impact.percent(value);
}

export function GroupTable({
  title,
  nameHeader,
  groups,
}: {
  title: string;
  nameHeader: string;
  groups: readonly ImpactGroup[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 break-inside-avoid">
      <h3 className="text-headline font-semibold">{title}</h3>
      {groups.length === 0 ? (
        <p className="text-subhead text-muted-foreground">{m.impact.empty}</p>
      ) : (
        <table className="w-full text-subhead">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">
                {nameHeader}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                {m.impact.columns.served}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                {m.impact.columns.completion}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                {m.impact.columns.attendance}
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-b last:border-0">
                <th
                  scope="row"
                  className="py-2 pr-3 text-left font-normal [overflow-wrap:anywhere]"
                >
                  {group.name}
                </th>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {group.served.toLocaleString("pt-BR")}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {rate(group.completed, group.finished)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {rate(group.attended, group.recorded)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
