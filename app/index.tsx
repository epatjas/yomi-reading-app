import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { globalStyles, colors } from './styles/globalStyles';
import YomiLogo from '../assets/images/yomi-logo.svg';
import BackgroundShape from '../assets/images/background-shape.svg';
import { getUserProfiles } from '../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSavedLanguage } from '../translation';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  console.log('Splash screen component mounted');

  useEffect(() => {
    console.log('Starting splash screen effect');
    const checkProfilesAndNavigate = async () => {
      try {
        // Load language preferences first thing on app startup
        await loadSavedLanguage();
        
        console.log('Starting delay...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Delay finished, checking profiles...');

        // Get or generate the device ID first
        let deviceId = await AsyncStorage.getItem('deviceId');
        
        if (!deviceId) {
          // If no device ID is stored, generate a new one and save it
          deviceId = `${Platform.OS}-${Platform.Version}-${Math.random().toString(36).substring(2, 10)}`;
          await AsyncStorage.setItem('deviceId', deviceId);
          console.log('Generated new device ID:', deviceId);
        } else {
          console.log('Using existing device ID:', deviceId);
        }
        
        // Now fetch only profiles for this device
        const profiles = await getUserProfiles(deviceId);
        console.log(`Found ${profiles.length} profile(s) for this device`);
        
        try {
          if (profiles.length === 0) {
            console.log('No profiles found, navigating to create-profile');
            // Using correct path format for Expo Router
            router.replace("/screens/create-profile");
          } else {
            console.log('Profiles found, navigating to select-profile');
            // Using correct path format for Expo Router
            router.replace("/screens/select-profile");
          }
        } catch (routeError) {
          console.error('Navigation error:', routeError);
          
          // Fallback navigation
          if (profiles.length === 0) {
            // Try alternative routing as a fallback
            router.replace("/screens/create-profile");
          } else {
            router.replace("/(tabs)");
          }
        }
      } catch (error) {
        console.error('Error checking profiles:', error);
        
        // Fallback to create-profile as a last resort
        try {
          router.replace("/screens/create-profile");
        } catch (e) {
          console.error('Critical navigation error:', e);
          Alert.alert(
            "Navigation Error",
            "There was a problem starting the app. Please restart the application."
          );
        }
      }
    };

    checkProfilesAndNavigate();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.yellowLight }]}>
      <View style={styles.contentContainer}>
        <View style={styles.backgroundContainer}>
          <BackgroundShape 
            width={width * 0.6} 
            height={width * 0.6} 
            fill={colors.yellowDark} 
          />
        </View>
        <LottieView
          source={require('../assets/animations/Black Cat.json')}
          style={[styles.pawAnimation, { zIndex: 1 }]}
          autoPlay
          loop
        />
        <View style={[styles.logoWrapper, { zIndex: 2 }]}>
          <YomiLogo 
            width={width * 0.3} 
            height={width * 0.3} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    position: 'relative',
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  logoWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawAnimation: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
