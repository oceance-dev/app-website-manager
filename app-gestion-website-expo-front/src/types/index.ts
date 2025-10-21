export interface Document {
    id: number;
    nameDoc: string;
    length: string;
    date: string;
    type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX';
}


export interface LoginData {
    email: string;
    password: string;
}

export interface User {
    id: number;
    lastname: string;
    firstname: string;
    email: string;
    role: 'Admin' | 'Encadrant' | 'Cadet';
    statut: 'Actif' | 'Inactif';
    dateOfbirth?: string;
    sexe?: number;
    phone: string;
}

export interface MenuItem {
    id: string,
    label: string,
    icon: string,
    screen: keyof RootStackParamList;
}

export type RootStackParamList = {
    Dashboard: undefined;
    Documents: undefined;
    Users: undefined;
    Cadet: undefined;
    Statistics: undefined;
    Settings: undefined;
}