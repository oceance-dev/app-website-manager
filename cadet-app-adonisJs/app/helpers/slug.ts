/**
 * Génère un slug à partir d'une chaîne de caractères
 * Supprime les accents, caractères spéciaux et convertit en minuscules
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Normalise les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/[^\w\-]+/g, '') // Supprime tous les caractères non-alphanumériques sauf les tirets
    .replace(/\-\-+/g, '-') // Remplace les tirets multiples par un seul
    .replace(/^-+/, '') // Supprime les tirets au début
    .replace(/-+$/, '') // Supprime les tirets à la fin
}
