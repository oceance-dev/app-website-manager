import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { LoginData } from '../../types';
import { isWeb } from '../../utils/responsive';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });

  const handleLogin = () => {
    if (loginData.email === 'admin@monapp.fr' && loginData.password === 'admin123') {
      onLogin();
    } else {
      if (isWeb) {
        alert('Email ou mot de passe incorrect');
      } else {
        Alert.alert('Erreur', 'Email ou mot de passe incorrect');
      }
    }
  };

  const containerStyle = isWeb ? styles.webContainer : styles.mobileContainer;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={containerStyle}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.title}>MonApp</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>
          </View>

          <View style={[styles.formContainer, isWeb && styles.formContainerWeb]}>
            <Text style={styles.formTitle}>Connexion</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Adresse email</Text>
              <View style={styles.inputWrapper}>
                <Mail color="#94a3b8" size={20} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  value={loginData.email}
                  onChangeText={(text) => setLoginData({ ...loginData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#94a3b8" size={20} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={loginData.password}
                  onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                  secureTextEntry
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Se connecter</Text>
            </TouchableOpacity>

            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>Compte de démonstration :</Text>
              <Text style={styles.demoText}>Email: admin@monapp.fr</Text>
              <Text style={styles.demoText}>Mot de passe: admin123</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  formContainerWeb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    outlineStyle: 'none',
  } as any,
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 12,
    color: '#1e40af',
  },
});