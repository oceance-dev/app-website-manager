import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DocumentType from '#models/document_type'
import type { DocumentCategory } from '#models/document'
import type { RequiredFor } from '#models/document_type'

interface DocumentTypeData {
  name: string
  slug: string
  description: string
  category: DocumentCategory
  isRequired: boolean
  requiresValidation: boolean
  hasExpiration: boolean
  validityDays?: number
  allowedExtensions: string[]
  maxFileSize: number
  requiredFor: RequiredFor | null
  sortOrder: number
}

export default class extends BaseSeeder {
  async run() {
    // Types de documents globaux (pour toutes les associations)
    const documentTypes: DocumentTypeData[] = [
      // Pièces d'identité
      {
        name: 'Carte d\'identité',
        slug: 'carte-identite',
        description: 'Copie recto-verso de la carte d\'identité en cours de validité',
        category: 'identity',
        isRequired: true,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 5475, // 15 ans
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024, // 5 MB
        requiredFor: 'all',
        sortOrder: 1,
      },
      {
        name: 'Passeport',
        slug: 'passeport',
        description: 'Copie des pages d\'identité du passeport en cours de validité',
        category: 'identity',
        isRequired: false,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 3650, // 10 ans
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: null,
        sortOrder: 2,
      },

      // Documents médicaux
      {
        name: 'Certificat médical d\'aptitude',
        slug: 'certificat-medical',
        description: 'Certificat médical attestant l\'aptitude à la pratique des activités',
        category: 'medical',
        isRequired: true,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 365, // 1 an
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: 'cadets',
        sortOrder: 10,
      },
      {
        name: 'Carnet de vaccination',
        slug: 'carnet-vaccination',
        description: 'Copie du carnet de vaccination à jour',
        category: 'medical',
        isRequired: false,
        requiresValidation: true,
        hasExpiration: false,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: 'cadets',
        sortOrder: 11,
      },
      {
        name: 'Fiche sanitaire',
        slug: 'fiche-sanitaire',
        description: 'Fiche de liaison sanitaire complétée et signée',
        category: 'medical',
        isRequired: true,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 365,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: 'cadets',
        sortOrder: 12,
      },

      // Autorisations parentales
      {
        name: 'Autorisation parentale',
        slug: 'autorisation-parentale',
        description: 'Autorisation parentale signée par les deux parents ou le tuteur légal',
        category: 'parental_authorization',
        isRequired: true,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 365,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: 'candidates',
        sortOrder: 20,
      },
      {
        name: 'Droit à l\'image',
        slug: 'droit-image',
        description: 'Autorisation de droit à l\'image signée',
        category: 'parental_authorization',
        isRequired: false,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 365,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: 'all',
        sortOrder: 21,
      },

      // Assurances
      {
        name: 'Attestation d\'assurance',
        slug: 'attestation-assurance',
        description: 'Attestation d\'assurance responsabilité civile',
        category: 'insurance',
        isRequired: true,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 365,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: 'all',
        sortOrder: 30,
      },

      // Inscription
      {
        name: 'Justificatif de domicile',
        slug: 'justificatif-domicile',
        description: 'Justificatif de domicile de moins de 3 mois',
        category: 'registration',
        isRequired: true,
        requiresValidation: true,
        hasExpiration: true,
        validityDays: 90,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: 'candidates',
        sortOrder: 40,
      },
      {
        name: 'Photo d\'identité',
        slug: 'photo-identite',
        description: 'Photo d\'identité récente format standard',
        category: 'photo',
        isRequired: true,
        requiresValidation: true,
        hasExpiration: false,
        allowedExtensions: ['jpg', 'jpeg', 'png'],
        maxFileSize: 2 * 1024 * 1024, // 2 MB
        requiredFor: 'candidates',
        sortOrder: 41,
      },

      // Certificats
      {
        name: 'Attestation de formation PSC1',
        slug: 'attestation-psc1',
        description: 'Attestation de formation Prévention et Secours Civiques niveau 1',
        category: 'certificate',
        isRequired: false,
        requiresValidation: true,
        hasExpiration: false,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: null,
        sortOrder: 50,
      },
      {
        name: 'Diplôme / Brevet',
        slug: 'diplome-brevet',
        description: 'Copie d\'un diplôme ou brevet obtenu',
        category: 'certificate',
        isRequired: false,
        requiresValidation: true,
        hasExpiration: false,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSize: 5 * 1024 * 1024,
        requiredFor: null,
        sortOrder: 51,
      },

      // Documents administratifs
      {
        name: 'Document administratif',
        slug: 'document-administratif',
        description: 'Tout autre document administratif',
        category: 'administrative',
        isRequired: false,
        requiresValidation: false,
        hasExpiration: false,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        maxFileSize: 10 * 1024 * 1024,
        requiredFor: null,
        sortOrder: 60,
      },

      // Supports de formation
      {
        name: 'Support de formation',
        slug: 'support-formation',
        description: 'Document ou support pédagogique',
        category: 'training',
        isRequired: false,
        requiresValidation: false,
        hasExpiration: false,
        allowedExtensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
        maxFileSize: 20 * 1024 * 1024, // 20 MB
        requiredFor: null,
        sortOrder: 70,
      },

      // Autres
      {
        name: 'Autre document',
        slug: 'autre',
        description: 'Tout autre type de document',
        category: 'other',
        isRequired: false,
        requiresValidation: false,
        hasExpiration: false,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'],
        maxFileSize: 10 * 1024 * 1024,
        requiredFor: null,
        sortOrder: 100,
      },
    ]

    for (const docType of documentTypes) {
      // Chercher si le type existe déjà (avec associationId IS NULL)
      const existing = await DocumentType.query()
        .where('slug', docType.slug)
        .whereNull('associationId')
        .first()

      if (existing) {
        existing.name = docType.name
        existing.description = docType.description
        existing.category = docType.category
        existing.isRequired = docType.isRequired
        existing.requiresValidation = docType.requiresValidation
        existing.hasExpiration = docType.hasExpiration
        existing.validityDays = docType.validityDays ?? null
        existing.allowedExtensions = docType.allowedExtensions
        existing.maxFileSize = docType.maxFileSize
        existing.requiredFor = docType.requiredFor
        existing.sortOrder = docType.sortOrder
        existing.isActive = true
        await existing.save()
      } else {
        const newDocType = new DocumentType()
        newDocType.associationId = null
        newDocType.name = docType.name
        newDocType.slug = docType.slug
        newDocType.description = docType.description
        newDocType.category = docType.category
        newDocType.isRequired = docType.isRequired
        newDocType.requiresValidation = docType.requiresValidation
        newDocType.hasExpiration = docType.hasExpiration
        newDocType.validityDays = docType.validityDays ?? null
        newDocType.allowedExtensions = docType.allowedExtensions
        newDocType.maxFileSize = docType.maxFileSize
        newDocType.requiredFor = docType.requiredFor
        newDocType.sortOrder = docType.sortOrder
        newDocType.isActive = true
        await newDocType.save()
      }
    }

    console.log('✅ Document types seeded successfully')
  }
}