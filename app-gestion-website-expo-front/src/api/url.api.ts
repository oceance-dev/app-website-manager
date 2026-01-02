

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
                getAll: '/staffApp/association/',
                get: (id: number | string) => `/staffApp/association/${id}`,
                approve: (id: number | string) => `/staffApp/association/${id}/approve`,
                reject: (id: number | string) => `/staffApp/association/${id}/reject`,
                suspend: (id: number | string) => `/staffApp/association/${id}/suspend`,
                reactived: (id: number | string) => `/staffApp/association/${id}/reactived`,
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
                getAll: '/association/admin/members/',
                approveMember: (id: number | string) => `/association/admin/members/${id}/approve`,
                rejectMember: (id: number | string) => `/association/admin/members/${id}/reject`,
                suspendMember: (id: number | string) => `/association/admin/members/${id}/suspend`,
                deleteMember: (id: number | string) => `/association/admin/members/${id}/delete`,
            },
            cadets: {

            }, 
            candidatures: {

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
        //update: (id: number | string) => `/documents/${id}/update`,
        //delete: (id: number | string) => `/documents/${id}/delete`,
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

        getFolderMembers: (id: number | string) => `/folders/${id}/members`,
        addFolderMember: (id: number | string) => `/folders/${id}/members`,
        updateFolderMember: (id: number | string, userId: number | string) => `/folders/${id}/members/${userId}`,
        deleteFolderMember: (id: number | string, userId: number | string) => `/folders/${id}/members/${userId}`,
    },

    /**
     * ROUTE CANDIDATURES
     */

    /**
     * ROUTE AUTH
     */
    authApi: {
        registerAssociation: '/auth/registerAssociation',
        registerMember: '/auth/registerMemberAssociation',
        login: '/auth/login',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
        logoutAll: '/auth/logout-all',
        me: '/auth/me',
    },
}