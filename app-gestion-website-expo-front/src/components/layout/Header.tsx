import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { MenuItem } from '../../types';

interface HeaderProps {
  activeScreen: string;
  menuItems: MenuItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Header({ activeScreen, menuItems, searchTerm, setSearchTerm }: HeaderProps) {
  const currentMenuItem = menuItems.find(item => item.screen === activeScreen);
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.title}>{currentMenuItem?.label || 'Dashboard'}</Text>
          <Text style={styles.subtitle}>Bienvenue sur votre espace de gestion</Text>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.searchContainer}>
            <Search color="#94a3b8" size={16} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell color="#64748b" size={20} />
            <View style={styles.notificationBadge} />
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
    borderBottomColor: '#e2e8f0',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    width: 256,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    outlineStyle: 'none',
  } as any,
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});