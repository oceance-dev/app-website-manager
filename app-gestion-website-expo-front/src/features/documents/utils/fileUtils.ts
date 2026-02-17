import { colors } from '@/src/theme';
import { FileType } from '../types';

export const getFileType = (fileName: string): FileType => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'PDF';
  if (extension === 'docx' || extension === 'doc') return 'DOCX';
  if (extension === 'xlsx' || extension === 'xls') return 'XLSX';
  if (extension === 'pptx' || extension === 'ppt') return 'PPTX';
  return 'OTHER';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const getTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    PDF: '#EA4335',
    DOCX: '#4285F4',
    XLSX: '#0F9D58',
    PPTX: '#FBBC04',
  };
  return typeColors[type] || colors.gray[600];
};

export const getVisibilityIcon = (visibility: string | undefined): string | null => {
  if (visibility === 'private') return '🔒';
  if (visibility === 'staff') return '👥';
  if (visibility === 'public') return '🌐';
  return null;
};
