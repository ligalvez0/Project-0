import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BudgetOverviewScreen from '../../screens/budget/BudgetOverviewScreen';
import BudgetCategoryScreen from '../../screens/budget/BudgetCategoryScreen';
import SetBudgetScreen from '../../screens/budget/SetBudgetScreen';

export type BudgetStackParamList = {
  BudgetOverview: undefined;
  BudgetCategory: { categoryId: string; month: string };
  SetBudget: { budgetId?: string };
};

const Stack = createNativeStackNavigator<BudgetStackParamList>();

export default function BudgetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BudgetOverview" component={BudgetOverviewScreen} />
      <Stack.Screen name="BudgetCategory" component={BudgetCategoryScreen} />
      <Stack.Screen name="SetBudget" component={SetBudgetScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
