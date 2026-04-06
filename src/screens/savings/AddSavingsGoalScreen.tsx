import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  HelperText,
  Text,
  TextInput,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SavingsStackParamList } from '../../app/navigation/SavingsStack';
import { useSavingsStore } from '../../store';
import { colors } from '../../constants/colors';
import { parseToCents, formatCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import AmountInput from '../../components/common/AmountInput';

type NavProp = NativeStackNavigationProp<SavingsStackParamList, 'AddSavingsGoal'>;

export default function AddSavingsGoalScreen() {
  const navigation = useNavigation<NavProp>();
  const { addGoal } = useSavingsStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const projectedCompletion = useMemo(() => {
    const targetCents = parseToCents(targetAmount);
    const monthlyCents = parseToCents(monthlyContribution);
    if (targetCents <= 0 || monthlyCents <= 0) return null;

    const monthsNeeded = Math.ceil(targetCents / monthlyCents);
    const date = new Date();
    date.setMonth(date.getMonth() + monthsNeeded);
    return date;
  }, [targetAmount, monthlyContribution]);

  const validate = (): boolean => {
    const newErrors: { name?: string; target?: string } = {};
    if (name.trim().length === 0) {
      newErrors.name = 'Goal name is required';
    }
    if (parseToCents(targetAmount) <= 0) {
      newErrors.target = 'Target amount must be greater than $0.00';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!validate()) return;

    addGoal({
      name: name.trim(),
      targetAmount: parseToCents(targetAmount),
      monthlyContribution: parseToCents(monthlyContribution),
      targetDate: targetDate.trim() || undefined,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated={false}>
        <Appbar.Action icon="close" onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Savings Goal" titleStyle={styles.appbarTitle} />
        <View style={{ width: 48 }} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text variant="labelLarge" style={styles.label}>
          Goal Name
        </Text>
        <TextInput
          mode="outlined"
          placeholder="e.g. Emergency Fund, Vacation"
          value={name}
          onChangeText={setName}
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
        />
        {submitted && errors.name ? (
          <HelperText type="error" visible>
            {errors.name}
          </HelperText>
        ) : null}

        {/* Target Amount */}
        <Text variant="labelLarge" style={styles.label}>
          Target Amount
        </Text>
        <AmountInput
          value={targetAmount}
          onChangeText={setTargetAmount}
          label="Target Amount"
        />
        {submitted && errors.target ? (
          <HelperText type="error" visible>
            {errors.target}
          </HelperText>
        ) : null}

        {/* Monthly Contribution */}
        <Text variant="labelLarge" style={styles.label}>
          Monthly Contribution
        </Text>
        <AmountInput
          value={monthlyContribution}
          onChangeText={setMonthlyContribution}
          label="Monthly Contribution"
        />

        {/* Target Date */}
        <Text variant="labelLarge" style={styles.label}>
          Target Date (optional)
        </Text>
        <TextInput
          mode="outlined"
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD"
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="calendar" />}
        />
        {targetDate.trim().length > 0 ? (
          <HelperText type="info" visible>
            {formatDate(targetDate || new Date().toISOString())}
          </HelperText>
        ) : null}

        {/* Projected Completion */}
        {projectedCompletion ? (
          <View style={styles.projectionCard}>
            <Text variant="labelMedium" style={styles.projectionLabel}>
              Projected Completion
            </Text>
            <Text variant="titleMedium" style={styles.projectionDate}>
              {formatDate(projectedCompletion.toISOString())}
            </Text>
            <Text variant="bodySmall" style={styles.projectionSubtext}>
              Based on {formatCents(parseToCents(monthlyContribution))}/month
            </Text>
          </View>
        ) : null}

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          buttonColor={colors.primary}
          textColor={colors.surface}
          labelStyle={styles.saveButtonLabel}
        >
          Save Goal
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appbar: {
    backgroundColor: colors.background,
  },
  appbarTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    marginTop: 20,
    marginBottom: 6,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.surface,
  },
  projectionCard: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  projectionLabel: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  projectionDate: {
    fontWeight: '700',
    color: colors.primary,
  },
  projectionSubtext: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  saveButton: {
    marginTop: 32,
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: 6,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
