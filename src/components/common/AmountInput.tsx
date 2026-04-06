import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  style?: ViewStyle;
}

export default function AmountInput({
  value,
  onChangeText,
  label = 'Amount',
  style,
}: AmountInputProps) {
  const handleChange = (text: string) => {
    // Strip everything except digits and a single decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }

    onChangeText(cleaned);
  };

  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={handleChange}
      keyboardType="numeric"
      left={<TextInput.Affix text="$" textStyle={styles.prefix} />}
      style={[styles.input, style]}
      contentStyle={styles.content}
      outlineColor={colors.border}
      activeOutlineColor={colors.primary}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    fontSize: 28,
  },
  content: {
    fontSize: 28,
    fontWeight: '600',
  },
  prefix: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
