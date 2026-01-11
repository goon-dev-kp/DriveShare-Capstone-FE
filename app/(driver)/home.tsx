import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import DriverHomeScreen from '@/screens/driver-v2/DriverHomeScreen'

const DriverHome: React.FC = () => {
  const router = useRouter()

  return (
    <View style={styles.container}>
<DriverHomeScreen />
      
      {/* Dev buttons */}
      {/* <View style={styles.devButtons}>
<TouchableOpacity 
          style={styles.devButton} 
          onPress={() => router.push('/vietmap-test')}
        >
<Text style={styles.devButtonText}>🗺️ VietMap Test</Text>
</TouchableOpacity>
<TouchableOpacity 
          style={styles.devButton} 
          onPress={() => router.push('/navigation-test')}
        >
<Text style={styles.devButtonText}>🧭 Navigation 3D</Text>
</TouchableOpacity>
<TouchableOpacity 
          style={styles.devButton} 
          onPress={() => router.push('/dev-reset')}
        >
<Text style={styles.devButtonText}>🔄 Reset App</Text>
</TouchableOpacity>
</View> */}
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  devButtons: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 1000,
  },
  devButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  devButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
})

export default DriverHome

