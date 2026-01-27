import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors, textStyles, spacing, shadows, borderRadius } from '../../theme';
import { isMobile, getFontSize } from '../../utils/responsive';

interface HeaderProps {
  title: string;
  subtitle?: string;
  notificationCount?: number;
  onNotificationPress?: () => void;
  style?: ViewStyle;
  rightComponent?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  notificationCount = 0,
  onNotificationPress,
  style,
  rightComponent,
}: HeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.actionsContainer}>
        {rightComponent}
        
        {onNotificationPress && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
          >
            <Bell color={colors.navy} size={20} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...textStyles.h3,
    color: colors.navy,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.gray[600],
    marginTop: spacing[1],
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  notificationButton: {
    position: 'relative',
    padding: spacing[2],
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default Header;
