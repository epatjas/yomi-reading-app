import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, colors, fonts, layout } from './styles/globalStyles';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={[globalStyles.container, styles.screenLayout]}>
      <View style={styles.contentContainer}>
        <Image
          source={require('../assets/images/yomi-character.png')}
          style={styles.yomiImage}
        />
        <View style={styles.speechBubble}>
          <Text style={styles.welcomeText}>
            Let's create your first reader profile!
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[globalStyles.button, styles.wideButton]} 
        onPress={() => router.push('/create-profile')}
      >
        <Text style={[globalStyles.buttonText, styles.centeredButtonText]}>Let's go</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screenLayout: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.paddingHorizontal,
    paddingVertical: layout.paddingVertical,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  yomiImage: {
    width: 120,
    height: 120,
    marginBottom: -20,
    zIndex: 1,
  },
  speechBubble: {
    backgroundColor: colors.background02,
    borderRadius: 20,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    maxWidth: '90%',
    borderWidth: 1,  // Add border width
    borderColor: colors.stroke,  // Use the stroke color for the border
  },
  welcomeText: {
    fontFamily: fonts.regular,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  wideButton: {
    width: '80%',
    paddingVertical: 15,
    alignItems: 'center', // Center-align the button content
  },
  centeredButtonText: {
    textAlign: 'center', // Ensure text is centered
  },
});
