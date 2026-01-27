import AssociationDocumentRequirement, { RequiredAt, RequiredFor } from "#models/association_document_requirement"
import Document from "#models/document"
import DocumentType from "#models/document_type"


/**
 * Options pour créer / modifier une exigence
 */
interface RequirementData {
  documentTypeId: number
  isEnabled?: boolean
  isRequired?: boolean
  requiredFor?: RequiredFor | null
  requiredAt?: RequiredAt
  customInstructions?: string | null
  customName?: string | null
  sortOrder?: number
  customValidityDays?: number | null
  templateDocumentId?: number | null
}

/**
 * Options pour la vérification de complétion
 */
interface CompletionOptions {
  isCadet?: boolean
  isCandidat?: boolean
  isStaff?: boolean
  requiredAt?: RequiredAt
}

/**
 * Résultat de la vérification de complétion
 */
interface CompletionResult {
  isComplete: boolean
  total: number
  completed: number
  percentage: number
  missing: {
    id: number
    name: string
    category: string
    isRequired: boolean
  }[]
  documents: {
    id: number
    name: string
    category: string
    status: string
    requirementId: number | null
  }[]
}


export class DocumentRequirementService {

   /**
   * Récupérer toutes les exigences d'une association
   */
  async getAll(associationId: number): Promise<AssociationDocumentRequirement[]> {
    return AssociationDocumentRequirement.query()
      .where('associationId', associationId)
      .preload('documentType')
      .preload('templateDocument')
      .orderBy('sortOrder', 'asc')
      .orderBy('id', 'asc')
  }

  /**
   * Récupérer les exigences activées
   */
  async getEnabled(associationId: number): Promise<AssociationDocumentRequirement[]> {
    return AssociationDocumentRequirement.forAssociation(associationId)
  }

  /**
   * Récupérer une exigence par ID
   */
  async getById(
    associationId: number,
    requirementId: number
  ): Promise<AssociationDocumentRequirement | null> {
    return AssociationDocumentRequirement.query()
      .where('id', requirementId)
      .where('associationId', associationId)
      .preload('documentType')
      .preload('templateDocument')
      .first()
  }

  /**
   * Créer une nouvelle exigence
   */
  async create(
    associationId: number,
    data: RequirementData
  ): Promise<{ success: boolean; requirement?: AssociationDocumentRequirement; error?: string }> {
    // Vérifier que le type de document existe
    const documentType = await DocumentType.find(data.documentTypeId)
    if (!documentType) {
      return { success: false, error: 'Type de document non trouvé' }
    }

    // Vérifier qu'il n'existe pas déjà
    const existing = await AssociationDocumentRequirement.query()
      .where('associationId', associationId)
      .where('documentTypeId', data.documentTypeId)
      .first()

    if (existing) {
      return { success: false, error: 'Cette exigence existe déjà pour cette association' }
    }

    // Récupérer le prochain ordre
    const maxOrder = await AssociationDocumentRequirement.query()
      .where('associationId', associationId)
      .max('sort_order as max')
      .first()

    const requirement = await AssociationDocumentRequirement.create({
      associationId,
      documentTypeId: data.documentTypeId,
      isEnabled: data.isEnabled ?? true,
      isRequired: data.isRequired ?? false,
      requiredFor: data.requiredFor ?? null,
      requiredAt: data.requiredAt ?? 'registration',
      customInstructions: data.customInstructions ?? null,
      customName: data.customName ?? null,
      sortOrder: data.sortOrder ?? (Number(maxOrder?.$extras.max) || 0) + 1,
      customValidityDays: data.customValidityDays ?? null,
      templateDocumentId: data.templateDocumentId ?? null,
    })

    await requirement.load('documentType')
    if (requirement.templateDocumentId) {
      await requirement.load('templateDocument')
    }

    return { success: true, requirement }
  }

  /**
   * Modifier une exigence
   */
  async update(
    associationId: number,
    requirementId: number,
    data: Partial<RequirementData>
  ): Promise<{ success: boolean; requirement?: AssociationDocumentRequirement; error?: string }> {
    const requirement = await this.getById(associationId, requirementId)

    if (!requirement) {
      return { success: false, error: 'Exigence non trouvée' }
    }

    if (data.isEnabled !== undefined) requirement.isEnabled = data.isEnabled
    if (data.isRequired !== undefined) requirement.isRequired = data.isRequired
    if (data.requiredFor !== undefined) requirement.requiredFor = data.requiredFor
    if (data.requiredAt !== undefined) requirement.requiredAt = data.requiredAt
    if (data.customInstructions !== undefined) requirement.customInstructions = data.customInstructions
    if (data.customName !== undefined) requirement.customName = data.customName
    if (data.sortOrder !== undefined) requirement.sortOrder = data.sortOrder
    if (data.customValidityDays !== undefined) requirement.customValidityDays = data.customValidityDays
    if (data.templateDocumentId !== undefined) requirement.templateDocumentId = data.templateDocumentId

    await requirement.save()

    if (requirement.templateDocumentId) {
      await requirement.load('templateDocument')
    }

    return { success: true, requirement }
  }

  /**
   * Supprimer une exigence
   */
  async delete(
    associationId: number,
    requirementId: number
  ): Promise<{ success: boolean; error?: string }> {
    const requirement = await this.getById(associationId, requirementId)

    if (!requirement) {
      return { success: false, error: 'Exigence non trouvée' }
    }

    await requirement.delete()

    return { success: true }
  }

  /**
   * Activer/Désactiver une exigence
   */
  async toggle(
    associationId: number,
    requirementId: number
  ): Promise<{ success: boolean; requirement?: AssociationDocumentRequirement; error?: string }> {
    const requirement = await this.getById(associationId, requirementId)

    if (!requirement) {
      return { success: false, error: 'Exigence non trouvée' }
    }

    requirement.isEnabled = !requirement.isEnabled
    await requirement.save()

    return { success: true, requirement }
  }

  /**
   * Réorganiser les exigences (mise à jour de l'ordre)
   */
  async reorder(
    associationId: number,
    orderedIds: number[]
  ): Promise<{ success: boolean; error?: string }> {
    for (let i = 0; i < orderedIds.length; i++) {
      await AssociationDocumentRequirement.query()
        .where('id', orderedIds[i])
        .where('associationId', associationId)
        .update({ sortOrder: i + 1 })
    }

    return { success: true }
  }

  /**
   * Mise à jour en masse
   */
  async bulkUpdate(
    associationId: number,
    updates: { id: number; isEnabled?: boolean; isRequired?: boolean }[]
  ): Promise<{ success: boolean; updated: number }> {
    let updated = 0

    for (const update of updates) {
      const result = await AssociationDocumentRequirement.query()
        .where('id', update.id)
        .where('associationId', associationId)
        .update({
          isEnabled: update.isEnabled,
          isRequired: update.isRequired,
        })

      if (result[0] > 0) updated++
    }

    return { success: true, updated }
  }

  /**
   * ========================================
   * INITIALISATION
   * ========================================
   */

  /**
   * Initialiser les exigences par défaut pour une nouvelle association
   */
  async initializeDefaults(associationId: number): Promise<void> {
    await AssociationDocumentRequirement.initializeForAssociation(associationId)
  }

  /**
   * Réinitialiser aux valeurs par défaut
   */
  async resetToDefaults(associationId: number): Promise<void> {
    // Supprimer les exigences existantes
    await AssociationDocumentRequirement.query()
      .where('associationId', associationId)
      .delete()

    // Réinitialiser
    await this.initializeDefaults(associationId)
  }

  /**
   * ========================================
   * EXIGENCES POUR L'INSCRIPTION
   * ========================================
   */

  /**
   * Récupérer les exigences pour l'inscription d'un candidat
   */
  async getForRegistration(
    associationId: number,
    options: { isMinor?: boolean } = {}
  ): Promise<AssociationDocumentRequirement[]> {
    const query = AssociationDocumentRequirement.query()
      .where('associationId', associationId)
      .where('isEnabled', true)
      .whereIn('requiredAt', ['registration'])
      .preload('documentType')
      .preload('templateDocument')
      .orderBy('isRequired', 'desc')
      .orderBy('sortOrder', 'asc')

    // Filtrer selon le profil
    query.where((q) => {
      q.whereNull('requiredFor')
        .orWhere('requiredFor', 'all')
        .orWhere('requiredFor', 'candidates')

      if (options.isMinor) {
        q.orWhere('requiredFor', 'minors')
      }
    })

    return query
  }

   /**
   * Récupérer les exigences pour l'approbation
   */
  async getForApproval(
    associationId: number,
    options: { isMinor?: boolean } = {}
  ): Promise<AssociationDocumentRequirement[]> {
    return AssociationDocumentRequirement.forApproval(associationId)
  }

  /**
   * ========================================
   * VÉRIFICATION DE COMPLÉTION
   * ========================================
   */

  /**
   * Vérifier la complétion des documents d'un utilisateur
   */
  async checkCompletion(
    associationId: number,
    userId: number,
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    // Récupérer les exigences selon le profil
    let query = AssociationDocumentRequirement.query()
      .where('associationId', associationId)
      .where('isEnabled', true)
      .preload('documentType')
      .orderBy('sortOrder', 'asc')

    // Filtrer par étape si spécifié
    if (options.requiredAt) {
      if (options.requiredAt === 'approval') {
        query.whereIn('requiredAt', ['registration', 'approval'])
      } else {
        query.where('requiredAt', options.requiredAt)
      }
    }

    // Filtrer selon le profil
    query.where((q) => {
      q.whereNull('requiredFor').orWhere('requiredFor', 'all')

      if (options.isCandidat) q.orWhere('requiredFor', 'candidat')
      if (options.isCadet) q.orWhere('requiredFor', 'cadets')
      if (options.isStaff) q.orWhere('requiredFor', 'staff')
      //if (options.isMinor) q.orWhere('requiredFor', 'minors')
    })

    const requirements = await query

    // Récupérer les documents de l'utilisateur
    const userDocuments = await Document.query()
      .where('associationId', associationId)
      .where('userId', userId)
      .whereNull('deletedAt')
      .whereIn('status', ['pending', 'approved'])

    // Calculer la complétion
    const missing: CompletionResult['missing'] = []
    const documents: CompletionResult['documents'] = []
    let completed = 0

    for (const req of requirements) {
      const matchingDoc = userDocuments.find(
        (doc) => doc.category === req.documentType.category
      )

      if (matchingDoc) {
        completed++
        documents.push({
          id: matchingDoc.id,
          name: matchingDoc.name,
          category: matchingDoc.category,
          status: matchingDoc.status,
          requirementId: req.id,
        })
      } else if (req.isRequired) {
        missing.push({
          id: req.id,
          name: req.effectiveName,
          category: req.documentType.category,
          isRequired: req.isRequired,
        })
      }
    }

    // Ajouter les documents sans exigence correspondante
    for (const doc of userDocuments) {
      const hasRequirement = documents.some((d) => d.id === doc.id)
      if (!hasRequirement) {
        documents.push({
          id: doc.id,
          name: doc.name,
          category: doc.category,
          status: doc.status,
          requirementId: null,
        })
      }
    }

    const requiredCount = requirements.filter((r) => r.isRequired).length
    const percentage = requiredCount > 0 
      ? Math.round(((requiredCount - missing.length) / requiredCount) * 100)
      : 100

    return {
      isComplete: missing.length === 0,
      total: requiredCount,
      completed: requiredCount - missing.length,
      percentage,
      missing,
      documents,
    }
  }

  /**
   * Vérifier si un candidat peut être approuvé
   */
  async canBeApproved(
    associationId: number,
    userId: number,
  ): Promise<{ canApprove: boolean; missing: string[] }> {
    const result = await this.checkCompletion(associationId, userId, {
      isCandidat: true,
      requiredAt: 'approval',
    })

    return {
      canApprove: result.isComplete,
      missing: result.missing.map((m) => m.name),
    }
  }

   /**
   * ========================================
   * STATISTIQUES
   * ========================================
   */

  /**
   * Statistiques des exigences pour une association
   */
  async stats(associationId: number): Promise<{
    total: number
    enabled: number
    required: number
    byRequiredAt: Record<RequiredAt, number>
    byRequiredFor: Record<RequiredFor | 'none', number>
  }> {
    const requirements = await this.getAll(associationId)

    const stats = {
      total: requirements.length,
      enabled: 0,
      required: 0,
      byRequiredAt: {
        registration: 0,
        approval: 0,
        anytime: 0,
      } as Record<RequiredAt, number>,
      byRequiredFor: {
        all: 0,
        cadets: 0,
        candidates: 0,
        staff: 0,
        association: 0,
        none: 0
      } as Record<RequiredFor | 'none', number>,
    }

    for (const req of requirements) {
      if (req.isEnabled) stats.enabled++
      if (req.isRequired) stats.required++
      stats.byRequiredAt[req.requiredAt]++
      
      const requiredFor = req.effectiveRequiredFor
      if (requiredFor) {
        stats.byRequiredFor[requiredFor]++
      } else {
        stats.byRequiredFor.none++
      }
    }

    return stats
  }
}