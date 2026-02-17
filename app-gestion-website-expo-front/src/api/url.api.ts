const associations = {
  staffApp: {
    list: "/association/staffApp/association",
    get: (id: number | string) => `/association/staffApp/association/${id}`,
    approve: (id: number | string) =>
      `/association/staffApp/association/${id}/approve`,
    reject: (id: number | string) =>
      `/association/staffApp/association/${id}/reject`,
    suspend: (id: number | string) =>
      `/association/staffApp/association/${id}/suspend`,
    reactivate: (id: number | string) =>
      `/association/staffApp/association/${id}/reactived`,
  },

  admin: {
    get: (id: number | string) => `/association/admin/association/${id}`,
    update: (id: number | string) =>
      `/association/admin/association/${id}/update`,
    extendSubscription: (id: number | string) =>
      `/association/admin/association/${id}/extend-subscription`,
    stats: "/my-association/stats",
    // Members
    members: {
      list: "/association/admin/members",
      approve: (id: number | string) =>
        `/association/admin/members/${id}/approve`,
      reject: (id: number | string) =>
        `/association/admin/members/${id}/reject`,
      suspend: (id: number | string) =>
        `/association/admin/members/${id}/suspend`,
      delete: (id: number | string) =>
        `/association/admin/members/${id}/delete`,
    },
    // Candidatures
    candidatures: {
      list: "/association/admin/candidatures",
      get: (id: number | string) => `/association/admin/candidatures/${id}`,
      validate: (id: number | string) =>
        `/association/admin/candidatures/${id}/validate`,
      reject: (id: number | string) =>
        `/association/admin/candidatures/${id}/reject`,
      documents: (id: number | string) =>
        `/association/admin/candidatures/${id}/documents`,
    },
  },
  list: "/associations/",
  occupiedRoles: (id: number | string) => `/associations/${id}/occupied-roles`,
} as const;

/**
 * Routes pour les utilisateurs
 */
const users = {
  me: "/users/me",
  updateMe: "/users/me/update",
  changePassword: "/users/me/change-password",
} as const;

/**
 * Routes pour les rôles et permissions
 */
const roles = {
  list: "/roles",
  get: (id: number | string) => `/roles/${id}`,
  assignable: "/roles/assignable",
  permissions: "/roles/permissions",
  myPermissions: "/roles/me/permissions",
};

/**
 * Routes pour staff App
 */
const staffApp = {
  roles: {
    create: "/staffApp/roles/",
    update: (id: number | string) => `/staffApp/roles/${id}/update`,
    delete: (id: number | string) => `/staffApp/roles/${id}/delete`,
    updatePermissions: (id: number | string) =>
      `/staffApp/roles/${id}/permissions/update`,
    getUserRole: (id: number | string) => `/staffApp/roles/${id}/user`,
  },
} as const;

/**
 * Routes pour les documents
 */
const documents = {
  // Documents utilisateurs
  list: "/documents/users/getAllDocument",
  view: (id: number | string) => `/documents/users/view/${id}`,
  upload: "/documents/users/upload-document",
  download: (id: number | string) => `/documents/users/download/${id}`,
  update: (id: number | string) => `/documents/users/update-document/${id}`,
  delete: (id: number | string) => `/documents/users/delete-document/${id}`,

  // Types de documents
  types: {
    list: "/documents/types",
    listCustom: "/documents/types/custom",
    create: "/documents/types/create",
    update: (id: number | string) => `/documents/types/${id}`,
    delete: (id: number | string) => `/documents/types/${id}`,
  },
} as const;

/**
 * Routes pour les dossiers
 */

const folders = {
  list: "/folders/getAllFolder",
  my: "/folders/my",
  create: "/folders/create-folder",
  get: (id: number | string) => `/folders/${id}`,
  update: (id: number | string) => `/folders/update/${id}`,
  delete: (id: number | string) => `/folders/delete/${id}`,
  moveDocument: "/folders/move-document",
  sync: "/folders/sync",
  move: (id: number | string) => `/folders/${id}/move`,

  // Members
  members: {
    list: (folderId: number | string) => `/folders/${folderId}/members`,
    add: (folderId: number | string) => `/folders/${folderId}/members`,
    update: (folderId: number | string, userId: number | string) =>
      `/folders/${folderId}/members/${userId}`,
    delete: (folderId: number | string, userId: number | string) =>
      `/folders/${folderId}/members/${userId}`,
  },
} as const;

/**
 * Routes pour les exigences documentaires
 */
const documentRequirements = {
  list: "/document-requirements",
  create: "/document-requirements/create-document-required",
  get: (id: number | string) => `/document-requirements/${id}`,
  update: (id: number | string) =>
    `/document-requirements/update-document-required/${id}`,
  delete: (id: number | string) =>
    `/document-requirements/delete-document-required/${id}`,
  toggle: (id: number | string) => `/document-requirements/${id}/toggle`,
  reorder: "/document-requirements/reorder",
  bulkUpdate: "/document-requirements/bulk-update",
  initialize: "/document-requirements/initialize",
  reset: "/document-requirements/reset",
  myCompletion: "/document-requirements/my-completion",
  checkUser: (userId: number | string) =>
    `/document-requirements/check/${userId}`,
  canApprove: (userId: number | string) =>
    `/document-requirements/can-approve/${userId}`,
  availableTypes: "/document-requirements/available-types",
} as const;

/**
 * Routes pour les candidats
 */
const candidats = {
  docRequirements: "/candidats/doc-requirements",
  completion: "/candidats/completion",
  canSubmit: "/candidats/can-submit",

  // Documents
  documents: {
    list: "/candidats/get-my-documents",
    upload: "/candidats/upload-my-document",
    download: (id: number | string) => `/candidats/download-my-document/${id}`,
    delete: (id: number | string) => `/candidats/delete-my-document/${id}`,
    view: (id: number | string) => `/candidats/view-my-document/${id}`,
    replace: (id: number | string) => `/candidats/replace-my-document/${id}`,
  },
} as const;

/**
 * Routes pour l'authentification
 */
const auth = {
  registerAssociation: "/auth/registerAssociation",
  registerMember: "/auth/registerMemberAssociation",
  registerCandidat: "/auth/registerCandidat",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  logoutAll: "/auth/logout-all",
  me: "/auth/me",
} as const;

/**
 * Export principal - Routes API
 */
export const API_ROUTES = {
  associations,
  users,
  roles,
  staffApp,
  documents,
  folders,
  documentRequirements,
  candidats,
  auth,
} as const;

export type ApiRoutes = typeof API_ROUTES;
