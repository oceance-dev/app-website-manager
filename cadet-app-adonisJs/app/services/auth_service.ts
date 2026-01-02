import { DateTime } from 'luxon'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import User from '#models/user'
import Association from '#models/association'
import RefreshToken from '#models/refresh_token'
import Role from '#models/role'
import hash from '@adonisjs/core/services/hash'
import { AssociationStatus } from '../../types/HelperPermAndRole.js'

/**
 * ========================================
 * INTERFACES
 * ========================================
 */

interface RegisterAssociationData {
  association: {
    name: string
    rna: string
    siret: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country?: string
  }
  responsable: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    city_code: string
    dateOfBirth: DateTime
    sexe: 'Homme' | 'Femme'
  }
}

interface LoginData {
  email: string
  password: string
  ip: string
  userAgent: string
}

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

interface AuthResult {
  user: User
  tokens: TokenPair
}

/**
 * ========================================
 * ERREURS PERSONNALISÉES
 * ========================================
 */

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor(public unlockAt: DateTime) {
    super('Compte temporairement verrouillé suite à trop de tentatives de connexion.', 'ACCOUNT_LOCKED')
  }
}

export class AccountInactiveError extends AuthenticationError {
  constructor() {
    super('Votre compte n\'est pas encore activé.', 'ACCOUNT_INACTIVE')
  }
}

export class AssociationInactiveError extends AuthenticationError {
  constructor() {
    super('Votre association n\'est pas active.', 'ASSOCIATION_INACTIVE')
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Identifiants invalides.', 'INVALID_CREDENTIALS')
  }
}

export class TokenError extends AuthenticationError {
  constructor(message: string, code: string = 'TOKEN_ERROR') {
    super(message, code)
  }
}

export class TokenReusedError extends TokenError {
  constructor() {
    super('Activité suspecte détectée. Tous vos appareils ont été déconnectés. Veuillez vous reconnecter.', 'TOKEN_REUSED')
  }
}

/**
 * ========================================
 * SERVICE D'AUTHENTIFICATION
 * ========================================
 */

export default class AuthService {
  /**
   * Configuration
   */
  private static readonly ACCESS_TOKEN_EXPIRY = '60 minutes'
  private static readonly REFRESH_TOKEN_EXPIRY_DAYS = 30
  private static readonly MAX_FAILED_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION_MINUTES = 15

  /**
   * ========================================
   * INSCRIPTION
   * ========================================
   */

  /**
   * Inscription d'une nouvelle association
   */
  async registerAssociation(data: RegisterAssociationData, context?: { ipAddress: string; userAgent?: string }): Promise<{ association: Association; user: User }> {
    // Récupérer le rôle "admin" pour le responsable
    const adminRole = await Role.findBy('name', 'admin')
    if (!adminRole) {
      throw new Error('Configuration erreur: Rôle admin non trouvé. Exécutez le seeder des rôles.')
    }

    // Créer l'association (statut pending)
    const association = await Association.create({
      name: data.association.name,
      rna: data.association.rna,
      siret: data.association.siret,
      email: data.association.email,
      phone: data.association.phone,
      address: data.association.address,
      city: data.association.city,
      postalCode: data.association.postalCode,
      country: data.association.country || 'France',
      status: AssociationStatus.PENDING,
    })

    // Créer l'utilisateur responsable (inactif jusqu'à approbation)
    const user = await User.create({
      associationId: association.id,
      roleId: adminRole.id,
      email: data.responsable.email,
      password: data.responsable.password, // Hashé automatiquement par le hook beforeSave
      firstname: data.responsable.firstName,
      lastname: data.responsable.lastName,
      phone: data.responsable.phone,
      city_code: data.responsable.city_code,
      dateOfBirth: data.responsable.dateOfBirth,
      sexe: data.responsable.sexe,
      isActive: false, // Activé après approbation
      failedLoginAttempts: 0,
      mustChangePassword: false,
    })

    return { association, user }
  }

  /**
   * Inscription d'un membre d'une association
   */
  async registerMemberAssociationService(
    data: {
      firstname: string
      lastname: string
      email: string
      password: string
      phone: string
      city_code: string
      dateOfBirth: DateTime | Date
      sexe: 'Homme' | 'Femme'
      associationId: number
      roleId?: number // roleId devient optionnel
    },
    context?: { ipAddress: string; userAgent?: string }
  ): Promise<{ user: User }> {
    // Vérifier que l'association existe et est active
    const association = await Association.find(data.associationId)
    if (!association) {
      throw new Error('Association introuvable')
    }

    // Si aucun roleId n'est fourni, attribuer le rôle "staff" par défaut
    let roleId = data.roleId
    if (!roleId) {
      const staffRole = await Role.findBy('name', 'staff')
      if (!staffRole) {
        throw new Error('Rôle par défaut "staff" introuvable')
      }
      roleId = staffRole.id
    } else {
      // Vérifier que le rôle existe si fourni
      const role = await Role.find(roleId)
      if (!role) {
        throw new Error('Rôle introuvable')
      }
    }

    // Convertir la date en DateTime si c'est un objet Date JavaScript
    const dateOfBirth = data.dateOfBirth instanceof Date
      ? DateTime.fromJSDate(data.dateOfBirth)
      : data.dateOfBirth

    // Créer l'utilisateur (inactif jusqu'à approbation par l'admin de l'association)
    const user = await User.create({
      associationId: data.associationId,
      roleId: roleId,
      email: data.email,
      password: data.password, // Hashé automatiquement par le hook beforeSave
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      city_code: data.city_code,
      dateOfBirth: dateOfBirth,
      sexe: data.sexe,
      isActive: false, // Activé après approbation par l'admin de l'association
      failedLoginAttempts: 0,
      mustChangePassword: false,
    })

    return { user }
  }

  /**
   * ========================================
   * CONNEXION
   * ========================================
   */

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginData): Promise<AuthResult> {
    // 1. Chercher l'utilisateur par email (sans révéler s'il existe)
    const user = await this.findUserByEmail(data.email)

    if (!user) {
      // Simuler un délai pour éviter les timing attacks
      await this.simulateHashDelay()
      throw new InvalidCredentialsError()
    }

    // 2. Vérifier si le compte est verrouillé
    if (user.isLocked) {
      throw new AccountLockedError(user.lockedUntil!)
    }

    // 3. Vérifier le mot de passe
    const isPasswordValid = await this.verifyPassword(data.password, user.password)

    if (!isPasswordValid) {
      await user.recordFailedLogin()

      // Vérifier si le compte vient d'être verrouillé
      if (user.isLocked) {
        throw new AccountLockedError(user.lockedUntil!)
      }

      throw new InvalidCredentialsError()
    }

    // 4. Vérifier que le compte est actif
    if (!user.isActive) {
      throw new AccountInactiveError()
    }

    // 5. Vérifier que l'association est active (si pas super_admin)
    if (user.associationId) {
      await user.load('association')
      if (user.association && user.association.status !== 'active') {
        throw new AssociationInactiveError()
      }
    }

    // 6. Charger le rôle avec les permissions
    await user.load('role', (query) => query.preload('permissions'))

    // 7. Enregistrer la connexion réussie
    await user.recordSuccessfulLogin(data.ip)

    // 8. Générer les tokens
    const tokens = await this.generateTokens(user, data.ip, data.userAgent)

    return { user, tokens }
  }

  /**
   * ========================================
   * REFRESH TOKEN
   * ========================================
   */

  /**
   * Rafraîchir les tokens
   */
  async refreshTokens(
    refreshTokenValue: string,
    ip: string,
    userAgent: string
  ): Promise<AuthResult> {
    // 1. Hasher le token reçu
    const tokenHash = this.hashToken(refreshTokenValue)

    // 2. Chercher le token en BDD
    const refreshToken = await RefreshToken.query()
      .where('token_hash', tokenHash)
      .preload('user', (query) => {
        query
          .whereNull('deletedAt')
          .preload('role', (q) => q.preload('permissions'))
          .preload('association')
      })
      .first()

    // 3. Token non trouvé
    if (!refreshToken) {
      throw new TokenError('Token invalide.', 'INVALID_TOKEN')
    }

    // 4. Token révoqué = tentative de réutilisation d'un ancien token
    if (refreshToken.isRevoked) {
      // ALERTE SÉCURITÉ : Révoquer toute la famille (vol potentiel)
      await RefreshToken.revokeFamily(refreshToken.family)
      throw new TokenReusedError()
    }

    // 5. Token expiré
    if (refreshToken.expiresAt < DateTime.now()) {
      await refreshToken.revoke()
      throw new TokenError('Token expiré.', 'TOKEN_EXPIRED')
    }

    // 6. Token déjà utilisé (rotation) = vol potentiel
    if (refreshToken.lastUsedAt) {
      // ALERTE SÉCURITÉ : Quelqu'un a réutilisé un ancien token
      await RefreshToken.revokeFamily(refreshToken.family)
      throw new TokenReusedError()
    }

    const user = refreshToken.user

    // 7. Utilisateur supprimé ou non trouvé
    if (!user) {
      await refreshToken.revoke()
      throw new TokenError('Utilisateur non trouvé.', 'USER_NOT_FOUND')
    }

    // 8. Compte désactivé
    if (!user.isActive) {
      await RefreshToken.revokeAllForUser(user.id)
      throw new AccountInactiveError()
    }

    // 9. Association suspendue
    if (user.association && user.association.status !== 'active') {
      await RefreshToken.revokeAllForUser(user.id)
      throw new AssociationInactiveError()
    }

    // 10. Marquer le token actuel comme utilisé (pour détecter les réutilisations)
    refreshToken.lastUsedAt = DateTime.now()
    await refreshToken.save()

    // 11. Générer de nouveaux tokens (même famille pour traçabilité)
    const tokens = await this.generateTokens(user, ip, userAgent, refreshToken.family)

    return { user, tokens }
  }

  /**
   * ========================================
   * DÉCONNEXION
   * ========================================
   */

  /**
   * Déconnexion (révoque le refresh token)
   */
  async logout(refreshTokenValue: string, user: User): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenValue)

    // Révoquer le refresh token
    await RefreshToken.query()
      .where('token_hash', tokenHash)
      .where('user_id', user.id)
      .update({ is_revoked: true })
  }

  /**
   * Déconnexion de tous les appareils
   */
  async logoutAllDevices(user: User): Promise<void> {
    // Révoquer tous les refresh tokens
    await RefreshToken.revokeAllForUser(user.id)

    // Révoquer tous les access tokens
    const tokens = await User.accessTokens.all(user)
    for (const token of tokens) {
      await User.accessTokens.delete(user, token.identifier)
    }
  }

  /**
   * ========================================
   * GESTION DES ASSOCIATIONS
   * ========================================
   */

  /**
   * Approuver une association
   */
  async approveAssociation(
    association: Association,
    subscriptionMonths: number = 12
  ): Promise<void> {
    // Activer l'association
    association.status = AssociationStatus.ACTIVE
    association.approvedAt = DateTime.now()
    association.subscribedAt = DateTime.now()
    association.subscriptionEndsAt = DateTime.now().plus({ months: subscriptionMonths })
    await association.save()

    // Activer tous les utilisateurs de l'association
    await User.query()
      .where('associationId', association.id)
      .whereNull('deletedAt')
      .update({ isActive: true })
  }

  /**
   * Rejeter une association
   */
  async rejectAssociation(association: Association, _reason?: string): Promise<void> {
    association.status = AssociationStatus.CANCELLED
    await association.save()

    // Optionnel: Supprimer les utilisateurs ou les garder pour historique
    // await User.query().where('associationId', association.id).delete()
  }

  /**
   * Suspendre une association
   */
  async suspendAssociation(association: Association): Promise<void> {
    association.status = AssociationStatus.SUSPENDED
    await association.save()

    // Désactiver tous les utilisateurs
    await User.query()
      .where('associationId', association.id)
      .update({ isActive: false })

    // Révoquer tous les tokens des utilisateurs de l'association
    const users = await User.query()
      .where('associationId', association.id)
      .select('id')

    for (const user of users) {
      await RefreshToken.revokeAllForUser(user.id)
    }
  }

  /**
   * Réactiver une association
   */
  async reactivateAssociation(association: Association): Promise<void> {
    association.status = AssociationStatus.ACTIVE
    await association.save()

    // Réactiver tous les utilisateurs
    await User.query()
      .where('associationId', association.id)
      .whereNull('deletedAt')
      .update({ isActive: true })
  }

  /**
   * ========================================
   * MÉTHODES PRIVÉES
   * ========================================
   */

  /**
   * Trouver un utilisateur par email
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    return User.query()
      .where('email', email.toLowerCase().trim())
      .whereNull('deletedAt')
      .first()
  }

  /**
   * Vérifier le mot de passe de manière sécurisée
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await hash.verify(hashedPassword, plainPassword)
    } catch {
      return false
    }
  }

  /**
   * Simuler un délai de hash pour éviter les timing attacks
   */
  private async simulateHashDelay(): Promise<void> {
    // Simuler le temps que prendrait un hash pour éviter de révéler si l'email existe
    await hash.make('dummy_password_for_timing_safety')
  }

  /**
   * Générer une paire de tokens (access + refresh)
   */
  private async generateTokens(
    user: User,
    ip: string,
    userAgent: string,
    family?: string
  ): Promise<TokenPair> {
    // 1. Générer l'access token via AdonisJS
    const accessToken = await User.accessTokens.create(user, ['*'], {
      expiresIn: AuthService.ACCESS_TOKEN_EXPIRY,
    })

    // 2. Générer le refresh token
    const refreshTokenValue = this.generateSecureToken()
    const tokenHash = this.hashToken(refreshTokenValue)
    const tokenFamily = family || this.generateSecureToken(16)
    const expiresAt = DateTime.now().plus({ days: AuthService.REFRESH_TOKEN_EXPIRY_DAYS })

    await RefreshToken.create({
      userId: user.id,
      tokenHash,
      family: tokenFamily,
      createdIp: this.sanitizeIp(ip),
      userAgent: this.sanitizeUserAgent(userAgent),
      expiresAt,
      isRevoked: false,
    })

    return {
      accessToken: accessToken.value!.release(),
      refreshToken: refreshTokenValue,
      expiresAt: accessToken.expiresAt!,
    }
  }

  /**
   * Générer un token sécurisé
   */
  private generateSecureToken(bytes: number = 32): string {
    return randomBytes(bytes).toString('hex')
  }

  /**
   * Hasher un token avec SHA256
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Nettoyer l'IP (éviter injection)
   */
  private sanitizeIp(ip: string): string {
    // Limiter la longueur et supprimer les caractères dangereux
    return ip.substring(0, 45).replace(/[^a-fA-F0-9.:]/g, '')
  }

  /**
   * Nettoyer le User-Agent
   */
  private sanitizeUserAgent(userAgent: string): string {
    return userAgent.substring(0, 500)
  }
}