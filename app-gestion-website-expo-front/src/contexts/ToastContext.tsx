import { AlertTriangle, CheckCircle2, Info } from "lucide-react-native";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";
import { borderRadius, colors, shadows, spacing } from "../theme";
import { Styles, Text, View } from "dripsy";

type ToastType = "success" | "error" | "info";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });

  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(20));

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast((prev) => ({ ...prev, visible: false, message: "" }));
    });
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType) => {
      setToast({ visible: true, message, type });

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(hideToast, 3000);
    },
    [hideToast, opacity, translateY],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (msg: string) => show(msg, "success"),
      showError: (msg: string) => show(msg, "error"),
      showInfo: (msg: string) => show(msg, "info"),
    }),
    [show],
  );

  const renderIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 color={colors.success} size={18} />;
      case "error":
        return <AlertTriangle color={colors.error} size={18} />;
      case "info":
        return <Info color={colors.navy} size={18} />;
    }
  };

  const getBackground = () => {
    switch (toast.type) {
      case "success":
        return colors.successLight;
      case "error":
        return colors.errorLight;
      case "info":
      default:
        return colors.navyLight;
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case "success":
        return colors.successDark;
      case "error":
        return colors.errorDark;
      case "info":
      default:
        return colors.navy;
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast.visible && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.toastContainer,
              {
                opacity,
                transform: [{ translateY }],
                backgroundColor: getBackground(),
              },
            ]}
          >
            {renderIcon()}
            <Text style={[styles.toastText, { color: getTextColor() }]}>
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};

const styles = Styles.create({
  toastContainer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: Platform.select({ ios: spacing.xl * 2, android: spacing.xl }),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    gap: spacing.sm,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
