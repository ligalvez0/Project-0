import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  HelperText,
  Portal,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ExpenseStackParamList } from '../../app/navigation/ExpenseStack';
import { useExpenseStore } from '../../store';
import { ExpenseType } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { formatCents, parseToCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import AmountInput from '../../components/common/AmountInput';
import CategoryPicker from '../../components/common/CategoryPicker';
import ExpenseTypeToggle from '../../components/expenses/ExpenseTypeToggle';

type NavProp = NativeStackNavigationProp<ExpenseStackParamList, 'ExpenseDetail'>;
type DetailRouteProp = RouteProp<ExpenseStackParamList, 'ExpenseDetail'>;

const categoryMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export default function ExpenseDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<DetailRouteProp>();
  const { expenseId } = route.params;

  const { expenses, updateExpense, deleteExpense } = useExpenseStore();
  const expense = useMemo(
    () => expenses.find((e) => e.id === expenseId),
    [expenses, expenseId],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Edit form state
  const [amount, setAmount] = useState(() =>
    expense ? (expense.amount / 100).toFixed(2) : '',
  );
  const [description, setDescription] = useState(expense?.description ?? '');
  const [type, setType] = useState<ExpenseType>(expense?.type ?? 'personal');
  const [categoryId, setCategoryId] = useState<string | null>(
    expense?.categoryId ?? null,
  );
  const [date, setDate] = useState(
    expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const filteredCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter((c) => c.type === type),
    [type],
  );

  const category = expense ? categoryMap.get(expense.categoryId) : undefined;

  const handleTypeChange = useCallback(
    (newType: ExpenseType) => {
      setType(newType);
      const currentCategory = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
      if (currentCategory && currentCategory.type !== newType) {
        setCategoryId(null);
      }
    },
    [categoryId],
  );

  const resetForm = useCallback(() => {
    if (!expense) return;
    setAmount((expense.amount / 100).toFixed(2));
    setDescription(expense.description);
    setType(expense.type);
    setCategoryId(expense.categoryId);
    setDate(expense.date.slice(0, 10));
    setNotes(expense.notes ?? '');
    setErrors({});
    setSubmitted(false);
  }, [expense]);

  const handleEdit = useCallback(() => {
    resetForm();
    setIsEditing(true);
  }, [resetForm]);

  const handleCancelEdit = useCallback(() => {
    resetForm();
    setIsEditing(false);
  }, [resetForm]);

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

  const handleSave = useCallback(() => {
    setSubmitted(true);
    if (!validate()) return;

    updateExpense(expenseId, {
      amount: parseToCents(amount),
      description: description.trim(),
      categoryId: categoryId ?? filteredCategories[0]?.id ?? '',
      type,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    });

    setIsEditing(false);
    setSubmitted(false);
  }, [
    amount,
    categoryId,
    date,
    description,
    expenseId,
    filteredCategories,
    notes,
    type,
    updateExpense,
  ]);

  const handleDelete = useCallback(() => {
    deleteExpense(expenseId);
    navigation.goBack();
  }, [deleteExpense, expenseId, navigation]);

  // Expense not found
  if (!expense) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header style={styles.appbar} elevated={false}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Expense" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.notFoundContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text variant="titleMedium" style={styles.notFoundText}>
            Expense not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header style={styles.appbar} elevated={false}>
          <Appbar.Action icon="close" onPress={handleCancelEdit} />
          <Appbar.Content title="Edit Expense" titleStyle={styles.appbarTitle} />
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
            Save Changes
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Detail view (read-only)
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated={false}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Expense Details" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.detailContent}>
        {/* Amount Card */}
        <Surface style={styles.amountCard} elevation={1}>
          <Text variant="displaySmall" style={styles.amountValue}>
            {formatCents(expense.amount)}
          </Text>
          <View
            style={[
              styles.typePill,
              {
                backgroundColor:
                  expense.type === 'personal'
                    ? colors.personal
                    : colors.business,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={expense.type === 'personal' ? 'account' : 'briefcase'}
              size={14}
              color={colors.surface}
            />
            <Text variant="labelSmall" style={styles.typePillText}>
              {expense.type === 'personal' ? 'Personal' : 'Business'}
            </Text>
          </View>
        </Surface>

        {/* Details Card */}
        <Surface style={styles.detailCard} elevation={1}>
          {/* Description */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons
                name="text"
                size={20}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.detailRowContent}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                Description
              </Text>
              <Text variant="bodyLarge" style={styles.detailValue}>
                {expense.description}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Category */}
          <View style={styles.detailRow}>
            <View
              style={[
                styles.detailIconContainer,
                { backgroundColor: category?.color ?? colors.textSecondary, borderRadius: 12 },
              ]}
            >
              <MaterialCommunityIcons
                name={category?.icon ?? 'help-circle'}
                size={20}
                color={colors.surface}
              />
            </View>
            <View style={styles.detailRowContent}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                Category
              </Text>
              <Text variant="bodyLarge" style={styles.detailValue}>
                {category?.name ?? 'Unknown'}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Date */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.detailRowContent}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                Date
              </Text>
              <Text variant="bodyLarge" style={styles.detailValue}>
                {formatDate(expense.date)}
              </Text>
            </View>
          </View>

          {/* Notes (if present) */}
          {expense.notes ? (
            <>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialCommunityIcons
                    name="note-text"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={styles.detailRowContent}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    Notes
                  </Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {expense.notes}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </Surface>

        {/* Delete Button */}
        <Button
          mode="outlined"
          onPress={() => setShowDeleteDialog(true)}
          style={styles.deleteButton}
          contentStyle={styles.deleteButtonContent}
          textColor={colors.error}
          icon="delete"
          labelStyle={styles.deleteButtonLabel}
        >
          Delete Expense
        </Button>

        {/* Created info */}
        <Text variant="bodySmall" style={styles.createdAt}>
          Created {formatDate(expense.createdAt)}
        </Text>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>Delete Expense?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogContent}>
              This will permanently delete the expense "{expense.description}" for{' '}
              {formatCents(expense.amount)}. This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDeleteDialog(false)}
              textColor={colors.textSecondary}
            >
              Cancel
            </Button>
            <Button onPress={handleDelete} textColor={colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notFoundText: {
    color: colors.textSecondary,
    marginTop: 16,
  },
  // Detail view styles
  detailContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  amountCard: {
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  amountValue: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  typePillText: {
    color: colors.surface,
    fontWeight: '700',
  },
  detailCard: {
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailRowContent: {
    flex: 1,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    color: colors.textPrimary,
  },
  divider: {
    marginHorizontal: 16,
  },
  deleteButton: {
    borderColor: colors.error,
    borderRadius: 12,
    marginBottom: 16,
  },
  deleteButtonContent: {
    paddingVertical: 4,
  },
  deleteButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  createdAt: {
    textAlign: 'center',
    color: colors.textSecondary,
    opacity: 0.7,
  },
  // Edit form styles
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
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  dialogContent: {
    textAlign: 'center',
  },
});
