import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, FolderOpen, Users, BarChart3, Settings, User, LogOut } from 'lucide-react-native';
import { MenuItem } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

interface SidebarProps {
  activeScreen: string;
  onLogout: () => void;
  menuItems: MenuItem[];
}

const iconMap = {
  'home': Home,
  'folder': FolderOpen,
  'users': Users,
  'bar-chart-2': BarChart3,
  'settings': Settings,
};

export default function Sidebar({ activeScreen, onLogout, menuItems }: SidebarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <View>
          <Text style={styles.appName}>MonApp</Text>
          <Text style={styles.appSubtitle}>Gestion Pro</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = activeScreen === item.screen;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Icon 
                color={isActive ? '#fff' : '#94a3b8'} 
                size={20} 
              />
              <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User Profile */}
      <View style={styles.footer}>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <User color="#64748b" size={20} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Admin User</Text>
            <Text style={styles.userEmail}>admin@monapp.fr</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <LogOut color="#fff" size={16} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 256,
    backgroundColor: '#0f172a',
    height: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#2563eb',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  menuTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#334155',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});