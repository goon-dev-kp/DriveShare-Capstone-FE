import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'

export default function DevResetScreen() {
  const router = useRouter()

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear()
      Alert.alert('Success', 'Storage cleared! App will restart.', [
        {
          text: 'OK',
          onPress: () => {
            // Force app to reload
            router.replace('/')
          }
        }
      ])
    } catch (error) {
      Alert.alert('Error', 'Failed to clear storage')
      console.error('Clear storage error:', error)
    }
  }

  const showCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user')
      const token = await AsyncStorage.getItem('token')
      
      Alert.alert('Current Storage', `User: ${userData}\nToken: ${token ? 'Present' : 'None'}`)
    } catch (error) {
      Alert.alert('Error', 'Failed to read storage')
    }
  }

  return (
    <View style={styles.container}>
<Text style={styles.title}>🔧 Dev Reset Tools</Text>
<TouchableOpacity style={styles.button} onPress={showCurrentUser}>
<Text style={styles.buttonText}>📱 Show Current User</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearStorage}>
<Text style={styles.buttonText}>🗑️ Clear All Data & Reset</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.button} onPress={() => router.push('/vietmap-test')}>
<Text style={styles.buttonText}>🗺️ Go to VietMap Test</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
<Text style={styles.buttonText}>🏠 Go to Home</Text>
</TouchableOpacity>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#111827',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})