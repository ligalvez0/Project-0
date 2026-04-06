import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SubscriptionStackParamList } from '../../app/navigation/SubscriptionStack';
import { useSubscriptionStore } from '../../store';
import { BillingCycle } from '../../models/Subscription';
import { ExpenseType } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { DEFAULTS } from '../../constants/defaults';
import { colors } from '../../constants/colors';
import { formatCents, parseToCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import { getMonthlyEquivalent } from '../../utils/projections';
import CategoryPicker from '../../components/common/CategoryPicker';

type NavProp = NativeStackNavigationProp<SubscriptionStackParamList, 'AddSubscription'>;

export default function AddSubscriptionScreen() {
  const navigation = useNavigation<NavProp>();
  const { addSubscription } = useSubscriptionStore();

  const today = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [type, setType] = useState<ExpenseType>('personal');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(today);
  const [nextBillingDate, setNextBillingDate] = useState(today);
  const [reminderDays, setReminderDays] = useState(
    String(DEFAULTS.reminderDaysBefore),
  );
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const filteredCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter((c) => c.type === type),
    [type],
  );

  const amountCents = parseToCents(amount);
  const monthlyEquivalent = getMonthlyEquivalent(amountCents, billingCycle);

  const handleTypeChange = (newType: string) => {
    const expType = newType as ExpenseType;
    setType(expType);
    const currentCategory = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    if (currentCategory && currentCategory.type !== expType) {
      setCategoryId(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (name.trim().length === 0) {
      newErrors.name = 'Name is required';
    }
    if (amountCents <= 0) {
      newErrors.amount = 'Amount must be greater than $0.00';
    }
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      newErrors.startDate = 'Valid start date is required';
    }
    if (!nextBillingDate || isNaN(new Date(nextBillingDate).getTime())) {
      newErrors.nextBillingDate = 'Valid next billing date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!validate()) return;

    const resolvedCategoryId =
      categoryId ?? filteredCategories[0]?.id ?? '';

    addSubscription({
      name: name.trim(),
      amount: amountCents,
      billingCycle,
      type,
      categoryId: resolvedCategoryId,
      startDate: new Date(startDate).toISOString(),
      nextBillingDate: new Date(nextBillingDate).toISOString(),
      isActive: true,
      notes: notes.trim() || undefined,
      reminderDaysBefore: parseInt(reminderDays, 10) || DEFAULTS.reminderDaysBefore,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated={false}>
        <Appbar.Action icon="close" onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Add Subscription"
          titleStyle={styles.appbarTitle}
        />
        <View style={{ width: 48 }} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text variant="labelLarge" style={styles.label}>
          Name
        </Text>
        <TextInput
          mode="outlined"
          placeholder="e.g. Netflix, Spotify"
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

        {/* Amount */}
        <Text variant="labelLarge" style={styles.label}>
          Amount
        </Text>
        <TextInput
          mode="outlined"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Affix text="$" />}
        />
        {submitted && errors.amount ? (
          <HelperText type="error" visible>
            {errors.amount}
          </HelperText>
        ) : null}

        {/* Billing Cycle */}
        <Text variant="labelLarge" style={styles.label}>
          Billing Cycle
        </Text>
        <SegmentedButtons
          value={billingCycle}
          onValueChange={(val) => setBillingCycle(val as BillingCycle)}
          buttons={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          style={styles.segmented}
        />

        {/* Monthly equivalent */}
        {amountCents > 0 && billingCycle !== 'monthly' && (
          <HelperText type="info" visible style={styles.monthlyHint}>
            {formatCents(monthlyEquivalent)}/month equivalent
          </HelperText>
        )}

        {/* Type */}
        <Text variant="labelLarge" style={styles.label}>
          Type
        </Text>
        <SegmentedButtons
          value={type}
          onValueChange={handleTypeChange}
          buttons={[
            { value: 'personal', label: 'Personal' },
            { value: 'business', label: 'Business' },
          ]}
          style={styles.segmented}
        />

        {/* Category */}
        <Text variant="labelLarge" style={styles.label}>
          Category
        </Text>
        <CategoryPicker
          categories={filteredCategories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        {/* Start Date */}
        <Text variant="labelLarge" style={styles.label}>
          Start Date
        </Text>
        <TextInput
          mode="outlined"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="calendar" />}
        />
        {submitted && errors.startDate ? (
          <HelperText type="error" visible>
            {errors.startDate}
          </HelperText>
        ) : (
          <HelperText type="info" visible>
            {startDate && !isNaN(new Date(startDate).getTime())
              ? formatDate(startDate)
              : 'Enter a valid date'}
          </HelperText>
        )}

        {/* Next Billing Date */}
        <Text variant="labelLarge" style={styles.label}>
          Next Billing Date
        </Text>
        <TextInput
          mode="outlined"
          value={nextBillingDate}
          onChangeText={setNextBillingDate}
          placeholder="YYYY-MM-DD"
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="calendar-clock" />}
        />
        {submitted && errors.nextBillingDate ? (
          <HelperText type="error" visible>
            {errors.nextBillingDate}
          </HelperText>
        ) : (
          <HelperText type="info" visible>
            {nextBillingDate && !isNaN(new Date(nextBillingDate).getTime())
              ? formatDate(nextBillingDate)
              : 'Enter a valid date'}
          </HelperText>
        )}

        {/* Reminder */}
        <Text variant="labelLarge" style={styles.label}>
          Reminder (days before billing)
        </Text>
        <TextInput
          mode="outlined"
          value={reminderDays}
          onChangeText={setReminderDays}
          keyboardType="number-pad"
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="bell-outline" />}
        />

        {/* Notes */}
        <Text variant="labelLarge" style={styles.label}>
          Notes (optional)
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Any additional details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={[styles.textInput, styles.notesInput]}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
        />

        {/* Save */}
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          buttonColor={colors.primary}
          textColor={colors.surface}
          labelStyle={styles.saveButtonLabel}
        >
          Save Subscription
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
  segmented: {
    borderRadius: 8,
  },
  monthlyHint: {
    marginTop: 2,
    color: colors.secondary,
  },
  notesInput: {
    minHeight: 80,
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
