import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Budget } from '../../models';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';
import ProgressBar from '../common/ProgressBar';

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onPress: () => void;
}

export default function BudgetCard({
  budget,
  spent,
  categoryName,
  categoryIcon,
  categoryColor,
  onPress,
}: BudgetCardProps) {
  const rawPercentage = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
  const displayPercentage = Math.round(rawPercentage * 100);

  return (
    <TouchableRipple onPress={onPress} style={styles.touchable} borderless>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.header}>
          <View style={styles.categoryInfo}>
            <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
              <MaterialCommunityIcons
                name={categoryIcon}
                size={20}
                color={colors.surface}
              />
            </View>
            <Text variant="titleMedium" style={styles.categoryName}>
              {categoryName}
            </Text>
          </View>
          <Text
            variant="labelMedium"
            style={[
              styles.percentage,
              rawPercentage >= 1
                ? { color: colors.error }
                : rawPercentage >= 0.8
                ? { color: colors.warning }
                : { color: colors.textSecondary },
            ]}
          >
            {displayPercentage}% used
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar progress={rawPercentage} style={styles.progressBar} />
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.spentText}>
            {formatCents(spent)} spent of {formatCents(budget.monthlyLimit)}
          </Text>
          {rawPercentage >= 1 ? (
            <Text variant="labelSmall" style={styles.overBudgetText}>
              Over by {formatCents(spent - budget.monthlyLimit)}
            </Text>
          ) : (
            <Text variant="labelSmall" style={styles.remainingText}>
              {formatCents(budget.monthlyLimit - spent)} left
            </Text>
          )}
        </View>
      </Surface>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  percentage: {
    fontWeight: '700',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {
    color: colors.textSecondary,
  },
  remainingText: {
    color: colors.success,
    fontWeight: '600',
  },
  overBudgetText: {
    color: colors.error,
    fontWeight: '600',
  },
});
