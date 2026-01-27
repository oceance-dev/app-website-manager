import React from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Platform, Easing, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import SuperAdminDashboardScreen from '../screens/SuperAdminDashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrganizationScreen from '../screens/OrganizationScreen';
import CoursesScreen from '../screens/CoursesScreen';
import CandidatDocumentsScreen from '../screens/CandidatDocumentsScreen';
import PendingMembersScreen from '../screens/PendingMembersScreen';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { RootStackParamList, User } from '../types';
import { menuItems } from '../data/mockData';
import { isWeb, isLargeScreen } from '../utils/responsive';
import { getRoleDisplayName, getRoleName, hasRole } from '../utils/roleUtils';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  onLogout: () => void;
  currentUser: User | null;
}

export default function AppNavigator({ onLogout, currentUser }: AppNavigatorProps) {
  const [currentRoute, setCurrentRoute] = React.useState('Dashboard');
  const isDesktop = isWeb && isLargeScreen();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(isDesktop);
  const navigationRef = React.useRef<any>(null);
  const sidebarWidth = React.useRef(new Animated.Value(isDesktop ? 280 : 0)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  // Filtrer les menuItems selon le rôle de l'utilisateur
  const filteredMenuItems = React.useMemo(() => {
    if (!currentUser) return menuItems;

    const userRoleDisplay = getRoleDisplayName(currentUser);

    return menuItems.filter(item => {
      // Si l'item n'a pas de restriction de rôles, il est visible pour tous
      if (!item.roles || item.roles.length === 0) {
        return true;
      }

      // Vérifier si le rôle de l'utilisateur est dans la liste (par displayName)
      return item.roles.includes(userRoleDisplay);
    });
  }, [currentUser]);

  // Déterminer l'écran initial selon le rôle
  const initialRouteName = React.useMemo(() => {
    if (hasRole(currentUser, 'candidat')) {
      return 'CandidatDocuments';
    }
    return 'Dashboard';
  }, [currentUser]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(sidebarWidth, {
        toValue: isSidebarOpen ? 280 : 0,
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isSidebarOpen && !isDesktop ? 0.5 : 0,
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      })
    ]).start();
  }, [isSidebarOpen, isDesktop]);

  const handleSettings = () => {
    if (navigationRef.current) {
      navigationRef.current.navigate('Settings');
    }
  };

  const handleProfile = () => {
    // TODO: Navigate to profile screen when it exists
    console.log('Navigate to profile');
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarNavigate = () => {
    // Fermer la sidebar sur mobile après navigation
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={(state) => {
        if (state) {
          const route = state.routes[state.index];
          setCurrentRoute(route.name);
        }
      }}
    >
      <View style={styles.container}>
        {/* Sidebar - Desktop: fixed, Mobile: overlay */}
        {isDesktop && (
          <Animated.View style={{ width: sidebarWidth, overflow: 'hidden' }}>
            <Sidebar
              activeScreen={currentRoute}
              menuItems={filteredMenuItems}
              onNavigate={handleSidebarNavigate}
              onLogout={onLogout}
            />
          </Animated.View>
        )}

        <View style={styles.content}>
          <Header
            activeScreen={currentRoute}
            menuItems={filteredMenuItems}
            onLogout={onLogout}
            onSettings={handleSettings}
            onProfile={handleProfile}
            onToggleSidebar={handleToggleSidebar}
          />
          <Stack.Navigator
            initialRouteName={initialRouteName as any}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="Dashboard"
              component={currentUser?.isSuperAdmin ? SuperAdminDashboardScreen : DashboardScreen}
              options={{ title: 'Tableau de bord' }}
            />
            <Stack.Screen
              name="Documents"
              component={DocumentsScreen}
              options={{ title: 'Documents' }}
            />
            <Stack.Screen
              name="Organization"
              component={OrganizationScreen}
              options={{ title: 'Gestion de l\'association' }}
            />
            <Stack.Screen
              name="Courses"
              options={{ title: 'Cours' }}
            >
              {(props) => <CoursesScreen {...props} route={{ ...props.route, params: { ...props.route.params, currentUser } }} />}
            </Stack.Screen>
            <Stack.Screen
              name="CandidatDocuments"
              component={CandidatDocumentsScreen}
              options={{ title: 'Mes documents' }}
            />
            <Stack.Screen
              name="PendingMembers"
              component={PendingMembersScreen}
              options={{ title: 'Demandes en attente' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Paramètres' }}
            />
          </Stack.Navigator>
        </View>

        {/* Mobile Sidebar Overlay */}
        {!isDesktop && (
          <>
            {/* Backdrop */}
            <Animated.View
              style={[
                styles.overlay,
                { opacity: overlayOpacity }
              ]}
              pointerEvents={isSidebarOpen ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={() => setIsSidebarOpen(false)}
                activeOpacity={1}
              />
            </Animated.View>

            {/* Sidebar */}
            <Animated.View
              style={[
                styles.mobileSidebar,
                {
                  width: sidebarWidth,
                  transform: [
                    {
                      translateX: sidebarWidth.interpolate({
                        inputRange: [0, 280],
                        outputRange: [-280, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <Sidebar
                activeScreen={currentRoute}
                menuItems={filteredMenuItems}
                onNavigate={handleSidebarNavigate}
                onLogout={onLogout}
              />
            </Animated.View>
          </>
        )}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  mobileSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#1a2744',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
});