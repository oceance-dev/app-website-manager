import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  TextStyle,
} from 'react-native';
import {
  X,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '@/src/theme';
import ImageViewer from 'react-simple-image-viewer';

interface DocumentViewerModalProps {
  visible: boolean;
  onClose: () => void;
  documentUrl: string | null;
  documentName: string;
  mimeType?: string;
  showDownload?: boolean;
}

const BREAKPOINT_TABLET = 768;
const ZOOM_STEP = 25;
const MIN_ZOOM = 25;
const MAX_ZOOM = 200;

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  visible,
  onClose,
  documentUrl,
  documentName,
  mimeType,
  showDownload = true,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT_TABLET;

  const [loading, setLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const isPDF = useMemo(() => {
    return mimeType?.includes('pdf') || documentName.toLowerCase().endsWith('.pdf');
  }, [mimeType, documentName]);

  const isImage = useMemo(() => {
    return mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(documentName);
  }, [mimeType, documentName]);

  const displayName = useMemo(() => {
    const name = documentName || 'Document';
    // Remove extension for cleaner display
    return name.replace(/\.[^/.]+$/, '');
  }, [documentName]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsViewerOpen(false);
      setLoading(true);
      setZoom(100);
      setRotation(0);
    }
  }, [visible]);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!documentUrl) {
      return;
    }

    try {
      if (documentUrl.startsWith('blob:')) {
        const response = await fetch(documentUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = documentName || 'document';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName || 'document';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  }, [documentUrl, documentName]);

  const handleOpenViewer = useCallback(() => {
    setIsViewerOpen(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  const renderContent = useCallback(() => {
    if (!documentUrl) {
      return (
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderIconContainer}>
              <FileText color={colors.navy} size={48} />
            </View>
            <View style={styles.placeholderLines}>
              <View style={[styles.placeholderLine, styles.placeholderLineLong]} />
              <View style={[styles.placeholderLine, styles.placeholderLineMedium]} />
              <View style={[styles.placeholderLine, styles.placeholderLineLong]} />
              <View style={styles.placeholderSpacer} />
              <View style={[styles.placeholderLine, styles.placeholderLineLong]} />
              <View style={[styles.placeholderLine, styles.placeholderLineShort]} />
              <View style={[styles.placeholderLine, styles.placeholderLineMedium]} />
              <View style={styles.placeholderSpacer} />
              <View style={[styles.placeholderLine, styles.placeholderLineButton]} />
            </View>
          </View>
        </View>
      );
    }

    if (isPDF) {
      return (
        <View style={styles.viewerContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.navy} />
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
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            onLoad={handleLoad}
            onError={handleError}
          >
            <View style={styles.unsupportedContainer}>
              <FileText color={colors.gray[400]} size={48} />
              <Text style={styles.unsupportedTitle}>
                Impossible d'afficher ce PDF
              </Text>
              <Text style={styles.unsupportedText}>
                Utilisez le bouton Télécharger pour ouvrir le fichier.
              </Text>
            </View>
          </object>
        </View>
      );
    }

    if (isImage) {
      return (
        <View style={styles.viewerContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.navy} />
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
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
            onClick={handleOpenViewer}
            onLoad={handleLoad}
            onError={handleError}
          />
        </View>
      );
    }

    // Placeholder for unsupported files
    return (
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderCard}>
          <View style={styles.placeholderIconContainer}>
            <FileText color={colors.navy} size={48} />
          </View>
          <View style={styles.placeholderLines}>
            <View style={[styles.placeholderLine, styles.placeholderLineLong]} />
            <View style={[styles.placeholderLine, styles.placeholderLineMedium]} />
            <View style={[styles.placeholderLine, styles.placeholderLineLong]} />
            <View style={styles.placeholderSpacer} />
            <View style={[styles.placeholderLine, styles.placeholderLineLong]} />
            <View style={[styles.placeholderLine, styles.placeholderLineShort]} />
            <View style={[styles.placeholderLine, styles.placeholderLineMedium]} />
            <View style={styles.placeholderSpacer} />
            <View style={[styles.placeholderLine, styles.placeholderLineButton]} />
          </View>
        </View>
      </View>
    );
  }, [documentUrl, isPDF, isImage, loading, zoom, rotation, documentName, handleLoad, handleError, handleOpenViewer]);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={onClose}
      >
        <View style={[styles.backdrop, isDesktop && styles.backdropCentered]}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          />

          <View style={[styles.modalContainer, isDesktop && styles.modalContainerDesktop]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <FileText color={colors.navy} size={20} />
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X color={colors.gray[400]} size={20} />
              </TouchableOpacity>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
              <View style={styles.toolbarGroup}>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
                >
                  <ZoomOut
                    color={zoom <= MIN_ZOOM ? colors.gray[300] : colors.gray[600]}
                    size={18}
                  />
                </TouchableOpacity>

                <Text style={styles.zoomText}>{zoom}%</Text>

                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={handleZoomIn}
                  disabled={zoom >= MAX_ZOOM}
                >
                  <ZoomIn
                    color={zoom >= MAX_ZOOM ? colors.gray[300] : colors.gray[600]}
                    size={18}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.toolbarSeparator} />

              <TouchableOpacity style={styles.toolbarButton} onPress={handleRotate}>
                <RotateCw color={colors.gray[600]} size={18} />
              </TouchableOpacity>

              {showDownload && (
                <>
                  <View style={styles.toolbarSeparator} />

                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownload}
                  >
                    <Download color={colors.navy} size={16} />
                    <Text style={styles.downloadButtonText}>Télécharger</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              {renderContent()}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Aperçu du document : {displayName}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full screen image viewer */}
      {isViewerOpen && documentUrl && isImage && (
        <ImageViewer
          src={[documentUrl]}
          currentIndex={0}
          disableScroll={false}
          closeOnClickOutside={true}
          onClose={handleCloseViewer}
          backgroundStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '95%',
    height: '95%',
    ...shadows.xl,
  },
  modalContainerDesktop: {
    width: '90%',
    maxWidth: 900,
    height: '85%',
    maxHeight: 700,
    borderRadius: borderRadius['2xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    flex: 1,
  } as TextStyle,
  closeButton: {
    padding: spacing[2],
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
    minWidth: 50,
    textAlign: 'center',
  } as TextStyle,
  toolbarSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing[2],
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.navy,
  } as TextStyle,

  // Content
  content: {
    flex: 1,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
  },
  viewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
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
    marginTop: spacing[3],
    fontSize: 14,
    color: colors.gray[500],
  } as TextStyle,

  // Placeholder
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  placeholderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    width: '100%',
    maxWidth: 350,
    ...shadows.md,
  },
  placeholderIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  placeholderLines: {
    gap: spacing[2],
  },
  placeholderLine: {
    height: 10,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
  },
  placeholderLineLong: {
    width: '100%',
  },
  placeholderLineMedium: {
    width: '75%',
  },
  placeholderLineShort: {
    width: '50%',
  },
  placeholderLineButton: {
    width: '40%',
    height: 20,
    alignSelf: 'center',
    marginTop: spacing[3],
    backgroundColor: colors.navyLight,
  },
  placeholderSpacer: {
    height: spacing[2],
  },

  // Unsupported
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  unsupportedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginTop: spacing[3],
    marginBottom: spacing[2],
    textAlign: 'center',
  } as TextStyle,
  unsupportedText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  } as TextStyle,

  // Footer
  footer: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.gray[500],
  } as TextStyle,
});

export default DocumentViewerModal;
