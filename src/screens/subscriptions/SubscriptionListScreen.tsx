import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FAB,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SubscriptionStackParamList } from '../../app/navigation/SubscriptionStack';
import { useSubscriptionStore } from '../../store';
import { Subscription } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { getMonthlyEquivalent } from '../../utils/projections';
import EmptyState from '../../components/common/EmptyState';
import SubscriptionCard from '../../components/subscriptions/SubscriptionCard';
import SubscriptionCostSummary from '../../components/subscriptions/SubscriptionCostSummary';

type NavProp = NativeStackNavigationProp<SubscriptionStackParamList, 'SubscriptionList'>;
type FilterValue = 'all' | 'personal' | 'business';

const categoryMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export default function SubscriptionListScreen() {
  const navigation = useNavigation<NavProp>();
  const { subscriptions } = useSubscriptionStore();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [cancelledExpanded, setCancelledExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return subscriptions;
    return subscriptions.filter((s) => s.type === filter);
  }, [subscriptions, filter]);

  const activeSubscriptions = useMemo(
    () => filtered.filter((s) => s.isActive),
    [filtered],
  );

  const cancelledSubscriptions = useMemo(
    () => filtered.filter((s) => !s.isActive),
    [filtered],
  );

  // Summary calculations across ALL active subscriptions (not just filtered)
  const totalMonthly = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + getMonthlyEquivalent(s.amount, s.billingCycle), 0);
  }, [subscriptions]);

  const personalMonthly = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive && s.type === 'personal')
      .reduce((sum, s) => sum + getMonthlyEquivalent(s.amount, s.billingCycle), 0);
  }, [subscriptions]);

  const businessMonthly = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive && s.type === 'business')
      .reduce((sum, s) => sum + getMonthlyEquivalent(s.amount, s.billingCycle), 0);
  }, [subscriptions]);

  const handlePress = useCallback(
    (subscriptionId: string) => {
      navigation.navigate('SubscriptionDetail', { subscriptionId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Subscription }) => {
      const category = categoryMap.get(item.categoryId);
      return (
        <SubscriptionCard
          subscription={item}
          categoryName={category?.name ?? 'Unknown'}
          categoryIcon={category?.icon ?? 'help-circle'}
          categoryColor={category?.color ?? colors.textSecondary}
          onPress={() => handlePress(item.id)}
        />
      );
    },
    [handlePress],
  );

  const hasAny = subscriptions.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Subscriptions
        </Text>
      </View>

      {hasAny ? (
        <FlatList
          data={activeSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Summary Card */}
              <SubscriptionCostSummary
                totalMonthly={totalMonthly}
                personalMonthly={personalMonthly}
                businessMonthly={businessMonthly}
              />

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

              {/* Active Section Header */}
              {activeSubscriptions.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text variant="labelMedium" style={styles.sectionHeaderText}>
                    Active ({activeSubscriptions.length})
                  </Text>
                </View>
              )}

              {activeSubscriptions.length === 0 && (
                <View style={styles.emptySection}>
                  <Text variant="bodyMedium" style={styles.emptySectionText}>
                    No active subscriptions
                    {filter !== 'all' ? ` for ${filter}` : ''}
                  </Text>
                </View>
              )}
            </>
          }
          ListFooterComponent={
            cancelledSubscriptions.length > 0 ? (
              <View>
                {/* Cancelled Accordion Header */}
                <Pressable
                  onPress={() => setCancelledExpanded((prev) => !prev)}
                  style={styles.accordionHeader}
                >
                  <Text variant="labelMedium" style={styles.sectionHeaderText}>
                    Cancelled ({cancelledSubscriptions.length})
                  </Text>
                  <MaterialCommunityIcons
                    name={cancelledExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {cancelledExpanded &&
                  cancelledSubscriptions.map((sub) => {
                    const category = categoryMap.get(sub.categoryId);
                    return (
                      <SubscriptionCard
                        key={sub.id}
                        subscription={sub}
                        categoryName={category?.name ?? 'Unknown'}
                        categoryIcon={category?.icon ?? 'help-circle'}
                        categoryColor={category?.color ?? colors.textSecondary}
                        onPress={() => handlePress(sub.id)}
                      />
                    );
                  })}
              </View>
            ) : null
          }
        />
      ) : (
        <EmptyState
          icon="credit-card-clock-outline"
          title="No subscriptions yet"
          subtitle="Tap the + button to track your first subscription"
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.surface}
        onPress={() => navigation.navigate('AddSubscription')}
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
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  segmented: {
    borderRadius: 8,
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
  emptySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptySectionText: {
    color: colors.textSecondary,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
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
