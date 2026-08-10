/** Форматирование денег: 12.5 -> "$12.50" */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Date from ISO string: "2026-08-15" -> "Aug 15" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/** Time/date for notifications */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Ordinal day: 1 -> "1st", 3 -> "3rd", 15 -> "15th" */
export function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : suffixes[Math.min(v % 10, 4)];
  return `${n}${suffix}`;
}

/** Initials for Avatar: "Ivan Petrov" -> "IP" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
