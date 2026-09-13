import { useEffect, type ReactNode } from "react";

export function Drawer({
  title,
  kicker,
  onClose,
  children,
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-nav/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-surface p-4 pb-24 shadow-lg md:p-6 lg:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {kicker ? <p className="text-sm text-muted">{kicker}</p> : null}
            <h2 className="text-xl font-semibold leading-7">{title}</h2>
          </div>
          <button type="button" className="min-h-11 rounded-sm border border-control px-3 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 flex-1">{children}</div>
      </div>
    </div>
  );
}
