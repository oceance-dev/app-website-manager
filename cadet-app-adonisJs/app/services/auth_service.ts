import Association from "#models/association"
import User from "#models/user"
import env from "#start/env"
import { DateTime } from "luxon"
import { AssociationStatus, UserRole } from "../../types/HelperPermAndRole.js"
import hash from "@adonisjs/core/services/hash"
import RefreshToken from "#models/refresh_token"
import { randomBytes, createHash } from "node:crypto"

interface TokenOptions {
  ipAddress: string
  userAgent?: string
}

interface AuthResult {
  user: User
  association?: Association
  accessToken: {
    type: 'bearer'
    value: string
    expiresAt: DateTime | null
  }
  refreshToken: {
    value: string
    expiresAt: DateTime
  }
}

interface RegisterAssociationData {
  association: {
    name: string
    rna?: string
    siret?: string
    email?: string
    phone?: string
    address?: string
    city: string
    postalCode: string
    country: string
  }
  responsable: {
    firstName: string
    lastName: string
    email: string
    password: string
  }
}

// Membre d'une association
interface RegisterMemberAssociationData {
  associationId: number
  email: string
  password: string
  firstname: string
  lastname: string
  dateOfBirth: Date
  phone: string
  sexe: 'Homme' | 'Femme'
  city_code: string,
  role: UserRole
}

export default class AuthService {
  // Your code here
  private accessTokenExpiry: number
  private refreshTokenExpiry: number

  constructor() {
    this.accessTokenExpiry = env.get('ACCESS_TOKEN_EXPIRY', 60)
    this.refreshTokenExpiry = env.get('REFRESH_TOKEN_EXPIRY', 30)
  }

  /**
   *  Inscription d'une nouvelle association
   */
  async registerAssociation(
    data: RegisterAssociationData,
    options: TokenOptions
  ): Promise<{ association: Association; user: User }> {
    
    // 1. Créer l'association (statut pending)
    const association = await Association.create({
      name: data.association.name,
      rna: data.association.rna,
      siret: data.association.siret,
      //email: data.association.email,
      //phone: data.association.phone,
      address: data.association.address,
      city: data.association.city,
      postalCode: data.association.postalCode,
      country: data.association.country,
      status: AssociationStatus.PENDING,
    })

    // 2. Créer le responsable (admin de l'association, inactif)
    const user = await User.create({
      associationId: association.id,
      email: data.responsable.email,
      password: data.responsable.password,
      firstname: data.responsable.firstName,
      lastname: data.responsable.lastName,
      role: UserRole.ADMIN,
      isActive: false, // Sera activé après valdiation
      failedLoginAttempts: 0,
    })

    return { association, user}
  }

  /**
   * Inscription d'un membre de l'association
   */
  async registerMemberAssociationService(
    data: RegisterMemberAssociationData,
    options: TokenOptions
  ): Promise<{ user: User }> {
    
    const user = await User.create({
      associationId: data.associationId,
      email: data.email,
      password: data.password,
      firstname: data.firstname,
      lastname: data.lastname,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      sexe: data.sexe,
      city_code: data.city_code,
      role: data.role,
      isActive: false, // Sera activé par l'admin de l'association
      failedLoginAttempts: 0
    })

    return { user }
  }

  /**
   * Connexion
   */
  async login(email: string, password: string, options: TokenOptions): Promise<AuthResult> {
    const user = await User.query()
      .where('email', email)
      .preload('association')
      .first()

    if (!user) {
      throw new Error('Identifiants invalides')
    }

    if (user.isLocked) {
      throw new Error('Compte temporairement verrouillé. Réessayer dans 15 minutes.')
    }

    if (!user.isActive) {
      throw new Error('Compte en attente de validation. Vous recevrez un email une fois approuvé.')
    }

    if (!user.isAdmin && user.association) {
      if (!user.association.isActive) {
        throw new Error('Votre association n\'est pas encore activée.')
      }
    }

    const isPasswordValid = await hash.verify(user.password, password)
    if (!isPasswordValid) {
      await user.recordFailedLogin()
      throw new Error('Identifiants invalides')
    }

    await user.recordSuccessfulLogin(options.ipAddress)
    const tokens = await this.generateTokens(user, options)

    return {
      user,
      association: user.association,
      ...tokens,
    }
  }

  /**
   * Rafraichir les tokens
   */
  async refreshTokens(refreshTokenValue: string, options: TokenOptions): Promise<AuthResult> {
    const tokenHash = this.hashToken(refreshTokenValue)

    const refreshToken = await RefreshToken.query()
      .where('token_hash', tokenHash)
      .preload('user', (query) => query.preload('association'))
      .first()

    if (!refreshToken) {
      throw new Error('Token invalide')
    }

    if (!refreshToken.isValid) {
      if (refreshToken.isRevoked) {
        await RefreshToken.revokeFamily(refreshToken.family)
        throw new Error('Session expirée. Veuillez vous reconnecter.')
      }
      throw new Error('Token expiré')
    }

    const user = refreshToken.user
    if (!user.isActive) {
      throw new Error('Compte désactivé')
    }

    refreshToken.isRevoked = true
    refreshToken.lastUsedAt = DateTime.now()
    await refreshToken.save()

    const tokens = await this.generateTokens(user, options, refreshToken.family)

    return {
      user,
      association: user.association,
      ...tokens,
    }
  }

  /**
   * Déconnexion
   */
  async logout(user: User, refreshTokenValue?: string): Promise<void> {
    if (refreshTokenValue) {
      const tokenHash = this.hashToken(refreshTokenValue)
      await RefreshToken.query().where('token_hash', tokenHash).update({ isRevoked: true })
    }
  }

  /**
   * Générer les tokens
   */
  private async generateTokens(
    user: User,
    options: TokenOptions,
    family?: string
  ): Promise<Omit<AuthResult, 'user' | 'association'>> {
    const accessToken = await User.accessTokens.create(user, ['*'], {
      expiresIn: `${this.accessTokenExpiry} minutes`,
    })

    const refreshTokenValue = randomBytes(32).toString('hex')
    const refreshTokenHash = this.hashToken(refreshTokenValue)
    const refreshTokenExpiry = DateTime.now().plus({ days: this.refreshTokenExpiry })

    await RefreshToken.create({
      user_id: user.id,
      token_hash: refreshTokenHash,
      family: family || randomBytes(16).toString('hex'),
      createdIp: options.ipAddress,
      userAgent: options.userAgent || null,
      expiresAt: refreshTokenExpiry,
      isRevoked: false,
    })

    return {
      accessToken: {
        type: 'bearer',
        value: accessToken.value!.release(),
        expiresAt: accessToken.expiresAt ? DateTime.fromJSDate(accessToken.expiresAt) : null,
      },
      refreshToken: {
        value: refreshTokenValue,
        expiresAt: refreshTokenExpiry,
      },
    }
  }

  /**
   * HashPassword
   */

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

}