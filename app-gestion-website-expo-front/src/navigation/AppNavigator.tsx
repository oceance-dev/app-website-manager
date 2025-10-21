import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import Sidebar from '../components/layout/Sidebar';
import { RootStackParamList } from '../types';
import { menuItems } from '../data/mockData';
import { isWeb, isLargeScreen } from '../utils/responsive';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  onLogout: () => void;
}

export default function AppNavigator({ onLogout }: AppNavigatorProps) {
  const [currentRoute, setCurrentRoute] = React.useState('Dashboard');
  const showSidebar = isWeb && isLargeScreen();

  return (
    <NavigationContainer
      onStateChange={(state) => {
        if (state) {
          const route = state.routes[state.index];
          setCurrentRoute(route.name);
        }
      }}
    >
      <View style={styles.container}>
        {showSidebar && (
          <Sidebar 
            activeScreen={currentRoute}
            onLogout={onLogout}
            menuItems={menuItems}
          />
        )}
        <View style={styles.content}>
          <Stack.Navigator
            initialRouteName="Dashboard"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2563eb',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerShown: !showSidebar,
            }}
          >
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Tableau de bord' }}
            />
            <Stack.Screen 
              name="Documents" 
              component={DocumentsScreen}
              options={{ title: 'Documents' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Paramètres' }}
            />
          </Stack.Navigator>
        </View>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});