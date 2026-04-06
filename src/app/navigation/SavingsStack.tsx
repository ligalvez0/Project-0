import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SavingsOverviewScreen from '../../screens/savings/SavingsOverviewScreen';
import AddSavingsGoalScreen from '../../screens/savings/AddSavingsGoalScreen';
import SavingsGoalDetailScreen from '../../screens/savings/SavingsGoalDetailScreen';

export type SavingsStackParamList = {
  SavingsOverview: undefined;
  AddSavingsGoal: undefined;
  SavingsGoalDetail: { goalId: string };
};

const Stack = createNativeStackNavigator<SavingsStackParamList>();

export default function SavingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SavingsOverview" component={SavingsOverviewScreen} />
      <Stack.Screen name="AddSavingsGoal" component={AddSavingsGoalScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SavingsGoalDetail" component={SavingsGoalDetailScreen} />
    </Stack.Navigator>
  );
}
