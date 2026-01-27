import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBackground?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = colors.navy,
  iconBackground = colors.gray[100],
  subtitle,
  onPress,
  style,
}: StatCardProps) {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={style}
    >
      <Card>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
            <Icon color={iconColor} size={24} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.value}>{value}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
      </Card>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...textStyles.label,
    color: colors.gray[600],
    marginBottom: spacing[1],
  },
  value: {
    ...textStyles.h2,
    color: colors.navy,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.gray[500],
    marginTop: spacing[1],
  },
});

export default StatCard;
