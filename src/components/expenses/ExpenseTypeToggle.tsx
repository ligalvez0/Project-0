import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { ExpenseType } from '../../models';
import { colors } from '../../constants/colors';

interface ExpenseTypeToggleProps {
  value: ExpenseType;
  onChange: (type: ExpenseType) => void;
}

export default function ExpenseTypeToggle({
  value,
  onChange,
}: ExpenseTypeToggleProps) {
  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={value}
        onValueChange={(val) => onChange(val as ExpenseType)}
        buttons={[
          {
            value: 'personal',
            label: 'Personal',
            icon: 'account',
            checkedColor: colors.surface,
            uncheckedColor: colors.personal,
            style: [
              styles.button,
              value === 'personal' && {
                backgroundColor: colors.personal,
                borderColor: colors.personal,
              },
            ],
          },
          {
            value: 'business',
            label: 'Business',
            icon: 'briefcase',
            checkedColor: colors.surface,
            uncheckedColor: colors.business,
            style: [
              styles.button,
              value === 'business' && {
                backgroundColor: colors.business,
                borderColor: colors.business,
              },
            ],
          },
        ]}
        style={styles.segmented}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  segmented: {
    borderRadius: 8,
  },
  button: {
    borderColor: colors.border,
  },
});
