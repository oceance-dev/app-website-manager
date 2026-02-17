import { Document, Folder, DocumentPermission } from '@/src/types';

export type { Document, Folder, DocumentPermission };

export type ViewMode = 'grid' | 'list';
export type ContextMenuType = 'folder' | 'document';

export interface DocumentToDelete {
  id: number;
  name: string;
  type: string;
  size: string;
}

export interface FolderToDelete {
  id: number;
  name: string;
  documentsCount: number;
  childrenCount: number;
}

export interface DocumentViewerState {
  visible: boolean;
  url: string | null;
  name: string;
  mimeType: string;
}

export type FileType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER';
