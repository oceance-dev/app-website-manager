/**
 * Utilitaire pour gérer les départements français
 */

export interface Department {
  code: string;
  name: string;
  region: string;
}

// Base de données des départements français
export const DEPARTMENTS: { [key: string]: Department } = {
  '01': { code: '01', name: 'Ain', region: 'Auvergne-Rhône-Alpes' },
  '02': { code: '02', name: 'Aisne', region: 'Hauts-de-France' },
  '03': { code: '03', name: 'Allier', region: 'Auvergne-Rhône-Alpes' },
  '04': { code: '04', name: 'Alpes-de-Haute-Provence', region: 'Provence-Alpes-Côte d\'Azur' },
  '05': { code: '05', name: 'Hautes-Alpes', region: 'Provence-Alpes-Côte d\'Azur' },
  '06': { code: '06', name: 'Alpes-Maritimes', region: 'Provence-Alpes-Côte d\'Azur' },
  '07': { code: '07', name: 'Ardèche', region: 'Auvergne-Rhône-Alpes' },
  '08': { code: '08', name: 'Ardennes', region: 'Grand Est' },
  '09': { code: '09', name: 'Ariège', region: 'Occitanie' },
  '10': { code: '10', name: 'Aube', region: 'Grand Est' },
  '11': { code: '11', name: 'Aude', region: 'Occitanie' },
  '12': { code: '12', name: 'Aveyron', region: 'Occitanie' },
  '13': { code: '13', name: 'Bouches-du-Rhône', region: 'Provence-Alpes-Côte d\'Azur' },
  '14': { code: '14', name: 'Calvados', region: 'Normandie' },
  '15': { code: '15', name: 'Cantal', region: 'Auvergne-Rhône-Alpes' },
  '16': { code: '16', name: 'Charente', region: 'Nouvelle-Aquitaine' },
  '17': { code: '17', name: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  '18': { code: '18', name: 'Cher', region: 'Centre-Val de Loire' },
  '19': { code: '19', name: 'Corrèze', region: 'Nouvelle-Aquitaine' },
  '21': { code: '21', name: 'Côte-d\'Or', region: 'Bourgogne-Franche-Comté' },
  '22': { code: '22', name: 'Côtes-d\'Armor', region: 'Bretagne' },
  '23': { code: '23', name: 'Creuse', region: 'Nouvelle-Aquitaine' },
  '24': { code: '24', name: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  '25': { code: '25', name: 'Doubs', region: 'Bourgogne-Franche-Comté' },
  '26': { code: '26', name: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
  '27': { code: '27', name: 'Eure', region: 'Normandie' },
  '28': { code: '28', name: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
  '29': { code: '29', name: 'Finistère', region: 'Bretagne' },
  '2A': { code: '2A', name: 'Corse-du-Sud', region: 'Corse' },
  '2B': { code: '2B', name: 'Haute-Corse', region: 'Corse' },
  '30': { code: '30', name: 'Gard', region: 'Occitanie' },
  '31': { code: '31', name: 'Haute-Garonne', region: 'Occitanie' },
  '32': { code: '32', name: 'Gers', region: 'Occitanie' },
  '33': { code: '33', name: 'Gironde', region: 'Nouvelle-Aquitaine' },
  '34': { code: '34', name: 'Hérault', region: 'Occitanie' },
  '35': { code: '35', name: 'Ille-et-Vilaine', region: 'Bretagne' },
  '36': { code: '36', name: 'Indre', region: 'Centre-Val de Loire' },
  '37': { code: '37', name: 'Indre-et-Loire', region: 'Centre-Val de Loire' },
  '38': { code: '38', name: 'Isère', region: 'Auvergne-Rhône-Alpes' },
  '39': { code: '39', name: 'Jura', region: 'Bourgogne-Franche-Comté' },
  '40': { code: '40', name: 'Landes', region: 'Nouvelle-Aquitaine' },
  '41': { code: '41', name: 'Loir-et-Cher', region: 'Centre-Val de Loire' },
  '42': { code: '42', name: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  '43': { code: '43', name: 'Haute-Loire', region: 'Auvergne-Rhône-Alpes' },
  '44': { code: '44', name: 'Loire-Atlantique', region: 'Pays de la Loire' },
  '45': { code: '45', name: 'Loiret', region: 'Centre-Val de Loire' },
  '46': { code: '46', name: 'Lot', region: 'Occitanie' },
  '47': { code: '47', name: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine' },
  '48': { code: '48', name: 'Lozère', region: 'Occitanie' },
  '49': { code: '49', name: 'Maine-et-Loire', region: 'Pays de la Loire' },
  '50': { code: '50', name: 'Manche', region: 'Normandie' },
  '51': { code: '51', name: 'Marne', region: 'Grand Est' },
  '52': { code: '52', name: 'Haute-Marne', region: 'Grand Est' },
  '53': { code: '53', name: 'Mayenne', region: 'Pays de la Loire' },
  '54': { code: '54', name: 'Meurthe-et-Moselle', region: 'Grand Est' },
  '55': { code: '55', name: 'Meuse', region: 'Grand Est' },
  '56': { code: '56', name: 'Morbihan', region: 'Bretagne' },
  '57': { code: '57', name: 'Moselle', region: 'Grand Est' },
  '58': { code: '58', name: 'Nièvre', region: 'Bourgogne-Franche-Comté' },
  '59': { code: '59', name: 'Nord', region: 'Hauts-de-France' },
  '60': { code: '60', name: 'Oise', region: 'Hauts-de-France' },
  '61': { code: '61', name: 'Orne', region: 'Normandie' },
  '62': { code: '62', name: 'Pas-de-Calais', region: 'Hauts-de-France' },
  '63': { code: '63', name: 'Puy-de-Dôme', region: 'Auvergne-Rhône-Alpes' },
  '64': { code: '64', name: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
  '65': { code: '65', name: 'Hautes-Pyrénées', region: 'Occitanie' },
  '66': { code: '66', name: 'Pyrénées-Orientales', region: 'Occitanie' },
  '67': { code: '67', name: 'Bas-Rhin', region: 'Grand Est' },
  '68': { code: '68', name: 'Haut-Rhin', region: 'Grand Est' },
  '69': { code: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  '70': { code: '70', name: 'Haute-Saône', region: 'Bourgogne-Franche-Comté' },
  '71': { code: '71', name: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté' },
  '72': { code: '72', name: 'Sarthe', region: 'Pays de la Loire' },
  '73': { code: '73', name: 'Savoie', region: 'Auvergne-Rhône-Alpes' },
  '74': { code: '74', name: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes' },
  '75': { code: '75', name: 'Paris', region: 'Île-de-France' },
  '76': { code: '76', name: 'Seine-Maritime', region: 'Normandie' },
  '77': { code: '77', name: 'Seine-et-Marne', region: 'Île-de-France' },
  '78': { code: '78', name: 'Yvelines', region: 'Île-de-France' },
  '79': { code: '79', name: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
  '80': { code: '80', name: 'Somme', region: 'Hauts-de-France' },
  '81': { code: '81', name: 'Tarn', region: 'Occitanie' },
  '82': { code: '82', name: 'Tarn-et-Garonne', region: 'Occitanie' },
  '83': { code: '83', name: 'Var', region: 'Provence-Alpes-Côte d\'Azur' },
  '84': { code: '84', name: 'Vaucluse', region: 'Provence-Alpes-Côte d\'Azur' },
  '85': { code: '85', name: 'Vendée', region: 'Pays de la Loire' },
  '86': { code: '86', name: 'Vienne', region: 'Nouvelle-Aquitaine' },
  '87': { code: '87', name: 'Haute-Vienne', region: 'Nouvelle-Aquitaine' },
  '88': { code: '88', name: 'Vosges', region: 'Grand Est' },
  '89': { code: '89', name: 'Yonne', region: 'Bourgogne-Franche-Comté' },
  '90': { code: '90', name: 'Territoire de Belfort', region: 'Bourgogne-Franche-Comté' },
  '91': { code: '91', name: 'Essonne', region: 'Île-de-France' },
  '92': { code: '92', name: 'Hauts-de-Seine', region: 'Île-de-France' },
  '93': { code: '93', name: 'Seine-Saint-Denis', region: 'Île-de-France' },
  '94': { code: '94', name: 'Val-de-Marne', region: 'Île-de-France' },
  '95': { code: '95', name: 'Val-d\'Oise', region: 'Île-de-France' },
  '971': { code: '971', name: 'Guadeloupe', region: 'Guadeloupe' },
  '972': { code: '972', name: 'Martinique', region: 'Martinique' },
  '973': { code: '973', name: 'Guyane', region: 'Guyane' },
  '974': { code: '974', name: 'La Réunion', region: 'La Réunion' },
  '976': { code: '976', name: 'Mayotte', region: 'Mayotte' },
};

/**
 * Extrait le code département depuis un code postal français
 * @param postalCode Code postal (5 chiffres)
 * @returns Code département (2 ou 3 chiffres) ou null si invalide
 */
export const extractDepartmentFromPostalCode = (postalCode: string): string | null => {
  if (!postalCode || postalCode.length !== 5) {
    return null;
  }

  // Cas particuliers : Corse
  if (postalCode.startsWith('200') || postalCode.startsWith('201')) {
    return '2A'; // Corse-du-Sud
  }
  if (postalCode.startsWith('202') || postalCode.startsWith('206')) {
    return '2B'; // Haute-Corse
  }

  // DOM-TOM (3 chiffres)
  if (postalCode.startsWith('97') || postalCode.startsWith('98')) {
    return postalCode.substring(0, 3);
  }

  // Métropole (2 premiers chiffres)
  return postalCode.substring(0, 2);
};

/**
 * Valide un code postal français
 */
export const isValidPostalCode = (postalCode: string): boolean => {
  // Format: 5 chiffres
  const regex = /^\d{5}$/;
  return regex.test(postalCode);
};

/**
 * Récupère les informations du département depuis un code postal
 */
export const getDepartmentFromPostalCode = (postalCode: string): Department | null => {
  if (!isValidPostalCode(postalCode)) {
    return null;
  }

  const departmentCode = extractDepartmentFromPostalCode(postalCode);

  if (!departmentCode || !DEPARTMENTS[departmentCode]) {
    return null;
  }

  return DEPARTMENTS[departmentCode];
};
