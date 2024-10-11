import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, colors, fonts } from '../app/styles/globalStyles';
import { getUserProfiles } from '../services/userService';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkProfilesAndNavigate = async () => {
      try {
        const profiles = await getUserProfiles();
        
        // Simulate a loading delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (profiles.length > 0) {
          router.replace('/select-profile');
        } else {
          router.replace('/create-profile');
        }
      } catch (error) {
        console.error('Error checking profiles:', error);
        // In case of error, default to create profile screen
        router.replace('/create-profile');
      }
    };

    checkProfilesAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>yomi</Text>
      <Image
        source={require('../assets/images/cat-paw.png')}
        style={styles.pawImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background01,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: fonts.regular,
    fontSize: 48,
    color: colors.text,
  },
  pawImage: {
    width: width * 0.2,
    height: width * 0.2,
    position: 'absolute',
    bottom: height * 0.1,
    resizeMode: 'contain',
  },
});

