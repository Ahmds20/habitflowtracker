// Onboarding sits outside the (app) layout: that layout redirects users who
// have not onboarded to /onboarding, which would loop if this page were inside it.
export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <p className="text-lg font-semibold tracking-tight">HabitFlow</p>
      {children}
    </main>
  );
}
