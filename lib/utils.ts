import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Provide a global fallback to avoid ReferenceError if a component misses the import
// This ensures legacy/usages without explicit imports don't crash at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof globalThis !== "undefined" && !(globalThis as any).cn) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).cn = cn;
}
