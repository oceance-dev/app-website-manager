import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';
import { getFontSize, getSpacing } from '../../utils/responsive';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

export default function Toast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
}: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide après la durée spécifiée
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle color="#fff" size={20} />,
          backgroundColor: '#10b981',
          borderColor: '#059669',
        };
      case 'error':
        return {
          icon: <XCircle color="#fff" size={20} />,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
        };
      case 'warning':
        return {
          icon: <AlertCircle color="#fff" size={20} />,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
        };
      case 'info':
        return {
          icon: <Info color="#fff" size={20} />,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.iconContainer}>{config.icon}</View>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(16),
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
});
