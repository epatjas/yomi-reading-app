import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { globalStyles, colors } from './styles/globalStyles';
import YomiLogo from '../assets/images/yomi-logo.svg';
import BackgroundShape from '../assets/images/background-shape.svg';
import { getUserProfiles } from '../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  console.log('Splash screen component mounted');

  useEffect(() => {
    console.log('Starting splash screen effect');
    const checkProfilesAndNavigate = async () => {
      try {
        console.log('Starting delay...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Delay finished, checking profiles...');

        const profiles = await getUserProfiles();
        console.log('Profiles fetched:', profiles);
        
        if (profiles.length === 0) {
          console.log('No profiles found, navigating to create-profile');
          router.replace('/screens/create-profile');
        } else {
          console.log('Profiles found, navigating to select-profile');
          router.replace('/screens/select-profile');
        }
      } catch (error) {
        console.error('Error checking profiles:', error);
        router.replace('/screens/create-profile');
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
