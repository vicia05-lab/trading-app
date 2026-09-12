import { createFileRoute } from "@tanstack/react-router";
import { DeskShell } from "@/components/desk-shell";
import { AlpacaKeyInsert } from "@/components/alpaca-keys";

export const Route = createFileRoute("/keys")({ component: Keys });

function Keys() {
  return (
    <DeskShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Alpaca keys</h1>
          <p className="mt-1 text-sm text-muted">
            Paste your paper key ID and secret. They stay encrypted on the server. Then open Trade.
          </p>
        </div>
        <AlpacaKeyInsert />
      </div>
    </DeskShell>
  );
}
