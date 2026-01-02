import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Association from '#models/association'
import User from '#models/user'
import Role from '#models/role'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    /**
     * ========================================
     * ASSOCIATION CADEP (Admin du site)
     * ========================================
     */
    const cadepAssociation = await Association.updateOrCreate(
      { email: 'contact@cadep.fr' },
      {
        name: 'CADEP',
        rna: 'W751234567',
        siret: '12345678901234',
        address: '1 Rue de la République',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        phone: '0123456789',
        email: 'contact@cadep.fr',
        status: 'active',
        approvedAt: DateTime.now(),
        subscribedAt: DateTime.now(),
        subscriptionEndsAt: DateTime.now().plus({ years: 10 }), // Abonnement longue durée
      }
    )

    console.log(`✅ Association CADEP créée/mise à jour (ID: ${cadepAssociation.id})`)

    /**
     * ========================================
     * SUPER ADMIN CADEP
     * ========================================
     */
    const superAdminRole = await Role.findBy('name', 'super_admin')

    if (!superAdminRole) {
      console.error('❌ Erreur: Le rôle super_admin n\'existe pas. Exécutez d\'abord le seeder role_permission_seeder.')
      return
    }

    const superAdmin = await User.updateOrCreate(
      { email: 'admin@cadep.fr' },
      {
        associationId: null, // Super admin n'appartient à aucune association
        roleId: superAdminRole.id,
        email: 'admin@cadep.fr',
        password: 'Admin@2025', // À changer immédiatement en production !
        lastname: 'CADEP',
        firstname: 'Administrateur',
        city_code: '75001',
        phone: '0123456789',
        dateOfBirth: DateTime.fromISO('1990-01-01'),
        sexe: 'Homme',
        isActive: true,
        emailVerifiedAt: DateTime.now(),
        mustChangePassword: true, // Force le changement de mot de passe à la première connexion
      }
    )

    console.log(`✅ Super Admin créé/mis à jour (ID: ${superAdmin.id})`)
    console.log(`📧 Email: admin@cadep.fr`)
    console.log(`🔑 Mot de passe: Admin@2025 (à changer !)`)

    /**
     * ========================================
     * ADMIN DE L'ASSOCIATION CADEP
     * ========================================
     */
    const adminRole = await Role.findBy('name', 'admin')

    if (adminRole) {
      const cadepAdmin = await User.updateOrCreate(
        { email: 'gestionnaire@cadep.fr' },
        {
          associationId: cadepAssociation.id,
          roleId: adminRole.id,
          email: 'gestionnaire@cadep.fr',
          password: 'Gestionnaire@2025', // À changer immédiatement en production !
          lastname: 'Gestionnaire',
          firstname: 'CADEP',
          city_code: '75001',
          phone: '0123456789',
          dateOfBirth: DateTime.fromISO('1990-01-01'),
          sexe: 'Homme',
          isActive: true,
          emailVerifiedAt: DateTime.now(),
          mustChangePassword: true,
        }
      )

      console.log(`✅ Admin CADEP créé/mis à jour (ID: ${cadepAdmin.id})`)
      console.log(`📧 Email: gestionnaire@cadep.fr`)
      console.log(`🔑 Mot de passe: Gestionnaire@2025 (à changer !)`)
    }

    console.log('\n✅ Seeder association_admin terminé')
    console.log('⚠️  IMPORTANT: Changez les mots de passe par défaut en production !')
  }
}
