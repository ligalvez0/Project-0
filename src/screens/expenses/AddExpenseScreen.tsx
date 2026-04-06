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

import { ExpenseStackParamList } from '../../app/navigation/ExpenseStack';
import { useExpenseStore } from '../../store';
import { ExpenseType } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { parseToCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import AmountInput from '../../components/common/AmountInput';
import CategoryPicker from '../../components/common/CategoryPicker';
import ExpenseTypeToggle from '../../components/expenses/ExpenseTypeToggle';

type NavProp = NativeStackNavigationProp<ExpenseStackParamList, 'AddExpense'>;

export default function AddExpenseScreen() {
  const navigation = useNavigation<NavProp>();
  const { addExpense } = useExpenseStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExpenseType>('personal');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const filteredCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter((c) => c.type === type),
    [type],
  );

  // Reset category when type changes if current selection doesn't match
  const handleTypeChange = (newType: ExpenseType) => {
    setType(newType);
    const currentCategory = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    if (currentCategory && currentCategory.type !== newType) {
      setCategoryId(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: { amount?: string; description?: string } = {};
    const cents = parseToCents(amount);
    if (cents <= 0) {
      newErrors.amount = 'Amount must be greater than $0.00';
    }
    if (description.trim().length === 0) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!validate()) return;

    addExpense({
      amount: parseToCents(amount),
      description: description.trim(),
      categoryId: categoryId ?? filteredCategories[0]?.id ?? '',
      type,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated={false}>
        <Appbar.Action icon="close" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Add Expense" titleStyle={styles.appbarTitle} />
        <View style={{ width: 48 }} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <Text variant="labelLarge" style={styles.label}>
          Amount
        </Text>
        <AmountInput value={amount} onChangeText={setAmount} />
        {submitted && errors.amount ? (
          <HelperText type="error" visible>
            {errors.amount}
          </HelperText>
        ) : null}

        {/* Description */}
        <Text variant="labelLarge" style={styles.label}>
          Description
        </Text>
        <TextInput
          mode="outlined"
          placeholder="What was this expense for?"
          value={description}
          onChangeText={setDescription}
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
        />
        {submitted && errors.description ? (
          <HelperText type="error" visible>
            {errors.description}
          </HelperText>
        ) : null}

        {/* Type Toggle */}
        <Text variant="labelLarge" style={styles.label}>
          Type
        </Text>
        <ExpenseTypeToggle value={type} onChange={handleTypeChange} />

        {/* Category */}
        <Text variant="labelLarge" style={styles.label}>
          Category
        </Text>
        <CategoryPicker
          categories={filteredCategories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        {/* Date */}
        <Text variant="labelLarge" style={styles.label}>
          Date
        </Text>
        <TextInput
          mode="outlined"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          style={styles.textInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="calendar" />}
        />
        <HelperText type="info" visible>
          {formatDate(date || new Date().toISOString())}
        </HelperText>

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
          Save Expense
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
