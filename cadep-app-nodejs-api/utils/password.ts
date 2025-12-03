import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const Password = {
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    async verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },

    validate(password: string, context?: { firstname?: string, lastname?: string} ): { valid: boolean, errors: string[] } {
        const errors: string[] = [];

        if (password.length < 12) {
            errors.push('Le mot de passe doit contenir au moins 12 caractères');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une majuscule');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une minuscule');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un chiffre');
        }
        
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un caractères spécial');
        }

        // Vérifier que le mot de passe ne correspond pas au prénom, ni au nom de la personne 
        if (context) {
            const passwordLower = password.toLowerCase(); // Met en minuscule

            const firstnameLower = context.firstname?.toLowerCase();
            const lastnameLower = context.lastname?.toLowerCase();

            if (firstnameLower && firstnameLower.length >= 3) {
                if (passwordLower.includes(firstnameLower)) {
                    errors.push('Le mot de passe ne doit pas contenir votre prénom');
                }
            }

            if (lastnameLower && lastnameLower.length >= 3) {
                if (passwordLower.includes(lastnameLower)) {
                    errors.push('Le mot de passe ne doit pas contenir votre nom');
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }
}