import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/keys")({
  head: () => ({ meta: [{ title: "Admin | Trading App" }] }),
  component: KeysRedirect,
});

function KeysRedirect() {
  return <Navigate to="/admin" />;
}
