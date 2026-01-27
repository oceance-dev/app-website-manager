

export const UrlApi = {

   

    /**
     * ROUTE ASSOCIATION
     */
    associationsApi: {
        /**
         * ROUTE SUPER ADMIN
         */
        staffApp: {
            association: {
                getAll: '/association/staffApp/association',
                get: (id: number | string) => `/association/staffApp/association/${id}`,
                approve: (id: number | string) => `/association/staffApp/association/${id}/approve`,
                reject: (id: number | string) => `/association/staffApp/association/${id}/reject`,
                suspend: (id: number | string) => `/association/staffApp/association/${id}/suspend`,
                reactived: (id: number | string) => `/association/staffApp/association/${id}/reactived`,
            },
        },
        /**
         * ROUTE ADMIN
         */
        admin: {
            association: {
                get: (id: number | string) => `/association/admin/association/${id}`,
                update:(id: number | string) => `/association/admin/association/${id}/update`,
                extendSubscription: (id: number | string) => `/association/admin/association/${id}/extend-subscription`,
                getStats: '/my-association/stats',
            },
            members: {
                getAll: '/association/admin/members',
                approveMember: (id: number | string) => `/association/admin/members/${id}/approve`,
                rejectMember: (id: number | string) => `/association/admin/members/${id}/reject`,
                suspendMember: (id: number | string) => `/association/admin/members/${id}/suspend`,
                deleteMember: (id: number | string) => `/association/admin/members/${id}/delete`,
            },
            cadets: {

            },
            candidatures: {
                getAll: '/association/admin/candidatures',
                get: (id: number | string) => `/association/admin/candidatures/${id}`,
                validate: (id: number | string) => `/association/admin/candidatures/${id}/validate`,
                reject: (id: number | string) => `/association/admin/candidatures/${id}/reject`,
                getDocuments: (id: number | string) => `/association/admin/candidatures/${id}/documents`,
            }
        },

        /**
         * ROUTE BASE ASSOCIATION
         */
        baseAssociation: {
            getAll: '/associations/',
            occupiedRole: (id: number | string) => `/associations/${id}/occupied-roles`,
        },
    },

    /**
     * ROUTE USERS
     */
    usersApi: {
        me: '/users/me',
        meUpdate: '/users/me/update',
        meChangePassword: '/users/me/change-password',
    },

    /**
     * ROLES & PERMISSIONS
     */
    rolesApi: {
        getAll: '/roles',
        get: '/roles/:id',
        assignable: '/roles/assignable',
        permissions: '/roles/permissions',
        myPermissions: '/roles/me/permissions',
    },
    
    staffAppApi: {
        postRoles: '/staffApp/roles/',
        updateRoles: (id: number | string) => `/staffApp/roles/${id}/update`,
        deleteRoles: (id: number | string) => `/staffApp/roles/${id}/delete`,

        updatePermissions: (id: number | string) => `/staffApp/roles/${id}/permissions/update`,
        getUserRole: (id: number | string) => `/staffApp/roles/${id}/user`,
    },

    /**
     * ROUTE CADETS
     *
     */

    /**
     * ROUTE DOCUMENTS
     */
    documentsApi: {
        getAll: '/documents/users/getAllDocument',
        viewDocument: (id: number | string) => `/documents/users/view/${id}`,
        create: '/documents/users/upload-document',
        downloadDocument: (id: number | string) => `/documents/users/download/${id}`,
        updateDocument: (id: number | string) => `/documents/users/update-document/${id}`,
        deleteDocument: (id: number | string) => `/documents/users/delete-document/${id}`,

        // ROUTE CANDIDAT
        uploadDocument: (id: number | string) => `/documents/candidat/${id}/upload-document`,

        // TYPES DE DOCUMENTS
        getAllTypes: '/documents/types',
        getCustomTypes: '/documents/types/custom',
        createType: '/documents/types/create',
        updateType: (id: number | string) => `/documents/types/${id}`,
        deleteType: (id: number | string) => `/documents/types/${id}`,

        // ROUTE STAFF APP
    },

    /**
     * ROUTE DOSSIERS
     */
    foldersApi: {
        getAll: '/folders/getAllFolder',
        myFolder: '/folders/my',
        create: '/folders/create-folder',
        get: (id: number | string) => `/folders/${id}`,
        update: (id: number | string) => `/folders/update/${id}`,
        delete: (id: number | string) => `/folders/delete/${id}`,
        moveDocument: '/folders/move-document',

        syncFolders: '/folders/sync',
        moveFolder: (id: number) =>  `/folders/${id}/move`,

        getFolderMembers: (id: number | string) => `/folders/${id}/members`,
        addFolderMember: (id: number | string) => `/folders/${id}/members`,
        updateFolderMember: (id: number | string, userId: number | string) => `/folders/${id}/members/${userId}`,
        deleteFolderMember: (id: number | string, userId: number | string) => `/folders/${id}/members/${userId}`,
    },

    /**
     * Choice document by association
     */
    choiceDocumentApi: {
        getAll: '/document-requirements',
        create: '/document-requirements/create-document-required',
        get: (id: number | string) => `/document-requirements/${id}`,
        update: (id: number | string) => `/document-requirements/update-document-required/${id}`,
        delete: (id: number | string) => `/document-requirements/delete-document-required/${id}`,
        toggle: (id: number | string) => `/document-requirements/${id}/toggle`,
        reorder: '/document-requirements/reorder',
        bulkUpdate: '/document-requirements/bulk-update',
        initialize: '/document-requirements/initialize',
        reset: '/document-requirements/reset',
        myCompletion: '/document-requirements/my-completion',
        checkUser: (userId: number | string) => `/document-requirements/check/${userId}`,
        canApprove: (userId: number | string) => `/document-requirements/can-approve/${userId}`,
        availableTypes: '/document-requirements/available-types',
    },

    /**
     * ROUTE CANDIDATURES
     */
    candidatsApi: {
        docRequirements: '/candidats/doc-requirements',
        completion: '/candidats/completion',
        canSubmit: '/candidats/can-submit',
        getMyDocuments: '/candidats/get-my-documents',
        uploadDocument: '/candidats/upload-my-document',
        downloadDocument: (id: number | string) => `/candidats/download-my-document/${id}`,
        deleteDocument: (id: number | string) => `/candidats/delete-my-document/${id}`,
        getDocument: (id: number | string) => `/candidats/view-my-document/${id}`,
        replaceDocument: (id: number | string) => `/candidats/replace-my-document/${id}`,
    },

    /**
     * ROUTE AUTH
     */
    authApi: {
        registerAssociation: '/auth/registerAssociation',
        registerMember: '/auth/registerMemberAssociation',
        registerCandidat: '/auth/registerCandidat',
        login: '/auth/login',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
        logoutAll: '/auth/logout-all',
        me: '/auth/me',
    },
}