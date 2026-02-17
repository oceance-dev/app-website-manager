import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextStyle,
} from 'react-native';
import {
  FileText,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useCandidateDocuments } from '@/src/features/association/hooks/useCandidateDocuments';
import { colors, textStyles, spacing, borderRadius } from '@/src/theme';
import { isWeb } from '@/src/utils/responsive';
import DocumentViewerModal from '@/src/components/modalsHelper/DocumentViewerModal';

interface CandidateDocumentsProps {
  candidateId: number;
}

export const CandidateDocuments = ({ candidateId }: CandidateDocumentsProps) => {
  const {
    documents,
    loading,
    uploading,
    fetchDocuments,
    viewDocument,
    downloadDocument,
    deleteDocument,
    uploadCustomDocument,
  } = useCandidateDocuments(candidateId);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState('');
  const [viewerMimeType, setViewerMimeType] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleView = async (doc: any) => {
    const result = await viewDocument(doc);
    if (result) {
      setViewerUrl(result.url);
      setViewerName(result.name);
      setViewerMimeType(result.mimeType);
      setViewerVisible(true);
    }
  };

  // Déterminer le statut du document
  const getDocStatus = (doc: any): 'validated' | 'pending' | 'missing' => {
    if (doc.status === 'validated' || doc.validated) return 'validated';
    if (doc.status === 'pending' || doc.uploadedAt) return 'pending';
    return 'missing';
  };

  const renderStatusBadge = (status: 'validated' | 'pending' | 'missing') => {
    switch (status) {
      case 'validated':
        return (
          <View style={[styles.statusBadge, styles.statusValidated]}>
            <CheckCircle color={colors.successDark} size={12} />
            <Text style={[styles.statusText, { color: colors.successDark }]}>Validé</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Clock color={colors.warningDark} size={12} />
            <Text style={[styles.statusText, { color: colors.warningDark }]}>En attente</Text>
          </View>
        );
      case 'missing':
        return (
          <View style={[styles.statusBadge, styles.statusMissing]}>
            <AlertCircle color={colors.gray[500]} size={12} />
            <Text style={[styles.statusText, { color: colors.gray[500] }]}>Manquant</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.navy} />
        <Text style={styles.loadingText}>Chargement des documents...</Text>
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun document requis</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {documents.map((doc, index) => {
        const status = getDocStatus(doc);
        const isMissing = status === 'missing';

        return (
          <View
            key={doc.id}
            style={[
              styles.documentRow,
              index === documents.length - 1 && styles.documentRowLast,
            ]}
          >
            {/* Icon */}
            <View style={[styles.docIcon, isMissing && styles.docIconMissing]}>
              <FileText color={isMissing ? colors.gray[400] : colors.success} size={18} />
            </View>

            {/* Info */}
            <View style={styles.docInfo}>
              <Text style={styles.docName}>{doc.originalName || doc.name}</Text>
              {!isMissing && doc.uploadedAt && (
                <Text style={styles.docDate}>
                  Soumis le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </View>

            {/* Status badge */}
            {renderStatusBadge(status)}

            {/* Actions (only if not missing) */}
            {!isMissing && (
              <View style={styles.docActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleView(doc)}
                >
                  <Eye color={colors.gray[400]} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => downloadDocument(doc)}
                >
                  <Download color={colors.gray[400]} size={18} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      <DocumentViewerModal
        visible={viewerVisible}
        documentUrl={viewerUrl || ''}
        documentName={viewerName}
        mimeType={viewerMimeType}
        onClose={() => {
          setViewerVisible(false);
          if (viewerUrl) URL.revokeObjectURL(viewerUrl);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  loadingText: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: spacing[2],
  } as TextStyle,
  emptyContainer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
  } as TextStyle,

  // Document row
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  documentRowLast: {
    marginBottom: 0,
  },

  // Doc icon
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconMissing: {
    backgroundColor: colors.gray[100],
  },

  // Doc info
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 2,
  } as TextStyle,
  docDate: {
    fontSize: 12,
    color: colors.gray[500],
  } as TextStyle,

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusValidated: {
    backgroundColor: colors.successLight,
    borderColor: colors.successLight,
  },
  statusPending: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningLight,
  },
  statusMissing: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  } as TextStyle,

  // Actions
  docActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  actionBtn: {
    padding: spacing[2],
  },
});
