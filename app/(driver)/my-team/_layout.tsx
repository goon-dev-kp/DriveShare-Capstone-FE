import { Stack } from 'expo-router'
import React from 'react'

export default function DriverTeamLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Team của tôi',
          headerShown: true,
        }} 
      />
    </Stack>
  )
}
