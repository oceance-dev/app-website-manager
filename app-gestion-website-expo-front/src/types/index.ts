export interface Folder {
    id: number;
    name: string;
    slug?: string;
    parentId: number | null;
    createdBy: number;
    createdAt: string;
    permissions: FolderPermission[];
    visibility?: 'private' | 'members' | 'staff' | 'public';
    description?: string;
    color?: string;
    icon?: string;
    allowUpload?: boolean;
    allowDownload?: boolean;
    allowDelete?: boolean;
}

export interface FolderPermission {
    userId: number;
    role: 'viewer' | 'editor' | 'admin';
}

export interface DocumentPermission {
    userId: number;
    canAccess: boolean;
}

export interface Document {
    id: number;
    nameDoc: string;
    folderId: number;
    length: string;
    date: string;
    type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER';
    uploadedBy: number;
    uri?: string;          // URI du fichier uploadé
    mimeType?: string;     // Type MIME du fichier
    permissions?: DocumentPermission[];  // Permissions d'accès au document
}


export interface LoginData {
    email: string;
    password: string;
}

export interface SignData {
    lastname: string;
    firstname: string;
    dateOfbirth: string;
    sexe: number;
    phone: string;
    email: string;
    emailParent: string;
    password: string;
    confirmPassword: string;
    postalCode?: string;
}

export interface UserRole {
    id: number;
    name: string;
    displayName: string;
    level: number;
}

export interface User {
    id: number;
    lastname: string;
    firstname: string;
    email: string;
    role: UserRole | string; // Support both old string format and new object format
    statut: 'Actif' | 'Inactif';
    dateOfbirth?: string;
    sexe?: number;
    phone: string;
    courseAccess?: boolean;
    postalCode?: string;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
}

export interface MenuItem {
    id: string,
    label: string,
    icon: string,
    screen: keyof RootStackParamList;
    roles?: string[];
}

export type RootStackParamList = {
    Dashboard: undefined;
    Documents: undefined;
    Users: undefined;
    Cadet: undefined;
    Statistics: undefined;
    Settings: undefined;
    Organization: { associationId?: number };
    Courses: undefined;
    CandidatDocuments: undefined;
    PendingMembers: undefined;
}