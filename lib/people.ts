export function ageOn(birthDate: string, day: string) {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [year, month, date] = day.split("-").map(Number);
  const hadBirthday =
    month > birthMonth || (month === birthMonth && date >= birthDay);
  return year - birthYear - (hadBirthday ? 0 : 1);
}

export function isMinor(birthDate: string, day: string) {
  return ageOn(birthDate, day) < 18;
}

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string) {
  const digits = normalizeCpf(value);
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const check = (length: number) => {
    const sum = [...digits.slice(0, length)].reduce(
      (total, digit, index) => total + Number(digit) * (length + 1 - index),
      0,
    );
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

export function formatCpf(value: string) {
  const digits = normalizeCpf(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 11 && digits.startsWith("55")
    ? digits.slice(2)
    : digits;
}

export function isValidPhone(value: string) {
  return /^[1-9]{2}9?\d{8}$/.test(normalizePhone(value));
}

export function formatPhone(value: string) {
  const digits = normalizePhone(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  return rest.length > split
    ? `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`
    : `(${area}) ${rest}`;
}

export function whatsappHref(phone: string) {
  return `https://wa.me/55${normalizePhone(phone)}`;
}

export function telHref(phone: string) {
  return `tel:+55${normalizePhone(phone)}`;
}

export function displayName(person: {
  full_name: string;
  social_name?: string | null;
}) {
  return person.social_name || person.full_name;
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}
