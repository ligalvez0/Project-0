import React, { useCallback } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Divider, List, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useExpenseStore } from '../../store';
import { useBudgetStore } from '../../store';
import { useSubscriptionStore } from '../../store';
import { useSavingsStore } from '../../store';
import { colors } from '../../constants/colors';

export default function SettingsScreen() {
  const { expenses } = useExpenseStore();
  const { budgets } = useBudgetStore();
  const { subscriptions } = useSubscriptionStore();
  const { goals } = useSavingsStore();

  const handleExportData = useCallback(async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        expenses,
        budgets,
        subscriptions,
        savingsGoals: goals,
      };

      const jsonString = JSON.stringify(data, null, 2);

      await Share.share({
        message: jsonString,
        title: 'FinTrack Data Export',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export data. Please try again.');
    }
  }, [expenses, budgets, subscriptions, goals]);

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all your data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Data Reset', 'All data has been cleared. Please restart the app.');
            } catch (error) {
              Alert.alert('Reset Failed', 'Unable to reset data. Please try again.');
            }
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <List.Section>
          <List.Subheader style={styles.sectionHeader}>Data Management</List.Subheader>
          <List.Item
            title="Export Data"
            description="Export all data as JSON"
            left={(props) => <List.Icon {...props} icon="export" color={colors.primary} />}
            onPress={handleExportData}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Reset All Data"
            description="Delete all expenses, budgets, subscriptions, and savings"
            left={(props) => <List.Icon {...props} icon="delete-forever" color={colors.error} />}
            onPress={handleResetData}
            style={styles.listItem}
            titleStyle={[styles.listItemTitle, { color: colors.error }]}
            descriptionStyle={styles.listItemDescription}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={styles.sectionHeader}>About</List.Subheader>
          <List.Item
            title="App Name"
            description="FinTrack"
            left={(props) => <List.Icon {...props} icon="information" color={colors.primary} />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="tag" color={colors.primary} />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        </List.Section>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    backgroundColor: colors.surface,
    paddingVertical: 4,
  },
  listItemTitle: {
    fontWeight: '500',
    color: colors.textPrimary,
  },
  listItemDescription: {
    color: colors.textSecondary,
  },
  divider: {
    backgroundColor: colors.border,
  },
});
