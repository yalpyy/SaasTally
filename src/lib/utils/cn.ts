type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Minimal class name joiner. We deliberately avoid pulling in clsx +
 * tailwind-merge for a handful of conditional classes; component APIs are
 * written so conflicting utilities are not passed in the first place.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }

  return out.join(" ");
}
