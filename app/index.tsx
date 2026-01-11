import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import { Role } from '../models/types';
import { Colors } from '../constants/Colors';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.lightGrey,
        }}
      >
<ActivityIndicator size="large" color={Colors.primary} />
</View>
    );
  }

  if (user) {
    // Điều hướng dựa trên role
    const homeRoute =
      user.role === Role.DRIVER
        ? '/(driver)/home'
        : user.role === Role.OWNER
        ? '/(owner)/home'
        : '/(provider)/home'
    return <Redirect href={homeRoute} />;
  }

  // Add VietMap test button for development
  const handleVietMapTest = () => {
    router.push('/vietmap-test');
  };

  return (
    <View style={styles.container}>
<WelcomeScreen />
      
      {/* Development Test Button */}
      {/* <View style={styles.testButtonContainer}>
<TouchableOpacity 
          style={styles.testButton} 
          onPress={handleVietMapTest}
        >
<Text style={styles.testButtonText}>🗺️ VietMap Test</Text>
</TouchableOpacity>
</View> */}
</View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  testButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Index;
