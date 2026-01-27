import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Settings, LogOut, Bell, Menu } from 'lucide-react-native';
import { MenuItem } from '../../types';
import { isWeb, getResponsivePadding } from '../../utils/responsive';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';
import { AuthApi } from '../../api';

interface HeaderProps {
  activeScreen: string;
  menuItems: MenuItem[];
  onLogout?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  onToggleSidebar?: () => void;
}

export default function Header({ activeScreen, menuItems, onLogout, onSettings, onProfile, onToggleSidebar }: HeaderProps) {
  const currentMenuItem = menuItems.find(item => item.screen === activeScreen);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const response = await AuthApi.getMe();
      if (response.success && response.data) {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const getUserInitials = () => {
    if (!currentUser) return 'U';
    const firstInitial = currentUser.firstName?.[0] || currentUser.firstname?.[0] || '';
    const lastInitial = currentUser.lastName?.[0] || currentUser.lastname?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (!currentUser) return 'Utilisateur';
    const firstName = currentUser.firstName || currentUser.firstname || '';
    const lastName = currentUser.lastName || currentUser.lastname || '';
    return `${firstName} ${lastName}`.trim() || 'Utilisateur';
  };

  const getUserRole = () => {
    return currentUser?.role?.displayName || currentUser?.role?.name || 'Membre';
  };

  const paddingTop = isWeb ? 0 : Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.content}>
        {/* Left Section - Menu Toggle */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onToggleSidebar}
          activeOpacity={0.7}
        >
          <Menu color={colors.gray[600]} size={24} strokeWidth={2} />
        </TouchableOpacity>

        {/* Right Section - Icons */}
        <View style={styles.rightSection}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Bell color={colors.gray[600]} size={20} strokeWidth={2} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSettings}
            activeOpacity={0.7}
          >
            <Settings color={colors.gray[600]} size={20} strokeWidth={2} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* User Profile Button */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfile}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{getUserName()}</Text>
              <Text style={styles.profileRole} numberOfLines={1}>{getUserRole()}</Text>
            </View>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut color={colors.error} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsivePadding(),
    minHeight: 72,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: colors.gray[50],
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.white,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing[1],
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.label,
    fontWeight: '700',
    color: colors.white,
  },
  profileInfo: {
    alignItems: 'flex-start',
    minWidth: 0,
    maxWidth: 120,
  },
  profileName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.navy,
  },
  profileRole: {
    ...textStyles.caption,
    color: colors.gray[600],
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
});
