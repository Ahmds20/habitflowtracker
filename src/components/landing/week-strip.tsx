import { CheckIcon, FlameIcon } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { cn } from "@/lib/utils";

// A still picture of the product's core idea, built from real markup:
// one week, the applications sent each day, and the goal they count toward.
// Day labels come from the dictionary (index 0 = Monday).

const days = [
  { sent: ["Tokopedia", "Gojek"] },
  { sent: [] },
  { sent: ["Shopee"] },
  { sent: ["Halodoc"], today: true },
  { sent: [] },
  { sent: [] },
  { sent: [] },
];

const goal = 5;
const sent = days.reduce((sum, d) => sum + d.sent.length, 0);

// Order in which the blocks appear on load, across the whole week.
let order = 0;
const strip = days.map((day, index) => ({
  ...day,
  index,
  blocks: day.sent.map((company) => ({ company, delay: order++ })),
}));

const habit = [true, true, false, true, true];

export function WeekStrip({ t }: { t: Dictionary }) {
  const w = t.landing.week;
  return (
    <figure
      className="bg-card w-full max-w-md rounded-2xl border p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.18)]"
      aria-label={w.label(sent, goal)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold">{w.title}</p>
        <p className="text-muted-foreground text-sm tabular-nums">
          {w.sent(sent, goal)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5" aria-hidden>
        {strip.map((day) => (
          <div key={day.index} className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-28 w-full flex-col-reverse gap-1 rounded-lg p-1",
                day.today
                  ? "bg-teal-50 ring-1 ring-teal-200 dark:bg-teal-950/40 dark:ring-teal-800"
                  : "bg-slate-50 dark:bg-slate-800/50",
              )}
            >
              {day.blocks.map((block) => (
                <span
                  key={block.company}
                  title={block.company}
                  className="landing-block h-6 rounded-md bg-teal-500"
                  style={{ animationDelay: `${150 + block.delay * 180}ms` }}
                />
              ))}
            </div>
            <span
              className={cn(
                "text-xs",
                day.today
                  ? "font-semibold text-teal-700 dark:text-teal-300"
                  : "text-muted-foreground",
              )}
            >
              {w.days[day.index]}
            </span>
          </div>
        ))}
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        aria-hidden
      >
        <div
          className="landing-bar h-full rounded-full bg-teal-500"
          style={{ width: `${(sent / goal) * 100}%` }}
        />
      </div>

      <div className="mt-5 flex items-center gap-3 border-t pt-4 text-sm">
        <span className="flex-1 font-medium">{w.habit}</span>
        <span className="flex gap-1" aria-hidden>
          {habit.map((done, i) => (
            <span
              key={i}
              className={cn(
                "flex size-5 items-center justify-center rounded-md",
                done
                  ? "bg-emerald-500 text-white"
                  : "border border-slate-300 dark:border-slate-600",
              )}
            >
              {done && <CheckIcon className="size-3 stroke-[3]" />}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-0.5 font-semibold tabular-nums">
          <FlameIcon
            className="size-4 fill-amber-500 text-amber-500"
            aria-hidden
          />
          2
        </span>
      </div>
      <figcaption className="sr-only">{w.caption}</figcaption>
    </figure>
  );
}
