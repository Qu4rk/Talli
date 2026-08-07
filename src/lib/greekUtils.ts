/**
 * Utility functions for Greek text processing and orthography rules.
 */

/**
 * Converts text to uppercase while removing Greek accents (τόνους)
 * according to modern Greek orthography standard for uppercase text.
 * e.g. "Μπράβο Ελένη!" -> "ΜΠΡΑΒΟ ΕΛΕΝΗ!"
 *      "Πολύ καλή προσπάθεια!" -> "ΠΟΛΥ ΚΑΛΗ ΠΡΟΣΠΑΘΕΙΑ!"
 */
export function toGreekUpper(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Removes combining acute accent (tonos)
    .toUpperCase();
}

/**
 * Removes Greek accents and converts text to lowercase for accent-insensitive matching.
 * e.g. "Ελένη" -> "ελενη"
 *      "Μπράβο" -> "μπραβο"
 */
export function removeAccents(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
