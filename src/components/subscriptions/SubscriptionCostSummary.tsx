import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { formatCents } from '../../utils/currency';

interface SubscriptionCostSummaryProps {
  totalMonthly: number;
  personalMonthly: number;
  businessMonthly: number;
}

export default function SubscriptionCostSummary({
  totalMonthly,
  personalMonthly,
  businessMonthly,
}: SubscriptionCostSummaryProps) {
  const personalRatio = totalMonthly > 0 ? personalMonthly / totalMonthly : 0;
  const businessRatio = totalMonthly > 0 ? businessMonthly / totalMonthly : 0;

  return (
    <Surface style={styles.container} elevation={2}>
      <Text variant="labelMedium" style={styles.label}>
        Total Monthly Cost
      </Text>
      <Text variant="headlineLarge" style={styles.totalAmount}>
        {formatCents(totalMonthly)}
      </Text>

      {/* Breakdown bar */}
      {totalMonthly > 0 && (
        <View style={styles.barContainer}>
          {personalRatio > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  flex: personalRatio,
                  backgroundColor: colors.personal,
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                  borderTopRightRadius: businessRatio === 0 ? 4 : 0,
                  borderBottomRightRadius: businessRatio === 0 ? 4 : 0,
                },
              ]}
            />
          )}
          {businessRatio > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  flex: businessRatio,
                  backgroundColor: colors.business,
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                  borderTopLeftRadius: personalRatio === 0 ? 4 : 0,
                  borderBottomLeftRadius: personalRatio === 0 ? 4 : 0,
                },
              ]}
            />
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.personal }]} />
          <Text variant="bodySmall" style={styles.legendLabel}>
            Personal
          </Text>
          <Text variant="bodySmall" style={styles.legendValue}>
            {formatCents(personalMonthly)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.business }]} />
          <Text variant="bodySmall" style={styles.legendLabel}>
            Business
          </Text>
          <Text variant="bodySmall" style={styles.legendValue}>
            {formatCents(businessMonthly)}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 16,
  },
  barContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    color: colors.textSecondary,
    marginRight: 6,
  },
  legendValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
