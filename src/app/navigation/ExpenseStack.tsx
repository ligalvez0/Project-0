import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExpenseListScreen from '../../screens/expenses/ExpenseListScreen';
import AddExpenseScreen from '../../screens/expenses/AddExpenseScreen';
import ExpenseDetailScreen from '../../screens/expenses/ExpenseDetailScreen';

export type ExpenseStackParamList = {
  ExpenseList: undefined;
  AddExpense: undefined;
  ExpenseDetail: { expenseId: string };
};

const Stack = createNativeStackNavigator<ExpenseStackParamList>();

export default function ExpenseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
    </Stack.Navigator>
  );
}
