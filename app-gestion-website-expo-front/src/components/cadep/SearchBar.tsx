import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher...',
  style,
}: SearchBarProps) {
  return (
    <View style={[styles.container, style]}>
      <Search color={colors.gray[400]} size={20} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.input.placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  input: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.navy,
    padding: 0,
  },
});

export default SearchBar;
