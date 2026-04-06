import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SubscriptionListScreen from '../../screens/subscriptions/SubscriptionListScreen';
import AddSubscriptionScreen from '../../screens/subscriptions/AddSubscriptionScreen';
import SubscriptionDetailScreen from '../../screens/subscriptions/SubscriptionDetailScreen';

export type SubscriptionStackParamList = {
  SubscriptionList: undefined;
  AddSubscription: undefined;
  SubscriptionDetail: { subscriptionId: string };
};

const Stack = createNativeStackNavigator<SubscriptionStackParamList>();

export default function SubscriptionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SubscriptionList" component={SubscriptionListScreen} />
      <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
    </Stack.Navigator>
  );
}
