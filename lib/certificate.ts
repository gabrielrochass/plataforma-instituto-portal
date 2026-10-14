export function normalizeCertificateCode(raw: unknown) {
  if (typeof raw !== "string") return null;
  const clean = raw.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (!/^[2-9A-HJ-NP-Z]{12}$/.test(clean)) return null;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}
