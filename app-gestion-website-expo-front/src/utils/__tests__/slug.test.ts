/**
 * Tests pour les fonctions de génération de slug
 * Ces tests documentent le comportement attendu
 */

import { slugify, generateFolderSlug, parseFolderSlug } from '../slug';

describe('Slug Utilities', () => {
  describe('slugify', () => {
    test('convertit en minuscules', () => {
      expect(slugify('HELLO WORLD')).toBe('hello-world');
    });

    test('remplace les espaces par des tirets', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    test('supprime les accents', () => {
      expect(slugify('Rapports été 2025')).toBe('rapports-ete-2025');
      expect(slugify('François')).toBe('francois');
      expect(slugify('Château')).toBe('chateau');
    });

    test('supprime les caractères spéciaux', () => {
      expect(slugify('Documents Importants!')).toBe('documents-importants');
      expect(slugify('Test@#$%123')).toBe('test123');
    });

    test('gère les tirets multiples', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
      expect(slugify('Test---Multiple')).toBe('test-multiple');
    });

    test('supprime les tirets au début et à la fin', () => {
      expect(slugify('-Hello-')).toBe('hello');
      expect(slugify('--Test--')).toBe('test');
    });
  });

  describe('generateFolderSlug', () => {
    test('génère un slug avec userId uniquement', () => {
      const slug = generateFolderSlug('Rapports 2025', 42);
      expect(slug).toBe('rapports-2025-u42');
    });

    test('génère un slug avec userId et associationId', () => {
      const slug = generateFolderSlug('Rapports 2025', 42, 7);
      expect(slug).toBe('rapports-2025-u42-a7');
    });

    test('gère les noms avec accents', () => {
      const slug = generateFolderSlug('Documents été', 10, 5);
      expect(slug).toBe('documents-ete-u10-a5');
    });

    test('gère les noms avec caractères spéciaux', () => {
      const slug = generateFolderSlug('Photos & Vidéos!', 20, 15);
      expect(slug).toBe('photos-videos-u20-a15');
    });

    test('gère associationId null', () => {
      const slug = generateFolderSlug('Test', 1, null);
      expect(slug).toBe('test-u1');
    });
  });

  describe('parseFolderSlug', () => {
    test('extrait les informations du slug', () => {
      const result = parseFolderSlug('rapports-2025-u42-a7');
      expect(result).toEqual({
        baseName: 'rapports-2025',
        userId: 42,
        associationId: 7,
      });
    });

    test('gère un slug sans associationId', () => {
      const result = parseFolderSlug('documents-u10');
      expect(result).toEqual({
        baseName: 'documents',
        userId: 10,
        associationId: null,
      });
    });

    test('gère les noms composés', () => {
      const result = parseFolderSlug('rapports-annee-2025-u42-a7');
      expect(result).toEqual({
        baseName: 'rapports-annee-2025',
        userId: 42,
        associationId: 7,
      });
    });
  });
});

/**
 * EXEMPLES D'UTILISATION
 *
 * 1. Créer un slug pour un dossier:
 *    const slug = generateFolderSlug("Rapports 2025", 42, 7);
 *    // Résultat: "rapports-2025-u42-a7"
 *
 * 2. Parser un slug existant:
 *    const info = parseFolderSlug("rapports-2025-u42-a7");
 *    // Résultat: { baseName: "rapports-2025", userId: 42, associationId: 7 }
 *
 * 3. Slugifier un texte simple:
 *    const simple = slugify("Documents Importants!");
 *    // Résultat: "documents-importants"
 */
