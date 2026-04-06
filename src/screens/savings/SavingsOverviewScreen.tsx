import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SavingsStackParamList } from '../../app/navigation/SavingsStack';
import { useSavingsStore } from '../../store';
import { SavingsGoal } from '../../models';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';
import EmptyState from '../../components/common/EmptyState';
import SavingsGoalCard from '../../components/savings/SavingsGoalCard';

type NavProp = NativeStackNavigationProp<SavingsStackParamList, 'SavingsOverview'>;

export default function SavingsOverviewScreen() {
  const navigation = useNavigation<NavProp>();
  const { goals } = useSavingsStore();

  const totalSaved = useMemo(
    () => goals.reduce((sum, g) => sum + g.currentAmount, 0),
    [goals],
  );

  const activeGoals = useMemo(
    () => goals.filter((g) => g.currentAmount < g.targetAmount),
    [goals],
  );

  const renderItem = useCallback(
    ({ item }: { item: SavingsGoal }) => (
      <SavingsGoalCard
        goal={item}
        onPress={() => navigation.navigate('SavingsGoalDetail', { goalId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Savings Goals
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text variant="titleLarge" style={styles.summaryValue}>
              {formatCents(totalSaved)}
            </Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Total Saved
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="titleLarge" style={styles.summaryValue}>
              {activeGoals.length}
            </Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Active Goals
            </Text>
          </View>
        </View>
      </View>

      {goals.length === 0 ? (
        <EmptyState
          icon="piggy-bank"
          title="Start saving!"
          subtitle="Set your first savings goal."
        />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.surface}
        onPress={() => navigation.navigate('AddSavingsGoal')}
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  summaryValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  summaryLabel: {
    color: colors.textSecondary,
    marginTop: 2,
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
