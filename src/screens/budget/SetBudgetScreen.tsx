import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, parse, addMonths, subMonths } from 'date-fns';

import { BudgetStackParamList } from '../../app/navigation/BudgetStack';
import { useBudgetStore } from '../../store';
import { ExpenseType } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { DEFAULTS } from '../../constants/defaults';
import { parseToCents } from '../../utils/currency';
import { getCurrentMonth, formatMonthYear } from '../../utils/dateHelpers';
import AmountInput from '../../components/common/AmountInput';

type NavProp = NativeStackNavigationProp<BudgetStackParamList, 'SetBudget'>;
type ScreenRouteProp = RouteProp<BudgetStackParamList, 'SetBudget'>;

const categoryMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export default function SetBudgetScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRouteProp>();
  const budgetId = route.params?.budgetId;

  const { budgets, addBudget, updateBudget, getBudgetsByMonth } = useBudgetStore();

  const existingBudget = useMemo(
    () => (budgetId ? budgets.find((b) => b.id === budgetId) : undefined),
    [budgetId, budgets],
  );

  const isEditing = !!existingBudget;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    existingBudget?.categoryId ?? '',
  );
  const [amountText, setAmountText] = useState<string>(
    existingBudget ? (existingBudget.monthlyLimit / 100).toFixed(2) : '',
  );
  const [thresholdText, setThresholdText] = useState<string>(
    existingBudget
      ? String(Math.round(existingBudget.alertThreshold * 100))
      : String(Math.round(DEFAULTS.alertThreshold * 100)),
  );
  const [month, setMonth] = useState<string>(
    existingBudget?.month ?? getCurrentMonth(),
  );

  const navigatePrevMonth = useCallback(() => {
    const date = parse(month, 'yyyy-MM', new Date());
    setMonth(format(subMonths(date, 1), 'yyyy-MM'));
  }, [month]);

  const navigateNextMonth = useCallback(() => {
    const date = parse(month, 'yyyy-MM', new Date());
    setMonth(format(addMonths(date, 1), 'yyyy-MM'));
  }, [month]);

  // Categories that don't already have a budget for this month
  const availableCategories = useMemo(() => {
    const budgetsForMonth = getBudgetsByMonth(month);
    const usedCategoryIds = new Set(budgetsForMonth.map((b) => b.categoryId));

    return DEFAULT_CATEGORIES.filter((c) => {
      if (isEditing && c.id === existingBudget?.categoryId) return true;
      return !usedCategoryIds.has(c.id);
    });
  }, [month, getBudgetsByMonth, isEditing, existingBudget]);

  const selectedCategory = categoryMap.get(selectedCategoryId);

  const handleSave = useCallback(() => {
    if (!selectedCategoryId) {
      Alert.alert('Missing Category', 'Please select a category.');
      return;
    }

    const cents = parseToCents(amountText);
    if (cents <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid monthly limit greater than $0.');
      return;
    }

    const threshold = parseInt(thresholdText, 10);
    if (isNaN(threshold) || threshold < 1 || threshold > 100) {
      Alert.alert('Invalid Threshold', 'Alert threshold must be between 1% and 100%.');
      return;
    }

    const category = categoryMap.get(selectedCategoryId);
    const type: ExpenseType = category?.type ?? 'personal';

    if (isEditing && existingBudget) {
      updateBudget(existingBudget.id, {
        categoryId: selectedCategoryId,
        type,
        monthlyLimit: cents,
        month,
        alertThreshold: threshold / 100,
      });
    } else {
      addBudget({
        categoryId: selectedCategoryId,
        type,
        monthlyLimit: cents,
        month,
        alertThreshold: threshold / 100,
      });
    }

    navigation.goBack();
  }, [
    selectedCategoryId,
    amountText,
    thresholdText,
    month,
    isEditing,
    existingBudget,
    addBudget,
    updateBudget,
    navigation,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <IconButton icon="close" size={24} onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={styles.topBarTitle}>
          {isEditing ? 'Edit Budget' : 'Set Budget'}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Month Selector */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Month
        </Text>
        <View style={styles.monthSelector}>
          <IconButton icon="chevron-left" size={24} onPress={navigatePrevMonth} />
          <Text variant="titleMedium" style={styles.monthText}>
            {formatMonthYear(month)}
          </Text>
          <IconButton icon="chevron-right" size={24} onPress={navigateNextMonth} />
        </View>

        {/* Category Picker */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Category
        </Text>
        <View style={styles.categoryGrid}>
          {availableCategories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <Button
                key={cat.id}
                mode={isSelected ? 'contained' : 'outlined'}
                onPress={() => setSelectedCategoryId(cat.id)}
                style={[
                  styles.categoryChip,
                  isSelected ? { backgroundColor: cat.color } : undefined,
                ]}
                labelStyle={[
                  styles.categoryChipLabel,
                  isSelected ? { color: colors.surface } : { color: colors.textPrimary },
                ]}
                icon={cat.icon}
                buttonColor={isSelected ? cat.color : undefined}
                textColor={isSelected ? colors.surface : colors.textPrimary}
                compact
              >
                {cat.name}
              </Button>
            );
          })}
          {availableCategories.length === 0 && (
            <Text variant="bodyMedium" style={styles.noCategoriesText}>
              All categories already have a budget for {formatMonthYear(month)}.
            </Text>
          )}
        </View>

        {/* Type indicator */}
        {selectedCategory && (
          <View style={styles.typeIndicator}>
            <Text variant="bodyMedium" style={styles.typeText}>
              Type:{' '}
              <Text
                style={{
                  fontWeight: '700',
                  color:
                    selectedCategory.type === 'personal'
                      ? colors.personal
                      : colors.business,
                }}
              >
                {selectedCategory.type === 'personal' ? 'Personal' : 'Business'}
              </Text>
            </Text>
          </View>
        )}

        {/* Monthly Limit */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Monthly Limit
        </Text>
        <AmountInput
          value={amountText}
          onChangeText={setAmountText}
          label="Monthly Limit"
          style={styles.amountInput}
        />

        {/* Alert Threshold */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Alert Threshold
        </Text>
        <Text variant="bodySmall" style={styles.helperText}>
          You will be alerted when spending reaches this percentage of the limit.
        </Text>
        <TextInput
          mode="outlined"
          value={thresholdText}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, '');
            if (cleaned === '' || (parseInt(cleaned, 10) <= 100)) {
              setThresholdText(cleaned);
            }
          }}
          keyboardType="numeric"
          right={<TextInput.Affix text="%" />}
          style={styles.thresholdInput}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          contentStyle={styles.thresholdContent}
        />

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          buttonColor={colors.primary}
          textColor={colors.surface}
          labelStyle={styles.saveButtonLabel}
        >
          {isEditing ? 'Update Budget' : 'Save Budget'}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 20,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
  },
  monthText: {
    minWidth: 160,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 8,
    borderColor: colors.border,
  },
  categoryChipLabel: {
    fontSize: 12,
  },
  noCategoriesText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  typeIndicator: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  typeText: {
    color: colors.textSecondary,
  },
  amountInput: {
    marginBottom: 4,
  },
  helperText: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  thresholdInput: {
    backgroundColor: colors.surface,
  },
  thresholdContent: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 32,
    borderRadius: 12,
    paddingVertical: 6,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
