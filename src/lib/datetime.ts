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

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
