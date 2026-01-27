import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Home, FolderOpen, Users, BarChart3, Settings, Building2, BookOpen, UserCheck } from 'lucide-react-native';
import { MenuItem } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { isWeb, isLargeScreen, isMobile, getResponsivePadding, getSpacing, MIN_TOUCH_TARGET } from '../../utils/responsive';
import { colors, textStyles, spacing, borderRadius } from '../../theme';
import { Logo } from '../cadep';

interface SidebarProps {
  activeScreen: string;
  menuItems: MenuItem[];
  onNavigate?: () => void;
  onLogout?: () => void;
}

const iconMap = {
  'home': Home,
  'folder': FolderOpen,
  'book-open': BookOpen,
  'users': Users,
  'user-check': UserCheck,
  'bar-chart-2': BarChart3,
  'building-2': Building2,
  'settings': Settings,
};

export default function Sidebar({ activeScreen, menuItems, onNavigate, onLogout }: SidebarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDesktop = isWeb && isLargeScreen();

  const handleNavigate = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
    if (onNavigate) {
      onNavigate();
    }
  };

  const paddingTop = isDesktop ? 0 : Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop, { paddingTop }]}>
      {/* Logo Header */}
      <View style={styles.logoContainer}>
        <Logo size="medium" showText={true} variant="dark" />
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Menu Navigation */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>NAVIGATION</Text>
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = activeScreen === item.screen;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive
              ]}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.7}
            >
              <Icon
                color={isActive ? colors.gold : colors.white + 'CC'}
                size={20}
                strokeWidth={2}
              />
              <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.separator} />
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>2026 - CadetApp</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: isMobile ? '100%' : 280,
    backgroundColor: colors.navy,
    height: '100%',
  },
  containerDesktop: {
    borderTopRightRadius: borderRadius.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsivePadding(),
    paddingBottom: getSpacing(20),
    gap: spacing[3],
  },
  separator: {
    height: 1,
    backgroundColor: colors.white + '20',
    marginHorizontal: getResponsivePadding(),
    marginBottom: spacing[4],
  },
  menuContainer: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing[2],
  },
  menuTitle: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.white + 'B3',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
    marginLeft: spacing[3],
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(12),
    borderRadius: borderRadius.lg,
    marginBottom: spacing[1],
    gap: spacing[3],
    backgroundColor: 'transparent',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: colors.white + '15',
  },
  menuText: {
    ...textStyles.body,
    fontWeight: '500',
    color: colors.white + 'CC',
    flex: 1,
  },
  menuTextActive: {
    color: colors.gold,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.sm,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingBottom: getResponsivePadding(),
  },
  copyrightSection: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing[3],
    alignItems: 'center',
  },
  copyrightText: {
    ...textStyles.caption,
    color: colors.white + '80',
    textAlign: 'center',
  },
});
