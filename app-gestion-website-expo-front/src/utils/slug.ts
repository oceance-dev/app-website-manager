/**
 * Génère un slug à partir d'une chaîne de caractères
 * Supprime les accents, caractères spéciaux et convertit en minuscules
 */
export const slugify = (text: string): string => {
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
    .replace(/-+$/, ''); // Supprime les tirets à la fin
};

/**
 * Génère un slug unique pour un dossier
 * Format: nom-dossier-userId-associationId
 *
 * @param folderName - Nom du dossier
 * @param userId - ID de l'utilisateur créateur
 * @param associationId - ID de l'association (optionnel)
 * @returns Slug unique pour le dossier
 *
 * @example
 * generateFolderSlug("Rapports 2025", 42, 7)
 * // Returns: "rapports-2025-u42-a7"
 *
 * generateFolderSlug("Documents Importants!", 10)
 * // Returns: "documents-importants-u10"
 */
export const generateFolderSlug = (
  folderName: string,
  userId: number,
  associationId?: number | null
): string => {
  const baseSlug = slugify(folderName);
  const userPart = `u${userId}`;
  const associationPart = associationId ? `a${associationId}` : '';

  const parts = [baseSlug, userPart];
  if (associationPart) {
    parts.push(associationPart);
  }

  return parts.join('-');
};

/**
 * Génère un slug unique pour un document
 * Format: nom-document-userId-associationId-timestamp
 *
 * @param documentName - Nom du document
 * @param userId - ID de l'utilisateur créateur
 * @param associationId - ID de l'association (optionnel)
 * @returns Slug unique pour le document
 */
export const generateDocumentSlug = (
  documentName: string,
  userId: number,
  associationId?: number | null
): string => {
  const baseSlug = slugify(documentName);
  const timestamp = Date.now().toString(36); // Timestamp en base 36 pour être plus court
  const userPart = `u${userId}`;
  const associationPart = associationId ? `a${associationId}` : '';

  const parts = [baseSlug, userPart];
  if (associationPart) {
    parts.push(associationPart);
  }
  parts.push(timestamp);

  return parts.join('-');
};

/**
 * Extrait les informations d'un slug de dossier
 *
 * @param slug - Le slug à analyser
 * @returns Objet contenant le nom de base, userId et associationId
 */
export const parseFolderSlug = (slug: string): {
  baseName: string;
  userId: number | null;
  associationId: number | null;
} => {
  // Format attendu: nom-dossier-u42-a7
  const parts = slug.split('-');

  let userId: number | null = null;
  let associationId: number | null = null;
  let baseNameParts: string[] = [];

  parts.forEach((part) => {
    if (part.startsWith('u') && !isNaN(Number(part.substring(1)))) {
      userId = Number(part.substring(1));
    } else if (part.startsWith('a') && !isNaN(Number(part.substring(1)))) {
      associationId = Number(part.substring(1));
    } else {
      baseNameParts.push(part);
    }
  });

  return {
    baseName: baseNameParts.join('-'),
    userId,
    associationId,
  };
};
