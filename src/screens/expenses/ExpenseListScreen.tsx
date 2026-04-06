import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FAB,
  SegmentedButtons,
  Text,
  TouchableRipple,
  Surface,
  Badge,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ExpenseStackParamList } from '../../app/navigation/ExpenseStack';
import { useExpenseStore } from '../../store';
import { Expense, ExpenseType } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';
import { getCurrentMonth, formatDate, formatMonthYear } from '../../utils/dateHelpers';
import EmptyState from '../../components/common/EmptyState';
import { format, parse, addMonths, subMonths } from 'date-fns';

type NavProp = NativeStackNavigationProp<ExpenseStackParamList, 'ExpenseList'>;
type FilterValue = 'all' | 'personal' | 'business';

const categoryMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export default function ExpenseListScreen() {
  const navigation = useNavigation<NavProp>();
  const { getExpensesByMonth, getTotalByMonth } = useExpenseStore();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());

  const monthTotal = useMemo(
    () => getTotalByMonth(currentMonth),
    [currentMonth, getTotalByMonth],
  );

  const expenses = useMemo(() => {
    let list = getExpensesByMonth(currentMonth);
    if (filter !== 'all') {
      list = list.filter((e) => e.type === filter);
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [currentMonth, filter, getExpensesByMonth]);

  // Group expenses by date
  const sections = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const exp of expenses) {
      const dateKey = exp.date.slice(0, 10); // YYYY-MM-DD
      const existing = groups.get(dateKey);
      if (existing) {
        existing.push(exp);
      } else {
        groups.set(dateKey, [exp]);
      }
    }
    return Array.from(groups.entries()).map(([dateKey, data]) => ({
      title: formatDate(dateKey),
      data,
    }));
  }, [expenses]);

  const navigatePrevMonth = useCallback(() => {
    const date = parse(currentMonth, 'yyyy-MM', new Date());
    setCurrentMonth(format(subMonths(date, 1), 'yyyy-MM'));
  }, [currentMonth]);

  const navigateNextMonth = useCallback(() => {
    const date = parse(currentMonth, 'yyyy-MM', new Date());
    setCurrentMonth(format(addMonths(date, 1), 'yyyy-MM'));
  }, [currentMonth]);

  const renderExpenseItem = useCallback(
    ({ item }: { item: Expense }) => {
      const category = categoryMap.get(item.categoryId);
      return (
        <TouchableRipple
          onPress={() =>
            navigation.navigate('ExpenseDetail', { expenseId: item.id })
          }
          style={styles.expenseRow}
        >
          <View style={styles.expenseRowInner}>
            <View style={styles.expenseLeft}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: category?.color ?? colors.textSecondary },
                ]}
              >
                <MaterialCommunityIcons
                  name={category?.icon ?? 'help-circle'}
                  size={18}
                  color={colors.surface}
                />
              </View>
              <View style={styles.expenseText}>
                <Text variant="bodyLarge" style={styles.expenseDescription}>
                  {item.description}
                </Text>
                <Text variant="bodySmall" style={styles.expenseCategory}>
                  {category?.name ?? 'Unknown'}
                </Text>
              </View>
            </View>
            <View style={styles.expenseRight}>
              <Text variant="titleSmall" style={styles.expenseAmount}>
                {formatCents(item.amount)}
              </Text>
              <Badge
                size={20}
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      item.type === 'personal'
                        ? colors.personal
                        : colors.business,
                  },
                ]}
              >
                {item.type === 'personal' ? 'P' : 'B'}
              </Badge>
            </View>
          </View>
        </TouchableRipple>
      );
    },
    [navigation],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text variant="labelMedium" style={styles.sectionHeaderText}>
          {section.title}
        </Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Expenses
        </Text>
        <Text variant="titleMedium" style={styles.headerTotal}>
          {formatCents(monthTotal)} this month
        </Text>
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

      {/* Expense List */}
      {sections.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="No expenses yet"
          subtitle="Tap the + button to add your first expense"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.surface}
        onPress={() => navigation.navigate('AddExpense')}
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerTotal: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  segmented: {
    borderRadius: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  monthText: {
    minWidth: 140,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 96,
  },
  expenseRow: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 12,
    elevation: 1,
  },
  expenseRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseText: {
    flex: 1,
  },
  expenseDescription: {
    fontWeight: '500',
    color: colors.textPrimary,
  },
  expenseCategory: {
    color: colors.textSecondary,
    marginTop: 1,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  typeBadge: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
});
