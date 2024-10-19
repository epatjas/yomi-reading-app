import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { globalStyles, colors } from '../app/styles/globalStyles';
import YomiLogo from '../assets/images/yomi-logo.svg';
import BackgroundShape from '../assets/images/background-shape.svg';
import { getUserProfiles } from '../services/userService';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkProfilesAndNavigate = async () => {
      try {
        // Wait for at least 3 seconds to show the loading screen
        await new Promise(resolve => setTimeout(resolve, 5000));

        const profiles = await getUserProfiles();
        
        if (profiles.length === 0) {
          // No profiles exist, navigate to create profile screen
          router.replace('/create-profile');
        } else {
          // Profiles exist, navigate to select profile screen
          router.replace('/select-profile');
        }
      } catch (error) {
        console.error('Error checking profiles:', error);
        // In case of error, navigate to create profile as a fallback
        router.replace('/create-profile');
      }
    };

    checkProfilesAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.backgroundContainer}>
          <BackgroundShape width={width * 0.6} height={width * 0.6} fill={colors.yellowDark} />
        </View>
        <LottieView
          source={require('../assets/animations/Black Cat.json')}
          style={styles.pawAnimation}
          autoPlay
          loop
        />
        <View style={styles.logoWrapper}>
          <YomiLogo width={width * 0.3} height={width * 0.3} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawAnimation: {
    width: width * 0.8, // Increased size to surround the logo
    height: width * 0.8, // Keeping it square
    position: 'absolute',
  },
  backgroundContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
