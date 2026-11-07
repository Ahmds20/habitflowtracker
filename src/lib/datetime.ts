// Helpers for exact moments (interview times) shown in the browser's timezone.

// ISO string -> value for <input type="datetime-local"> ("YYYY-MM-DDTHH:mm").
export function toDateTimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// <input type="datetime-local"> value (local wall time) -> ISO string with offset.
export function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

// `intl` is a BCP 47 tag such as "en-GB" or "id-ID" (see i18n/config.ts).
export function formatDateTime(iso: string, intl = "en-GB") {
  return new Date(iso).toLocaleString(intl, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string, intl = "en-GB") {
  return new Date(iso).toLocaleTimeString(intl, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLongDay(iso: string, intl = "en-GB") {
  return new Date(iso).toLocaleDateString(intl, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
