import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

// The HabitFlow logo (rounded frame, "Hf", rising arrow) in the brand colour,
// followed by the wordmark.
export function BrandMark({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 font-bold", className)}
    >
      <LogoMark
        className={cn("text-primary shrink-0", compact ? "size-8" : "size-9")}
      />
      <span className="text-base tracking-tight">
        HabitFlow
        <span className="text-primary">Tracker</span>
      </span>
    </Link>
  );
}
