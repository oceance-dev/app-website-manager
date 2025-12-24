import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Home, FolderOpen, Users, BarChart3, Settings, Building2, BookOpen } from 'lucide-react-native';
import { MenuItem } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { isWeb, isLargeScreen } from '../../utils/responsive';

interface SidebarProps {
  activeScreen: string;
  menuItems: MenuItem[];
  onNavigate?: () => void;
}

const iconMap = {
  'home': Home,
  'folder': FolderOpen,
  'book-open': BookOpen,
  'users': Users,
  'bar-chart-2': BarChart3,
  'building-2': Building2,
  'settings': Settings,
};

export default function Sidebar({ activeScreen, menuItems, onNavigate }: SidebarProps) {
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
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <View>
          <Text style={styles.appName}>CadetApp</Text>
          <Text style={styles.appSubtitle}>Gestion Pro</Text>
        </View>
      </View>

      {/* Menu */}
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
              <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                <Icon
                  color={isActive ? '#2563eb' : '#64748b'}
                  size={20}
                  strokeWidth={2}
                />
              </View>
              <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: '#fff',
    height: '100%',
  },
  containerDesktop: {
    borderTopRightRadius: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: '#dbeafe',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  menuTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
