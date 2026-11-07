import { CheckIcon, FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A still picture of the product's core idea, built from real markup:
// one week, the applications sent each day, and the goal they count toward.

const days = [
  { label: "Mon", sent: ["Tokopedia", "Gojek"] },
  { label: "Tue", sent: [] },
  { label: "Wed", sent: ["Shopee"] },
  { label: "Thu", sent: ["Halodoc"], today: true },
  { label: "Fri", sent: [] },
  { label: "Sat", sent: [] },
  { label: "Sun", sent: [] },
];

const goal = 5;
const sent = days.reduce((sum, d) => sum + d.sent.length, 0);

// Order in which the blocks appear on load, across the whole week.
let order = 0;
const strip = days.map((day) => ({
  ...day,
  blocks: day.sent.map((company) => ({ company, delay: order++ })),
}));

const habit = [true, true, false, true, true];

export function WeekStrip() {
  return (
    <figure
      className="bg-background w-full max-w-md rounded-2xl border p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.18)]"
      aria-label={`Example week: ${sent} of ${goal} applications sent by Thursday`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium">This week</p>
        <p className="text-muted-foreground text-sm tabular-nums">
          {sent} of {goal} sent
        </p>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5" aria-hidden>
        {strip.map((day) => (
          <div key={day.label} className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-28 w-full flex-col-reverse gap-1 rounded-lg p-1",
                day.today ? "bg-sky-50 ring-1 ring-sky-200" : "bg-slate-50",
              )}
            >
              {day.blocks.map((block) => (
                <span
                  key={block.company}
                  title={block.company}
                  className="landing-block h-6 rounded-md bg-sky-500"
                  style={{ animationDelay: `${150 + block.delay * 180}ms` }}
                />
              ))}
            </div>
            <span
              className={cn(
                "text-xs",
                day.today
                  ? "font-medium text-sky-700"
                  : "text-muted-foreground",
              )}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"
        aria-hidden
      >
        <div
          className="landing-bar h-full rounded-full bg-sky-500"
          style={{ width: `${(sent / goal) * 100}%` }}
        />
      </div>

      <div className="mt-5 flex items-center gap-3 border-t pt-4 text-sm">
        <span className="flex-1">Practice coding</span>
        <span className="flex gap-1" aria-hidden>
          {habit.map((done, i) => (
            <span
              key={i}
              className={cn(
                "flex size-5 items-center justify-center rounded-full",
                done ? "bg-emerald-500 text-white" : "border border-slate-300",
              )}
            >
              {done && <CheckIcon className="size-3" />}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-0.5 tabular-nums">
          <FlameIcon className="size-4 text-orange-500" aria-hidden />2
        </span>
      </div>
      <figcaption className="sr-only">
        Four applications sent by Thursday toward a goal of five, and a coding
        habit checked in on four of five weekdays.
      </figcaption>
    </figure>
  );
}
