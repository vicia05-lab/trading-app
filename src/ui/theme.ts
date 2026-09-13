export type Appearance = "light" | "dark" | "system";

const KEY = "ta-appearance";

export function readAppearance(): Appearance {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "light";
}

export function resolvedDark(pref: Appearance): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyAppearance(pref: Appearance): void {
  document.documentElement.classList.toggle("dark", resolvedDark(pref));
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* ignore */
  }
}
