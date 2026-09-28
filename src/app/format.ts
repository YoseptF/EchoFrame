const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function relativeTime(iso: string, now = Date.now()) {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of units)
    if (Math.abs(seconds) >= size)
      return format.format(Math.round(seconds / size), unit);
  return "just now";
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
