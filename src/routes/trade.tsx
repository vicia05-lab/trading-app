import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/trade")({
  head: () => ({ meta: [{ title: "Trade | Trading App" }] }),
  component: Trade,
});

function Trade() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg py-8">
        <PageHeader title="Simulated research only" purpose="This workspace supports simulated earnings research only." />
        <p className="text-base leading-relaxed text-muted">
          There is no order ticket in this interface. Paper positions are reserved by the earnings rule, not by a
          buy/sell form. Broker keys, if saved, are used only as a market-data connection from Admin.
        </p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg">
          Back to Home
        </Link>
      </div>
    </AppShell>
  );
}
