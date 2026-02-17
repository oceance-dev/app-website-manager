import { borderRadius, colors, spacing } from "@/src/theme";
import { Styles, Text, View } from "dripsy";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AlertTriangle color={colors.error} size={20} />
        <Text style={styles.text}>{message}</Text>
      </View>

      {onRetry ? (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <RefreshCw color={colors.white} size={16} />
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = Styles.create({
  container: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.errorLight,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: colors.errorDark,
  },
  retryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
  },
  retryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
