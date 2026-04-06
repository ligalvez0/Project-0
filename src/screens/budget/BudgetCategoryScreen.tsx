import React, { useMemo, useCallback } from 'react';
import { FlatList, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Divider,
  IconButton,
  Surface,
  Text,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BudgetStackParamList } from '../../app/navigation/BudgetStack';
import { useBudgetStore, useExpenseStore } from '../../store';
import { Expense } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';
import { formatDate, formatMonthYear } from '../../utils/dateHelpers';
import { getSpentInCategory, getBudgetStatus } from '../../utils/budgetCalculations';
import ProgressBar from '../../components/common/ProgressBar';

type NavProp = NativeStackNavigationProp<BudgetStackParamList, 'BudgetCategory'>;
type ScreenRouteProp = RouteProp<BudgetStackParamList, 'BudgetCategory'>;

const categoryMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export default function BudgetCategoryScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRouteProp>();
  const { categoryId, month } = route.params;

  const { getBudgetForCategory, deleteBudget } = useBudgetStore();
  const { expenses } = useExpenseStore();

  const category = categoryMap.get(categoryId);
  const budget = getBudgetForCategory(categoryId, month);

  const spent = useMemo(
    () => getSpentInCategory(expenses, categoryId, month),
    [expenses, categoryId, month],
  );

  const status = useMemo(
    () => (budget ? getBudgetStatus(budget, spent) : null),
    [budget, spent],
  );

  const categoryExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.categoryId === categoryId && e.date.startsWith(month))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, categoryId, month]);

  const stats = useMemo(() => {
    if (!budget) return null;

    const remaining = Math.max(budget.monthlyLimit - spent, 0);

    // Calculate daily average based on days elapsed in month
    const now = new Date();
    const monthDate = new Date(month + '-01');
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const totalDays = monthEnd.getDate();

    // If the month is in the past, use total days. If current, use days elapsed.
    const isCurrentOrPast = now >= monthStart;
    const daysElapsed = isCurrentOrPast
      ? Math.min(
          Math.max(
            Math.ceil(
              (Math.min(now.getTime(), monthEnd.getTime()) - monthStart.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
            1,
          ),
          totalDays,
        )
      : 1;

    const dailyAverage = spent > 0 ? Math.round(spent / daysElapsed) : 0;

    // Projected: daily average * total days in month
    const projected = dailyAverage * totalDays;

    return { remaining, dailyAverage, projected, totalDays, daysElapsed };
  }, [budget, spent, month]);

  const rawPercentage = budget && budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
  const displayPercentage = Math.round(rawPercentage * 100);

  const handleDelete = useCallback(() => {
    if (!budget) return;
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget for ${category?.name ?? 'this category'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBudget(budget.id);
            navigation.goBack();
          },
        },
      ],
    );
  }, [budget, category, deleteBudget, navigation]);

  const renderExpenseItem = useCallback(
    ({ item }: { item: Expense }) => (
      <View style={styles.expenseRow}>
        <View style={styles.expenseLeft}>
          <Text variant="bodySmall" style={styles.expenseDate}>
            {formatDate(item.date)}
          </Text>
          <Text variant="bodyMedium" style={styles.expenseDescription} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <Text variant="titleSmall" style={styles.expenseAmount}>
          {formatCents(item.amount)}
        </Text>
      </View>
    ),
    [],
  );

  if (!budget) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.topBarTitle}>
            {category?.name ?? 'Budget'}
          </Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No budget set for this category in {formatMonthYear(month)}.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <View style={styles.topBarCenter}>
          <View style={styles.headerCategoryInfo}>
            <MaterialCommunityIcons
              name={category?.icon ?? 'help-circle'}
              size={22}
              color={category?.color ?? colors.textSecondary}
            />
            <Text variant="titleLarge" style={styles.topBarTitle}>
              {category?.name ?? 'Unknown'}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.headerMonth}>
            {formatMonthYear(month)}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={categoryExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Budget Progress Card */}
            <Surface style={styles.progressCard} elevation={1}>
              <View style={styles.amountDisplay}>
                <Text variant="headlineLarge" style={styles.spentAmount}>
                  {formatCents(spent)}
                </Text>
                <Text variant="bodyLarge" style={styles.limitAmount}>
                  of {formatCents(budget.monthlyLimit)}
                </Text>
              </View>

              <ProgressBar
                progress={rawPercentage}
                style={styles.progressBar}
              />

              <Text
                variant="titleMedium"
                style={[
                  styles.percentageText,
                  rawPercentage >= 1
                    ? { color: colors.error }
                    : rawPercentage >= 0.8
                    ? { color: colors.warning }
                    : { color: colors.success },
                ]}
              >
                {displayPercentage}% used
              </Text>
            </Surface>

            {/* Stats Card */}
            {stats && (
              <Surface style={styles.statsCard} elevation={1}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text variant="labelSmall" style={styles.statLabel}>
                      Remaining
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.statValue,
                        stats.remaining === 0 ? { color: colors.error } : undefined,
                      ]}
                    >
                      {formatCents(stats.remaining)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text variant="labelSmall" style={styles.statLabel}>
                      Daily Avg
                    </Text>
                    <Text variant="titleMedium" style={styles.statValue}>
                      {formatCents(stats.dailyAverage)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text variant="labelSmall" style={styles.statLabel}>
                      Projected
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.statValue,
                        stats.projected > budget.monthlyLimit
                          ? { color: colors.error }
                          : undefined,
                      ]}
                    >
                      {formatCents(stats.projected)}
                    </Text>
                  </View>
                </View>
              </Surface>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => navigation.navigate('SetBudget', { budgetId: budget.id })}
                style={styles.editButton}
                buttonColor={colors.primary}
                textColor={colors.surface}
              >
                Edit Budget
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDelete}
                style={styles.deleteButton}
                textColor={colors.error}
              >
                Delete
              </Button>
            </View>

            {/* Expenses Header */}
            {categoryExpenses.length > 0 && (
              <View style={styles.expensesHeader}>
                <Text variant="titleMedium" style={styles.expensesTitle}>
                  Transactions
                </Text>
                <Text variant="bodySmall" style={styles.expensesCount}>
                  {categoryExpenses.length} {categoryExpenses.length === 1 ? 'expense' : 'expenses'}
                </Text>
              </View>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.noExpenses}>
            <Text variant="bodyMedium" style={styles.noExpensesText}>
              No expenses in this category for {formatMonthYear(month)}.
            </Text>
          </View>
        }
      />
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
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerMonth: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 32,
  },
  progressCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  amountDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  spentAmount: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  limitAmount: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 12,
    borderRadius: 6,
  },
  percentageText: {
    fontWeight: '700',
    marginTop: 12,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statLabel: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
  },
  deleteButton: {
    borderRadius: 8,
    borderColor: colors.error,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  expensesTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expensesCount: {
    color: colors.textSecondary,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
  },
  expenseLeft: {
    flex: 1,
    marginRight: 12,
  },
  expenseDate: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  expenseDescription: {
    fontWeight: '500',
    color: colors.textPrimary,
  },
  expenseAmount: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    marginHorizontal: 16,
  },
  noExpenses: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noExpensesText: {
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
