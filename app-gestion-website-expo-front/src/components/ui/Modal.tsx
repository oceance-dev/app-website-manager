import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  TextStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius, shadows } from '@/src/theme';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const BREAKPOINT_TABLET = 768;

export const Modal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  actions,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= BREAKPOINT_TABLET;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={isTablet ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, isTablet && styles.backdropCentered]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.container,
            isTablet && styles.containerTablet,
          ]}
        >
          {/* Handle bar pour mobile */}
          {!isTablet && (
            <View style={styles.handleBar}>
              <View style={styles.handle} />
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.gray[600]} size={22} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {/* Actions */}
          {actions && <View style={styles.actions}>{actions}</View>}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
  container: {
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4] + (Platform.OS === 'ios' ? spacing[4] : spacing[3]),
    ...shadows.lg,
  },
  containerTablet: {
    width: '80%',
    maxWidth: 600,
    borderRadius: borderRadius.xl,
    paddingTop: spacing[4],
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...textStyles.h2,
    color: colors.navy,
  } as TextStyle,
  subtitle: {
    ...textStyles.caption,
    color: colors.gray[600],
    marginTop: 2,
  } as TextStyle,
  closeButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  content: {
    flexGrow: 0,
  },
  contentInner: {
    paddingVertical: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});
