import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, Download, Trash2, MoreVertical, FileText } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/src/theme';
import { Document, ViewMode } from '../types';
import { getTypeColor } from '../utils/fileUtils';
import { isMobile, getFontSize, MIN_TOUCH_TARGET } from '@/src/utils/responsive';

interface DocumentCardProps {
  document: Document;
  viewMode: ViewMode;
  onView: (id: number) => void;
  onDownload: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onOpenContextMenu?: (id: number) => void;
}

export const DocumentCard = ({
  document,
  viewMode,
  onView,
  onDownload,
  onDelete,
  onOpenContextMenu,
}: DocumentCardProps) => {
  const iconColor = getTypeColor(document.type);

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        style={styles.cardGrid}
        onPress={() => onView(document.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainerGrid}>
          <FileText color={iconColor} size={48} fill={iconColor} />
        </View>
        <View style={styles.infoGrid}>
          <Text style={styles.nameGrid} numberOfLines={2}>
            {document.nameDoc}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{document.length}</Text>
          </View>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onView(document.id);
            }}
          >
            <Eye color={colors.gray[600]} size={18} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDownload(document.id, document.nameDoc);
            }}
          >
            <Download color={colors.gray[600]} size={18} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(document.id);
            }}
          >
            <Trash2 color={colors.error} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.cardList}
      onPress={() => onView(document.id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <FileText color={iconColor} size={24} fill={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {document.nameDoc}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{document.length}</Text>
          <Text style={styles.metaText}>{document.date}</Text>
        </View>
      </View>
      {onOpenContextMenu && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation();
            onOpenContextMenu(document.id);
          }}
        >
          <MoreVertical color={colors.gray[600]} size={20} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardList: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[1],
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? spacing[3] : 0,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 48,
  },
  cardGrid: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    height: '100%',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  iconContainerGrid: {
    width: 48,
    height: 48,
    marginBottom: spacing[3],
    alignSelf: 'flex-start',
  },
  info: {
    flex: 1,
  },
  infoGrid: {
    alignItems: 'flex-start',
    width: '100%',
  },
  name: {
    fontSize: getFontSize(14),
    fontWeight: '400',
    color: '#202124',
    lineHeight: 20,
  },
  nameGrid: {
    fontSize: getFontSize(14),
    lineHeight: 20,
    fontWeight: '400',
    color: '#202124',
    marginBottom: spacing[2],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: getFontSize(12),
    color: '#5f6368',
    fontWeight: '400',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'center',
    marginTop: 'auto',
  },
  actionButton: {
    width: isMobile ? MIN_TOUCH_TARGET : 32,
    height: isMobile ? MIN_TOUCH_TARGET : 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: isMobile ? MIN_TOUCH_TARGET : 32,
    height: isMobile ? MIN_TOUCH_TARGET : 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
