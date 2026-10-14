export const bom = String.fromCharCode(0xfeff);

const formulaStart = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = formulaStart.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function toCsv(
  header: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
) {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(";"));
  return `${bom}${lines.join("\r\n")}\r\n`;
}
