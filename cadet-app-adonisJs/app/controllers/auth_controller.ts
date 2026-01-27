import type { HttpContext } from '@adonisjs/core/http'

import AuthService from "#services/auth_service";
import { loginValidator, refreshTokenValidator, registerAssociationValidator, registerAssociationMemberValidator, registerAssociationCandidatValidator } from '#validators/auth';

export default class AuthController {
    private authService: AuthService // Faire appel au service auth

    constructor() {
        this.authService = new AuthService() // Initialiser la class AuthService
    }

    /**
     * POST /api/v1/auth/register/association
     * Inscription d'une nouvelle association
     */
    async register({ request, response}: HttpContext) {
        const payload = await request.validateUsing(registerAssociationValidator)

        try {
            const { association, user } = await this.authService.registerAssociation(
                payload,
                {
                    ipAddress: request.ip(),
                    userAgent: request.header('user-agent'),
                }  
            )

            return response.created({
                success: true,
                message: 'Inscription enregistrée avec succès. Votre demande est en cours de validation. Vous recevrez un email une fois approuvée.',
                data: {
                    association: association.serialize(),
                    responsable: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstname,
                        lastName: user.lastname
                    },
                },
            })
        } catch (error) {
            return response.badRequest({
                success: false,
                message: error.message || 'Erreur lors de l\'inscription',
                errors: [{ message: error.message }],
            })
        }
    }

    /**
     * POST /api/v1/auth/register/memberAssociation
     * Inscription d'un nouveau membre d'une association
     */
    async registerMemberAssociation({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(registerAssociationMemberValidator)

            const { user } = await this.authService.registerMemberAssociationService(
                payload.associationMember,
                {
                    ipAddress: request.ip(),
                    userAgent: request.header('user-agent'),
                }
            )

            return response.created({
                success: true,
                message: 'Inscription enregistrée avec succès. Votre demande est en cours de validation. Vous recevrez un email une fois approuvée.',
                data: {
                    user: user.serialize(),
                },
            })
        } catch (error) {
            console.error('❌ Registration error:', error)
            return response.badRequest({
                success: false,
                message: error.message || 'Erreur lors de l\'inscription',
                errors: [{ message: error.message}],
            })
        }
    }

    /**
     * POST /api/v1/auth/register/candidatAssociation
     * Inscription d'un nouveau cadet pour une association
     */

    async registerCandidatAssociation({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(registerAssociationCandidatValidator)

            const { user, candidat } = await this.authService.registerCandidatAssociationService(
                payload,
                {
                    ipAddress: request.ip(),
                    userAgent: request.header('user-agent'),
                }
            )

            return response.created({
                success: true,
                message: 'Compte candidat enregistré avec succès',
                data: {
                    candidat: candidat.serialize(),
                    user: user.serialize()
                },
            })

        } catch (error) {
            console.error(' Registration error:', error)
            return response.badRequest({
                success: false,
                message: error.message || 'Erreur lors de l\'inscription',
                errors: [{ message: error.message}],
            })
        }
    }


    /**
     * POST /api/v1/auth/login
     * Connexion
     */
    async login({ request, response }: HttpContext) {
        const payload = await request.validateUsing(loginValidator)

        try {
            const result = await this.authService.login({
                email: payload.email,
                password: payload.password,
                ip: request.ip(),
                userAgent: request.header('user-agent') || '',
            })

            return response.ok({
                success: true,
                message: 'Connexion réussie',
                data: {
                    user: result.user.serialize(),
                    association: result.user.association?.serialize() ?? null,
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken,
                },
            })
        } catch (error) {
            return response.unauthorized({
                success: false,
                message: error.message || 'Identifiants invalides',
                code: error.code || 'AUTH_ERROR',
                errors: [{ message: error.message }],
            })
        }
    }

    /**
     * POST /api/v1/auth/refresh
     * Rafraichir les tokens
     */
    async refresh({ request, response }: HttpContext) {
        const payload = await request.validateUsing(refreshTokenValidator)

        try {
            const result = await this.authService.refreshTokens(
                payload.refreshToken,
                request.ip(),
                request.header('user-agent') || ''
            )

            return response.ok({
                success: true,
                message: 'Tokens rafraîchis',
                data: {
                    user: result.user.serialize(),
                    association: result.user.association?.serialize() ?? null,
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken,
                },
            })
        } catch (error) {
            return response.unauthorized({
                success: false,
                message: error.message || 'Token invalide',
                errors: [{ message: error.message }],
            })
        }
    }

    /**
     * GET /api/v1/auth/me
     * Utilisateur connecté
     */
    async me({ auth, response }: HttpContext) {
        const user = auth.user!
        await user.load('association')

        return response.ok({
            success: true,
            data: {
                user: user.serialize(),
                association: user.association?.serialize() ?? null,
            },
        })
    }

    /**
     * POST /api/v1/auth/logout
     * Déconnexion
     */
    async logout({ auth, request, response }: HttpContext) {
        const user = auth.user!
        const refreshToken = request.input('refreshToken')

        await this.authService.logout(refreshToken, user)

        return response.ok({
            success: true,
            message: 'Déconnexion réussie'
        })
    }
}
