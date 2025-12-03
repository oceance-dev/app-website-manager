import { pool  } from "./connection";

export async function initSchema() {
    /**
     * Partie user 
     */
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY
            lastname VARCHAR(100) NOT NULL,
            firstname VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('Admin', 'Président', 'Trésorier', 'Bénévole', 'Directeur de formation', 'Encadrant', 'Cadet', 'Cadet breveté', 'Candidat') NOT NULL,
            statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
            city_code VARCHAR(10) NOT NULL,
            phone VARCHAR(20),
            date_of_burth DATE,
            sexe TINYINT COMMENT '0 = Homme, 1 = Femme',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            INDEX idx_email (email),
            INDEX idx_role (role),
            INDEX idx_statut (statut)
        )    
    `);

    /**
     * Partie candidat
     */
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS candidats (
            id INT AUTO_INCREMENT PRIMARY KEY
            user_id INT UNIQUE COMMENT 'référence au compte utilisateur créé',
            emailParent VARCHAR(255) NOT NULL,
            status ENUM('pending', 'appointment_scheduled', 'validated', 'rejected') DEFAULT 'pending',
            rejection_reason TEXT COMMENT 'Raison du rejet si statut = rejected',
            request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            validated_at TIMESTAMP NULL COMMENT 'Date de validation en Cadet',
            validated_by INT COMMENT 'ID de l\'admin qui a validé',

            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
            
            INDEX idx_status (status),
            INDEX idx_emailParent (emailParent)
        ) 
    `);

    /**
     * Partie rendez-vous
     */    
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidat_id INT NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time DATE NOT NULL,
            notes TEXT COMMENT 'Notes sur le rendez-vous',
            created_by INT COMMENT 'ID de l\'admin qui a créé le RDV',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatet_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (candidat_id) REFERENCES candidats(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

            INDEX idx_candidat (candidat_id),
            INDEX idx_date (appointment_date)
        )    
    `);
    
    /**
     * Partie candidat_document
     */
    await pool.execute(`
       CREATE TABLE IF EXISTS candidat_document (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidat_id INT NOT NULL,
            document_type ENUM(
                'id_card', -- Pièce d'identité
                'photo', -- Photo d'identité
                'medical_certificate', -- Certificat médical
                'parental_authorization', -- Autorisation parentale
                'inscription_form', -- Formulaire d'inscription
                'engagement_form', -- Charte d'engagement
                'health_form', -- Fiche sanitaire
            ) NOT NULL,
            document_name VARCHAR(255) NOT NULL COMMENT 'Nom du fichier',
            file_path VARCHAR(500) NOT NULL COMMENT 'Chemin du fichier sur le serveur',
            file_size INT COMMENT 'Taille en octets',
            mime_type VARCHAR(100),
            category ENUM('required', 'form') NOT NULL COMMENT 'Document requis ou formulaire à compléter',

            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (candidat_id) REFERENCES candidats(id) ON DELETE CASCADE,
            INDEX idx_candidat (candidat_id),
            INDEX idx_type (document_type),
            UNIQUE KEY unique_candidat_document (candidat_id, document_type)
       ) 
    `);

    /**
     * Partie folders 
     */
    await pool.execute(`
        CREATE TABLE IF EXISTS folders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            parent_id INT NULL COMMENT 'ID du dossier parent (Null = racine)',
            created_by INT NOT NULL COMMENT 'ID de l\'utilisateur créateur',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,

            INDEX idx_parent (parent_id),
            INDEX idx_created_by (created_by)
        )
    `);

    /**
     * TABLE: folder_permissions
     */
    await pool.execute(`
        -- ============================================
        -- TABLE: folder_permissions
        -- Description: Permissions d'accès aux dossiers
        -- ============================================
        CREATE TABLE folder_permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            folder_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('viewer', 'editor', 'admin') NOT NULL COMMENT 'Niveau de permission',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_folder (folder_id),
            INDEX idx_user (user_id),
            UNIQUE KEY unique_folder_user (folder_id, user_id)
        );
    `);

    /**
     * Partie documents
     */
    await pool.execute(`
        -- ============================================
        -- TABLE: documents
        -- Description: Documents de l'association
        -- ============================================
        CREATE TABLE documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            folder_id INT NOT NULL,
            file_path VARCHAR(500) NOT NULL COMMENT 'Chemin du fichier sur le serveur',
            file_size BIGINT COMMENT 'Taille en octets',
            file_size_display VARCHAR(20) COMMENT 'Taille formatée (ex: 2.4 MB)',
            mime_type VARCHAR(100),
            document_type ENUM('PDF', 'DOCX', 'XLSX', 'PPTX', 'OTHER') DEFAULT 'OTHER',
            uploaded_by INT NOT NULL COMMENT 'ID de l\'utilisateur qui a uploadé',
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
            FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_folder (folder_id),
            INDEX idx_uploaded_by (uploaded_by),
            INDEX idx_type (document_type),
            INDEX idx_date (uploaded_at)
        );
    `);

    /**
     * Partie document_permissions
     */
    await pool.execute(`
        -- ============================================
        -- TABLE: document_permissions
        -- Description: Permissions spécifiques pour les documents de cours
        -- Note: Permet de donner accès à certains cadets uniquement
        -- ============================================
        CREATE TABLE document_permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            document_id INT NOT NULL,
            user_id INT NOT NULL,
            can_access BOOLEAN DEFAULT TRUE,
            granted_by INT COMMENT 'ID de l\'admin/encadrant qui a donné la permission',
            granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_document (document_id),
            INDEX idx_user (user_id),
            UNIQUE KEY unique_document_user (document_id, user_id)
        );
    `);

    /**
     * Partie organization_info
     */
    await pool.execute(`
        -- ============================================
        -- TABLE: organization_info
        -- Description: Informations de l'association
        -- ============================================
        CREATE TABLE organization_info (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            postal_code VARCHAR(10),
            city VARCHAR(100),
            email VARCHAR(255),
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `);
    

    console.log('Schéma initialisé');
}