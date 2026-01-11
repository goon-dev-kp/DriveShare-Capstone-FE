import React from 'react';
import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
<Stack.Screen name="my-wallet" />
<Stack.Screen name="setup" />
<Stack.Screen name="topup" />
<Stack.Screen name="pay-trip" />
</Stack>
  );
}
