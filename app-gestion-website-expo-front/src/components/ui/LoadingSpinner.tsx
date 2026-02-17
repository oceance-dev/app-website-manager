import { colors, spacing } from "@/src/theme";
import { ActivityIndicator, Styles, Text, View } from "dripsy";
import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  fullscreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Chargement...",
  fullscreen = true,
}) => {
  if (fullscreen) {
    return (
      <View style={styles.fullscreen}>
        <ActivityIndicator size="large" color={colors.navy} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={colors.navy} />
      {message ? <Text style={styles.inlineMessage}>{message}</Text> : null}
    </View>
  );
};

const styles = Styles.create({
  fullscreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  inlineMessage: {
    fontSize: 14,
    color: colors.gray[600],
  },
});
