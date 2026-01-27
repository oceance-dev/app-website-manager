import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Download } from 'lucide-react-native';
import { isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET, getModalWidth, getModalHeight } from '../../utils/responsive';
import ImageViewer from 'react-simple-image-viewer';

interface DocumentViewerModalProps {
  visible: boolean;
  onClose: () => void;
  documentUrl: string | null;
  documentName: string;
  mimeType?: string;
  showDownload?: boolean;
}

export default function DocumentViewerModal({
  visible,
  onClose,
  documentUrl,
  documentName,
  mimeType,
  showDownload = true,
}: DocumentViewerModalProps) {
  const [loading, setLoading] = React.useState(true);
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);

  const isPDF = mimeType?.includes('pdf') || documentName.toLowerCase().endsWith('.pdf');
  const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(documentName);

  // Fermer le viewer d'images quand on ferme la modal
  React.useEffect(() => {
    if (!visible) {
      setIsViewerOpen(false);
      setLoading(true);
    }
  }, [visible]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!documentUrl) {
      console.log('❌ No document URL for download');
      return;
    }

    console.log('💾 Starting download:', {
      url: documentUrl,
      name: documentName,
      mimeType: mimeType,
    });

    try {
      // Si c'est un blob URL, on doit le re-fetch pour créer un nouveau blob
      if (documentUrl.startsWith('blob:')) {
        console.log('📦 Fetching blob for download...');

        const response = await fetch(documentUrl);
        const blob = await response.blob();

        console.log('📦 Blob fetched:', blob.type, blob.size);

        // Créer un nouveau blob URL temporaire
        const url = URL.createObjectURL(blob);

        // Créer le lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = documentName || 'document';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        console.log('✅ Download triggered');

        // Nettoyer
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('🧹 Cleanup done');
        }, 100);
      } else {
        // Pour les URLs normales
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName || 'document';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        console.log('✅ Download triggered');

        setTimeout(() => {
          document.body.removeChild(link);
          console.log('🧹 Cleanup done');
        }, 100);
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const renderContent = () => {
    if (!documentUrl) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Impossible de charger le document</Text>
        </View>
      );
    }

    if (isPDF) {
      return (
        <View style={styles.viewerContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Chargement du PDF...</Text>
            </View>
          )}
          <object
            data={documentUrl}
            type="application/pdf"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            onLoad={handleLoad}
            onError={handleError}
          >
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
            }}>
              <Text style={styles.unsupportedTitle}>
                Votre navigateur ne peut pas afficher ce PDF
              </Text>
              <Text style={styles.unsupportedText}>
                Utilisez le bouton de téléchargement pour ouvrir le fichier.
              </Text>
            </div>
          </object>
        </View>
      );
    }

    if (isImage) {
      return (
        <View style={styles.viewerContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Chargement de l'image...</Text>
            </View>
          )}
          <img
            src={documentUrl}
            alt={documentName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
            onClick={() => setIsViewerOpen(true)}
            onLoad={handleLoad}
            onError={handleError}
          />
          <Text style={styles.imageHint}>Cliquez sur l'image pour l'agrandir</Text>
        </View>
      );
    }

    // Pour les autres types de fichiers
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedTitle}>Prévisualisation non disponible</Text>
        <Text style={styles.unsupportedText}>
          Ce type de fichier ne peut pas être prévisualisé directement.
        </Text>
        <Text style={styles.unsupportedText}>
          Utilisez le bouton de téléchargement pour ouvrir le fichier.
        </Text>
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title} numberOfLines={1}>
                  {documentName}
                </Text>
                {mimeType && (
                  <Text style={styles.subtitle}>{mimeType}</Text>
                )}
              </View>
              <View style={styles.headerActions}>
                {showDownload && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleDownload}
                  >
                    <Download color="#2563eb" size={24} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            {renderContent()}
          </View>
        </View>
      </Modal>

      {/* Image Viewer en plein écran */}
      {isViewerOpen && documentUrl && isImage && (
        <ImageViewer
          src={[documentUrl]}
          currentIndex={0}
          disableScroll={false}
          closeOnClickOutside={true}
          onClose={() => setIsViewerOpen(false)}
          backgroundStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 0 : 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: isMobile ? 0 : 16,
    width: isMobile ? '100%' : '95%',
    maxWidth: isMobile ? '100%' : 1600,
    height: isMobile ? '100%' : '95%',
    maxHeight: isMobile ? '100%' : 1000,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: 'space-between',
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: isMobile ? 12 : 0,
  },
  headerContent: {
    flex: 1,
    marginRight: isMobile ? 0 : 16,
  },
  title: {
    fontSize: getFontSize(isMobile ? 16 : 18),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: getFontSize(14),
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: isMobile ? 'flex-end' : 'flex-start',
  },
  iconButton: {
    padding: isMobile ? 12 : 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
    minWidth: isMobile ? MIN_TOUCH_TARGET : 'auto',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: isMobile ? 12 : 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    minWidth: isMobile ? MIN_TOUCH_TARGET : 'auto',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: getFontSize(16),
    color: '#64748b',
  },
  imageHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: getFontSize(14),
    color: '#64748b',
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(32),
  },
  errorText: {
    fontSize: getFontSize(16),
    color: '#ef4444',
    textAlign: 'center',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(32),
  },
  unsupportedTitle: {
    fontSize: getFontSize(isMobile ? 18 : 20),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  unsupportedText: {
    fontSize: getFontSize(16),
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
});
