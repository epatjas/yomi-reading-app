import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, colors, fonts } from '../app/styles/globalStyles'; // Adjust the import path as needed

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    // Simulate a loading delay, then navigate to the main app
    const timer = setTimeout(() => {
      router.replace('/welcome'); // Adjust this route to your main app screen
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>yomi</Text>
      <Image
        source={require('../assets/images/cat-paw.png')} // Adjust the path as needed
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
    fontFamily: fonts.regular, // Make sure you have this font loaded
    fontSize: 48,
    color: colors.text,
  },
  pawImage: {
    width: width * 0.2, // Adjust size as needed
    height: width * 0.2, // Adjust size as needed
    position: 'absolute',
    bottom: height * 0.1, // Adjust position as needed
    resizeMode: 'contain',
  },
});
