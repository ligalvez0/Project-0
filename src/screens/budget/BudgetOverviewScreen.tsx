import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FAB,
  IconButton,
  SegmentedButtons,
  Surface,
  Text,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, parse, addMonths, subMonths } from 'date-fns';

import { BudgetStackParamList } from '../../app/navigation/BudgetStack';
import { useBudgetStore, useExpenseStore } from '../../store';
import { Budget } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';
import { getCurrentMonth, formatMonthYear } from '../../utils/dateHelpers';
import { getSpentInCategory, getBudgetStatus } from '../../utils/budgetCalculations';
import BudgetCard from '../../components/budget/BudgetCard';
import EmptyState from '../../components/common/EmptyState';

type NavProp = NativeStackNavigationProp<BudgetStackParamList, 'BudgetOverview'>;
type FilterValue = 'all' | 'personal' | 'business';

const categoryMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export default function BudgetOverviewScreen() {
  const navigation = useNavigation<NavProp>();
  const { getBudgetsByMonth } = useBudgetStore();
  const { expenses } = useExpenseStore();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());

  const navigatePrevMonth = useCallback(() => {
    const date = parse(currentMonth, 'yyyy-MM', new Date());
    setCurrentMonth(format(subMonths(date, 1), 'yyyy-MM'));
  }, [currentMonth]);

  const navigateNextMonth = useCallback(() => {
    const date = parse(currentMonth, 'yyyy-MM', new Date());
    setCurrentMonth(format(addMonths(date, 1), 'yyyy-MM'));
  }, [currentMonth]);

  const budgets = useMemo(() => {
    let list = getBudgetsByMonth(currentMonth);
    if (filter !== 'all') {
      list = list.filter((b) => b.type === filter);
    }
    return list;
  }, [currentMonth, filter, getBudgetsByMonth]);

  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const spent = getSpentInCategory(expenses, budget.categoryId, currentMonth);
      const category = categoryMap.get(budget.categoryId);
      const status = getBudgetStatus(budget, spent);
      return { budget, spent, category, status };
    });
  }, [budgets, expenses, currentMonth]);

  const overThresholdCount = useMemo(() => {
    return budgetData.filter((d) => d.status.isOverThreshold).length;
  }, [budgetData]);

  const totals = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
    const totalSpent = budgetData.reduce((sum, d) => sum + d.spent, 0);
    return { totalBudgeted, totalSpent };
  }, [budgets, budgetData]);

  const renderBudgetCard = useCallback(
    ({ item }: { item: (typeof budgetData)[number] }) => {
      const { budget, spent, category } = item;
      return (
        <BudgetCard
          budget={budget}
          spent={spent}
          categoryName={category?.name ?? 'Unknown'}
          categoryIcon={category?.icon ?? 'help-circle'}
          categoryColor={category?.color ?? colors.textSecondary}
          onPress={() =>
            navigation.navigate('BudgetCategory', {
              categoryId: budget.categoryId,
              month: currentMonth,
            })
          }
        />
      );
    },
    [navigation, currentMonth],
  );

  const totalSpentPercentage = totals.totalBudgeted > 0
    ? Math.round((totals.totalSpent / totals.totalBudgeted) * 100)
    : 0;

  const ListHeader = useMemo(() => {
    return (
      <View>
        {/* Alert Banner */}
        {overThresholdCount > 0 && (
          <Surface style={styles.alertBanner} elevation={0}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color={colors.warning}
            />
            <Text variant="bodyMedium" style={styles.alertText}>
              {overThresholdCount} {overThresholdCount === 1 ? 'category is' : 'categories are'} over budget threshold
            </Text>
          </Surface>
        )}

        {/* Total Summary Card */}
        {budgets.length > 0 && (
          <Surface style={styles.summaryCard} elevation={1}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={styles.summaryLabel}>
                  Total Budgeted
                </Text>
                <Text variant="titleLarge" style={styles.summaryAmount}>
                  {formatCents(totals.totalBudgeted)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={styles.summaryLabel}>
                  Total Spent
                </Text>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.summaryAmount,
                    totals.totalSpent > totals.totalBudgeted
                      ? { color: colors.error }
                      : undefined,
                  ]}
                >
                  {formatCents(totals.totalSpent)}
                </Text>
              </View>
            </View>
            <Text variant="bodySmall" style={styles.summaryPercentage}>
              {totalSpentPercentage}% of total budget used
            </Text>
          </Surface>
        )}
      </View>
    );
  }, [overThresholdCount, budgets.length, totals, totalSpentPercentage]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Budget
        </Text>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={navigatePrevMonth}
        />
        <Text variant="titleMedium" style={styles.monthText}>
          {formatMonthYear(currentMonth)}
        </Text>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={navigateNextMonth}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={(val) => setFilter(val as FilterValue)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'personal', label: 'Personal' },
            { value: 'business', label: 'Business' },
          ]}
          style={styles.segmented}
        />
      </View>

      {/* Budget List */}
      {budgetData.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="No budgets set"
          subtitle="Set monthly budgets for your spending categories to track where your money goes."
        />
      ) : (
        <FlatList
          data={budgetData}
          keyExtractor={(item) => item.budget.id}
          renderItem={renderBudgetCard}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.surface}
        onPress={() => navigation.navigate('SetBudget', {})}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  monthText: {
    minWidth: 160,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  segmented: {
    borderRadius: 8,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
  },
  alertText: {
    marginLeft: 10,
    color: colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryPercentage: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 96,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
});
