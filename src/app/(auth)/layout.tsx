import { BrandMark } from "@/components/app/brand";
import { PreferenceBar } from "@/components/app/preference-bar";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <BrandMark />
        <PreferenceBar />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-4 pb-16">
        {children}
      </main>
    </div>
  );
}
