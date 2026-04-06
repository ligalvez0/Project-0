import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SavingsStackParamList } from '../../app/navigation/SavingsStack';
import { useSavingsStore } from '../../store';
import { SavingsContribution } from '../../models';
import { colors } from '../../constants/colors';
import { formatCents, parseToCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import { projectCompletionDate } from '../../utils/projections';
import ProgressBar from '../../components/common/ProgressBar';
import AmountInput from '../../components/common/AmountInput';

type NavProp = NativeStackNavigationProp<SavingsStackParamList, 'SavingsGoalDetail'>;
type RoutePropType = RouteProp<SavingsStackParamList, 'SavingsGoalDetail'>;

export default function SavingsGoalDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { goalId } = route.params;

  const { goals, addContribution, updateGoal, deleteGoal } = useSavingsStore();
  const goal = goals.find((g) => g.id === goalId);

  const [showContributionForm, setShowContributionForm] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editMonthly, setEditMonthly] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  const projectedDate = useMemo(() => {
    if (!goal) return null;
    return projectCompletionDate(goal);
  }, [goal]);

  const progress = goal && goal.targetAmount > 0
    ? goal.currentAmount / goal.targetAmount
    : 0;

  const percentage = Math.min(Math.round(progress * 100), 100);
  const remaining = goal ? goal.targetAmount - goal.currentAmount : 0;

  const sortedContributions = useMemo(() => {
    if (!goal) return [];
    return [...goal.contributions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [goal]);

  const handleAddContribution = useCallback(() => {
    const cents = parseToCents(contributionAmount);
    if (cents <= 0) return;

    addContribution(goalId, cents, contributionNote.trim() || undefined);
    setContributionAmount('');
    setContributionNote('');
    setShowContributionForm(false);
  }, [goalId, contributionAmount, contributionNote, addContribution]);

  const handleStartEdit = useCallback(() => {
    if (!goal) return;
    setEditName(goal.name);
    setEditTarget((goal.targetAmount / 100).toFixed(2));
    setEditMonthly((goal.monthlyContribution / 100).toFixed(2));
    setEditTargetDate(goal.targetDate ?? '');
    setIsEditing(true);
  }, [goal]);

  const handleSaveEdit = useCallback(() => {
    if (!goal) return;
    const name = editName.trim();
    if (name.length === 0) return;
    const targetCents = parseToCents(editTarget);
    if (targetCents <= 0) return;

    updateGoal(goalId, {
      name,
      targetAmount: targetCents,
      monthlyContribution: parseToCents(editMonthly),
      targetDate: editTargetDate.trim() || undefined,
    });
    setIsEditing(false);
  }, [goalId, editName, editTarget, editMonthly, editTargetDate, updateGoal, goal]);

  const handleDelete = useCallback(() => {
    deleteGoal(goalId);
    setShowDeleteDialog(false);
    navigation.goBack();
  }, [goalId, deleteGoal, navigation]);

  if (!goal) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header style={styles.appbar} elevated={false}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Goal Not Found" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.centeredMessage}>
          <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
            This savings goal could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderContribution = ({ item }: { item: SavingsContribution }) => (
    <View style={styles.contributionRow}>
      <View style={styles.contributionLeft}>
        <Text variant="bodyMedium" style={styles.contributionDate}>
          {formatDate(item.date)}
        </Text>
        {item.note ? (
          <Text variant="bodySmall" style={styles.contributionNote} numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
      </View>
      <Text variant="titleSmall" style={styles.contributionAmount}>
        +{formatCents(item.amount)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated={false}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={goal.name} titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Display */}
        <Card style={styles.progressCard} mode="elevated">
          <Card.Content style={styles.progressContent}>
            <Text variant="displaySmall" style={styles.progressPercentage}>
              {percentage}%
            </Text>
            <ProgressBar
              progress={progress}
              color={colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodyLarge" style={styles.progressAmounts}>
              {formatCents(goal.currentAmount)} of {formatCents(goal.targetAmount)}
            </Text>
          </Card.Content>
        </Card>

        {/* Key Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Current</Text>
            <Text variant="titleSmall" style={styles.statValue}>
              {formatCents(goal.currentAmount)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Target</Text>
            <Text variant="titleSmall" style={styles.statValue}>
              {formatCents(goal.targetAmount)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Remaining</Text>
            <Text variant="titleSmall" style={styles.statValue}>
              {formatCents(Math.max(remaining, 0))}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Monthly</Text>
            <Text variant="titleSmall" style={styles.statValue}>
              {formatCents(goal.monthlyContribution)}
            </Text>
          </View>
        </View>

        {projectedDate ? (
          <View style={styles.projectionRow}>
            <Text variant="bodyMedium" style={styles.projectionLabel}>
              Projected Completion
            </Text>
            <Text variant="titleSmall" style={styles.projectionValue}>
              {formatDate(projectedDate.toISOString())}
            </Text>
          </View>
        ) : goal.currentAmount >= goal.targetAmount ? (
          <View style={styles.projectionRow}>
            <Text variant="titleSmall" style={[styles.projectionValue, { color: colors.success }]}>
              Goal reached!
            </Text>
          </View>
        ) : null}

        {/* Add Contribution */}
        {!showContributionForm ? (
          <Button
            mode="contained"
            icon="plus"
            onPress={() => setShowContributionForm(true)}
            style={styles.addContributionButton}
            contentStyle={styles.addContributionContent}
            buttonColor={colors.primary}
            textColor={colors.surface}
          >
            Add Contribution
          </Button>
        ) : (
          <Card style={styles.contributionFormCard} mode="outlined">
            <Card.Content>
              <Text variant="titleSmall" style={styles.contributionFormTitle}>
                Add Contribution
              </Text>
              <AmountInput
                value={contributionAmount}
                onChangeText={setContributionAmount}
                label="Amount"
              />
              <TextInput
                mode="outlined"
                label="Note (optional)"
                value={contributionNote}
                onChangeText={setContributionNote}
                style={styles.contributionNoteInput}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              <View style={styles.contributionFormActions}>
                <Button
                  mode="text"
                  onPress={() => {
                    setShowContributionForm(false);
                    setContributionAmount('');
                    setContributionNote('');
                  }}
                  textColor={colors.textSecondary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddContribution}
                  buttonColor={colors.primary}
                  textColor={colors.surface}
                >
                  Save
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Edit Form */}
        {isEditing ? (
          <Card style={styles.editFormCard} mode="outlined">
            <Card.Content>
              <Text variant="titleSmall" style={styles.contributionFormTitle}>
                Edit Goal
              </Text>
              <TextInput
                mode="outlined"
                label="Goal Name"
                value={editName}
                onChangeText={setEditName}
                style={styles.editInput}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              <AmountInput
                value={editTarget}
                onChangeText={setEditTarget}
                label="Target Amount"
                style={styles.editAmountInput}
              />
              <AmountInput
                value={editMonthly}
                onChangeText={setEditMonthly}
                label="Monthly Contribution"
                style={styles.editAmountInput}
              />
              <TextInput
                mode="outlined"
                label="Target Date (YYYY-MM-DD)"
                value={editTargetDate}
                onChangeText={setEditTargetDate}
                style={styles.editInput}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                left={<TextInput.Icon icon="calendar" />}
              />
              <View style={styles.contributionFormActions}>
                <Button
                  mode="text"
                  onPress={() => setIsEditing(false)}
                  textColor={colors.textSecondary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveEdit}
                  buttonColor={colors.primary}
                  textColor={colors.surface}
                >
                  Save Changes
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {/* Contribution History */}
        {sortedContributions.length > 0 ? (
          <View style={styles.historySection}>
            <Text variant="titleMedium" style={styles.historyTitle}>
              Contribution History
            </Text>
            {sortedContributions.map((contribution) => (
              <React.Fragment key={contribution.id}>
                {renderContribution({ item: contribution })}
                <Divider style={styles.divider} />
              </React.Fragment>
            ))}
          </View>
        ) : null}

        {/* Action Buttons */}
        {!isEditing ? (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={handleStartEdit}
              style={styles.editButton}
              textColor={colors.primary}
            >
              Edit Goal
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              onPress={() => setShowDeleteDialog(true)}
              style={styles.deleteButton}
              textColor={colors.error}
            >
              Delete Goal
            </Button>
          </View>
        ) : null}
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Goal</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete "{goal.name}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} textColor={colors.textSecondary}>
              Cancel
            </Button>
            <Button onPress={handleDelete} textColor={colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appbar: {
    backgroundColor: colors.background,
  },
  appbarTitle: {
    fontWeight: '700',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  progressCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  progressContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  progressPercentage: {
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  progressAmounts: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  statLabel: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  projectionLabel: {
    color: colors.textSecondary,
  },
  projectionValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  addContributionButton: {
    borderRadius: 12,
    marginBottom: 16,
  },
  addContributionContent: {
    paddingVertical: 4,
  },
  contributionFormCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderColor: colors.primary,
  },
  contributionFormTitle: {
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  contributionNoteInput: {
    backgroundColor: colors.surface,
    marginTop: 12,
  },
  contributionFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  editFormCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderColor: colors.secondary,
  },
  editInput: {
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  editAmountInput: {
    marginBottom: 12,
  },
  historySection: {
    marginTop: 8,
    marginBottom: 16,
  },
  historyTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contributionLeft: {
    flex: 1,
    marginRight: 12,
  },
  contributionDate: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  contributionNote: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  contributionAmount: {
    fontWeight: '700',
    color: colors.success,
  },
  divider: {
    backgroundColor: colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: colors.primary,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: colors.error,
  },
});
