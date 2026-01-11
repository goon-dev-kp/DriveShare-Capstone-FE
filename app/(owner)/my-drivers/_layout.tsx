import { Stack } from 'expo-router'
import React from 'react'

export default function OwnerDriverLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Tài xế của tôi',
          headerShown: true,
        }} 
      />
    </Stack>
  )
}
