import { useCallback, useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "portal-ebd-theme";

export type Theme = "light" | "dark";

export function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

let currentTheme: Theme = readStoredTheme();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentTheme;
}

function setTheme(next: Theme) {
  if (next === currentTheme) return;
  currentTheme = next;
  applyTheme(next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light" as Theme);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }, []);

  return { theme, toggleTheme };
}

applyTheme(currentTheme);
