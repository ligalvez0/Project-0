import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Divider,
  HelperText,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SubscriptionStackParamList } from '../../app/navigation/SubscriptionStack';
import { useSubscriptionStore } from '../../store';
import { BillingCycle } from '../../models/Subscription';
import { ExpenseType } from '../../models';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { DEFAULTS } from '../../constants/defaults';
import { colors } from '../../constants/colors';
import { formatCents, parseToCents } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import { getMonthlyEquivalent } from '../../utils/projections';
import CategoryPicker from '../../components/common/CategoryPicker';

type NavProp = NativeStackNavigationProp<SubscriptionStackParamList, 'SubscriptionDetail'>;
type DetailRoute = RouteProp<SubscriptionStackParamList, 'SubscriptionDetail'>;

const categoryMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

const CYCLE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export default function SubscriptionDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<DetailRoute>();
  const { subscriptionId } = route.params;
  const {
    subscriptions,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
  } = useSubscriptionStore();

  const subscription = subscriptions.find((s) => s.id === subscriptionId);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(subscription?.name ?? '');
  const [editAmount, setEditAmount] = useState(
    subscription ? (subscription.amount / 100).toFixed(2) : '',
  );
  const [editBillingCycle, setEditBillingCycle] = useState<BillingCycle>(
    subscription?.billingCycle ?? 'monthly',
  );
  const [editType, setEditType] = useState<ExpenseType>(
    subscription?.type ?? 'personal',
  );
  const [editCategoryId, setEditCategoryId] = useState<string | null>(
    subscription?.categoryId ?? null,
  );
  const [editNextBillingDate, setEditNextBillingDate] = useState(
    subscription?.nextBillingDate?.slice(0, 10) ?? '',
  );
  const [editReminderDays, setEditReminderDays] = useState(
    String(subscription?.reminderDaysBefore ?? DEFAULTS.reminderDaysBefore),
  );
  const [editNotes, setEditNotes] = useState(subscription?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const filteredCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter((c) => c.type === editType),
    [editType],
  );

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header style={styles.appbar} elevated={false}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Not Found" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.notFound}>
          <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
            Subscription not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = categoryMap.get(subscription.categoryId);
  const monthlyCost = getMonthlyEquivalent(subscription.amount, subscription.billingCycle);
  const yearlyCost = monthlyCost * 12;

  const handleEditTypeChange = (newType: string) => {
    const expType = newType as ExpenseType;
    setEditType(expType);
    const current = DEFAULT_CATEGORIES.find((c) => c.id === editCategoryId);
    if (current && current.type !== expType) {
      setEditCategoryId(null);
    }
  };

  const startEditing = () => {
    setEditName(subscription.name);
    setEditAmount((subscription.amount / 100).toFixed(2));
    setEditBillingCycle(subscription.billingCycle);
    setEditType(subscription.type);
    setEditCategoryId(subscription.categoryId);
    setEditNextBillingDate(subscription.nextBillingDate.slice(0, 10));
    setEditReminderDays(String(subscription.reminderDaysBefore));
    setEditNotes(subscription.notes ?? '');
    setErrors({});
    setSubmitted(false);
    setIsEditing(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (editName.trim().length === 0) {
      newErrors.name = 'Name is required';
    }
    const cents = parseToCents(editAmount);
    if (cents <= 0) {
      newErrors.amount = 'Amount must be greater than $0.00';
    }
    if (!editNextBillingDate || isNaN(new Date(editNextBillingDate).getTime())) {
      newErrors.nextBillingDate = 'Valid next billing date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = () => {
    setSubmitted(true);
    if (!validate()) return;

    updateSubscription(subscriptionId, {
      name: editName.trim(),
      amount: parseToCents(editAmount),
      billingCycle: editBillingCycle,
      type: editType,
      categoryId: editCategoryId ?? filteredCategories[0]?.id ?? subscription.categoryId,
      nextBillingDate: new Date(editNextBillingDate).toISOString(),
      reminderDaysBefore:
        parseInt(editReminderDays, 10) || DEFAULTS.reminderDaysBefore,
      notes: editNotes.trim() || undefined,
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel "${subscription.name}"? This will mark it as inactive.`,
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            cancelSubscription(subscriptionId);
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to permanently delete "${subscription.name}"? This cannot be undone.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSubscription(subscriptionId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  // ---- EDIT MODE ----
  if (isEditing) {
    const editAmountCents = parseToCents(editAmount);
    const editMonthlyEquiv = getMonthlyEquivalent(editAmountCents, editBillingCycle);

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header style={styles.appbar} elevated={false}>
          <Appbar.Action
            icon="close"
            onPress={() => setIsEditing(false)}
          />
          <Appbar.Content title="Edit Subscription" titleStyle={styles.appbarTitle} />
          <View style={{ width: 48 }} />
        </Appbar.Header>

        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="labelLarge" style={styles.label}>
            Name
          </Text>
          <TextInput
            mode="outlined"
            value={editName}
            onChangeText={setEditName}
            style={styles.textInput}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />
          {submitted && errors.name ? (
            <HelperText type="error" visible>
              {errors.name}
            </HelperText>
          ) : null}

          <Text variant="labelLarge" style={styles.label}>
            Amount
          </Text>
          <TextInput
            mode="outlined"
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="decimal-pad"
            style={styles.textInput}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            left={<TextInput.Affix text="$" />}
          />
          {submitted && errors.amount ? (
            <HelperText type="error" visible>
              {errors.amount}
            </HelperText>
          ) : null}

          <Text variant="labelLarge" style={styles.label}>
            Billing Cycle
          </Text>
          <SegmentedButtons
            value={editBillingCycle}
            onValueChange={(val) => setEditBillingCycle(val as BillingCycle)}
            buttons={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
            style={styles.segmented}
          />
          {editAmountCents > 0 && editBillingCycle !== 'monthly' && (
            <HelperText type="info" visible>
              {formatCents(editMonthlyEquiv)}/month equivalent
            </HelperText>
          )}

          <Text variant="labelLarge" style={styles.label}>
            Type
          </Text>
          <SegmentedButtons
            value={editType}
            onValueChange={handleEditTypeChange}
            buttons={[
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' },
            ]}
            style={styles.segmented}
          />

          <Text variant="labelLarge" style={styles.label}>
            Category
          </Text>
          <CategoryPicker
            categories={filteredCategories}
            selectedId={editCategoryId}
            onSelect={setEditCategoryId}
          />

          <Text variant="labelLarge" style={styles.label}>
            Next Billing Date
          </Text>
          <TextInput
            mode="outlined"
            value={editNextBillingDate}
            onChangeText={setEditNextBillingDate}
            placeholder="YYYY-MM-DD"
            style={styles.textInput}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="calendar-clock" />}
          />
          {submitted && errors.nextBillingDate ? (
            <HelperText type="error" visible>
              {errors.nextBillingDate}
            </HelperText>
          ) : null}

          <Text variant="labelLarge" style={styles.label}>
            Reminder (days before billing)
          </Text>
          <TextInput
            mode="outlined"
            value={editReminderDays}
            onChangeText={setEditReminderDays}
            keyboardType="number-pad"
            style={styles.textInput}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="bell-outline" />}
          />

          <Text variant="labelLarge" style={styles.label}>
            Notes (optional)
          </Text>
          <TextInput
            mode="outlined"
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.notesInput]}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />

          <Button
            mode="contained"
            onPress={handleSaveEdit}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            buttonColor={colors.primary}
            textColor={colors.surface}
            labelStyle={styles.saveButtonLabel}
          >
            Save Changes
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- VIEW MODE ----
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar} elevated={false}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={subscription.name} titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="pencil" onPress={startEditing} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.detailContent}>
        {/* Status banner */}
        {!subscription.isActive && (
          <View style={styles.cancelledBanner}>
            <MaterialCommunityIcons
              name="cancel"
              size={18}
              color={colors.surface}
            />
            <Text variant="labelLarge" style={styles.cancelledBannerText}>
              Cancelled
            </Text>
          </View>
        )}

        {/* Next billing prominently */}
        {subscription.isActive && (
          <Surface style={styles.nextBillingCard} elevation={2}>
            <Text variant="labelMedium" style={styles.nextBillingLabel}>
              Next Billing Date
            </Text>
            <Text variant="headlineSmall" style={styles.nextBillingDate}>
              {formatDate(subscription.nextBillingDate)}
            </Text>
          </Surface>
        )}

        {/* Cost Breakdown */}
        <Surface style={styles.costCard} elevation={1}>
          <Text variant="titleMedium" style={styles.costCardTitle}>
            Cost Breakdown
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.costRow}>
            <Text variant="bodyMedium" style={styles.costLabel}>
              Per {CYCLE_LABELS[subscription.billingCycle]?.toLowerCase() ?? 'cycle'}
            </Text>
            <Text variant="titleSmall" style={styles.costValue}>
              {formatCents(subscription.amount)}
            </Text>
          </View>
          <View style={styles.costRow}>
            <Text variant="bodyMedium" style={styles.costLabel}>
              Per month
            </Text>
            <Text variant="titleSmall" style={styles.costValue}>
              {formatCents(monthlyCost)}
            </Text>
          </View>
          <View style={styles.costRow}>
            <Text variant="bodyMedium" style={styles.costLabel}>
              Per year
            </Text>
            <Text variant="titleSmall" style={styles.costValue}>
              {formatCents(yearlyCost)}
            </Text>
          </View>
        </Surface>

        {/* Details */}
        <Surface style={styles.detailCard} elevation={1}>
          <Text variant="titleMedium" style={styles.costCardTitle}>
            Details
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Billing Cycle
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {CYCLE_LABELS[subscription.billingCycle] ?? subscription.billingCycle}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Type
            </Text>
            <View style={styles.typeChip}>
              <View
                style={[
                  styles.typeDot,
                  {
                    backgroundColor:
                      subscription.type === 'personal'
                        ? colors.personal
                        : colors.business,
                  },
                ]}
              />
              <Text variant="bodyMedium" style={styles.detailValue}>
                {subscription.type === 'personal' ? 'Personal' : 'Business'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Category
            </Text>
            <View style={styles.categoryDisplay}>
              <MaterialCommunityIcons
                name={category?.icon ?? 'help-circle'}
                size={18}
                color={category?.color ?? colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text variant="bodyMedium" style={styles.detailValue}>
                {category?.name ?? 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Start Date
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {formatDate(subscription.startDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Reminder
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {subscription.reminderDaysBefore} day
              {subscription.reminderDaysBefore !== 1 ? 's' : ''} before
            </Text>
          </View>

          {subscription.notes ? (
            <View style={styles.notesSection}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Notes
              </Text>
              <Text variant="bodyMedium" style={styles.notesText}>
                {subscription.notes}
              </Text>
            </View>
          ) : null}
        </Surface>

        {/* Actions */}
        <View style={styles.actions}>
          {subscription.isActive && (
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
              contentStyle={styles.actionButtonContent}
              textColor={colors.warning}
              icon="cancel"
            >
              Cancel Subscription
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            contentStyle={styles.actionButtonContent}
            textColor={colors.error}
            icon="delete"
          >
            Delete Subscription
          </Button>
        </View>
      </ScrollView>
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
    textAlign: 'center',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    paddingBottom: 40,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  cancelledBannerText: {
    color: colors.surface,
    fontWeight: '700',
    marginLeft: 8,
  },
  nextBillingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  nextBillingLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextBillingDate: {
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  costCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.surface,
  },
  costCardTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  costLabel: {
    color: colors.textSecondary,
  },
  costValue: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.surface,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    color: colors.textSecondary,
  },
  detailValue: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  notesText: {
    color: colors.textPrimary,
    marginTop: 6,
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: colors.warning,
    marginBottom: 12,
  },
  deleteButton: {
    borderRadius: 12,
    borderColor: colors.error,
  },
  actionButtonContent: {
    paddingVertical: 4,
  },
  // Edit mode styles (reused from AddSubscription pattern)
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    marginTop: 20,
    marginBottom: 6,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.surface,
  },
  segmented: {
    borderRadius: 8,
  },
  notesInput: {
    minHeight: 80,
  },
  saveButton: {
    marginTop: 32,
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: 6,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
