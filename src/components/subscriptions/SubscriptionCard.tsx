import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Subscription } from '../../models';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import { getMonthlyEquivalent } from '../../utils/projections';

interface SubscriptionCardProps {
  subscription: Subscription;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onPress: () => void;
}

const CYCLE_LABELS: Record<string, string> = {
  weekly: 'wk',
  monthly: 'mo',
  quarterly: 'qtr',
  yearly: 'yr',
};

export default function SubscriptionCard({
  subscription,
  categoryName,
  categoryIcon,
  categoryColor,
  onPress,
}: SubscriptionCardProps) {
  const monthlyEquivalent = getMonthlyEquivalent(
    subscription.amount,
    subscription.billingCycle,
  );
  const cycleLabel = CYCLE_LABELS[subscription.billingCycle] ?? subscription.billingCycle;

  return (
    <TouchableRipple
      onPress={onPress}
      style={[
        styles.card,
        !subscription.isActive && styles.cardInactive,
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.left}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
            <MaterialCommunityIcons
              name={categoryIcon}
              size={20}
              color={colors.surface}
            />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.nameRow}>
              <Text
                variant="bodyLarge"
                style={styles.name}
                numberOfLines={1}
              >
                {subscription.name}
              </Text>
              {!subscription.isActive && (
                <Badge size={20} style={styles.cancelledBadge}>
                  Cancelled
                </Badge>
              )}
            </View>
            <Text variant="bodySmall" style={styles.category}>
              {categoryName}
            </Text>
            {subscription.isActive && (
              <Text variant="bodySmall" style={styles.nextBilling}>
                Next: {formatDate(subscription.nextBillingDate)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.right}>
          <Text variant="titleSmall" style={styles.amount}>
            {formatCents(subscription.amount)}/{cycleLabel}
          </Text>
          {subscription.billingCycle !== 'monthly' && (
            <Text variant="bodySmall" style={styles.monthly}>
              {formatCents(monthlyEquivalent)}/mo
            </Text>
          )}
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 12,
    elevation: 1,
  },
  cardInactive: {
    opacity: 0.55,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  cancelledBadge: {
    backgroundColor: colors.error,
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  category: {
    color: colors.textSecondary,
    marginTop: 1,
  },
  nextBilling: {
    color: colors.textSecondary,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthly: {
    color: colors.textSecondary,
    marginTop: 2,
  },
});
