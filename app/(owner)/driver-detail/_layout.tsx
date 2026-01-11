import { Stack } from 'expo-router'
import React from 'react'

export default function OwnerDriverDetailLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{
          title: 'Chi tiết tài xế',
          headerShown: true,
        }} 
      />
    </Stack>
  )
}
