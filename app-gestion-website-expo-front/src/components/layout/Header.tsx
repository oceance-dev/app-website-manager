import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import { Settings, LogOut, User, Search, Bell, Menu } from 'lucide-react-native';
import { MenuItem } from '../../types';
import { isWeb } from '../../utils/responsive';

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
          <Menu color="#64748b" size={24} strokeWidth={2} />
        </TouchableOpacity>

        {/* Right Section - Search & Icons */}
        <View style={styles.rightSection}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search color="#94a3b8" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Bell color="#64748b" size={20} strokeWidth={2} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSettings}
            activeOpacity={0.7}
          >
            <Settings color="#64748b" size={20} strokeWidth={2} />
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
              <Text style={styles.avatarText}>AD</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Admin User</Text>
              <Text style={styles.profileRole}>Administrateur</Text>
            </View>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut color="#ef4444" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 72,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    minWidth: 240,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    outlineStyle: 'none',
  } as any,
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  profileRole: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
});
