import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, TouchableRipple } from 'react-native-paper';
import { SavingsGoal } from '../../models';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import { projectCompletionDate } from '../../utils/projections';
import ProgressBar from '../common/ProgressBar';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onPress: () => void;
}

export default function SavingsGoalCard({ goal, onPress }: SavingsGoalCardProps) {
  const progress = goal.targetAmount > 0
    ? goal.currentAmount / goal.targetAmount
    : 0;

  const projectedDate = useMemo(() => projectCompletionDate(goal), [goal]);

  const isOnTrack = useMemo(() => {
    if (!goal.targetDate) return true;
    if (goal.currentAmount >= goal.targetAmount) return true;
    if (!projectedDate) return false;
    return projectedDate.getTime() <= new Date(goal.targetDate).getTime();
  }, [goal, projectedDate]);

  const statusColor = isOnTrack ? colors.success : colors.warning;
  const percentage = Math.min(Math.round(progress * 100), 100);

  return (
    <Card style={styles.card} mode="elevated">
      <TouchableRipple onPress={onPress} borderless style={styles.ripple}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text variant="labelMedium" style={[styles.percentage, { color: statusColor }]}>
              {percentage}%
            </Text>
          </View>

          <ProgressBar progress={progress} color={statusColor} style={styles.progressBar} />

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.amounts}>
              {formatCents(goal.currentAmount)} of {formatCents(goal.targetAmount)} saved
            </Text>
            {projectedDate ? (
              <Text variant="bodySmall" style={styles.projected}>
                Est. {formatDate(projectedDate.toISOString())}
              </Text>
            ) : goal.currentAmount >= goal.targetAmount ? (
              <Text variant="bodySmall" style={[styles.projected, { color: colors.success }]}>
                Goal reached!
              </Text>
            ) : (
              <Text variant="bodySmall" style={[styles.projected, { color: colors.warning }]}>
                Set a contribution
              </Text>
            )}
          </View>
        </View>
      </TouchableRipple>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  ripple: {
    borderRadius: 12,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  percentage: {
    fontWeight: '700',
  },
  progressBar: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amounts: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  projected: {
    color: colors.textSecondary,
  },
});
